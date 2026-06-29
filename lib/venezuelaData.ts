export type LifeStatus = "missing" | "found_alive" | "deceased" | "critical_health";

export type StateRisk = 1 | 2 | 3 | 4 | 5;

export type VenezuelaState = {
  code: string;
  name: string;
  cities: string[];
  risk: StateRisk;
};

export const statusLabels: Record<LifeStatus, string> = {
  missing: "Extraviada",
  found_alive: "Encontradas",
  deceased: "Fallecidas",
  critical_health: "Bajo supervision medica"
};

export const riskLabels: Record<StateRisk, string> = {
  1: "Riesgo bajo",
  2: "Riesgo moderado",
  3: "Riesgo medio",
  4: "Riesgo alto",
  5: "Riesgo muy alto"
};

export const riskColors: Record<StateRisk, string> = {
  1: "#ffffff",
  2: "#fee2e2",
  3: "#fca5a5",
  4: "#ef4444",
  5: "#7f1d1d"
};

export const venezuelaStates: VenezuelaState[] = [
  { code: "zulia", name: "Zulia", cities: ["Maracaibo", "Cabimas", "Ciudad Ojeda"], risk: 4 },
  { code: "falcon", name: "Falcon", cities: ["Coro", "Punto Fijo", "Tucacas"], risk: 4 },
  { code: "lara", name: "Lara", cities: ["Barquisimeto", "Carora", "El Tocuyo"], risk: 4 },
  { code: "yaracuy", name: "Yaracuy", cities: ["San Felipe", "Chivacoa", "Yaritagua"], risk: 4 },
  { code: "carabobo", name: "Carabobo", cities: ["Valencia", "Puerto Cabello", "Guacara"], risk: 5 },
  { code: "aragua", name: "Aragua", cities: ["Maracay", "La Victoria", "Turmero"], risk: 5 },
  { code: "la_guaira", name: "La Guaira", cities: ["La Guaira", "Maiquetia", "Catia La Mar"], risk: 5 },
  { code: "distrito_capital", name: "Distrito Capital", cities: ["Caracas"], risk: 5 },
  { code: "miranda", name: "Miranda", cities: ["Los Teques", "Petare", "Guarenas"], risk: 5 },
  { code: "cojedes", name: "Cojedes", cities: ["San Carlos", "Tinaquillo", "El Baul"], risk: 3 },
  { code: "portuguesa", name: "Portuguesa", cities: ["Guanare", "Acarigua", "Araure"], risk: 3 },
  { code: "trujillo", name: "Trujillo", cities: ["Trujillo", "Valera", "Bocono"], risk: 4 },
  { code: "merida", name: "Merida", cities: ["Merida", "El Vigia", "Tovar"], risk: 5 },
  { code: "tachira", name: "Tachira", cities: ["San Cristobal", "Rubio", "La Fria"], risk: 5 },
  { code: "barinas", name: "Barinas", cities: ["Barinas", "Socopo", "Barinitas"], risk: 3 },
  { code: "apure", name: "Apure", cities: ["San Fernando", "Guasdualito", "Achaguas"], risk: 2 },
  { code: "guarico", name: "Guarico", cities: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"], risk: 3 },
  { code: "anzoategui", name: "Anzoategui", cities: ["Barcelona", "Puerto La Cruz", "El Tigre"], risk: 4 },
  { code: "sucre", name: "Sucre", cities: ["Cumana", "Carupano", "Guiria"], risk: 5 },
  { code: "monagas", name: "Monagas", cities: ["Maturin", "Punta de Mata", "Caripito"], risk: 4 },
  { code: "delta_amacuro", name: "Delta Amacuro", cities: ["Tucupita", "Pedernales", "Curiapo"], risk: 2 },
  { code: "bolivar", name: "Bolivar", cities: ["Ciudad Bolivar", "Ciudad Guayana", "Upata"], risk: 2 },
  { code: "amazonas", name: "Amazonas", cities: ["Puerto Ayacucho", "San Fernando de Atabapo", "Maroa"], risk: 1 },
  { code: "nueva_esparta", name: "Nueva Esparta", cities: ["La Asuncion", "Porlamar", "Pampatar"], risk: 4 }
];

export const stateOptions = venezuelaStates.map((state) => state.name);
