-- Tipo de empreendimento (loteamento/condominio) e finalidade (residencial/
-- comercial/misto) do estudo — antes eram fixos como "Loteamento" no dashboard.
-- Rodar isso no SQL Editor do Supabase.

alter table public.estudos add column if not exists tipo_empreendimento text not null default 'loteamento'
  check (tipo_empreendimento in ('loteamento', 'condominio'));

alter table public.estudos add column if not exists finalidade text not null default 'residencial'
  check (finalidade in ('residencial', 'comercial', 'misto'));
