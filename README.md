# Meseros

Software para el personal de sala del restaurante piloto ("El Encanto de la
Selva"). El mesero se acerca a la mesa, toma el pedido y lo manda a cocina;
eso marca la mesa como **ocupada** automáticamente. Cuando manda la boleta,
la mesa vuelve a quedar **libre**. Ambas cosas se reflejan en el sistema
principal de Restaurants (`../Restaurants`), no aquí.

## Cómo se relaciona con `../Restaurants`

Son **dos sistemas distintos** (cada uno con su propio repo, su propio
frontend y su propia base de datos) que se integran solo por API — nada de
compartir base de datos ni código:

| Qué | Quién llama a quién |
|---|---|
| Menú (platos disponibles) | Meseros → `GET {Restaurants}/v1/dishes/restaurant/{restaurantId}` (público) |
| Mesas del local (incluye hora de próxima reserva) | Meseros → `GET {Restaurants}/v1/restaurants/{restaurantId}/tables` (público) |
| Marcar mesa ocupada/libre | Meseros → `PATCH {Restaurants}/v1/restaurants/{restaurantId}/tables/{tableId}/status?status=OCCUPIED\|AVAILABLE` (requiere `X-API-Key`) |

**La API key es del propio dueño del restaurante**, generada desde su cuenta:
Restaurants → dashboard → **API Keys** → "Generar nueva clave" (el mismo
formulario de autoservicio que ya existía para el rol `DEVELOPER`, ahora
también disponible para `RESTAURANTE_OWNER`). No es un secreto fijo inventado
por nosotros — el dueño la genera, la revoca o la regenera cuando quiera
desde su propio panel, sin necesitar un redeploy. Al autenticar con esa key,
Restaurants la trata exactamente como si el dueño hubiera iniciado sesión: el
mismo chequeo de "¿eres dueño de este restaurante?" (`OwnershipGuard`) que ya
protegía ese endpoint sigue aplicando sin cambios.

La clave nunca llega al navegador del mesero: `src/app/api/mesas/[tableId]/estado/route.ts`
es una ruta servidor de Next.js que la agrega (header `X-API-Key`) y reenvía
la llamada.

Los pedidos (comandas) e items del mesero viven **solo en Supabase de este
proyecto**. Restaurants no los ve ni los necesita: para Restaurants, lo único
que existe es "esta mesa está ocupada o libre".

## Configuración

1. Crea un proyecto en [supabase.com](https://supabase.com) y corre
   `supabase/schema.sql` en su SQL Editor (crea las tablas `orders` y
   `order_items`).
2. Copia `.env.example` a `.env.local` y completa:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — de tu
     proyecto Supabase (Project Settings → API).
   - `NEXT_PUBLIC_RESTAURANTS_API_URL` — `http://localhost:8080/api` si
     corres Restaurants localmente con Docker Compose.
   - `NEXT_PUBLIC_RESTAURANT_ID` — UUID del restaurante piloto. Consíguelo
     con `GET {NEXT_PUBLIC_RESTAURANTS_API_URL}/v1/restaurants?search=Encanto`
     o desde Swagger (`/api/swagger-ui/index.html`) del backend de
     Restaurants.
   - `RESTAURANTS_API_KEY` — inicia sesión en Restaurants como el dueño del
     restaurante piloto, ve a **dashboard → API Keys**, genera una clave
     nueva y pégala acá. Solo se muestra una vez al crearla.
3. Asegúrate de que Restaurants esté corriendo (`docker compose up -d` en
   `../Restaurants`) — su `CORS_ALLOWED_ORIGINS` ya incluye
   `http://localhost:3001` por defecto, que es donde corre este proyecto.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3001
```

## Flujo de uso

1. El mesero abre la app, ingresa su nombre (una sola vez, se guarda en el
   dispositivo).
2. Ve la grilla de mesas (libre/ocupada, en vivo desde Restaurants).
3. Entra a una mesa, arma el pedido desde el menú y presiona **"Enviar a
   cocina"** → se guarda el pedido en Supabase y la mesa pasa a *Ocupada*.
4. Puede volver a la misma mesa y agregar más items (se acumulan en el mismo
   pedido abierto).
5. Al terminar, presiona **"Mandar boleta"** → cierra el pedido y la mesa
   vuelve a *Libre*.

## Alcance actual (deliberadamente básico)

- Un solo restaurante (el piloto) — usa una sola API key, la del dueño de ese restaurante.
- Sin login real de mesero, solo nombre local.
- Sin pantalla de cocina (KDS): "enviar a cocina" solo persiste el pedido y
  libera/ocupa la mesa. El modelo (`order_items`) ya queda listo para sumar
  esa vista después si se necesita.
