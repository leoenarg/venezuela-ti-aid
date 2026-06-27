export type LifeStatus = "missing" | "found_alive" | "deceased" | "critical_health";

export type StateRisk = 1 | 2 | 3 | 4 | 5;

export type VenezuelaState = {
  code: string;
  name: string;
  cities: string[];
  risk: StateRisk;
  path: string;
  labelX: number;
  labelY: number;
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
  { code: "zulia", name: "Zulia", cities: ["Maracaibo", "Cabimas", "Ciudad Ojeda"], risk: 4, path: "M43 130 L82 82 L126 96 L145 142 L132 214 L80 246 L43 208 Z", labelX: 91, labelY: 164 },
  { code: "falcon", name: "Falcon", cities: ["Coro", "Punto Fijo", "Tucacas"], risk: 4, path: "M126 75 L215 55 L252 88 L236 122 L164 128 L138 110 Z", labelX: 190, labelY: 94 },
  { code: "lara", name: "Lara", cities: ["Barquisimeto", "Carora", "El Tocuyo"], risk: 4, path: "M145 132 L205 126 L232 155 L212 196 L154 188 L130 156 Z", labelX: 181, labelY: 162 },
  { code: "yaracuy", name: "Yaracuy", cities: ["San Felipe", "Chivacoa", "Yaritagua"], risk: 4, path: "M232 120 L275 108 L295 138 L272 166 L232 155 Z", labelX: 261, labelY: 140 },
  { code: "carabobo", name: "Carabobo", cities: ["Valencia", "Puerto Cabello", "Guacara"], risk: 5, path: "M294 112 L336 112 L352 142 L326 172 L286 150 Z", labelX: 319, labelY: 141 },
  { code: "aragua", name: "Aragua", cities: ["Maracay", "La Victoria", "Turmero"], risk: 5, path: "M350 113 L397 116 L416 146 L386 176 L348 150 Z", labelX: 381, labelY: 144 },
  { code: "la_guaira", name: "La Guaira", cities: ["La Guaira", "Maiquetia", "Catia La Mar"], risk: 5, path: "M392 86 L466 90 L453 111 L386 108 Z", labelX: 425, labelY: 101 },
  { code: "distrito_capital", name: "Distrito Capital", cities: ["Caracas"], risk: 5, path: "M412 114 L440 115 L444 142 L416 144 Z", labelX: 428, labelY: 132 },
  { code: "miranda", name: "Miranda", cities: ["Los Teques", "Petare", "Guarenas"], risk: 5, path: "M444 116 L512 123 L525 174 L474 199 L438 148 Z", labelX: 481, labelY: 157 },
  { code: "cojedes", name: "Cojedes", cities: ["San Carlos", "Tinaquillo", "El Baul"], risk: 3, path: "M232 160 L286 153 L324 181 L304 226 L246 222 L212 195 Z", labelX: 267, labelY: 191 },
  { code: "portuguesa", name: "Portuguesa", cities: ["Guanare", "Acarigua", "Araure"], risk: 3, path: "M154 190 L214 198 L246 224 L222 272 L154 258 L124 214 Z", labelX: 184, labelY: 231 },
  { code: "trujillo", name: "Trujillo", cities: ["Trujillo", "Valera", "Bocono"], risk: 4, path: "M88 224 L128 198 L154 214 L150 258 L108 276 L78 254 Z", labelX: 117, labelY: 238 },
  { code: "merida", name: "Merida", cities: ["Merida", "El Vigia", "Tovar"], risk: 5, path: "M76 260 L110 278 L145 296 L126 338 L82 330 L58 292 Z", labelX: 101, labelY: 302 },
  { code: "tachira", name: "Tachira", cities: ["San Cristobal", "Rubio", "La Fria"], risk: 5, path: "M54 332 L94 336 L124 368 L102 412 L56 404 L34 364 Z", labelX: 78, labelY: 372 },
  { code: "barinas", name: "Barinas", cities: ["Barinas", "Socopo", "Barinitas"], risk: 3, path: "M146 262 L222 276 L266 326 L238 384 L148 372 L112 320 Z", labelX: 190, labelY: 323 },
  { code: "apure", name: "Apure", cities: ["San Fernando", "Guasdualito", "Achaguas"], risk: 2, path: "M112 374 L238 386 L318 430 L278 486 L112 462 L54 408 Z", labelX: 183, labelY: 429 },
  { code: "guarico", name: "Guarico", cities: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"], risk: 3, path: "M322 180 L410 176 L468 224 L442 306 L334 310 L304 230 Z", labelX: 382, labelY: 247 },
  { code: "anzoategui", name: "Anzoategui", cities: ["Barcelona", "Puerto La Cruz", "El Tigre"], risk: 4, path: "M512 128 L590 118 L632 170 L604 232 L524 226 L500 174 Z", labelX: 561, labelY: 174 },
  { code: "sucre", name: "Sucre", cities: ["Cumana", "Carupano", "Guiria"], risk: 5, path: "M588 94 L684 82 L704 120 L648 150 L592 124 Z", labelX: 644, labelY: 118 },
  { code: "monagas", name: "Monagas", cities: ["Maturin", "Punta de Mata", "Caripito"], risk: 4, path: "M524 230 L604 236 L628 300 L574 354 L486 318 L470 252 Z", labelX: 548, labelY: 287 },
  { code: "delta_amacuro", name: "Delta Amacuro", cities: ["Tucupita", "Pedernales", "Curiapo"], risk: 2, path: "M628 238 L694 236 L704 334 L626 376 L574 354 L628 300 Z", labelX: 651, labelY: 306 },
  { code: "bolivar", name: "Bolivar", cities: ["Ciudad Bolivar", "Ciudad Guayana", "Upata"], risk: 2, path: "M316 314 L484 320 L574 358 L626 382 L554 492 L398 508 L286 486 L322 432 L238 384 Z", labelX: 445, labelY: 411 },
  { code: "amazonas", name: "Amazonas", cities: ["Puerto Ayacucho", "San Fernando de Atabapo", "Maroa"], risk: 1, path: "M278 488 L398 510 L388 552 L238 552 L112 464 Z", labelX: 266, labelY: 525 },
  { code: "nueva_esparta", name: "Nueva Esparta", cities: ["La Asuncion", "Porlamar", "Pampatar"], risk: 4, path: "M544 58 L604 48 L638 62 L620 84 L556 82 Z", labelX: 590, labelY: 68 }
];

export const stateOptions = venezuelaStates.map((state) => state.name);
