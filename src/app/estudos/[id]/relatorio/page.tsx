import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  buildModel,
  calcularIndiceViabilidade,
  gerarParecer,
  CENARIO_BASE,
  type Premissas,
} from '@/lib/calc-engine';
import { fmtMesAno } from '@/lib/dates';
import TopBar from '@/components/TopBar';
import MiniAreaChart from '@/components/MiniAreaChart';
import PrintButton from '@/components/PrintButton';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
};

const REC_COR: Record<string, string> = {
  Aprovar: 'var(--good)',
  'Aprovar com ressalvas': 'var(--accent)',
  'Revisar premissas': 'var(--warn)',
  'Não recomendado': 'var(--crit)',
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 break-inside-avoid">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
          {titulo}
        </h2>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>
      {children}
    </section>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>
      <div className="num text-[13.5px] font-semibold">{value}</div>
    </div>
  );
}

export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  const p = estudo.premissas as Premissas;
  const m = buildModel(p, CENARIO_BASE);
  const indice = calcularIndiceViabilidade(m, p);
  const parecer = gerarParecer(m, p, indice);
  const corIndice =
    indice.classificacao === 'Altamente viável'
      ? 'var(--good)'
      : indice.classificacao === 'Viável com atenção'
      ? 'var(--accent)'
      : indice.classificacao === 'Alto risco'
      ? 'var(--warn)'
      : 'var(--crit)';

  // recorte do fluxo acumulado pra um grafico legivel: dos 6 meses antes do
  // inicio das obras ate 12 meses depois do payback (ou fim do prazo longo)
  const janelaFim = Math.min(m.T1, (m.payback ?? p.mesInicioVendas + p.prazoLonga) + 12);
  const janelaIni = Math.max(m.T0, p.mesInicioObras - 6);
  const iInicio = m.idx(janelaIni);
  const iFim = m.idx(janelaFim);
  const acumuladoRecorte = m.acumulado.slice(iInicio, iFim + 1);
  const mesesRecorte = m.months.slice(iInicio, iFim + 1).map((t) => `mês ${t}`);

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <TopBar email={user?.email ?? ''} />
      </div>

      <main className="mx-auto max-w-[880px] px-6 py-8 print:max-w-none print:px-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href={`/estudos/${id}`} className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            ← {estudo.nome}
          </Link>
          <PrintButton />
        </div>

        {/* CABECALHO */}
        <div className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
            Relatório executivo · estudo de viabilidade
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold">{estudo.nome}</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: 'var(--text-2)' }}>
            {[estudo.cidade, estudo.estado].filter(Boolean).join(' / ')}
            {estudo.spe ? ` · SPE: ${estudo.spe}` : ''}
            {estudo.proprietario ? ` · Proprietário: ${estudo.proprietario}` : ''}
          </p>
          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
            Gerado em {new Date().toLocaleDateString('pt-BR')} · Status: {STATUS_LABEL[estudo.status] ?? estudo.status}
          </p>
        </div>

        {/* PARECER + INDICE NO TOPO */}
        <div
          className="mb-8 flex items-center gap-6 rounded-[16px] border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
              Índice geral de viabilidade
            </div>
            <div className="num mt-1 text-[40px] font-extrabold leading-none" style={{ color: corIndice }}>
              {indice.nota.toFixed(0)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className="w-fit rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: REC_COR[parecer.recomendacao] + '22', color: REC_COR[parecer.recomendacao] }}
            >
              {parecer.recomendacao}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              {indice.classificacao}
            </span>
          </div>
        </div>

        <Secao titulo="Dados do empreendimento">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="Área bruta" value={`${p.areaGleba.toLocaleString('pt-BR')} m²`} />
            <Campo label="Área líquida" value={`${p.areaVendavel.toLocaleString('pt-BR')} m²`} />
            <Campo label="Número de lotes" value={`${p.lotes?.length ?? p.qtdLotes}`} />
            <Campo label="Valor da terra" value={BRL(p.valorTerraEconomico)} />
            <Campo label="Lançamento" value={fmtMesAno(p.datas?.lancamento)} />
            <Campo label="Entrega" value={fmtMesAno(p.datas?.entrega)} />
          </div>
        </Secao>

        <Secao titulo="Premissas comerciais e de financiamento">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="Mix à vista / curta / longa" value={`${PCT(p.mix.avista)} / ${PCT(p.mix.curta)} / ${PCT(p.mix.longa)}`} />
            <Campo label="Desconto à vista" value={PCT(p.descontoAvista)} />
            <Campo label="Entrada" value={`${PCT(p.entrada)} em ${p.parcelasEntrada}x`} />
            <Campo label="Prazo tabela curta" value={`${p.prazoCurta} meses`} />
            <Campo label="Prazo tabela longa" value={`${p.prazoLonga} meses`} />
            <Campo label="Juros" value={`${(p.jurosPrice * 100).toFixed(2)}% a.m.`} />
            <Campo label="TMA" value={`${(p.tma * 100).toFixed(1)}% a.a.`} />
          </div>
        </Secao>

        <Secao titulo="Custos">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="Custo total" value={BRL(m.custoTotal)} />
            <Campo label="Custo de implantação" value={BRL(m.custoImplantacao)} />
            <Campo label="Valor econômico da terra" value={BRL(m.custoTerreno)} />
            <Campo label="Custo por lote" value={BRL(m.custoPorLote)} />
            <Campo label="Custo por m² urbanizado" value={BRL(m.custoPorM2Urbanizado)} />
          </div>
        </Secao>

        <Secao titulo="Vendas">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="VGV Base" value={BRL(m.vgvBase)} />
            <Campo label="VGV Nominal" value={BRL(m.vgvNominal)} />
            <Campo label="VGV Presente" value={BRL(m.vgvPresente)} />
            <Campo label="Valor médio do lote" value={BRL(m.precoMedio)} />
            <Campo label="Tipo de curva de vendas" value={p.tipoCurvaVendas === 'scurve' ? 'S-Curve' : p.tipoCurvaVendas === 'manual' ? 'Manual' : 'Linear'} />
          </div>
        </Secao>

        <Secao titulo="Fluxo financeiro">
          <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="mb-2 text-[11.5px]" style={{ color: 'var(--text-2)' }}>
              Fluxo de caixa acumulado (R$)
            </div>
            <MiniAreaChart data={acumuladoRecorte} labels={mesesRecorte} />
          </div>
        </Secao>

        <Secao titulo="Indicadores">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="TIR do capital aportado" value={PCT(m.tirAnual) + ' a.a.'} />
            <Campo label="VPL" value={BRL(m.vpl)} />
            <Campo label="Lucro econômico" value={BRL(m.lucroLiquidoTotal)} />
            <Campo label="Capital necessário" value={BRL(m.capitalNecessario)} />
            <Campo label="Payback" value={m.payback !== null ? `${m.payback} meses` : 'N/D'} />
            <Campo label="Margem" value={PCT(m.margemLiquida)} />
          </div>
        </Secao>

        <Secao titulo="Parecer de viabilidade">
          <div className="flex flex-col gap-4">
            {parecer.pontosFortes.length > 0 && (
              <div>
                <div className="mb-1.5 text-[12px] font-bold" style={{ color: 'var(--good)' }}>
                  Pontos fortes
                </div>
                <ul className="flex flex-col gap-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
                  {parecer.pontosFortes.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
            {parecer.riscos.length > 0 && (
              <div>
                <div className="mb-1.5 text-[12px] font-bold" style={{ color: 'var(--crit)' }}>
                  Riscos
                </div>
                <ul className="flex flex-col gap-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
                  {parecer.riscos.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
            {parecer.pontosAtencao.length > 0 && (
              <div>
                <div className="mb-1.5 text-[12px] font-bold" style={{ color: 'var(--warn)' }}>
                  Pontos de atenção
                </div>
                <ul className="flex flex-col gap-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
                  {parecer.pontosAtencao.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
            <div
              className="mt-2 flex items-center gap-3 rounded-[12px] p-4"
              style={{ background: REC_COR[parecer.recomendacao] + '15' }}
            >
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
                Conclusão:
              </span>
              <span className="text-[14px] font-extrabold" style={{ color: REC_COR[parecer.recomendacao] }}>
                {parecer.recomendacao}
              </span>
            </div>
          </div>
        </Secao>
      </main>
    </div>
  );
}
