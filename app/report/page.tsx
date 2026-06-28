"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { calculateAge, cedulaRules, sanitizeCedula } from "@/lib/formHelpers";
import { compressToGrayscaleJpeg } from "@/lib/imageCompression";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { LifeStatus, stateOptions, statusLabels } from "@/lib/venezuelaData";

const locationOptions = ["Hospital", "Sede Policial", "Refugio Temporal", "Escuela Habilitada", "Otro..."];
const inputClass = "focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3";

type Step = 1 | 2 | 3;

// How much the reporter knows about the person's age:
// - birthDate: exact birth date known -> age is derived automatically.
// - ageOnly: only the age is known -> birth_date stays empty (null on submit).
// - unknown: neither is known -> the flow must not be blocked.
type AgeMode = "birthDate" | "ageOnly" | "unknown";

type ReportForm = {
  fullName: string;
  cedula: string;
  gender: string;
  status: LifeStatus;
  ageMode: AgeMode;
  birthDate: string;
  age: string;
  locationCategory: string;
  locationDetail: string;
  lastKnownState: string;
  lastKnownCity: string;
  lastKnownParish: string;
  acceptedTerms: boolean;
};

const ageModeLabels: Record<AgeMode, string> = {
  birthDate: "Conozco la fecha de nacimiento",
  ageOnly: "Solo conozco la edad",
  unknown: "No conozco ninguno de los dos"
};

