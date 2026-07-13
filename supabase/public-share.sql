-- Link publico de visualizacao (somente leitura) do estudo, para compartilhar
-- com o cliente sem exigir login e sem permitir edicao.
-- Rodar isso no SQL Editor do Supabase depois do schema.sql e do storage.sql.

alter table public.estudos add column if not exists public_token uuid not null default gen_random_uuid();
alter table public.estudos add column if not exists publico_habilitado boolean not null default false;

create unique index if not exists idx_estudos_public_token on public.estudos(public_token);

-- Funcao SECURITY DEFINER: unico jeito de ler um estudo sem estar logado.
-- Nao abre uma policy de SELECT publica na tabela inteira (o que deixaria
-- qualquer estudo com publico_habilitado=true listavel por qualquer um) —
-- so retorna a linha quando o token exato bate, e mesmo assim so se o dono
-- tiver habilitado o compartilhamento.
create or replace function public.get_estudo_publico(p_token uuid)
returns setof public.estudos
language sql
security definer
set search_path = public
stable
as $$
  select * from public.estudos
  where public_token = p_token and publico_habilitado = true;
$$;

revoke all on function public.get_estudo_publico(uuid) from public;
grant execute on function public.get_estudo_publico(uuid) to anon, authenticated;
