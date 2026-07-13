-- Plataforma de Estudos de Viabilidade — schema inicial
-- Rodar isso no SQL Editor do seu projeto Supabase (supabase.com -> seu projeto -> SQL Editor).

create table if not exists public.estudos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cidade text,
  estado text,
  spe text,
  proprietario text,
  responsavel_nome text,
  responsavel_crea text,
  data_base date default current_date,
  versao text default 'v1.0',
  status text default 'rascunho' check (status in ('rascunho','em_analise','aprovado','arquivado')),
  premissas jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  estudo_id uuid not null references public.estudos(id) on delete cascade,
  tipo text not null check (tipo in ('terrenista','loteador','investidor','outro')),
  nome text not null,
  percentual_participacao numeric(6,3) not null default 0,
  valor_integralizado numeric(16,2) not null default 0,
  forma_participacao text not null default 'dinheiro' check (forma_participacao in ('dinheiro','permuta','servico','misto')),
  percentual_lucro numeric(6,3) not null default 0,
  timing_aporte text not null default 'mes_0' check (timing_aporte in ('mes_0','parcelado','conforme_cronograma')),
  timing_recebimento text not null default 'mensal' check (timing_recebimento in ('mensal','no_final','conforme_distribuicao')),
  tma numeric(6,3),
  criado_em timestamptz not null default now(),
  ordem integer not null default 0
);

alter table public.estudos enable row level security;
alter table public.participantes enable row level security;

create policy "usuario ve so os proprios estudos"
  on public.estudos for select
  using (auth.uid() = user_id);

create policy "usuario cria estudo pra si"
  on public.estudos for insert
  with check (auth.uid() = user_id);

create policy "usuario edita so os proprios estudos"
  on public.estudos for update
  using (auth.uid() = user_id);

create policy "usuario apaga so os proprios estudos"
  on public.estudos for delete
  using (auth.uid() = user_id);

create policy "usuario ve participantes dos proprios estudos"
  on public.participantes for select
  using (exists (select 1 from public.estudos e where e.id = estudo_id and e.user_id = auth.uid()));

create policy "usuario gerencia participantes dos proprios estudos"
  on public.participantes for all
  using (exists (select 1 from public.estudos e where e.id = estudo_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.estudos e where e.id = estudo_id and e.user_id = auth.uid()));

create index if not exists idx_participantes_estudo on public.participantes(estudo_id);
create index if not exists idx_estudos_user on public.estudos(user_id);
