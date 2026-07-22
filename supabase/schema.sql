-- ============================================================
-- Esquema Supabase - Sistema del Mesero
-- Ejecutar en el SQL Editor del proyecto de Supabase.
--
-- Este sistema NO duplica mesas ni platos: esos viven en el sistema de
-- Restaurants y se consultan en vivo por su API pública (ver
-- src/services/restaurantsApi.ts). Aquí solo se guarda lo que Restaurants
-- no modela: pedidos (comandas) y sus items.
-- ============================================================

create extension if not exists "uuid-ossp";

create type order_status as enum ('ABIERTO', 'ENVIADO_COCINA', 'ENTREGADO', 'CERRADO');

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null,
  table_id uuid not null,           -- id de la mesa en el sistema de Restaurants
  table_number text not null,       -- copia legible para no depender de otro fetch
  waiter_name text not null,
  status order_status not null default 'ABIERTO',
  created_at timestamptz not null default now(),
  sent_to_kitchen_at timestamptz,
  closed_at timestamptz
);

-- Como mucho un pedido abierto por mesa a la vez.
create unique index if not exists orders_one_open_per_table
  on orders (table_id)
  where status <> 'CERRADO';

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  dish_id uuid not null,            -- id del plato en el sistema de Restaurants
  dish_name text not null,          -- copia al momento de pedir (el precio/nombre pudo cambiar luego)
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists orders_restaurant_id_idx on orders (restaurant_id);

-- RLS: la app usa la clave anónima directo desde el navegador (mesero en
-- tablet/celular, sin login propio). Se deja abierto a nivel de fila porque
-- es una app interna de un solo restaurante piloto; si se expone a más
-- restaurantes conviene sumar auth real y políticas por restaurant_id.
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "orders_all" on orders for all using (true) with check (true);
create policy "order_items_all" on order_items for all using (true) with check (true);
