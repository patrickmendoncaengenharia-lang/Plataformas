import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudos } = await supabase
    .from('estudos')
    .select('id, nome, cidade, estado, status, atualizado_em, premissas')
    .order('atualizado_em', { ascending: false });

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold">Meus estudos de viabilidade</h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
              {estudos?.length ?? 0} estudo{(estudos?.length ?? 0) === 1 ? '' : 's'} cadastrado
              {(estudos?.length ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/estudos/novo"
            className="rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            + Novo estudo
          </Link>
        </div>

        {(!estudos || estudos.length === 0) && (
          <div
            className="rounded-[16px] border p-10 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-[15px] font-semibold">Nenhum estudo ainda</p>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
              Comece cadastrando as premissas do seu primeiro loteamento.
            </p>
            <Link
              href="/estudos/novo"
              className="mt-4 inline-block rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              Criar primeiro estudo
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {estudos?.map((e) => (
            <Link
              key={e.id}
              href={`/estudos/${e.id}`}
              className="rounded-[16px] border p-5 transition hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="mb-3 flex items-start justify-between">
                <span
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {e.status ?? 'rascunho'}
                </span>
              </div>
              <h3 className="text-[15px] font-bold">{e.nome}</h3>
              <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-2)' }}>
                {[e.cidade, e.estado].filter(Boolean).join(' / ') || 'Localizacao nao informada'}
              </p>
              <p className="mt-3 text-[11px]" style={{ color: 'var(--text-3)' }}>
                Atualizado em {new Date(e.atualizado_em).toLocaleDateString('pt-BR')}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
