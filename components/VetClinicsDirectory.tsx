"use client";

import { useId, useState } from "react";

type ClinicPhone = {
  number: string;
  label?: string;
};

type VetClinic = {
  name: string;
  location: string;
  phones: ClinicPhone[];
  notes?: string;
};

// Static, public emergency reference data. Free veterinary care directory.
// No personal records, no database, no tracking: just published contacts.
const clinics: VetClinic[] = [
  { name: "Consultorio Dr. Elis Navarro", location: "Plaza de Ruiz Pineda", phones: [{ number: "0424-1758829" }] },
  {
    name: "TUVET24",
    location: "Colinas de Bello Monte",
    phones: [{ number: "0212-7534118" }, { number: "0212-7517256" }, { number: "0416-6295135" }]
  },
  {
    name: "Centro Clinico Veterinario Dr. Santana",
    location: "Baruta",
    phones: [{ number: "+58 414-3358033" }],
    notes: "Activos para emergencias de traumatologia. (Linea CANTV fuera de servicio)."
  },
  {
    name: "Clinica Veterinaria Huellas",
    location: "La Castellana, Caracas",
    phones: [{ number: "0424-1231441" }, { number: "0424-2177643", label: "Guardia" }]
  },
  { name: "Uvet", location: "Las Acacias, Caracas", phones: [{ number: "0424-2663088" }, { number: "0212-6344330" }] },
  { name: "Hector Rodriguez", location: "Barquisimeto", phones: [{ number: "0424-5003658" }] },
  { name: "Masco Salud", location: "Valles del Tuy", phones: [{ number: "0412-9907357" }] },
  { name: "Kodama Animal", location: "Santa Eduvigis, Caracas", phones: [{ number: "0424-1767103" }] },
  {
    name: "Veterinaria Terrazas del Avila",
    location: "C.C. Parque Avila, Planta Baja",
    phones: [{ number: "+58 412-9353846" }],
    notes: "Emergencia 24 horas."
  },
  {
    name: "Bernadette Anzola",
    location: "Barquisimeto",
    phones: [{ number: "0414-5307339" }],
    notes: "Interconsulta en Etologia Clinica Veterinaria (Disponible online)."
  },
  {
    name: "Sedes del Dr. Coornelio",
    location: "Santa Eduvigis y California Sur",
    phones: [],
    notes: "Emergencias veterinarias."
  },
  { name: "Urgencias Veterinaria Santa Monica", location: "Santa Monica", phones: [] },
  {
    name: "Pets Products 2022 (Dra. Carolina Conde y Dra. Johana Urbina)",
    location: "San Antonio de los Altos",
    phones: [],
    notes: "Atendiendo emergencias (ubicados en la parte posterior)."
  },
  { name: "Clinica Veterinaria Razas", location: "Las Mercedes", phones: [], notes: "Detras de la bomba Texaco." },
  { name: "Clinica Vizcaya (Emilio Casanas)", location: "C.C. Vizcaya, PB.", phones: [{ number: "0424-1597148" }] },
  {
    name: "Centro Veterinario Terrazas de Avila (Dr. Jose Leonardo Quintero)",
    location: "Terrazas de Avila",
    phones: [{ number: "0424-2193882" }]
  }
];

function telHref(number: string) {
  return `tel:${number.replace(/[^+\d]/g, "")}`;
}

export function VetClinicsDirectory() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="grid min-w-0 gap-3 rounded-md border border-neutral-300 bg-white p-4" aria-labelledby="vet-title">
      <h2 className="sr-only" id="vet-title">
        Atencion veterinaria gratuita
      </h2>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="focus-ring flex items-center justify-between gap-3 rounded-md border-2 border-ink px-5 py-4 text-left text-lg font-black text-ink"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span>Listado de clinicas que prestan atencion veterinaria gratuita</span>
        <span aria-hidden className="text-2xl leading-none">
          {isOpen ? "-" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div id={panelId}>
          <p className="mt-1 text-sm leading-6 text-neutral-700">
            Contactos publicos de referencia para emergencias. Confirma disponibilidad antes de trasladarte.
          </p>
          <div className="mt-3 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-neutral-300">
            <table className="w-full min-w-[640px] border-collapse bg-white text-sm">
              <thead className="bg-neutral-100 text-left">
                <tr>
                  <th className="p-3">Clinica / Especialista</th>
                  <th className="p-3">Ubicacion</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Notas adicionales</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr className="border-t border-neutral-200 align-top" key={clinic.name}>
                    <td className="p-3 font-bold">{clinic.name}</td>
                    <td className="p-3">{clinic.location}</td>
                    <td className="p-3">
                      {clinic.phones.length > 0 ? (
                        <ul className="grid gap-1">
                          {clinic.phones.map((phone) => (
                            <li key={phone.number}>
                              {phone.label ? <span className="font-bold">{phone.label}: </span> : null}
                              <a className="focus-ring font-semibold text-signal underline" href={telHref(phone.number)}>
                                {phone.number}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-500">No disponible</span>
                      )}
                    </td>
                    <td className="p-3 text-neutral-700">{clinic.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
