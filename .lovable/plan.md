

## Plan: Storage Buckets + Tabla de Victorias

### 1. Crear 2 buckets de storage (públicos)

- **`avatars`** — 6 imágenes de avatares de los owners
- **`covers`** — 58 imágenes de portadas de juegos

Ambos buckets serán públicos (solo lectura para todos, ya que son assets estáticos). Se crean vía migración SQL.

### 2. Subir las imágenes

Crear un edge function `upload-assets` que:
- Lee los archivos desde las URLs públicas actuales del proyecto
- Los sube a los buckets correspondientes

Alternativamente, escribir un script en el código que use el cliente de storage para subir cada archivo. Dado que son archivos estáticos ya en `public/`, usaré un edge function que haga fetch a cada URL y los suba al bucket.

### 3. Actualizar referencias en el código

- **`src/data/owners.js`**: Cambiar `avatar: "/avatars/ernesto-aguirre.png"` → URL pública del bucket `avatars`
- **`src/data/images.js`**: Cambiar todas las rutas `/covers/...` → URLs públicas del bucket `covers`
- Construir las URLs con el patrón: `https://jcijqhcdsqonbitvyysh.supabase.co/storage/v1/object/public/{bucket}/{filename}`

### 4. Crear tabla `victories` en la base de datos

```sql
create table public.victories (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  winner text not null,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Públicamente accesible (no hay auth en esta app)
alter table public.victories enable row level security;
create policy "Allow all access" on public.victories for all using (true) with check (true);
```

### 5. Actualizar el código para usar la tabla `victories`

- **`src/utils/storage.js`**: Reemplazar `loadVictories`/`saveVictories` (localStorage) por funciones que lean/escriban de la tabla `victories` vía el cliente.
- **`src/App.jsx`**: Cambiar el state de victories para cargar desde la DB al iniciar y escribir a la DB al agregar una victoria.
- **`src/components/Leaderboard.jsx`**: Sin cambios necesarios (recibe victories como prop).

### Resumen de cambios

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear buckets `avatars` y `covers`, tabla `victories` con RLS |
| Edge function `upload-assets` | Subir las 64 imágenes a los buckets |
| `src/data/images.js` | URLs apuntando al bucket `covers` |
| `src/data/owners.js` | URLs apuntando al bucket `avatars` |
| `src/utils/storage.js` | Victorias desde/hacia la DB en vez de localStorage |
| `src/App.jsx` | Cargar victorias de DB al inicio, guardar en DB al agregar |

