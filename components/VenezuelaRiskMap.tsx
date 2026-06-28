"use client";

import { useMemo, useState } from "react";
import { riskColors, riskLabels, statusLabels, venezuelaStates } from "@/lib/venezuelaData";

export type StateStatusStats = {
  state: string;
  missing: number;
  found_alive: number;
  deceased: number;
  critical_health: number;
};

type Props = {
  stateStats: StateStatusStats[];
};

type MarkerPosition = {
  x: number;
  y: number;
};

const emptyStats = {
  missing: 0,
  found_alive: 0,
  deceased: 0,
  critical_health: 0
};

const markerPositions: Record<string, MarkerPosition> = {
  zulia: { x: 13.5, y: 25 },
  falcon: { x: 25.5, y: 18 },
  lara: { x: 26.5, y: 25 },
  yaracuy: { x: 31.5, y: 24 },
  carabobo: { x: 36.4, y: 25.5 },
  aragua: { x: 41, y: 26.2 },
  la_guaira: { x: 43, y: 19.4 },
  distrito_capital: { x: 46, y: 23.4 },
  miranda: { x: 49, y: 25 },
  cojedes: { x: 35.5, y: 30.5 },
  portuguesa: { x: 28.4, y: 35.2 },
  trujillo: { x: 19.2, y: 31 },
  merida: { x: 15.5, y: 39.5 },
  tachira: { x: 10.8, y: 43.4 },
  barinas: { x: 24, y: 41.2 },
  apure: { x: 35, y: 51 },
  guarico: { x: 46.2, y: 36.7 },
  anzoategui: { x: 60.5, y: 33.5 },
  sucre: { x: 68.6, y: 23.2 },
  monagas: { x: 66.7, y: 30.3 },
  delta_amacuro: { x: 78, y: 36.8 },
  bolivar: { x: 62.2, y: 58 },
  amazonas: { x: 47.8, y: 76.5 },
  nueva_esparta: { x: 64.3, y: 18 }
};

export function VenezuelaRiskMap({ stateStats }: Props) {
  const [selectedCode, setSelectedCode] = useState("zulia");
  const selectedState = venezuelaStates.find((state) => state.code === selectedCode) ?? venezuelaStates[0];

  const statsByState = useMemo(() => {
    return new Map(stateStats.map((stats) => [stats.state, stats]));
  }, [stateStats]);

  const selectedStats = statsByState.get(selectedState.name) ?? { state: selectedState.name, ...emptyStats };

  return (
    <section className="grid min-w-0 gap-5 rounded-md border border-neutral-300 bg-white p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]" aria-labelledby="map-title">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black" id="map-title">
              Mapa de riesgo sismico
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-700">
              Mapa base referencial de Venezuela con marcadores interactivos de riesgo por estado.
            </p>
          </div>
          <RiskLegend />
        </div>

        <div className="mt-4 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-neutral-200 bg-sky-100">
          <div className="relative w-[900px] max-w-none lg:w-full">
            {/* Plain img avoids provider-side image optimization and keeps this free-tier friendly. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Mapa politico referencial de Venezuela con estados"
              className="block h-auto w-full grayscale-[35%] saturate-75"
              src="/venezuela-reference-map.png"
            />

            {venezuelaStates.map((state) => {
              const marker = markerPositions[state.code];
              const isSelected = state.code === selectedCode;

              if (!marker) return null;

              return (
                <button
                  aria-label={`${state.name}: ${riskLabels[state.risk]}`}
                  className="focus-ring absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-md transition hover:scale-110"
                  key={state.code}
                  onFocus={() => setSelectedCode(state.code)}
                  onMouseEnter={() => setSelectedCode(state.code)}
                  style={{
                    backgroundColor: riskColors[state.risk],
                    boxShadow: isSelected ? "0 0 0 4px rgba(21, 21, 21, 0.35)" : undefined,
                    left: `${marker.x}%`,
                    top: `${marker.y}%`
                  }}
                  title={`${state.name} - ${riskLabels[state.risk]} - ${state.cities.join(", ")}`}
                  type="button"
                >
                  {state.risk}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="min-w-0 rounded-md border border-neutral-300 bg-paper p-4">
        <p className="text-sm font-bold uppercase text-neutral-600">Estado seleccionado</p>
        <h3 className="mt-1 text-3xl font-black">{selectedState.name}</h3>
        <p className="mt-2 font-bold" style={{ color: selectedState.risk >= 5 ? "#7f1d1d" : "#991b1b" }}>
          {riskLabels[selectedState.risk]}
        </p>

        <div className="mt-4">
          <p className="text-sm font-bold text-neutral-600">Ciudades principales</p>
          <p className="mt-1 leading-7">{selectedState.cities.join(", ")}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div className="rounded-md border border-neutral-300 bg-white p-3" key={key}>
              <p className="text-xs font-bold text-neutral-600">{label}</p>
              <p className="text-2xl font-black">{selectedStats[key as keyof typeof emptyStats]}</p>
            </div>
          ))}
        </div>
      </aside>

      <StateStatsTable stateStats={stateStats} statsByState={statsByState} />
    </section>
  );
}

function StateStatsTable({
  stateStats,
  statsByState
}: {
  stateStats: StateStatusStats[];
  statsByState: Map<string, StateStatusStats>;
}) {
  const rows = stateStats.length > 0 ? venezuelaStates.filter((state) => statsByState.has(state.name)) : venezuelaStates.slice(0, 8);

  return (
    <div className="min-w-0 lg:col-span-2">
      <h3 className="text-lg font-black">Personas reportadas por estado</h3>
      <div className="mt-3 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-neutral-300">
        <table className="w-full min-w-[560px] border-collapse bg-white text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-3">Estado</th>
              <th className="p-3">Perdidas</th>
              <th className="p-3">Encontradas</th>
              <th className="p-3">Fallecidas</th>
              <th className="p-3">Salud delicada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((state) => {
              const stats = statsByState.get(state.name) ?? { state: state.name, ...emptyStats };
              return (
                <tr className="border-t border-neutral-200" key={state.code}>
                  <td className="p-3 font-bold">{state.name}</td>
                  <td className="p-3">{stats.missing}</td>
                  <td className="p-3">{stats.found_alive}</td>
                  <td className="p-3">{stats.deceased}</td>
                  <td className="p-3">{stats.critical_health}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskLegend() {
  return (
    <div className="grid gap-2 text-xs font-bold text-neutral-700">
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4, 5] as const).map((risk) => (
          <span className="h-4 w-8 rounded-sm border border-neutral-400" key={risk} style={{ backgroundColor: riskColors[risk] }} />
        ))}
      </div>
      <div className="flex justify-between gap-4">
        <span>Bajo</span>
        <span>Muy alto</span>
      </div>
    </div>
  );
}
