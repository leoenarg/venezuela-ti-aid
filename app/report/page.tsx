"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { ImageValidationResult, validateAndOptimizeImage } from "@/lib/imageValidation";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { LifeStatus, stateOptions, statusLabels } from "@/lib/venezuelaData";
import { calculateAge, cedulaRules, sanitizeCedula } from "@/lib/formHelpers";

const locationOptions = ["Hospital", "Sede Policial", "Refugio Temporal", "Escuela Habilitada", "Otro..."];

type Step = 1 | 2 | 3;

type ReportFormValues = {
  fullName: string;
  cedula: string;
  gender: string;
  age: string;
  birthDate: string;
  status: LifeStatus;
  locationCategory: string;
  locationDetail: string;
  lastKnownState: string;
  lastKnownCity: string;
  lastKnownParish: string;
  acceptedTerms: boolean;
};

const stepFields: Record<Exclude<Step, 3>, (keyof ReportFormValues)[]> = {
  1: ["fullName", "cedula", "gender"],
  2: ["age", "birthDate"]
};

export default function ReportPage() {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ReportFormValues>({
    defaultValues: {
      fullName: "",
      cedula: "",
      gender: "",
      age: "",
      birthDate: "",
      status: "missing",
      locationCategory: locationOptions[0],
      locationDetail: "",
      lastKnownState: "",
      lastKnownCity: "",
      lastKnownParish: "",
      acceptedTerms: false
    }
  });

  const [step, setStep] = useState<Step>(1);
  const [optimizedPhoto, setOptimizedPhoto] = useState<File | null>(null);
  const [photoValidation, setPhotoValidation] = useState<ImageValidationResult | null>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "validating" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const age = watch("age");
  const status = watch("status");
  const locationCategory = watch("locationCategory");
  const acceptedTerms = watch("acceptedTerms");

  const cedulaField = register("cedula", cedulaRules);

  // Birth date drives the age field: age is derived, never typed by hand.
  const birthDateRegistration = register("birthDate", { required: "La fecha de nacimiento es obligatoria." });
  const birthDateField: UseFormRegisterReturn = {
    ...birthDateRegistration,
    onChange: (event) => {
      setValue("age", calculateAge(event.target.value), { shouldValidate: true });
      return birthDateRegistration.onChange(event);
    }
  };

  const isMinor = useMemo(() => {
    const numericAge = Number(age);
    return age !== "" && Number.isFinite(numericAge) && numericAge < 18;
  }, [age]);
  const isPhotoBusy = photoStatus === "validating";
  const hasPhotoError = photoStatus === "error";

  async function goToNextStep() {
    if (step === 3) return;
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    if (step === 2 && (isPhotoBusy || hasPhotoError)) return;
    setStep((step + 1) as Step);
  }

  useEffect(() => {
    return () => {
      if (photoValidation?.previewUrl) {
        URL.revokeObjectURL(photoValidation.previewUrl);
      }
    };
  }, [photoValidation?.previewUrl]);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMessage("");
    setOptimizedPhoto(null);

    if (photoValidation?.previewUrl) {
      URL.revokeObjectURL(photoValidation.previewUrl);
    }

    if (!selectedFile) {
      setPhotoValidation(null);
      setPhotoStatus("idle");
      return;
    }

    setPhotoValidation(null);
    setPhotoStatus("validating");
    await logClientAuditEvent("UPLOAD_IMAGE_ATTEMPT", {
      original_file_size: selectedFile.size,
      mime_type: selectedFile.type
    });

    const result = await validateAndOptimizeImage(selectedFile);
    setPhotoValidation(result);

    if (!result.isValid || !result.optimizedFile) {
      await logClientAuditEvent("UPLOAD_IMAGE_REJECTED", {
        original_file_size: selectedFile.size,
        mime_type: selectedFile.type,
        validation_result: "rejected",
        errors: result.errors,
        warnings: result.warnings,
        faces_detected: result.metadata.facesDetected,
        nsfw_scores: result.metadata.nsfwScores
      });
      setOptimizedPhoto(null);
      setPhotoStatus("error");
      return;
    }

    setOptimizedPhoto(result.optimizedFile);
    setPhotoStatus("success");
  }

  async function submitReport(values: ReportFormValues) {
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!hasSupabaseConfig) {
        throw new Error("Missing Supabase configuration.");
      }

      let imageUrl: string | null = null;

      if (hasPhotoError || isPhotoBusy) {
        throw new Error("Photo validation is not complete.");
      }

      if (optimizedPhoto) {
        const storagePath = `reports/${optimizedPhoto.name}`;
        const imageHash = await sha256File(optimizedPhoto);

        const { error: uploadError } = await supabase.storage
          .from("person-photos")
          .upload(storagePath, optimizedPhoto, {
            contentType: optimizedPhoto.type,
            upsert: false
          });

        if (uploadError) {
          await logClientAuditEvent("UPLOAD_IMAGE_REJECTED", {
            reason: "storage_upload_error",
            optimized_file_size: optimizedPhoto.size,
            mime_type: optimizedPhoto.type,
            image_hash: imageHash
          });
          throw uploadError;
        }

        const publicUrl = supabase.storage.from("person-photos").getPublicUrl(storagePath);
        imageUrl = publicUrl.data.publicUrl;

        await logClientAuditEvent("UPLOAD_IMAGE_SUCCESS", {
          storage_path: storagePath,
          optimized_file_size: optimizedPhoto.size,
          mime_type: optimizedPhoto.type,
          image_hash: imageHash,
          faces_detected: photoValidation?.metadata.facesDetected,
          nsfw_scores: photoValidation?.metadata.nsfwScores
        });
      }

      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: values.fullName.trim(),
          cedula: values.cedula.trim(),
          gender: values.gender,
          age: Number(values.age),
          birth_date: values.birthDate,
          status: values.status,
          location_category: values.locationCategory,
          location_detail:
            values.locationCategory === "Otro..." ? values.locationDetail.trim() : values.locationDetail.trim() || null,
          last_known_state: values.lastKnownState || null,
          last_known_city: values.lastKnownCity.trim() || null,
          last_known_parish: values.lastKnownParish.trim() || null,
          image_url: imageUrl,
          is_minor: isMinor,
          accepted_terms: values.acceptedTerms,
          terms_version: "2026-06-27",
          audit_metadata: optimizedPhoto
            ? {
                optimized_file_size: optimizedPhoto.size,
                mime_type: optimizedPhoto.type,
                faces_detected: photoValidation?.metadata.facesDetected,
                nsfw_scores: photoValidation?.metadata.nsfwScores
              }
            : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const messageText = typeof errorData?.error === "string" ? errorData.error : "No se pudo enviar el reporte.";
        throw new Error(messageText);
      }

      setMessage("Reporte enviado. Gracias por ayudar a una familia a encontrar informacion.");
      reset();
      if (photoValidation?.previewUrl) {
        URL.revokeObjectURL(photoValidation.previewUrl);
      }
      setOptimizedPhoto(null);
      setPhotoValidation(null);
      setPhotoStatus("idle");
      setStep(1);
    } catch (error) {
      console.error("Report submission failed", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo enviar el reporte. Revisa la conexion e intenta de nuevo.";
      setMessage(errorMessage || "No se pudo enviar el reporte. Revisa la conexion e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <Link className="focus-ring text-sm font-bold underline" href="/">
            Inicio
          </Link>
          <span className="rounded-md border border-neutral-300 px-3 py-1 text-sm font-bold">Paso {step} de 3</span>
        </header>

        <h1 className="text-3xl font-black">Reportar Persona</h1>
        <p className="mt-2 leading-7 text-neutral-700">
          Completa solo lo que conozcas con seguridad. La foto sera reducida en este dispositivo antes de subirla.
        </p>
        <AuditNotice />

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit(submitReport)} noValidate>
          {step === 1 ? (
            <section className="grid gap-4">
              <TextField
                label="Nombre completo"
                registration={register("fullName", {
                  required: "El nombre completo es obligatorio.",
                  minLength: { value: 2, message: "Ingresa el nombre completo." }
                })}
                error={errors.fullName?.message}
                required
              />
              <TextField
                label="Cedula de Identidad"
                inputMode="numeric"
                registration={{
                  ...cedulaField,
                  onChange: (event) => {
                    event.target.value = sanitizeCedula(event.target.value);
                    return cedulaField.onChange(event);
                  }
                }}
                error={errors.cedula?.message}
                required
              />
              <label className="grid gap-2 font-bold">
                Genero
                <select
                  className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3"
                  {...register("gender", { required: "Selecciona el genero." })}
                >
                  <option value="">Seleccionar</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro / no especificado</option>
                </select>
                {errors.gender ? <span className="text-sm font-semibold text-alert">{errors.gender.message}</span> : null}
              </label>
              <label className="grid gap-2 font-bold">
                Estado de vida
                <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" {...register("status")}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid gap-4">
              <TextField
                label="Fecha de nacimiento"
                type="date"
                registration={birthDateField}
                error={errors.birthDate?.message}
                required
              />
              <TextField
                label="Edad"
                min="0"
                type="number"
                readOnly
                hint="Se calcula automaticamente a partir de la fecha de nacimiento."
                registration={register("age", {
                  required: "La edad es obligatoria.",
                  min: { value: 0, message: "La edad no puede ser negativa." }
                })}
                error={errors.age?.message}
                required
              />
              {isMinor ? <p className="rounded-md border border-alert bg-red-50 p-3 text-sm font-bold text-alert">El reporte sera marcado como menor de edad.</p> : null}
              <label className="grid gap-2 font-bold">
                Foto opcional
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3"
                  onChange={handlePhotoChange}
                  type="file"
                />
              </label>
              <PhotoValidationPanel result={photoValidation} status={photoStatus} />
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid gap-4">
              {status === "deceased" ? (
                <p className="rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold text-neutral-700">
                  Para reportes de personas fallecidas, agrega si puedes el ultimo estado, ciudad y parroquia donde fue vista, extraviada o localizada.
                </p>
              ) : null}

              <label className="grid gap-2 font-bold">
                Ubicacion o institucion
                <select
                  className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3"
                  {...register("locationCategory")}
                >
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 font-bold">
                Detalle de ubicacion
                <textarea
                  className="focus-ring min-h-24 rounded-md border border-neutral-400 bg-white px-3 py-3"
                  placeholder={locationCategory === "Otro..." ? "Escribe el lugar conocido" : "Nombre del centro, ciudad o referencia"}
                  {...register("locationDetail", {
                    validate: (value) =>
                      locationCategory !== "Otro..." || value.trim().length > 0 || "Describe el lugar conocido."
                  })}
                />
                {errors.locationDetail ? (
                  <span className="text-sm font-semibold text-alert">{errors.locationDetail.message}</span>
                ) : null}
              </label>
              <label className="grid gap-2 font-bold">
                Estado donde fue extraviada o ultimo lugar conocido
                <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" {...register("lastKnownState")}>
                  <option value="">No especificado</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Ciudad opcional" registration={register("lastKnownCity")} />
              <TextField label="Parroquia opcional" registration={register("lastKnownParish")} />
              <label className="flex gap-3 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6">
                <input
                  className="mt-1 h-5 w-5"
                  type="checkbox"
                  {...register("acceptedTerms", { required: true })}
                />
                <span>
                  Confirmo que envio esta informacion de buena fe para fines humanitarios y acepto los{" "}
                  <Link className="font-black text-signal underline" href="/legal" target="_blank">
                    terminos, privacidad y colaboracion
                  </Link>
                  .
                </span>
              </label>
            </section>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {step > 1 ? (
              <button className="focus-ring rounded-md border-2 border-ink px-4 py-3 font-black" onClick={() => setStep((step - 1) as Step)} type="button">
                Volver
              </button>
            ) : null}
            {step < 3 ? (
              <button className="focus-ring rounded-md bg-signal px-4 py-3 font-black text-white disabled:opacity-50" disabled={isPhotoBusy || hasPhotoError} onClick={goToNextStep} type="button">
                {isPhotoBusy ? "Validando foto..." : "Continuar"}
              </button>
            ) : (
              <button className="focus-ring rounded-md bg-relief px-4 py-3 font-black text-white disabled:opacity-50" disabled={isSubmitting || !acceptedTerms || isPhotoBusy || hasPhotoError} type="submit">
                {isSubmitting ? "Enviando..." : "Enviar Reporte"}
              </button>
            )}
          </div>
        </form>

        {message ? <p className="mt-5 rounded-md border border-neutral-300 bg-white p-4 font-semibold">{message}</p> : null}
      </div>
    </main>
  );
}

function AuditNotice() {
  return (
    <p className="mt-4 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6 text-neutral-700">
      Por seguridad y prevencion de abusos, esta plataforma registra auditoria tecnica minima sobre cargas, consultas,
      visualizaciones y descargas. Puede incluir fecha, IP aproximada, navegador, accion realizada y registros
      consultados, y preservarse ante requerimientos legales.
    </p>
  );
}

function PhotoValidationPanel({
  result,
  status
}: {
  result: ImageValidationResult | null;
  status: "idle" | "validating" | "error" | "success";
}) {
  if (status === "idle") return null;

  if (status === "validating") {
    return <p className="rounded-md border border-neutral-300 bg-white p-3 text-sm font-bold text-neutral-700">Validando y optimizando la imagen...</p>;
  }

  return (
    <div className="grid gap-3 rounded-md border border-neutral-300 bg-white p-3 text-sm">
      {result?.previewUrl ? (
        <Image
          alt="Vista previa optimizada"
          className="aspect-square w-32 rounded-md border border-neutral-300 object-cover"
          height={128}
          src={result.previewUrl}
          unoptimized
          width={128}
        />
      ) : null}

      {result?.errors.map((error) => (
        <p className="font-bold text-alert" key={error}>
          {error}
        </p>
      ))}

      {result?.warnings.map((warning) => (
        <p className="font-semibold text-neutral-700" key={warning}>
          {warning}
        </p>
      ))}

      {result?.metadata.optimizedSize ? (
        <p className="text-neutral-600">
          Imagen optimizada: {formatBytes(result.metadata.optimizedSize)} / {result.metadata.width}x{result.metadata.height}px.
        </p>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function logClientAuditEvent(eventType: "UPLOAD_IMAGE_ATTEMPT" | "UPLOAD_IMAGE_SUCCESS" | "UPLOAD_IMAGE_REJECTED", metadata: Record<string, unknown>) {
  try {
    await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventType,
        entityType: "person_photo",
        statusCode: eventType === "UPLOAD_IMAGE_REJECTED" ? 400 : 200,
        metadata
      })
    });
  } catch {
    // Client-side audit is best-effort and must not block humanitarian reporting.
  }
}

async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function TextField({
  label,
  registration,
  type = "text",
  required = false,
  min,
  inputMode,
  error,
  readOnly = false,
  hint
}: {
  label: string;
  registration: UseFormRegisterReturn;
  type?: string;
  required?: boolean;
  min?: string;
  inputMode?: "numeric" | "text";
  error?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input
        className={`focus-ring rounded-md border border-neutral-400 px-3 py-3 ${readOnly ? "bg-neutral-100 text-neutral-700" : "bg-white"}`}
        min={min}
        inputMode={inputMode}
        readOnly={readOnly}
        required={required}
        type={type}
        {...registration}
      />
      {hint ? <span className="text-sm font-normal text-neutral-600">{hint}</span> : null}
      {error ? <span className="text-sm font-semibold text-alert">{error}</span> : null}
    </label>
  );
}
