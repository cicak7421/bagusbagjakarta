-- =====================================================================
-- PESANAN, AKUN CUSTOMER & PEMBAYARAN (aman dijalankan berulang)
--
-- Jalankan di Supabase → SQL Editor SETELAH schema.sql dan security.sql
-- (file ini memakai fungsi public.is_admin() dari security.sql).
--
-- Prinsip keamanan:
--  * Customer TIDAK bisa menulis langsung ke tabel orders / order_items.
--    Pesanan hanya bisa dibuat lewat fungsi create_order(), yang menghitung
--    ulang harga & stok dari tabel products (angka dari browser diabaikan).
--  * Customer hanya bisa MEMBACA pesanannya sendiri (RLS).
--  * Status "lunas" hanya diubah oleh server (webhook Midtrans terverifikasi,
--    memakai secret key) atau oleh admin.
-- =====================================================================

-- ---------- Sakelar checkout online (bisa dimatikan dari database) ----------
alter table public.site_settings add column if not exists checkout_enabled boolean not null default true;

-- ---------- Profil customer ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  company text not null default '',
  address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_len check (
    char_length(full_name) <= 80 and char_length(phone) <= 20 and char_length(company) <= 80
    and char_length(address) <= 300 and char_length(city) <= 60 and char_length(postal_code) <= 10)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profile read own" on public.profiles;
drop policy if exists "profile insert own" on public.profiles;
drop policy if exists "profile update own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profile insert own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profile update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Buat baris profil otomatis saat customer mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80),
    left(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '[^0-9+]', '', 'g'), 20)
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new; -- pendaftaran tidak boleh gagal hanya karena profil
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Pesanan ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','processing','shipped','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','expired','failed','refunded')),
  payment_method text not null default 'qris' check (payment_method in ('qris','manual')),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  shipping_cost numeric(14,2) not null default 0 check (shipping_cost >= 0),
  total numeric(14,2) not null check (total >= 0),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  company text not null default '',
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null default '',
  notes text not null default '',
  admin_note text not null default '',
  courier text not null default '',
  tracking_number text not null default '',
  payment_attempt integer not null default 0,
  payment_ref text unique,
  payment_transaction_id text,
  payment_qr_url text,
  payment_qr_string text,
  payment_expires_at timestamptz,
  paid_at timestamptz,
  stock_released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null default '',
  category text not null default '',
  image_url text not null default '',
  color_name text,
  motif_name text,
  size_name text,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  qty integer not null check (qty > 0),
  line_total numeric(14,2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Catatan notifikasi pembayaran (audit). Hanya admin yang bisa membaca; hanya server yang menulis.
create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  order_id uuid references public.orders(id) on delete cascade,
  payment_ref text,
  transaction_status text,
  source text not null default 'webhook',
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_order_idx on public.payment_events (order_id, created_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.orders, public.order_items, public.payment_events from anon, authenticated;
grant select, update on public.orders to authenticated;       -- update dibatasi RLS: hanya admin
grant select on public.order_items, public.payment_events to authenticated;

drop policy if exists "orders read own" on public.orders;
drop policy if exists "orders admin update" on public.orders;
create policy "orders read own" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "orders admin update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order items read own" on public.order_items;
create policy "order items read own" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));

drop policy if exists "payment events admin read" on public.payment_events;
create policy "payment events admin read" on public.payment_events for select to authenticated
  using (public.is_admin());

-- ---------- Stok varian (kolom jsonb colors / motifs / sizes) ----------
create or replace function public._adjust_variant_stock(arr jsonb, vname text, delta integer)
returns jsonb language sql immutable set search_path = public as $$
  select case when vname is null or jsonb_typeof(arr) <> 'array' then arr else coalesce((
    select jsonb_agg(
      case when btrim(e->>'name') = vname and jsonb_typeof(e->'stock_qty') = 'number'
        then jsonb_set(e, '{stock_qty}', to_jsonb(greatest(0, (e->>'stock_qty')::numeric::integer + delta)))
        else e end order by ord)
    from jsonb_array_elements(arr) with ordinality as t(e, ord)), '[]'::jsonb) end;
$$;

