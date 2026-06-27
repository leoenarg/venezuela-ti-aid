"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StateStatusStats, VenezuelaRiskMap } from "@/components/VenezuelaRiskMap";
import { PublicStats, supabase } from "@/lib/supabaseClient";

const fallbackStats: PublicStats = {
  total_missing: 0,
  found_alive: 0,
  deceased: 0,
  critical_health: 0
};

const statLabels = [
  ["Personas perdidas", "total_missing"],
  ["Encontradas con vida", "found_alive"],
  ["Fallecidas", "deceased"],
  ["Salud delicada", "critical_health"]
] as const;

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats>(fallbackStats);
  const [stateStats, setStateStats] = useState<StateStatusStats[]>([]);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [{ data: totals }, { data: byState }] = await Promise.all([
          supabase.rpc("get_public_stats"),
          supabase.rpc("get_public_state_stats")
        ]);

        if (totals) setStats(totals as PublicStats);
        if (byState) setStateStats(byState as StateStatusStats[]);
      } catch {
        setStats(fallbackStats);
        setStateStats([]);
      }
    }

    loadStats();
  }, []);

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between border-b border-neutral-300 pb-4">
          <p className="text-sm font-bold uppercase tracking-wide text-signal">venezuela-ti-aid</p>
          <button className="focus-ring text-sm font-semibold underline" onClick={() => setTermsOpen(true)} type="button">
            Terminos
          </button>
        </header>

        <div className="grid flex-1 content-start gap-8 py-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-ink sm:text-6xl">Ayuda humanitaria para encontrar familiares.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-7 text-neutral-700">
              Reportes ciudadanos con busqueda privada por cedula y fecha de nacimiento. Sin directorios publicos de nombres.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Estadisticas publicas">
            {statLabels.map(([label, key]) => (
              <div className="rounded-md border border-neutral-300 bg-white p-4" key={key}>
                <p className="text-sm font-semibold text-neutral-600">{label}</p>
                <p className="mt-2 text-4xl font-black text-ink">{stats[key]}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="focus-ring rounded-md bg-signal px-5 py-4 text-center text-lg font-black text-white shadow-sm"
              href="/report"
            >
              Reportar Persona Desaparecida
            </Link>
            <Link
              className="focus-ring rounded-md border-2 border-ink bg-white px-5 py-4 text-center text-lg font-black text-ink"
              href="/search"
            >
              Buscar un Familiar
            </Link>
          </div>

          <VenezuelaRiskMap stateStats={stateStats} />
        </div>
      </section>

      {termsOpen ? <TermsModal onClose={() => setTermsOpen(false)} /> : null}
    </main>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-end bg-black/40 p-3 sm:place-items-center" role="dialog" aria-modal="true">
      <section className="w-full max-w-xl rounded-md bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black">Terminos y uso humanitario</h2>
        <p className="mt-3 leading-7 text-neutral-700">
          La informacion es enviada por la comunidad para fines de alivio humanitario y reunificacion familiar. Esta prohibido usar estos datos para acoso, persecucion, comercio, extorsion, difusion publica no autorizada o reportes falsos.
        </p>
        <p className="mt-3 leading-7 text-neutral-700">
          Toda busqueda requiere coincidencia exacta de cedula y fecha de nacimiento. El mal uso de la plataforma puede poner en riesgo a personas vulnerables.
        </p>
        <button className="focus-ring mt-5 w-full rounded-md bg-ink px-4 py-3 font-bold text-white" onClick={onClose} type="button">
          Entendido
        </button>
      </section>
    </div>
  );
}
