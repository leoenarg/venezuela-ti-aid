# venezuela-ti-aid

Aplicacion humanitaria, mobile-first y privacy-first para reportar y buscar personas desaparecidas en Venezuela durante emergencias.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase PostgreSQL + Storage
- Vercel desde GitHub

## Rutas

- `/` tablero publico con contadores livianos y acciones principales.
- `/report` formulario multi-paso con compresion local de imagenes por canvas.
- `/search` busqueda exacta por cedula y fecha de nacimiento.

## Configuracion

1. Crea un proyecto gratuito en Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL editor.
3. Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Instala dependencias y levanta la app:

```bash
npm install
npm run dev
```

## Seguridad

El cliente anonimo puede insertar reportes, pero no puede listar registros. La busqueda publica usa la funcion `search_missing_person`, que solo devuelve una fila cuando coinciden exactamente `cedula` y `birth_date`.