create or replace function public._find_variant(arr jsonb, vname text)
returns jsonb language sql immutable set search_path = public as $$
  select e from jsonb_array_elements(case when jsonb_typeof(arr) = 'array' then arr else '[]'::jsonb end) as e
  where btrim(e->>'name') = vname limit 1;
$$;

-- Kembalikan stok sebuah pesanan (dipanggil trigger saat pesanan dibatalkan)
create or replace function public._release_order_stock(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare it record; pr record; sv jsonb;
begin
  for it in select * from public.order_items where order_id = p_order_id and product_id is not null loop
    select * into pr from public.products where id = it.product_id for update;
    if not found then continue; end if;
    sv := public._find_variant(pr.sizes, it.size_name);
    update public.products set
      stock_qty = case when sv is not null and jsonb_typeof(sv->'stock_qty') = 'number' then stock_qty else stock_qty + it.qty end,
      sizes  = public._adjust_variant_stock(sizes,  it.size_name,  it.qty),
      colors = public._adjust_variant_stock(colors, it.color_name, it.qty),
      motifs = public._adjust_variant_stock(motifs, it.motif_name, it.qty),
      updated_at = now()
    where id = it.product_id;
  end loop;
end $$;

-- Jaga konsistensi tiap kali pesanan diubah (oleh admin maupun server).
-- subtotal hanya boleh diisi sekali oleh create_order (lewat set_config app.order_init).
create or replace function public.orders_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.order_number := old.order_number; new.user_id := old.user_id; new.created_at := old.created_at;
  if coalesce(current_setting('app.order_init', true), '') <> old.id::text then new.subtotal := old.subtotal; end if;
  new.total := new.subtotal + new.shipping_cost;
  if new.payment_status = 'paid' and old.payment_status <> 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
    if new.status = 'pending_payment' then new.status := 'paid'; end if;
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' and not old.stock_released then
    perform public._release_order_stock(old.id);
    new.stock_released := true;
  end if;
  return new;
end $$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

-- ---------- Membuat pesanan (satu-satunya jalan untuk customer) ----------
-- p_items   : [{"product_id":"uuid","color":"Hitam","motif":null,"size":null,"qty":100}, ...]
-- p_shipping: {"name","phone","company","address","city","postal_code","notes"}
create or replace function public.create_order(p_items jsonb, p_shipping jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_email text;
  it jsonb; pr public.products%rowtype;
  v_color text; v_motif text; v_size text; v_qty integer;
  cv jsonb; mv jsonb; sv jsonb;
  v_unit numeric(14,2); v_stock integer; v_subtotal numeric(14,2) := 0;
  v_name text := btrim(coalesce(p_shipping->>'name', ''));
  v_phone text := regexp_replace(coalesce(p_shipping->>'phone', ''), '[^0-9+]', '', 'g');
  v_address text := btrim(coalesce(p_shipping->>'address', ''));
  v_city text := btrim(coalesce(p_shipping->>'city', ''));
  v_postal text := btrim(coalesce(p_shipping->>'postal_code', ''));
  v_company text := btrim(coalesce(p_shipping->>'company', ''));
  v_notes text := btrim(coalesce(p_shipping->>'notes', ''));
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_enabled boolean;
begin
  if uid is null then raise exception 'Silakan masuk ke akun terlebih dahulu.' using errcode = 'P0001'; end if;

  select checkout_enabled into v_enabled from public.site_settings limit 1;
  if v_enabled is false then raise exception 'Checkout online sedang dinonaktifkan. Silakan pesan lewat WhatsApp.' using errcode = 'P0001'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then raise exception 'Keranjang masih kosong.' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Maksimal 20 jenis barang per pesanan.' using errcode = 'P0001'; end if;
  if char_length(v_name) < 3 or char_length(v_name) > 80 then raise exception 'Nama penerima wajib diisi (3-80 huruf).' using errcode = 'P0001'; end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then raise exception 'Nomor HP/WhatsApp tidak valid.' using errcode = 'P0001'; end if;
  if char_length(v_address) < 10 or char_length(v_address) > 300 then raise exception 'Alamat pengiriman wajib diisi lengkap (10-300 huruf).' using errcode = 'P0001'; end if;
  if char_length(v_city) < 2 or char_length(v_city) > 60 then raise exception 'Kota/kabupaten wajib diisi.' using errcode = 'P0001'; end if;
  if v_postal <> '' and v_postal !~ '^[0-9]{5}$' then raise exception 'Kode pos harus 5 angka.' using errcode = 'P0001'; end if;
  if char_length(v_company) > 80 or char_length(v_notes) > 500 then raise exception 'Nama perusahaan atau catatan terlalu panjang.' using errcode = 'P0001'; end if;

  -- Pesanan QRIS yang kodenya sudah pernah dibuat tapi tidak dibayar lebih dari 24 jam dibatalkan otomatis
  -- (stok kembali lewat trigger). Pesanan yang menunggu transfer manual TIDAK ikut dibatalkan: itu keputusan admin.
  update public.orders set status = 'cancelled', admin_note = btrim(admin_note || ' [Otomatis batal: QRIS tidak dibayar 24 jam]')
   where status = 'pending_payment' and payment_status in ('expired', 'failed', 'pending') and payment_method = 'qris' and payment_attempt > 0
     and created_at < now() - interval '24 hours'
     and (payment_expires_at is null or payment_expires_at < now());

  -- Anti-spam: batasi jumlah pesanan yang belum dibayar per akun
  if (select count(*) from public.orders where user_id = uid and status = 'pending_payment') >= 5 then
    raise exception 'Kamu masih punya 5 pesanan yang belum dibayar. Selesaikan atau batalkan dulu.' using errcode = 'P0001';
  end if;

  select email into v_email from auth.users where id = uid;

  -- Nomor pesanan unik: TJE-YYMMDD-XXXXXX
  loop
    v_number := 'TJE-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;

  insert into public.orders (id, order_number, user_id, subtotal, total, customer_name, customer_phone, customer_email, company,
                             shipping_address, shipping_city, shipping_postal_code, notes)
  values (v_order_id, v_number, uid, 0, 0, v_name, v_phone, coalesce(v_email, ''), v_company, v_address, v_city, v_postal, v_notes);

  for it in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty := (it->>'qty')::integer;
    exception when others then
      raise exception 'Jumlah barang tidak valid.' using errcode = 'P0001';
    end;
    v_color := nullif(btrim(coalesce(it->>'color', '')), '');
    v_motif := nullif(btrim(coalesce(it->>'motif', '')), '');
    v_size  := nullif(btrim(coalesce(it->>'size', '')), '');

    begin
      select * into pr from public.products where id = (it->>'product_id')::uuid and is_active = true for update;
    exception when invalid_text_representation then
      raise exception 'Produk tidak valid.' using errcode = 'P0001';
    end;
    if not found then raise exception 'Ada produk di keranjang yang sudah tidak tersedia. Perbarui keranjang kamu.' using errcode = 'P0001'; end if;

    -- Varian wajib dipilih kalau produknya punya pilihan
    cv := null; mv := null; sv := null;
    if jsonb_array_length(pr.colors) > 0 then
      cv := public._find_variant(pr.colors, v_color);
      if cv is null then raise exception 'Pilihan warna untuk "%" tidak tersedia lagi.', pr.name using errcode = 'P0001'; end if;
    else v_color := null; end if;
    if jsonb_array_length(pr.motifs) > 0 then
      mv := public._find_variant(pr.motifs, v_motif);
      if mv is null then raise exception 'Pilihan motif untuk "%" tidak tersedia lagi.', pr.name using errcode = 'P0001'; end if;
    else v_motif := null; end if;
    if jsonb_array_length(pr.sizes) > 0 then
      sv := public._find_variant(pr.sizes, v_size);
      if sv is null then raise exception 'Pilihan ukuran untuk "%" tidak tersedia lagi.', pr.name using errcode = 'P0001'; end if;
    else v_size := null; end if;

    -- Harga per pcs: harga ukuran (kalau ada) atau harga produk + tambahan warna & motif. Sama dengan lib/variants.ts
    v_unit := coalesce(
        nullif(floor(coalesce((sv->>'price')::numeric, 0)), 0),
        nullif(floor(coalesce((sv->>'price_add')::numeric, 0)), 0),
        pr.price)
      + greatest(0, floor(coalesce((cv->>'price_add')::numeric, 0)))
      + greatest(0, floor(coalesce((mv->>'price_add')::numeric, 0)));
    if v_unit <= 0 then raise exception 'Harga "%" belum tersedia. Silakan hubungi admin lewat WhatsApp.', pr.name using errcode = 'P0001'; end if;

    -- Stok efektif: stok ukuran menggantikan stok produk; warna & motif membatasi lagi
    v_stock := case when sv is not null and jsonb_typeof(sv->'stock_qty') = 'number' then (sv->>'stock_qty')::numeric::integer else pr.stock_qty end;
    if cv is not null and jsonb_typeof(cv->'stock_qty') = 'number' then v_stock := least(v_stock, (cv->>'stock_qty')::numeric::integer); end if;
    if mv is not null and jsonb_typeof(mv->'stock_qty') = 'number' then v_stock := least(v_stock, (mv->>'stock_qty')::numeric::integer); end if;

    if v_qty is null or v_qty < pr.min_order then raise exception 'Minimal order "%" adalah % pcs.', pr.name, pr.min_order using errcode = 'P0001'; end if;
    if v_qty > 100000 then raise exception 'Jumlah "%" terlalu besar. Untuk order besar hubungi admin lewat WhatsApp.', pr.name using errcode = 'P0001'; end if;
    if v_qty > v_stock then raise exception 'Stok "%" tinggal % pcs. Kurangi jumlah atau hubungi admin untuk pre-order.', pr.name, greatest(v_stock, 0) using errcode = 'P0001'; end if;

    update public.products set
      stock_qty = case when sv is not null and jsonb_typeof(sv->'stock_qty') = 'number' then stock_qty else stock_qty - v_qty end,
      sizes  = public._adjust_variant_stock(sizes,  v_size,  -v_qty),
      colors = public._adjust_variant_stock(colors, v_color, -v_qty),
      motifs = public._adjust_variant_stock(motifs, v_motif, -v_qty),
      updated_at = now()
    where id = pr.id;

    insert into public.order_items (order_id, product_id, product_name, product_slug, category, image_url, color_name, motif_name, size_name, unit_price, qty, line_total)
    values (v_order_id, pr.id, pr.name, pr.slug, pr.category,
            coalesce(nullif(mv->>'image_url', ''), nullif(sv->>'image_url', ''), nullif(cv->>'image_url', ''), pr.image_url, ''),
            v_color, v_motif, coalesce(v_size, nullif(pr.size, '')), v_unit, v_qty, v_unit * v_qty);
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  -- subtotal dikunci trigger untuk UPDATE biasa, jadi diisi lewat jalur khusus di bawah
  perform set_config('app.order_init', v_order_id::text, true);
  update public.orders set subtotal = v_subtotal where id = v_order_id;
  perform set_config('app.order_init', '', true);

  return jsonb_build_object('order_number', v_number, 'total', v_subtotal);
end $$;

-- ---------- Customer membatalkan pesanannya sendiri (hanya selama belum dibayar) ----------
create or replace function public.cancel_my_order(p_order_number text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'Silakan masuk ke akun terlebih dahulu.' using errcode = 'P0001'; end if;
  update public.orders set status = 'cancelled'
   where order_number = p_order_number and user_id = auth.uid()
     and status = 'pending_payment' and payment_status in ('unpaid','expired','failed','pending')
     and (payment_status <> 'pending' or payment_expires_at is null or payment_expires_at < now());
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Pesanan tidak bisa dibatalkan. Kalau kode QRIS masih aktif, tunggu sampai kedaluwarsa atau hubungi admin.' using errcode = 'P0001'; end if;
  return true;
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon;
revoke all on function public.cancel_my_order(text) from public, anon;
revoke all on function public._release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.orders_before_update() from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to authenticated;
grant execute on function public.cancel_my_order(text) to authenticated;

-- Supaya API langsung mengenali kolom & fungsi baru
notify pgrst, 'reload schema';
