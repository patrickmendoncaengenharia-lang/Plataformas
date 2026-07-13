import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildModel, calcularIndiceViabilidade, CENARIO_BASE, type Premissas } from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[19px] font-extrabold">{value}</div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h2
          className="text-[12px] font-bold uppercase tracking-wide"
          style={{ color: 'var(--text-2)' }}
        >
          {titulo}
        </h2>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export default async function EstudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  const premissas = estudo.premissas as Premissas;
  const model = buildModel(premissas, CENARIO_BASE);
  const indice = calcularIndiceViabilidade(model, premissas);

  const corClassificacao =
    indice.classificacao === 'Altamente viável'
      ? 'var(--good)'
      : indice.classificacao === 'Viável com atenção'
      ? 'var(--accent)'
      : indice.classificacao === 'Alto risco'
      ? 'var(--warn)'
      : 'var(--crit)';

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-4">
          <Link href="/dashboard" className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            ← Meus estudos
          </Link>
          <h1 className="mt-1 text-[22px] font-extrabold">{estudo.nome}</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
            {[estudo.cidade, estudo.estado].filter(Boolean).join(' / ')}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ['Configurações', 'configuracoes'],
            ['Lotes', 'lotes'],
            ['Cronograma', 'cronograma'],
            ['Sensibilidade', 'sensibilidade'],
            ['Parcerias e TIR individual', 'parcerias'],
            ['Planejamento tributário', 'tributacao'],
            ['Relatório executivo', 'relatorio'],
          ].map(([label, slug]) => (
            <Link
              key={slug}
              href={`/estudos/${id}/${slug}`}
              className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              {label} →
            </Link>
          ))}
        </div>

        {/* STATUS — indice geral de viabilidade */}
        <div
          className="mb-8 flex items-center gap-6 rounded-[20px] border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
              Índice geral de viabilidade
            </div>
            <div className="num mt-1 text-[40px] font-extrabold leading-none" style={{ color: corClassificacao }}>
              {indice.nota.toFixed(0)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className="w-fit rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: corClassificacao + '22', color: corClassificacao }}
            >
              {indice.classificacao}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              Status do empreendimento: <b style={{ color: 'var(--text)' }}>{STATUS_LABEL[estudo.status] ?? estudo.status}</b>
            </span>
          </div>
        </div>

        <Grupo titulo="Financeiros">
          <Kpi label="TIR do capital aportado" value={PCT(model.tirAnual) + ' a.a.'} />
          <Kpi label="VPL" value={BRL(model.vpl)} />
          <Kpi label="Lucro econômico" value={BRL(model.lucroLiquidoTotal)} />
          <Kpi label="Capital necessário" value={BRL(model.capitalNecessario)} />
          <Kpi label="Payback" value={model.payback !== null ? `${model.payback} meses` : 'N/D'} />
          <Kpi label="Margem" value={PCT(model.margemLiquida)} />
        </Grupo>

        <Grupo titulo="Comerciais">
          <Kpi label="VGV Base" value={BRL(model.vgvBase)} />
          <Kpi label="VGV Presente" value={BRL(model.vgvPresente)} />
          <Kpi label="Valor médio do lote" value={BRL(model.precoMedio)} />
        </Grupo>

        <Grupo titulo="Engenharia">
          <Kpi label="Custo total" value={BRL(model.custoTotal)} />
          <Kpi label="Custo por lote" value={BRL(model.custoPorLote)} />
          <Kpi label="Custo por m² urbanizado" value={BRL(model.custoPorM2Urbanizado)} />
        </Grupo>

        <Grupo titulo="Patrimonial">
          <Kpi label="Valor econômico da terra" value={BRL(model.custoTerreno)} />
        </Grupo>
      </main>
    </div>
  );
}
