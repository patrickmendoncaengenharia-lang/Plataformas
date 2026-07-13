import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Premissas } from '@/lib/calc-engine';
import { somarMeses, fmtMesAno } from '@/lib/dates';
import TopBar from '@/components/TopBar';

type Marco = {
  label: string;
  inicio?: string;
  fim?: string;
  cor: string;
};

export default async function CronogramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  const p = estudo.premissas as Premissas;
  const datas = p.datas;

  const fimObras = datas?.inicioObras ? somarMeses(datas.inicioObras, p.prazoObra) : undefined;
  const fimVendas =
    datas?.lancamento && p.mesFimVendas && p.mesFimVendas !== p.mesInicioVendas
      ? somarMeses(datas.lancamento, p.mesFimVendas - p.mesInicioVendas)
      : datas?.lancamento;
  const prazoRecebimentos = Math.max(p.prazoCurta, p.prazoLonga) + p.parcelasEntrada;
  const fimRecebimentos = datas?.lancamento ? somarMeses(datas.lancamento, prazoRecebimentos) : undefined;

  const marcos: Marco[] = [
    { label: 'Projetos', inicio: datas?.inicioProjetos, fim: datas?.inicioProjetos, cor: 'var(--accent)' },
    { label: 'Aprovação', inicio: datas?.aprovacao, fim: datas?.aprovacao, cor: 'var(--accent)' },
    { label: 'Registro', inicio: datas?.registro, fim: datas?.registro, cor: 'var(--accent)' },
    { label: 'Obras', inicio: datas?.inicioObras, fim: fimObras, cor: 'var(--warn)' },
    { label: 'Lançamento', inicio: datas?.lancamento, fim: datas?.lancamento, cor: 'var(--good)' },
    { label: 'Vendas', inicio: datas?.lancamento, fim: fimVendas, cor: 'var(--good)' },
    { label: 'Recebimentos', inicio: datas?.lancamento, fim: fimRecebimentos, cor: 'var(--accent)' },
    { label: 'Entrega', inicio: datas?.entrega, fim: datas?.entrega, cor: 'var(--crit)' },
  ];

  const datasValidas = marcos.flatMap((m) => [m.inicio, m.fim]).filter(Boolean) as string[];
  const min = datasValidas.length ? datasValidas.reduce((a, b) => (a < b ? a : b)) : undefined;
  const max = datasValidas.length ? datasValidas.reduce((a, b) => (a > b ? a : b)) : undefined;

  function posicao(iso?: string): number {
    if (!iso || !min || !max || min === max) return 0;
    const [ay, am] = min.split('-').map(Number);
    const [by, bm] = iso.split('-').map(Number);
    const [zy, zm] = max.split('-').map(Number);
    const total = (zy - ay) * 12 + (zm - am);
    const atual = (by - ay) * 12 + (bm - am);
    return total === 0 ? 0 : (atual / total) * 100;
  }

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />
      <main className="mx-auto max-w-[1000px] px-6 py-8">
        <Link href={`/estudos/${id}`} className="text-[12px]" style={{ color: 'var(--text-3)' }}>
          ← {estudo.nome}
        </Link>
        <h1 className="mt-1 mb-1 text-[22px] font-extrabold">Cronograma</h1>
        <p className="mb-6 max-w-[640px] text-[13px]" style={{ color: 'var(--text-2)' }}>
          Linha do tempo dos 8 marcos do empreendimento, calculada automaticamente a partir das datas cadastradas em
          Configurações.
        </p>

        {!datas?.dataBase && (
          <div
            className="mb-6 rounded-[12px] border p-4 text-[13px]"
            style={{ background: 'var(--warn-soft)', borderColor: 'var(--warn)', color: 'var(--warn)' }}
          >
            Nenhuma data cadastrada ainda. Preencha em{' '}
            <Link href={`/estudos/${id}/configuracoes`} className="underline">
              Configurações
            </Link>
            .
          </div>
        )}

        <div className="rounded-[16px] border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-5">
            {marcos.map((m) => (
              <div key={m.label} className="flex items-center gap-4">
                <div className="w-[110px] shrink-0 text-[12.5px] font-semibold">{m.label}</div>
                <div className="relative h-2 flex-1 rounded-full" style={{ background: 'var(--surface-2)' }}>
                  {m.inicio && (
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${posicao(m.inicio)}%`,
                        width: `${Math.max(1.5, posicao(m.fim) - posicao(m.inicio))}%`,
                        background: m.cor,
                      }}
                    />
                  )}
                </div>
                <div className="w-[150px] shrink-0 text-right text-[12px] num" style={{ color: 'var(--text-2)' }}>
                  {m.inicio
                    ? m.fim && m.fim !== m.inicio
                      ? `${fmtMesAno(m.inicio)} – ${fmtMesAno(m.fim)}`
                      : fmtMesAno(m.inicio)
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
