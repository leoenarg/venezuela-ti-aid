# Análisis de Contexto — venezuela-ti-aid

> Documento generado como contexto técnico del proyecto. Resume arquitectura, flujos de
> datos, modelo de seguridad y observaciones. Complementa a `brain.md` (principios y reglas)
> y al `README.md` (instalación). Ante conflicto de reglas, manda `brain.md`.

## 1. Qué es

Aplicación web humanitaria, *mobile-first* y *privacy-first*, para **reportar y buscar
personas desaparecidas, encontradas, fallecidas o en estado crítico de salud en Venezuela
durante emergencias**. El eje del diseño es evitar cualquier directorio público de personas:
la búsqueda solo devuelve resultados con coincidencia exacta de `cedula` + `birth_date`.

## 2. Stack y configuración

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router), React 18, TypeScript 5 |
| Estilos | Tailwind CSS 3 (tema custom: `signal`, `ink`, `relief`, `alert`, `paper`) |
| Backend | Supabase (PostgreSQL + Storage) vía `@supabase/supabase-js` |
| Deploy | Vercel desde GitHub (orientado a *free tier*) |

- Sin dependencias de UI/estado externas: todo es React local (`useState`/`useMemo`).
- Configuración por entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Sin analytics, trackers, ads ni APIs de IA (prohibido por diseño en `brain.md`).

## 3. Estructura del repositorio

```
app/
  layout.tsx            Layout raíz
  page.tsx              "/"        Tablero público (stats + mapa + accesos)
  report/page.tsx       "/report"  Formulario de reporte en 3 pasos
  search/page.tsx       "/search"  Búsqueda privada por coincidencia exacta
  legal/page.tsx        "/legal"   Términos, privacidad, colaboración, proveedores
components/
  VenezuelaRiskMap.tsx  Mapa interactivo con marcadores + tabla por estado
lib/
  supabaseClient.ts     Cliente Supabase + tipos compartidos
  imageCompression.ts   Compresión/escala de grises en canvas (cliente)
  venezuelaData.ts      Catálogo de 24 estados, riesgo, ciudades, etiquetas
supabase/schema.sql     Esquema, RLS, RPCs y bucket de Storage
docs/                   Política de privacidad, T&C, colaboración, riesgo de proveedores
public/venezuela-reference-map.png   Mapa base referencial
brain.md                Contexto y reglas obligatorias para IA/desarrolladores
```

## 4. Modelo de datos

Tabla única: **`public.missing_persons`**. Campos sensibles clave:
`full_name`, `cedula`, `birth_date`, `age`, `gender`, `status`, `location_category`,
`location_detail`, `last_known_state/city/parish`, `image_url`, `is_minor`.

Restricciones notables en el esquema:
- `status` es enum `person_status` (`missing`, `found_alive`, `deceased`, `critical_health`).
- `is_minor = (age < 18)` se valida en *check constraint* **y** en la política RLS de inserción.
- Identidad única: `unique (cedula, birth_date)` — base de la búsqueda exacta.
- `terms_version` se guarda en el reporte (actualmente fijo `"2026-06-27"` en el cliente).
- Trigger `set_missing_persons_updated_at` mantiene `updated_at`.

## 5. Modelo de seguridad (el corazón del proyecto)

RLS habilitado; permisos revocados a `anon`/`authenticated` salvo lo explícito:

- **INSERT anónimo permitido** con `with check` que reexige `is_minor=(age<18)`,
  `accepted_terms=true`, `terms_version` no nulo y longitudes de `cedula`/`full_name`.
- **SELECT anónimo denegado** (`using (false)`). No hay lectura directa de la tabla.
- Toda lectura pública pasa por funciones `security definer`:
  - `search_missing_person(cedula, birth_date)` → 1 fila exacta. **Enmascara a menores**:
    nombre → "Persona menor de edad", y oculta `location_detail`, `city`, `parish`, `image_url`.
  - `get_public_stats()` → totales agregados por estado de vida.
  - `get_public_state_stats()` → conteos por estado geográfico (alimenta el mapa).
- **Storage `person-photos`**: bucket *público*, límite 50 KB, solo `image/jpeg`. Subida
  anónima permitida solo para extensiones jpg/jpeg. Los nombres son `crypto.randomUUID()`
  (no predecibles).

## 6. Flujos principales

**Reporte** (`/report`): formulario de 3 pasos (identidad → edad/foto → ubicación/consentimiento).
La foto se comprime en el dispositivo a ≤500 px, escala de grises y JPEG ≤50 KB
(`compressToGrayscaleJpeg`) antes de subirse a Storage; luego se inserta la fila.

**Búsqueda** (`/search`): llama al RPC `search_missing_person`; muestra una sola coincidencia
con enmascaramiento de menores ya aplicado en la base.

**Tablero** (`/`): carga `get_public_stats` y `get_public_state_stats` en paralelo; renderiza
contadores, mapa interactivo y tabla por estado. Sin datos, usa *fallbacks* en cero.

## 7. Observaciones y posibles puntos de atención

- **Foto de menores en Storage**: el RPC oculta `image_url` para menores, pero el archivo
  sigue existiendo en un bucket *público*. Si la URL se filtró antes del enmascaramiento o
  se adivina el UUID (improbable), la imagen sería accesible. Considerar bucket privado +
  URLs firmadas, o no almacenar fotos de menores.
- **Título del mapa**: se rotula "Mapa de riesgo sísmico" pero `venezuelaData` modela un
  "riesgo" genérico por estado. Conviene alinear copy y semántica del dato.
- **`search_missing_person` devuelve `id` (uuid)** del registro; no se usa en el cliente y
  expone un identificador interno. Evaluar removerlo del `returns table`.
- **`terms_version` *hardcodeada*** en `report/page.tsx`. Si cambian los términos hay que
  editar el código; podría centralizarse.
- **Manejo de errores silencioso**: varios `catch {}` muestran mensaje genérico al usuario.
  Correcto para no filtrar datos, pero dificulta diagnóstico (sin logs por diseño).
- **Sin tests ni CI** visibles. Validación de calidad: `npm run lint` y `npm run build`.

## 8. Reglas que NO se deben romper (resumen de `brain.md`)

- Nada de directorios públicos, búsqueda por nombre, feeds, exports o *listados masivos*.
- Búsqueda pública solo por `cedula` + `birth_date` exactos; nunca `SELECT` anónimo crudo.
- Proteger menores enmascarando datos. Recolectar el mínimo de datos.
- Sin analytics/trackers/IA de terceros sobre datos de usuarios. Orientado a *free tier*.
- Cambios que requieren revisión humana: tocar RLS para permitir `SELECT`, dashboards admin,
  GPS preciso, reconocimiento facial/biométrico, OAuth, o compartir datos con terceros.

## 9. Flujo de desarrollo seguro

1. Leer `docs/privacy-and-data-protection.md` antes de tocar flujos de datos.
2. Leer `supabase/schema.sql` antes de cambiar comportamiento de base de datos.
3. Correr `npm run lint` y `npm run build`.
4. Al añadir un campo, actualizar: esquema → formulario → enmascaramiento en búsqueda →
   textos legales → `brain.md` si cambia el riesgo.
```

