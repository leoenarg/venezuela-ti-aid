"use client";

import { useMemo, useState } from "react";
import { riskColors, riskLabels, statusLabels, VenezuelaState, venezuelaStates } from "@/lib/venezuelaData";

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

const emptyStats = {
  missing: 0,
  found_alive: 0,
  deceased: 0,
  critical_health: 0
};

export function VenezuelaRiskMap({ stateStats }: Props) {
  const [selectedCode, setSelectedCode] = useState(venezuelaStates[0].code);
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
              Infografia referencial por estado. Pasa el mouse o enfoca un estado para ver ciudades y reportes.
            </p>
          </div>
          <RiskLegend />
        </div>

        <div className="mt-4 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-neutral-200 bg-slate-50">
          <svg className="block h-auto w-[700px] max-w-none lg:w-full" role="img" aria-label="Mapa simplificado de Venezuela por riesgo sismico" viewBox="0 0 720 560">
            <rect fill="#f8fafc" height="560" rx="18" width="720" />
            {venezuelaStates.map((state) => {
              const fill = riskColors[state.risk];
              const isSelected = selectedCode === state.code;

              return (
                <g key={state.code}>
                  <rect
                    aria-label={`${state.name}: ${riskLabels[state.risk]}`}
                    className="cursor-pointer transition duration-150 hover:stroke-ink focus:outline-none"
                    fill={fill}
                    height={state.height}
                    onBlur={() => undefined}
                    onFocus={() => setSelectedCode(state.code)}
                    onMouseEnter={() => setSelectedCode(state.code)}
                    rx="8"
                    stroke={isSelected ? "#151515" : "#737373"}
                    strokeWidth={isSelected ? 3 : 1.3}
                    tabIndex={0}
                    width={state.width}
                    x={state.x}
                    y={state.y}
                  >
                    <title>{`${state.name} - ${riskLabels[state.risk]} - ${state.cities.join(", ")}`}</title>
                  </rect>
                  <text
                    className="pointer-events-none select-none text-[10px] font-bold"
                    fill={state.risk >= 5 ? "#ffffff" : "#151515"}
                    textAnchor="middle"
                    x={state.x + state.width / 2}
                    y={state.y + state.height / 2 + 4}
                  >
                    {shortName(state.name)}
                  </text>
                </g>
              );
            })}
          </svg>
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

function shortName(name: VenezuelaState["name"]) {
  const labels: Record<string, string> = {
    Distrito: "DC",
    "Distrito Capital": "DC",
    "Delta Amacuro": "Delta",
    "Nueva Esparta": "N. Esparta",
    "La Guaira": "Guaira"
  };

  return labels[name] ?? name;
}
