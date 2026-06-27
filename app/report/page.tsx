"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { compressToGrayscaleJpeg } from "@/lib/imageCompression";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { LifeStatus, stateOptions, statusLabels } from "@/lib/venezuelaData";

const locationOptions = ["Hospital", "Sede Policial", "Refugio Temporal", "Escuela Habilitada", "Otro..."];

type Step = 1 | 2 | 3;

export default function ReportPage() {
  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState<LifeStatus>("missing");
  const [locationCategory, setLocationCategory] = useState(locationOptions[0]);
  const [locationDetail, setLocationDetail] = useState("");
  const [lastKnownState, setLastKnownState] = useState("");
  const [lastKnownCity, setLastKnownCity] = useState("");
  const [lastKnownParish, setLastKnownParish] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinor = useMemo(() => Number(age) > 0 && Number(age) < 18, [age]);
  const canContinue =
    (step === 1 && fullName.trim().length > 1 && cedula.trim().length > 3 && gender.length > 0) ||
    (step === 2 && Number(age) >= 0 && birthDate.length > 0) ||
    step === 3;

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!hasSupabaseConfig) {
        throw new Error("Missing Supabase configuration.");
      }

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
        full_name: fullName.trim(),
        cedula: cedula.trim(),
        gender,
        age: Number(age),
        birth_date: birthDate,
        status,
        location_category: locationCategory,
        location_detail: locationCategory === "Otro..." ? locationDetail.trim() : locationDetail.trim() || null,
        last_known_state: lastKnownState || null,
        last_known_city: lastKnownCity.trim() || null,
        last_known_parish: lastKnownParish.trim() || null,
        image_url: imageUrl,
        is_minor: isMinor,
        accepted_terms: acceptedTerms,
        terms_version: "2026-06-27"
      });

      if (error) throw error;

      setMessage("Reporte enviado. Gracias por ayudar a una familia a encontrar informacion.");
      setFullName("");
      setCedula("");
      setGender("");
      setAge("");
      setBirthDate("");
      setStatus("missing");
      setLocationCategory(locationOptions[0]);
      setLocationDetail("");
      setLastKnownState("");
      setLastKnownCity("");
      setLastKnownParish("");
      setPhoto(null);
      setAcceptedTerms(false);
      setStep(1);
    } catch {
      setMessage("No se pudo enviar el reporte. Revisa la conexion e intenta de nuevo.");
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

        <form className="mt-6 grid gap-5" onSubmit={submitReport}>
          {step === 1 ? (
            <section className="grid gap-4">
              <TextField label="Nombre completo" onChange={setFullName} required value={fullName} />
              <TextField label="Cedula de Identidad" onChange={setCedula} required value={cedula} />
              <label className="grid gap-2 font-bold">
                Genero
                <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" onChange={(event) => setGender(event.target.value)} required value={gender}>
                  <option value="">Seleccionar</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro / no especificado</option>
                </select>
              </label>
              <label className="grid gap-2 font-bold">
                Estado de vida
                <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" onChange={(event) => setStatus(event.target.value as LifeStatus)} value={status}>
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
              <TextField label="Edad" min="0" onChange={setAge} required type="number" value={age} />
              <TextField label="Fecha de nacimiento" onChange={setBirthDate} required type="date" value={birthDate} />
              {isMinor ? <p className="rounded-md border border-alert bg-red-50 p-3 text-sm font-bold text-alert">El reporte sera marcado como menor de edad.</p> : null}
              <label className="grid gap-2 font-bold">
                Foto opcional
                <input
                  accept="image/*"
                  className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3"
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
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
                  onChange={(event) => setLocationCategory(event.target.value)}
                  required
                  value={locationCategory}
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
                  onChange={(event) => setLocationDetail(event.target.value)}
                  placeholder={locationCategory === "Otro..." ? "Escribe el lugar conocido" : "Nombre del centro, ciudad o referencia"}
                  required={locationCategory === "Otro..."}
                  value={locationDetail}
                />
              </label>
              <label className="grid gap-2 font-bold">
                Estado donde fue extraviada o ultimo lugar conocido
                <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" onChange={(event) => setLastKnownState(event.target.value)} value={lastKnownState}>
                  <option value="">No especificado</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Ciudad opcional" onChange={setLastKnownCity} value={lastKnownCity} />
              <TextField label="Parroquia opcional" onChange={setLastKnownParish} value={lastKnownParish} />
              <label className="flex gap-3 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6">
                <input
                  checked={acceptedTerms}
                  className="mt-1 h-5 w-5"
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  required
                  type="checkbox"
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
              <button className="focus-ring rounded-md bg-signal px-4 py-3 font-black text-white disabled:opacity-50" disabled={!canContinue} onClick={() => setStep((step + 1) as Step)} type="button">
                Continuar
              </button>
            ) : (
              <button className="focus-ring rounded-md bg-relief px-4 py-3 font-black text-white disabled:opacity-50" disabled={isSubmitting || !acceptedTerms} type="submit">
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

function TextField({
  label,
  onChange,
  value,
  type = "text",
  required = false,
  min
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input
        className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
