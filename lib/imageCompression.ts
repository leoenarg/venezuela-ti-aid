export type CompressedImage = {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
};

const MAX_SIZE = 500;
const TARGET_BYTES = 50 * 1024;
const MIN_QUALITY = 0.25;

export async function compressToGrayscaleJpeg(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_SIZE / image.width, MAX_SIZE / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("No se pudo procesar la imagen en este dispositivo.");
  }

  context.drawImage(image, 0, 0, width, height);

  const frame = context.getImageData(0, 0, width, height);
  for (let index = 0; index < frame.data.length; index += 4) {
    const gray = Math.round(frame.data[index] * 0.299 + frame.data[index + 1] * 0.587 + frame.data[index + 2] * 0.114);
    frame.data[index] = gray;
    frame.data[index + 1] = gray;
    frame.data[index + 2] = gray;
  }
  context.putImageData(frame, 0, 0);

  let quality = 0.6;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  URL.revokeObjectURL(image.src);

  return {
    blob,
    fileName: `${crypto.randomUUID()}.jpg`,
    width,
    height
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}
