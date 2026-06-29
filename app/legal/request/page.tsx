"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

type LegalRequestFormValues = {
  authorityFullName: string;
  institution: string;
  officialRole: string;
  jurisdiction: string;
  officialEmail: string;
  officialPhone: string;
  courtOrderId: string;
  issuingCourt: string;
  orderDate: string;
  legalBasis: string;
  scopeSummary: string;
  requestedRecords: string;
  urgency: "normal" | "urgent";
  deliveryConstraints: string;
  attestation: boolean;
};

type LegalRequestResponse = {
  id?: string;
  requestId?: string;
  error?: string;
  details?: string[];
};

export default function LegalRequestPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<LegalRequestFormValues>({
    defaultValues: {
      authorityFullName: "",
      institution: "",
      officialRole: "",
      jurisdiction: "",
      officialEmail: "",
      officialPhone: "",
      courtOrderId: "",
      issuingCourt: "",
      orderDate: "",
      legalBasis: "",
      scopeSummary: "",
      requestedRecords: "",
      urgency: "normal",
      deliveryConstraints: "",
      attestation: false
    }
  });

  const [message, setMessage] = useState("");
  const [folio, setFolio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLegalRequest(values: LegalRequestFormValues) {
    setMessage("");
    setFolio("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/legal-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json().catch(() => null)) as LegalRequestResponse | null;

      if (!response.ok) {
        const details = data?.details?.join(" ") || data?.error || "No se pudo registrar la solicitud legal.";
        throw new Error(details);
      }

      setFolio(data?.id ?? "");
      setMessage("Solicitud registrada. El folio no autoriza entrega automatica; sera revisado por el responsable del proyecto.");
      reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar la solicitud legal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-neutral-300 pb-5">
          <Link className="focus-ring text-sm font-bold underline" href="/legal">
            Volver a terminos
          </Link>
          <h1 className="mt-5 text-4xl font-black">Solicitud legal de informacion</h1>
          <p className="mt-3 leading-7 text-neutral-700">
            Portal de recepcion para autoridades con orden judicial valida. Este formulario registra la solicitud y
            genera un folio; no entrega datos automaticamente ni habilita descargas publicas.
          </p>
        </header>

        <section className="mt-6 rounded-md border border-alert bg-red-50 p-4 text-sm font-semibold leading-6 text-alert">
          La informacion de personas reportadas es sensible. Toda entrega debe ser revisada por el responsable del
          proyecto, limitada al alcance de la orden judicial, registrada en auditoria y transmitida por un canal seguro.
        </section>

        <form className="mt-6 grid gap-5 rounded-md border border-neutral-300 bg-white p-4" onSubmit={handleSubmit(submitLegalRequest)} noValidate>
          <fieldset className="grid gap-4">
            <legend className="text-xl font-black">Autoridad solicitante</legend>
            <TextField
              label="Nombre completo de la autoridad"
              hint="Persona funcionaria responsable de la solicitud."
              registration={register("authorityFullName", {
                required: "El nombre de la autoridad es obligatorio.",
                minLength: { value: 3, message: "Ingresa un nombre valido." }
              })}
              error={errors.authorityFullName?.message}
            />
            <TextField
              label="Institucion"
              hint="Organismo, tribunal, fiscalia, defensoria u otra institucion competente."
              registration={register("institution", { required: "La institucion es obligatoria." })}
              error={errors.institution?.message}
            />
            <TextField
              label="Cargo oficial"
              hint="Cargo o funcion que autoriza la solicitud."
              registration={register("officialRole", { required: "El cargo oficial es obligatorio." })}
              error={errors.officialRole?.message}
            />
            <TextField
              label="Jurisdiccion"
              hint="Pais, estado, municipio o ambito legal de la autoridad."
              registration={register("jurisdiction", { required: "La jurisdiccion es obligatoria." })}
              error={errors.jurisdiction?.message}
            />
            <TextField
              label="Correo oficial"
              hint="Debe ser un correo institucional o verificable para seguimiento."
              type="email"
              registration={register("officialEmail", {
                required: "El correo oficial es obligatorio.",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo valido." }
              })}
              error={errors.officialEmail?.message}
            />
            <TextField
              label="Telefono oficial opcional"
              hint="Canal adicional de contacto para validacion humana."
              registration={register("officialPhone")}
            />
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-xl font-black">Orden judicial y alcance</legend>
            <TextField
              label="Numero o identificador de la orden"
              hint="Numero de expediente, oficio, causa o identificador verificable."
              registration={register("courtOrderId", { required: "El identificador de la orden es obligatorio." })}
              error={errors.courtOrderId?.message}
            />
            <TextField
              label="Tribunal o autoridad emisora"
              hint="Nombre de quien emitio la orden judicial."
              registration={register("issuingCourt", { required: "La autoridad emisora es obligatoria." })}
              error={errors.issuingCourt?.message}
            />
            <TextField
              label="Fecha de la orden"
              hint="Fecha formal de emision de la orden judicial."
              type="date"
              registration={register("orderDate", { required: "La fecha de la orden es obligatoria." })}
              error={errors.orderDate?.message}
            />
            <TextArea
              label="Fundamento legal"
              hint="Resume la base legal de la solicitud y la competencia de la autoridad."
              registration={register("legalBasis", {
                required: "El fundamento legal es obligatorio.",
                minLength: { value: 10, message: "Describe el fundamento legal con mas detalle." }
              })}
              error={errors.legalBasis?.message}
            />
            <TextArea
              label="Alcance de la solicitud"
              hint="Indica periodo, caso, personas o hechos cubiertos por la orden. Evita pedir informacion masiva."
              registration={register("scopeSummary", {
                required: "El alcance es obligatorio.",
                minLength: { value: 10, message: "Describe el alcance con mas detalle." }
              })}
              error={errors.scopeSummary?.message}
            />
            <TextArea
              label="Registros solicitados"
              hint="Describe exactamente que datos se solicitan y por que son necesarios."
              registration={register("requestedRecords", {
                required: "Los registros solicitados son obligatorios.",
                minLength: { value: 10, message: "Describe los registros solicitados con mas detalle." }
              })}
              error={errors.requestedRecords?.message}
            />
            <label className="grid gap-2 font-bold">
              Urgencia
              <select className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" {...register("urgency")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
              <span className="text-sm font-normal text-neutral-600">Usa urgente solo si existe riesgo actual para la vida o integridad de una persona.</span>
            </label>
            <TextArea
              label="Condiciones de entrega opcionales"
              hint="Canal seguro, cifrado, persona receptora autorizada o restricciones del tribunal."
              registration={register("deliveryConstraints")}
            />
          </fieldset>

          <label className="flex gap-3 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6">
            <input className="mt-1 h-5 w-5" type="checkbox" {...register("attestation", { required: true })} />
            <span>
              Confirmo que esta solicitud se basa en una orden judicial valida, que la informacion sera usada solo para
              el fin legal declarado y que no se solicita una descarga masiva fuera del alcance autorizado.
              {errors.attestation ? <span className="mt-1 block text-alert">Esta confirmacion es obligatoria.</span> : null}
            </span>
          </label>

          <button className="focus-ring rounded-md bg-signal px-4 py-3 font-black text-white disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Registrando..." : "Registrar solicitud legal"}
          </button>
        </form>

        {message ? (
          <section className="mt-5 rounded-md border border-neutral-300 bg-white p-4 font-semibold leading-7">
            <p>{message}</p>
            {folio ? <p className="mt-2 break-all">Folio: {folio}</p> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function TextField({
  label,
  registration,
  type = "text",
  hint,
  error
}: {
  label: string;
  registration: UseFormRegisterReturn;
  type?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input className="focus-ring rounded-md border border-neutral-400 bg-white px-3 py-3" type={type} {...registration} />
      {hint ? <span className="text-sm font-normal text-neutral-600">{hint}</span> : null}
      {error ? <span className="text-sm font-semibold text-alert">{error}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  registration,
  hint,
  error
}: {
  label: string;
  registration: UseFormRegisterReturn;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <textarea className="focus-ring min-h-28 rounded-md border border-neutral-400 bg-white px-3 py-3" {...registration} />
      {hint ? <span className="text-sm font-normal text-neutral-600">{hint}</span> : null}
      {error ? <span className="text-sm font-semibold text-alert">{error}</span> : null}
    </label>
  );
}
