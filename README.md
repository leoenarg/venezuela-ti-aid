# venezuela-ti-aid

Aplicacion humanitaria, mobile-first y privacy-first para reportar y buscar personas desaparecidas en Venezuela durante emergencias.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase PostgreSQL + Storage
- Vercel desde GitHub

## Rutas

- `/` tablero publico con contadores livianos y acciones principales.
- `/report` formulario multi-paso con validacion local de imagenes, deteccion de rostro, filtro NSFW y optimizacion antes de subir.
- `/search` busqueda exacta por cedula y fecha de nacimiento, auditada desde API server-side.
- `/legal` terminos, privacidad, reglas de colaboracion y aviso de proveedores.

## Configuracion

1. Crea un proyecto gratuito en Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL editor.
3. Ejecuta `supabase/audit.sql` en el SQL editor para crear la auditoria defensiva append-only.
4. Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUDIT_SALT=
```

`SUPABASE_SERVICE_ROLE_KEY` y `AUDIT_SALT` son solo de servidor y se usan para auditoria defensiva. Los flujos publicos de reporte y busqueda deben seguir funcionando con anon key y RLS aunque la auditoria falle. No deben usarse en componentes cliente ni exponerse como `NEXT_PUBLIC_*`.

5. Instala dependencias y levanta la app:

```bash
npm install
npm run dev
```

## Seguridad

El cliente anonimo puede subir fotos optimizadas al bucket permitido, pero no puede listar registros. La creacion de reportes y la busqueda exacta pasan por rutas API server-side para registrar auditoria tecnica. La busqueda usa la funcion `search_missing_person`, que solo devuelve una fila cuando coinciden exactamente `cedula` y `birth_date`.

## Auditoria defensiva

La migracion `supabase/audit.sql` crea `audit.audit_events`, funciones `audit.log_event`, `audit.export_events` y `audit.verify_chain`. La tabla es append-only mediante triggers, tiene RLS activo y revoca permisos directos a `anon` y `authenticated`.

Eventos integrados actualmente:

- `UPLOAD_IMAGE_ATTEMPT`
- `UPLOAD_IMAGE_SUCCESS`
- `UPLOAD_IMAGE_REJECTED`
- `CREATE_PERSON_REPORT`
- `SEARCH_PERSON`
- `VIEW_PERSON_DETAIL`

Eventos preparados para futuros flujos admin o descargas:

- `UPDATE_PERSON_REPORT`
- `DOWNLOAD_IMAGE`
- `DOWNLOAD_REPORT`
- `ADMIN_REVIEW_APPROVED`
- `ADMIN_REVIEW_REJECTED`
- `AUDIT_EXPORT`

La auditoria guarda IP aproximada y `ip_hash`, headers tecnicos minimos, ruta, metodo, status y metadata minimizada. No solicita GPS, contactos, fingerprinting invasivo ni cookies de terceros.

## Gobernanza

- `AGENTS.md` contiene instrucciones cortas para agentes de IA y debe leerse antes de tocar el codigo.
- `brain.md` contiene el contexto que debe leer cualquier IA o desarrollador antes de modificar el proyecto.
- `docs/privacy-and-data-protection.md` define reglas de tratamiento de datos.
- `docs/terms-and-conditions.md` contiene una base de terminos de uso.
- `docs/collaboration-policy.md` define reglas para colaboradores y uso de IA.
- `docs/service-provider-risk-review.md` resume riesgos y links de Vercel, Supabase y GitHub.
- `.github/CODEOWNERS` define revisores responsables para cambios del repositorio.
- `.github/workflows/validate-tag.yml` valida en pull requests hacia `main` que la version esperada sea consecutiva segun el ultimo tag `v.Numero.YYMMDDletra`.

## Versionado y tags

El flujo de GitHub espera tags con formato:

```text
v.0.260628a
v.0.260628b
```

Ejemplo: `v.0.260628a` para el primer tag del 28 de junio de 2026. Si existe otro tag el mismo dia, la letra debe avanzar.

El workflow `validate-tag.yml` lee un archivo `VERSION` y lo compara contra el siguiente tag esperado. Si se mantiene este control, cada PR hacia `main` debe incluir o actualizar `VERSION` con el valor esperado antes de mergear.

## AI / Agent Instructions

Antes de usar una IA o agente de codigo en este proyecto, lee `AGENTS.md`, `brain.md`, `docs/privacy-and-data-protection.md` y `supabase/schema.sql`.

Este proyecto maneja datos humanitarios sensibles. No pegues datos reales de usuarios, fotos, cedulas, fechas de nacimiento, reportes, exports de auditoria ni secretos en herramientas de IA, issues publicos, logs o servicios externos.

Estos documentos son plantillas operativas, no asesoria legal. Deben revisarse con asesoria legal antes de uso publico formal.