export default function ReportPage() {
  const [step, setStep] = useState<Step>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    clearErrors,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReportForm>({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      cedula: "",
      gender: "",
      status: "missing",
      ageMode: "birthDate",
      birthDate: "",
      age: "",
      locationCategory: locationOptions[0],
      locationDetail: "",
      lastKnownState: "",
      lastKnownCity: "",
      lastKnownParish: "",
      acceptedTerms: false
    }
  });

  const ageMode = watch("ageMode");
  const birthDate = watch("birthDate");
  const ageInput = watch("age");
  const locationCategory = watch("locationCategory");
  const status = watch("status");

  const derivedAge = ageMode === "birthDate" ? calculateAge(birthDate) : null;
  const effectiveAge = ageMode === "birthDate" ? derivedAge : ageMode === "ageOnly" ? Number(ageInput) : null;
  const isMinor = effectiveAge != null && effectiveAge >= 0 ? effectiveAge < 18 : false;

  const cedulaField = register("cedula", cedulaRules);

  function selectAgeMode(mode: AgeMode) {
    setValue("ageMode", mode);
    // Drop values that no longer apply so stale data is never submitted.
    if (mode !== "birthDate") setValue("birthDate", "");
    if (mode !== "ageOnly") setValue("age", "");
    clearErrors(["birthDate", "age"]);
  }

  async function goNext() {
    const fieldsByStep: Record<number, (keyof ReportForm)[]> = {
      1: ["fullName", "cedula", "gender"],
      2: ageMode === "birthDate" ? ["birthDate"] : ageMode === "ageOnly" ? ["age"] : []
    };
    const valid = await trigger(fieldsByStep[step] ?? []);
    if (valid) setStep((step + 1) as Step);
  }

  async function onSubmit(data: ReportForm) {
    setMessage("");

    try {
      if (!hasSupabaseConfig) {
        throw new Error("Missing Supabase configuration.");
      }

      const birthDateValue = data.ageMode === "birthDate" ? data.birthDate : null;
      const ageValue =
        data.ageMode === "birthDate"
          ? calculateAge(data.birthDate)
          : data.ageMode === "ageOnly"
            ? Number(data.age)
            : null;
      const minor = ageValue != null ? ageValue < 18 : false;

      let imageUrl: string | null = null;

      if (photo) {
        const compressed = await compressToGrayscaleJpeg(photo);
        const storagePath = `reports/${compressed.fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("person-photos")
          .upload(storagePath, compressed.blob, {
            contentType: "image/jpeg",
            upsert: false
          });

        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage.from("person-photos").getPublicUrl(storagePath);
        imageUrl = publicUrl.data.publicUrl;
      }

      const { error } = await supabase.from("missing_persons").insert({
        full_name: data.fullName.trim(),
        cedula: data.cedula.trim(),
        gender: data.gender,
        age: ageValue,
        birth_date: birthDateValue,
        status: data.status,
        location_category: data.locationCategory,
        location_detail:
          data.locationCategory === "Otro..." ? data.locationDetail.trim() : data.locationDetail.trim() || null,
        last_known_state: data.lastKnownState || null,
        last_known_city: data.lastKnownCity.trim() || null,
        last_known_parish: data.lastKnownParish.trim() || null,
        image_url: imageUrl,
        is_minor: minor,
        accepted_terms: data.acceptedTerms,
        terms_version: "2026-06-27"
      });

      if (error) throw error;

      setMessage("Reporte enviado. Gracias por ayudar a una familia a encontrar informacion.");
      reset();
      setPhoto(null);
      setStep(1);
    } catch {
      setMessage("No se pudo enviar el reporte. Revisa la conexion e intenta de nuevo.");
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

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 ? (
            <section className="grid gap-4">
              <Field error={errors.fullName?.message} label="Nombre completo">
                <input
                  className={inputClass}
                  {...register("fullName", {
                    required: "Ingresa el nombre completo.",
                    minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres." }
                  })}
                />
              </Field>
              <Field error={errors.cedula?.message} label="Cedula de Identidad">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  {...cedulaField}
                  onChange={(event) => {
                    event.target.value = sanitizeCedula(event.target.value);
                    cedulaField.onChange(event);
                  }}
                />
              </Field>
              <Field error={errors.gender?.message} label="Genero">
                <select className={inputClass} {...register("gender", { required: "Selecciona una opcion." })}>
                  <option value="">Seleccionar</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro / no especificado</option>
                </select>
              </Field>
              <Field label="Estado de vida">
                <select className={inputClass} {...register("status")}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid gap-4">
              <fieldset className="grid gap-2">
                <legend className="font-bold">Datos de edad</legend>
                <p className="text-sm font-semibold text-neutral-600">Elige la opcion que mejor describa lo que conoces.</p>
                <div className="grid gap-2">
                  {(Object.keys(ageModeLabels) as AgeMode[]).map((mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-3 rounded-md border border-neutral-300 bg-white p-3 font-semibold"
                    >
                      <input
                        checked={ageMode === mode}
                        className="h-5 w-5"
                        onChange={() => selectAgeMode(mode)}
                        type="checkbox"
                      />
                      <span>{ageModeLabels[mode]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {ageMode === "birthDate" ? (
                <Field error={errors.birthDate?.message} label="Fecha de nacimiento">
                  <input
                    className={inputClass}
                    type="date"
                    {...register("birthDate", {
                      validate: (value) =>
                        ageMode !== "birthDate" || (!!value && calculateAge(value) != null) || "Indica una fecha de nacimiento valida."
                    })}
                  />
                  {derivedAge != null ? (
                    <span className="text-sm font-bold text-neutral-700">Edad calculada: {derivedAge} años</span>
                  ) : null}
                </Field>
              ) : null}

              {ageMode === "ageOnly" ? (
                <Field error={errors.age?.message} label="Edad">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    min="0"
                    max="125"
                    type="number"
                    {...register("age", {
                      validate: (value) => {
                        if (ageMode !== "ageOnly") return true;
                        if (!value) return "Indica la edad.";
                        const numeric = Number(value);
                        if (!Number.isInteger(numeric) || numeric < 0 || numeric > 125) {
                          return "Ingresa una edad entre 0 y 125.";
                        }
                        return true;
                      }
                    })}
                  />
                </Field>
              ) : null}

              {ageMode === "unknown" ? (
                <p className="rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold text-neutral-700">
                  Puedes continuar sin estos datos. El reporte no podra encontrarse por busqueda exacta hasta que se conozca la fecha de nacimiento.
                </p>
              ) : null}

              {isMinor ? (
                <p className="rounded-md border border-alert bg-red-50 p-3 text-sm font-bold text-alert">
                  El reporte sera marcado como menor de edad.
                </p>
              ) : null}

              <Field label="Foto opcional">
                <input
                  accept="image/*"
                  className={inputClass}
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </Field>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid gap-4">
              {status === "deceased" ? (
                <p className="rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold text-neutral-700">
                  Para reportes de personas fallecidas, agrega si puedes el ultimo estado, ciudad y parroquia donde fue vista, extraviada o localizada.
                </p>
              ) : null}

              <Field label="Ubicacion o institucion">
                <select className={inputClass} {...register("locationCategory", { required: true })}>
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field error={errors.locationDetail?.message} label="Detalle de ubicacion">
                <textarea
                  className={`${inputClass} min-h-24`}
                  placeholder={locationCategory === "Otro..." ? "Escribe el lugar conocido" : "Nombre del centro, ciudad o referencia"}
                  {...register("locationDetail", {
                    validate: (value) =>
                      locationCategory !== "Otro..." || value.trim().length > 0 || "Describe la ubicacion."
                  })}
                />
              </Field>
              <Field label="Estado donde fue extraviada o ultimo lugar conocido">
                <select className={inputClass} {...register("lastKnownState")}>
                  <option value="">No especificado</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad opcional">
                <input className={inputClass} {...register("lastKnownCity")} />
              </Field>
              <Field label="Parroquia opcional">
                <input className={inputClass} {...register("lastKnownParish")} />
              </Field>
              <label className="flex gap-3 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6">
                <input className="mt-1 h-5 w-5" type="checkbox" {...register("acceptedTerms", { required: true })} />
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
              <button className="focus-ring rounded-md bg-signal px-4 py-3 font-black text-white disabled:opacity-50" onClick={goNext} type="button">
                Continuar
              </button>
            ) : (
              <button className="focus-ring rounded-md bg-relief px-4 py-3 font-black text-white disabled:opacity-50" disabled={isSubmitting || !watch("acceptedTerms")} type="submit">
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      {children}
      {error ? <span className="text-sm font-semibold text-alert">{error}</span> : null}
    </label>
  );
}
