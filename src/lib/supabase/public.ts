import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cliente anonimo (sem cookies/sessao) usado pela rota /publico/[token] — le
// o estudo via RPC get_estudo_publico, que so retorna dados quando o token
// bate e o dono habilitou o compartilhamento.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
