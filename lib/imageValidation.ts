"use client";

import imageCompression from "browser-image-compression";

type NsfwClassName = "Drawing" | "Hentai" | "Neutral" | "Porn" | "Sexy";

export type NsfwScores = Partial<Record<NsfwClassName, number>>;

export type ImageValidationMetadata = {
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  facesDetected: number;
  nsfwScores: NsfwScores;
};

export type ImageValidationResult = {
  isValid: boolean;
  optimizedFile?: File;
  previewUrl?: string;
  errors: string[];
  warnings: string[];
  metadata: ImageValidationMetadata;
};

type NsfwPrediction = {
  className: NsfwClassName;
  probability: number;
};

type NsfwModel = {
  classify: (input: HTMLImageElement | HTMLCanvasElement, topK?: number) => Promise<NsfwPrediction[]>;
};

type NativeFaceDetector = {
  detect: (source: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => Promise<unknown[]>;
};

type FaceDetectorConstructor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => NativeFaceDetector;

const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_SIDE = 200;
const MAX_OUTPUT_SIDE = 1024;
const OUTPUT_QUALITY = 0.78;
const BLUR_VARIANCE_WARNING_THRESHOLD = 70;
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

let nsfwModelPromise: Promise<NsfwModel> | null = null;
let mediaPipeFaceDetectorPromise: Promise<{ detect: (image: HTMLImageElement | HTMLCanvasElement) => { detections: unknown[] } }> | null = null;

export async function validateAndOptimizeImage(file: File): Promise<ImageValidationResult> {
  if (typeof window === "undefined") {
    throw new Error("La validacion de imagenes solo puede ejecutarse en el navegador.");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: ImageValidationMetadata = {
    originalSize: file.size,
    optimizedSize: 0,
    width: 0,
    height: 0,
    facesDetected: 0,
    nsfwScores: {}
  };

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    errors.push("La imagen no tiene un formato valido. Usa JPG, PNG o WEBP.");
  }

  if (file.size > MAX_ORIGINAL_BYTES) {
    errors.push("La imagen es demasiado pesada. Intenta con una imagen menor a 5 MB.");
  }

  const hasValidSignature = await hasSupportedImageSignature(file);
  if (!hasValidSignature) {
    errors.push("El archivo seleccionado no parece ser una imagen valida.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, metadata };
  }

  let sourceUrl: string | null = null;
  let optimizedUrl: string | null = null;

  try {
    sourceUrl = URL.createObjectURL(file);
    const sourceImage = await loadImage(sourceUrl);

    if (sourceImage.naturalWidth < MIN_IMAGE_SIDE || sourceImage.naturalHeight < MIN_IMAGE_SIDE) {
      errors.push("La imagen es muy pequena. Usa una foto de al menos 200x200 px.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings, metadata };
    }

    const outputType = supportsWebpOutput() ? "image/webp" : "image/jpeg";
    const optimizedFile = await imageCompression(file, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: MAX_OUTPUT_SIDE,
      initialQuality: OUTPUT_QUALITY,
      fileType: outputType,
      useWebWorker: true
    });

    optimizedUrl = URL.createObjectURL(optimizedFile);
    const optimizedImage = await loadImage(optimizedUrl);

    metadata.optimizedSize = optimizedFile.size;
    metadata.width = optimizedImage.naturalWidth;
    metadata.height = optimizedImage.naturalHeight;

    metadata.facesDetected = await detectFaces(optimizedImage);
    if (metadata.facesDetected === 0) {
      errors.push("La imagen debe mostrar el rostro de la persona desaparecida.");
    } else if (metadata.facesDetected > 1) {
      warnings.push("Detectamos mas de un rostro. Asegurate de que la persona desaparecida sea claramente visible.");
    }

    metadata.nsfwScores = await classifyNsfw(optimizedImage);
    if (
      (metadata.nsfwScores.Porn ?? 0) >= 0.15 ||
      (metadata.nsfwScores.Hentai ?? 0) >= 0.15 ||
      (metadata.nsfwScores.Sexy ?? 0) >= 0.35
    ) {
      errors.push("La imagen parece contener contenido no permitido.");
    }

    if (estimateBlurVariance(optimizedImage) < BLUR_VARIANCE_WARNING_THRESHOLD) {
      warnings.push("La imagen podria verse borrosa. Si puedes, usa una foto mas clara.");
    }

    if (errors.length > 0) {
      if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
      return { isValid: false, errors, warnings, metadata };
    }

    return {
      isValid: true,
      optimizedFile: renameOptimizedFile(optimizedFile, outputType),
      previewUrl: optimizedUrl,
      errors,
      warnings: ["La imagen fue optimizada correctamente para la carga.", ...warnings],
      metadata
    };
  } catch {
    if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
    return {
      isValid: false,
      errors: ["No se pudo validar la imagen. Intenta con otra foto clara del rostro."],
      warnings,
      metadata
    };
  } finally {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }
}

async function hasSupportedImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || isWebp;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen."));
    image.decoding = "async";
    image.src = url;
  });
}

function supportsWebpOutput() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function detectFaces(image: HTMLImageElement): Promise<number> {
  const nativeDetector = (window as Window & { FaceDetector?: FaceDetectorConstructor }).FaceDetector;

  if (nativeDetector) {
    const detections = await new nativeDetector({ fastMode: true, maxDetectedFaces: 6 }).detect(image);
    return detections.length;
  }

  const faceDetector = await getMediaPipeFaceDetector();
  return faceDetector.detect(image).detections.length;
}

async function getMediaPipeFaceDetector() {
  mediaPipeFaceDetectorPromise ??= import("@mediapipe/tasks-vision").then(async ({ FaceDetector, FilesetResolver }) => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
    return FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.45
    });
  });

  return mediaPipeFaceDetectorPromise;
}

async function classifyNsfw(image: HTMLImageElement): Promise<NsfwScores> {
  nsfwModelPromise ??= Promise.all([import("@tensorflow/tfjs"), import("nsfwjs/core")]).then(async ([tf, nsfwjs]) => {
    tf.enableProdMode();
    await tf.ready();
    return nsfwjs.load("https://raw.githubusercontent.com/infinitered/nsfwjs/master/models/mobilenet_v2/") as Promise<NsfwModel>;
  });

  const model = await nsfwModelPromise;
  const predictions = await model.classify(image, 5);

  return predictions.reduce<NsfwScores>((scores, prediction) => {
    scores[prediction.className] = prediction.probability;
    return scores;
  }, {});
}

function estimateBlurVariance(image: HTMLImageElement): number {
  const canvas = document.createElement("canvas");
  const size = 96;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return Number.POSITIVE_INFINITY;

  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  const gray = new Float32Array(size * size);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    gray[pixel] = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
  }

  const values: number[] = [];
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const center = gray[y * size + x] * 4;
      const laplacian = center - gray[y * size + x - 1] - gray[y * size + x + 1] - gray[(y - 1) * size + x] - gray[(y + 1) * size + x];
      values.push(laplianAbs(laplacian));
    }
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function laplianAbs(value: number) {
  return Math.abs(value);
}

function renameOptimizedFile(file: File, mimeType: string) {
  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  return new File([file], `${crypto.randomUUID()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now()
  });
}
