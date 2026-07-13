-- Bucket de imagens do projeto (foto/planta que o usuario opcionalmente sobe).
-- Rodar isso no SQL Editor do Supabase depois do schema.sql.

alter table public.estudos add column if not exists imagem_url text;

insert into storage.buckets (id, name, public)
values ('estudo-imagens', 'estudo-imagens', true)
on conflict (id) do nothing;

create policy "leitura publica das imagens de estudo"
  on storage.objects for select
  using (bucket_id = 'estudo-imagens');

create policy "usuario autenticado sobe imagem de estudo"
  on storage.objects for insert
  with check (bucket_id = 'estudo-imagens' and auth.role() = 'authenticated');

create policy "usuario autenticado substitui/remove imagem de estudo"
  on storage.objects for update
  using (bucket_id = 'estudo-imagens' and auth.role() = 'authenticated');

create policy "usuario autenticado apaga imagem de estudo"
  on storage.objects for delete
  using (bucket_id = 'estudo-imagens' and auth.role() = 'authenticated');
