"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SearchResult } from "@/lib/supabaseClient";

const statusLabels: Record<string, string> = {
  missing: "Persona perdida",
  found_alive: "Encontrada con vida",
  deceased: "Fallecida",
  critical_health: "Salud delicada"
};

export default function SearchPage() {
  const [cedula, setCedula] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setMessage("");
    setIsSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cedula: cedula.trim(),
          birthDate
        })
      });

      if (!response.ok) throw new Error("Search API failed.");

      const data = (await response.json()) as { result: SearchResult | null };
      const match = data.result;
      if (!match) {
        setMessage("No encontramos una coincidencia exacta. Verifica los datos e intenta nuevamente.");
        return;
      }

      setResult(match);
    } catch {
      setMessage("La busqueda no pudo completarse. Intenta de nuevo cuando tengas conexion.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link className="focus-ring text-sm font-bold underline" href="/">
            Inicio
          </Link>
        </header>

        <h1 className="text-3xl font-black">Buscar un Familiar</h1>
        <p className="mt-2 leading-7 text-neutral-700">Por seguridad, solo se muestran resultados con cedula y fecha de nacimiento exactas.</p>
        <p className="mt-4 rounded-md border border-neutral-300 bg-white p-3 text-sm font-semibold leading-6 text-neutral-700">
          Por seguridad y prevencion de abusos, esta consulta registra auditoria tecnica minima: fecha, IP aproximada,
          navegador, accion realizada y si hubo coincidencia exacta.
        </p>

        <form className="mt-6 grid gap-4 rounded-md border border-neutral-300 bg-white p-4" onSubmit={search}>
          <label className="grid gap-2 font-bold">
            Cedula de Identidad
            <input className="focus-ring rounded-md border border-neutral-400 px-3 py-3" onChange={(event) => setCedula(event.target.value)} required value={cedula} />
          </label>
          <label className="grid gap-2 font-bold">
            Fecha de nacimiento
            <input
              className="focus-ring rounded-md border border-neutral-400 px-3 py-3"
              onChange={(event) => setBirthDate(event.target.value)}
              required
              type="date"
              value={birthDate}
            />
          </label>
          <button className="focus-ring rounded-md bg-signal px-4 py-3 font-black text-white" disabled={isSearching} type="submit">
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {message ? <p className="mt-5 rounded-md border border-neutral-300 bg-white p-4 font-semibold">{message}</p> : null}

        {result ? (
          <section className="mt-5 rounded-md border border-neutral-300 bg-white p-4">
            {/* Plain img avoids provider-side image processing and keeps the deployment free-tier friendly. */}
            {result.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="mb-4 aspect-square w-32 rounded-md object-cover grayscale" src={result.image_url} />
            ) : null}
            <p className="text-sm font-bold uppercase text-neutral-600">{statusLabels[result.status] ?? result.status}</p>
            <h2 className="mt-1 text-2xl font-black">{result.full_name}</h2>
            {result.is_minor ? <p className="mt-2 text-sm font-bold text-alert">Informacion limitada por proteccion de menor de edad.</p> : null}
            <dl className="mt-4 grid gap-3">
              <div>
                <dt className="text-sm font-bold text-neutral-600">Ubicacion</dt>
                <dd className="font-semibold">{result.location_category}</dd>
              </div>
              {result.location_detail ? (
                <div>
                  <dt className="text-sm font-bold text-neutral-600">Detalle</dt>
                  <dd className="font-semibold">{result.location_detail}</dd>
                </div>
              ) : null}
              {result.last_known_state ? (
                <div>
                  <dt className="text-sm font-bold text-neutral-600">Ultimo estado conocido</dt>
                  <dd className="font-semibold">
                    {[result.last_known_state, result.last_known_city, result.last_known_parish].filter(Boolean).join(", ")}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm font-bold text-neutral-600">Ultima actualizacion</dt>
                <dd className="font-semibold">{new Date(result.last_seen_at).toLocaleString("es-VE")}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  );
}
