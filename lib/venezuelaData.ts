export type LifeStatus = "missing" | "found_alive" | "deceased" | "critical_health";

export type StateRisk = 1 | 2 | 3 | 4 | 5;

export type VenezuelaState = {
  code: string;
  name: string;
  cities: string[];
  risk: StateRisk;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const statusLabels: Record<LifeStatus, string> = {
  missing: "Perdidas",
  found_alive: "Encontradas",
  deceased: "Fallecidas",
  critical_health: "Salud delicada"
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
  { code: "zulia", name: "Zulia", cities: ["Maracaibo", "Cabimas", "Ciudad Ojeda"], risk: 4, x: 28, y: 88, width: 74, height: 90 },
  { code: "falcon", name: "Falcon", cities: ["Coro", "Punto Fijo", "Tucacas"], risk: 4, x: 110, y: 62, width: 70, height: 52 },
  { code: "lara", name: "Lara", cities: ["Barquisimeto", "Carora", "El Tocuyo"], risk: 4, x: 132, y: 120, width: 58, height: 46 },
  { code: "yaracuy", name: "Yaracuy", cities: ["San Felipe", "Chivacoa", "Yaritagua"], risk: 4, x: 196, y: 108, width: 44, height: 42 },
  { code: "carabobo", name: "Carabobo", cities: ["Valencia", "Puerto Cabello", "Guacara"], risk: 5, x: 246, y: 104, width: 48, height: 42 },
  { code: "aragua", name: "Aragua", cities: ["Maracay", "La Victoria", "Turmero"], risk: 5, x: 300, y: 104, width: 52, height: 42 },
  { code: "la_guaira", name: "La Guaira", cities: ["La Guaira", "Maiquetia", "Catia La Mar"], risk: 5, x: 354, y: 78, width: 52, height: 24 },
  { code: "distrito_capital", name: "Distrito Capital", cities: ["Caracas"], risk: 5, x: 360, y: 108, width: 36, height: 32 },
  { code: "miranda", name: "Miranda", cities: ["Los Teques", "Petare", "Guarenas"], risk: 5, x: 402, y: 104, width: 60, height: 52 },
  { code: "cojedes", name: "Cojedes", cities: ["San Carlos", "Tinaquillo", "El Baul"], risk: 3, x: 226, y: 154, width: 56, height: 50 },
  { code: "portuguesa", name: "Portuguesa", cities: ["Guanare", "Acarigua", "Araure"], risk: 3, x: 154, y: 174, width: 72, height: 56 },
  { code: "trujillo", name: "Trujillo", cities: ["Trujillo", "Valera", "Bocono"], risk: 4, x: 82, y: 174, width: 66, height: 48 },
  { code: "merida", name: "Merida", cities: ["Merida", "El Vigia", "Tovar"], risk: 5, x: 70, y: 228, width: 68, height: 56 },
  { code: "tachira", name: "Tachira", cities: ["San Cristobal", "Rubio", "La Fria"], risk: 5, x: 44, y: 292, width: 70, height: 58 },
  { code: "barinas", name: "Barinas", cities: ["Barinas", "Socopo", "Barinitas"], risk: 3, x: 144, y: 238, width: 92, height: 76 },
  { code: "apure", name: "Apure", cities: ["San Fernando", "Guasdualito", "Achaguas"], risk: 2, x: 116, y: 326, width: 144, height: 78 },
  { code: "guarico", name: "Guarico", cities: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"], risk: 3, x: 288, y: 168, width: 118, height: 86 },
  { code: "anzoategui", name: "Anzoategui", cities: ["Barcelona", "Puerto La Cruz", "El Tigre"], risk: 4, x: 468, y: 132, width: 98, height: 70 },
  { code: "sucre", name: "Sucre", cities: ["Cumana", "Carupano", "Guiria"], risk: 5, x: 574, y: 94, width: 92, height: 52 },
  { code: "monagas", name: "Monagas", cities: ["Maturin", "Punta de Mata", "Caripito"], risk: 4, x: 498, y: 208, width: 92, height: 70 },
  { code: "delta_amacuro", name: "Delta Amacuro", cities: ["Tucupita", "Pedernales", "Curiapo"], risk: 2, x: 598, y: 210, width: 76, height: 74 },
  { code: "bolivar", name: "Bolivar", cities: ["Ciudad Bolivar", "Ciudad Guayana", "Upata"], risk: 2, x: 354, y: 286, width: 216, height: 138 },
  { code: "amazonas", name: "Amazonas", cities: ["Puerto Ayacucho", "San Fernando de Atabapo", "Maroa"], risk: 1, x: 234, y: 424, width: 178, height: 98 },
  { code: "nueva_esparta", name: "Nueva Esparta", cities: ["La Asuncion", "Porlamar", "Pampatar"], risk: 4, x: 548, y: 50, width: 66, height: 28 }
];

export const stateOptions = venezuelaStates.map((state) => state.name);
