import Link from "next/link";

const providerLinks = [
  ["Vercel Privacy Policy", "https://vercel.com/legal/privacy-policy"],
  ["Vercel Terms", "https://vercel.com/legal/terms"],
  ["Vercel DPA", "https://vercel.com/legal/dpa"],
  ["Supabase Privacy Policy", "https://supabase.com/privacy"],
  ["Supabase Terms", "https://supabase.com/terms"],
  ["Supabase DPA", "https://supabase.com/dpa"]
];

export default function LegalPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <header className="border-b border-neutral-300 pb-5">
          <Link className="focus-ring text-sm font-bold underline" href="/">
            Inicio
          </Link>
          <h1 className="mt-5 text-4xl font-black">Terminos, privacidad y colaboracion</h1>
          <p className="mt-3 max-w-3xl leading-7 text-neutral-700">
            Esta plataforma existe exclusivamente para asistencia humanitaria, reunificacion familiar y busqueda segura. Estos textos son una base operativa y deben ser revisados por asesoria legal antes de una operacion publica formal.
          </p>
        </header>

        <div className="grid gap-6 py-6">
          <LegalSection title="Uso permitido">
            <p>
              venezuela-ti-aid puede usarse solo para reportar, buscar y actualizar informacion de personas desaparecidas, encontradas, fallecidas o con salud delicada durante situaciones de emergencia.
            </p>
            <p>
              La informacion no debe usarse para persecucion, acoso, extorsion, discriminacion, fines politicos, venta de datos, publicidad, perfilado comercial, vigilancia o cualquier actividad que ponga en riesgo a una persona.
            </p>
          </LegalSection>

          <LegalSection title="Datos que se pueden cargar">
            <ul>
              <li>Nombre completo, cedula, fecha de nacimiento, edad y genero.</li>
              <li>Estado de vida y ubicacion o institucion relacionada.</li>
              <li>Estado, ciudad y parroquia del ultimo lugar conocido cuando la persona reportante los conozca.</li>
              <li>Foto opcional, validada y optimizada localmente antes de subirla.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Privacidad y busqueda">
            <p>
              No existe un directorio publico de personas ni busqueda por nombre. La busqueda publica requiere coincidencia exacta de cedula y fecha de nacimiento.
            </p>
            <p>
              Si una busqueda no coincide, el sistema muestra un mensaje generico y no revela si una cedula, fecha, nombre o ubicacion existe en la base de datos.
            </p>
            <p>
              Para menores de edad, los resultados se reducen o enmascaran para evitar exposicion innecesaria.
            </p>
          </LegalSection>

          <LegalSection title="Auditoria tecnica defensiva">
            <p>
              Por seguridad y prevencion de abusos, esta plataforma registra informacion tecnica de auditoria sobre
              cargas, consultas, visualizaciones y descargas, incluyendo fecha, IP aproximada, navegador, accion
              realizada y registros consultados.
            </p>
            <p>
              Esta informacion se usa solo para proteger el sistema, investigar abuso, preservar integridad tecnica y
              responder ante requerimientos legales de autoridades competentes. No se solicita GPS, contactos,
              fingerprinting invasivo ni datos privados del dispositivo.
            </p>
          </LegalSection>

          <LegalSection title="Responsabilidad al reportar">
            <p>
              Quien reporta declara que la informacion se entrega de buena fe y con finalidad humanitaria. No debe enviar rumores como hechos, informacion falsa, datos obtenidos de forma abusiva ni imagenes usadas para danar a terceros.
            </p>
            <p>
              La plataforma no reemplaza a servicios de emergencia, hospitales, proteccion civil, organizaciones humanitarias, autoridades competentes ni asesoria legal.
            </p>
          </LegalSection>

          <LegalSection title="Servicios usados">
            <p>
              La aplicacion puede depender de proveedores de infraestructura como Vercel para hosting, Supabase para base de datos y almacenamiento, y GitHub para codigo fuente.
            </p>
            <p>
              Estos proveedores pueden procesar datos tecnicos o informacion necesaria para alojar, almacenar, proteger y operar el servicio bajo sus propias politicas y acuerdos. El proyecto no autoriza su uso para fines ajenos a la operacion del sistema.
            </p>
            <div className="grid gap-2">
              {providerLinks.map(([label, href]) => (
                <a className="focus-ring font-bold text-signal underline" href={href} key={href} rel="noreferrer" target="_blank">
                  {label}
                </a>
              ))}
            </div>
          </LegalSection>

          <LegalSection title="Colaboradores y desarrolladores">
            <p>
              Los colaboradores no deben acceder a datos reales de usuarios salvo autorizacion documentada y necesidad operativa. Para desarrollo se debe usar informacion ficticia.
            </p>
            <p>
              Esta prohibido pegar reportes reales, cedulas, fechas de nacimiento, fotos o datos sensibles en herramientas de IA, issues publicos, chats, documentos compartidos o servicios externos no aprobados.
            </p>
          </LegalSection>

          <LegalSection title="Correccion, retiro y abuso">
            <p>
              Antes de operar publicamente, el responsable del proyecto debe publicar un canal de contacto para pedir correccion, retiro de informacion, denuncia de abuso o investigacion de reportes falsos.
            </p>
            <p>
              Cualquier incidente de seguridad debe investigarse, documentarse y notificarse segun las leyes aplicables.
            </p>
          </LegalSection>

          <LegalSection title="Aviso legal">
            <p>
              Estos terminos son una plantilla inicial para software humanitario. No constituyen asesoria legal. Deben revisarse conforme a las leyes aplicables del pais donde opere el proyecto, el lugar donde esten los usuarios y las jurisdicciones de los proveedores.
            </p>
          </LegalSection>
        </div>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-neutral-300 bg-white p-5">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-3 grid gap-3 leading-7 text-neutral-700 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}
