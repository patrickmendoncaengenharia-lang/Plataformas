import type {
  ModeloResultado,
  Premissas,
  IndiceViabilidade,
  AnaliseRisco,
  Oportunidade,
  ParecerNarrativo,
} from '@/lib/calc-engine';
import OportunidadesOtimizacao from '@/components/OportunidadesOtimizacao';
import ParecerExecutivoCard from '@/components/ParecerExecutivoCard';
import ChartCard from '@/components/charts/ChartCard';
import SeriesChart from '@/components/charts/SeriesChart';
import DonutChart from '@/components/charts/DonutChart';
import CategoryBarChart from '@/components/charts/CategoryBarChart';
import RiskGauge from '@/components/charts/RiskGauge';
import { CHART_COLORS, cumsum, janelaAtiva } from '@/components/charts/chart-utils';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number, dec = 1) =>
  (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%';

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[16px] border p-4 transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[22px] font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function TrendChip({ atual, base, melhorSeMaior }: { atual: number; base: number; melhorSeMaior: boolean }) {
  const delta = base !== 0 ? (atual - base) / Math.abs(base) : 0;
  const subiu = delta >= 0;
  const melhorou = melhorSeMaior ? subiu : !subiu;
  const cor = melhorou ? 'var(--good)' : 'var(--crit)';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold"
      style={{ background: cor + '22', color: cor }}
    >
      {subiu ? '▲' : '▼'} {PCT(Math.abs(delta))}
    </span>
  );
}

function KpiChave({
  label,
  value,
  base,
  atual,
  melhorSeMaior = true,
  breakdown,
}: {
  label: string;
  value: string;
  base?: number;
  atual?: number;
  melhorSeMaior?: boolean;
  breakdown?: { label: string; value: string }[];
}) {
  return (
    <div
      className="rounded-[16px] border p-4 transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[22px] font-extrabold tracking-tight">{value}</div>
      {breakdown && breakdown.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-[11.5px]" style={{ color: 'var(--text-2)' }}>
              <span>{b.label}</span>
              <b className="num" style={{ color: 'var(--text)' }}>
                {b.value}
              </b>
            </div>
          ))}
        </div>
      )}
      {base !== undefined && atual !== undefined && (
        <div className="mt-2.5 flex items-center gap-2">
          <TrendChip atual={atual} base={base} melhorSeMaior={melhorSeMaior} />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            vs. conservador
          </span>
        </div>
      )}
    </div>
  );
}

function spreadStatus(spreadPP: number): { label: string; color: string } {
  if (spreadPP >= 0.05) return { label: 'Acima da TMA', color: 'var(--good)' };
  if (spreadPP >= -0.02) return { label: 'Próximo da TMA', color: 'var(--warn)' };
  return { label: 'Abaixo da TMA', color: 'var(--crit)' };
}

function RateCard({
  titulo,
  desc,
  mensal,
  anual,
  tma,
  na,
  isTma,
}: {
  titulo: string;
  desc: string;
  mensal: number;
  anual: number;
  tma?: number;
  na?: boolean;
  isTma?: boolean;
}) {
  const spread = !na && !isTma && tma !== undefined ? anual - tma : null;
  const status = na ? { label: 'Não aplicável', color: 'var(--warn)' } : spread !== null ? spreadStatus(spread) : null;
  return (
    <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <b className="text-[14px] font-bold">{titulo}</b>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
            {desc}
          </div>
        </div>
        {status && (
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: status.color + '22', color: status.color }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
            {status.label}
          </span>
        )}
      </div>
      <div className="flex gap-6">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
            Mensal
          </div>
          <b className="num text-[17px] font-extrabold">{na ? '—' : PCT(mensal, 2)}</b>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
            Anual
          </div>
          <b className="num text-[17px] font-extrabold">{na ? '—' : PCT(anual, 1)}</b>
        </div>
        {spread !== null && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Spread vs. TMA
            </div>
            <b className="num text-[17px] font-extrabold" style={{ color: status?.color }}>
              {spread >= 0 ? '+' : ''}
              {PCT(spread, 1)}
            </b>
          </div>
        )}
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
          {titulo}
        </h2>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export default function EstudoDashboardBody({
  estudoNome,
  estudoCidade,
  estudoEstado,
  estudoStatus,
  estudoResponsavelNome,
  estudoResponsavelCrea,
  estudoVersao,
  premissas,
  model,
  modelCons,
  indice,
  riscos,
  oportunidades,
  parecerNarrativo,
}: {
  estudoNome: string;
  estudoCidade: string | null;
  estudoEstado: string | null;
  estudoStatus: string;
  estudoResponsavelNome: string | null;
  estudoResponsavelCrea: string | null;
  estudoVersao: string | null;
  premissas: Premissas;
  model: ModeloResultado;
  modelCons: ModeloResultado;
  indice: IndiceViabilidade;
  riscos: AnaliseRisco;
  oportunidades: Oportunidade[];
  parecerNarrativo: ParecerNarrativo;
}) {
  const { startIdx, endIdx } = janelaAtiva(model.custoDireto, model.receitaBruta, model.idx(0));
  const mesesJanela = model.months.slice(startIdx, endIdx + 1);
  const receitaJanela = model.receitaBruta.slice(startIdx, endIdx + 1);
  const resultadoJanela = model.resultado.slice(startIdx, endIdx + 1);
  const acumuladoJanela = model.acumulado.slice(startIdx, endIdx + 1);
  const lotesMesJanela = model.lotesVendidosMes.slice(startIdx, endIdx + 1);
  const saidaTotalMensalJanela = receitaJanela.map((r, i) => r - resultadoJanela[i]);
  const lotesAcumuladoJanela = cumsum(lotesMesJanela);
  const capitalRecuperadoAcum = cumsum(receitaJanela);
  const capitalInvestidoAcum = cumsum(saidaTotalMensalJanela).map((v) => -v);

  const primeiraVendaIdx = model.lotesVendidosMes.findIndex((v) => v > 0);
  const ultimaVendaIdx =
    model.lotesVendidosMes.length - 1 - [...model.lotesVendidosMes].reverse().findIndex((v) => v > 0);
  const subtituloVendas =
    primeiraVendaIdx === ultimaVendaIdx
      ? `Lotes vendidos e acumulado — sell-out no mês ${model.months[primeiraVendaIdx]} (100% no lançamento)`
      : `Lotes vendidos e acumulado — absorção entre os meses ${model.months[primeiraVendaIdx]} e ${model.months[ultimaVendaIdx]}`;

  const composicaoVgv = [
    { label: 'À vista', value: model.nomAvista, color: CHART_COLORS.blue },
    { label: `Tabela curta (${premissas.prazoCurta}m)`, value: model.nomCurta, color: CHART_COLORS.green },
    { label: `Tabela longa (${premissas.prazoLonga}m)`, value: model.nomLonga, color: CHART_COLORS.purple },
  ];

  const despesaComissao = premissas.pctComissao * model.vgvNominal;
  const despesaMarketing = premissas.pctMarketing * model.vgvNominal;
  const despesaTributos = premissas.pctImpostos * model.vgvNominal;
  const despesaAdminJuridico = premissas.pctAdmin * model.custoImplantacao + model.custoComJurTotal;
  const despesaContingInad =
    premissas.pctConting * model.custoImplantacao +
    (premissas.pctInad + premissas.pctDistrato + premissas.pctGestaoCarteira) * model.vgvNominal;

  const composicaoCustos = [
    { label: 'Terreno (custo econ.)', value: model.custoTerreno, color: CHART_COLORS.blue },
    { label: 'Infraestrutura', value: model.custoObraTotal, color: CHART_COLORS.green },
    { label: 'Projetos/Licenciamento', value: model.custoProjTotal, color: CHART_COLORS.amber },
    { label: 'Comercial + comissão', value: despesaComissao, color: CHART_COLORS.purple },
    { label: 'Marketing', value: despesaMarketing, color: CHART_COLORS.teal },
    { label: 'Administração/Jurídico', value: despesaAdminJuridico, color: CHART_COLORS.orange },
    { label: 'Tributos', value: despesaTributos, color: CHART_COLORS.red },
    { label: 'Conting./Inadimplência', value: despesaContingInad, color: CHART_COLORS.gray },
  ];

  const corClassificacao =
    indice.classificacao === 'Altamente viável'
      ? 'var(--good)'
      : indice.classificacao === 'Viável com atenção'
      ? 'var(--accent)'
      : indice.classificacao === 'Alto risco'
      ? 'var(--warn)'
      : 'var(--crit)';

  return (
    <>
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
            Status do empreendimento: <b style={{ color: 'var(--text)' }}>{STATUS_LABEL[estudoStatus] ?? estudoStatus}</b>
          </span>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Indicadores-chave
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            vs. cenário conservador
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiChave label="VGV Base" value={BRL(model.vgvBase)} base={modelCons.vgvBase} atual={model.vgvBase} />
          <KpiChave label="VGV Nominal" value={BRL(model.vgvNominal)} base={modelCons.vgvNominal} atual={model.vgvNominal} />
          <KpiChave
            label="VGV Valor Presente"
            value={BRL(model.vgvPresente)}
            base={modelCons.vgvPresente}
            atual={model.vgvPresente}
          />
          <KpiChave
            label="Custo Total"
            value={BRL(model.custoTotal)}
            base={modelCons.custoTotal}
            atual={model.custoTotal}
            melhorSeMaior={false}
            breakdown={[
              { label: 'Projeto, Aprovação e Registro', value: BRL(model.custoProjTotal) },
              { label: 'Execução de Obras e Infraestrutura', value: BRL(model.custoObraTotal) },
              { label: 'Comercial e Jurídico (pré-operacional)', value: BRL(model.custoComJurTotal) },
              { label: 'Custo do Terreno', value: BRL(model.custoTerreno) },
            ]}
          />
          <KpiChave
            label="Lucro Bruto"
            value={BRL(model.lucroBrutoTotal)}
            base={modelCons.lucroBrutoTotal}
            atual={model.lucroBrutoTotal}
          />
          <KpiChave
            label="Lucro Líquido"
            value={BRL(model.lucroLiquidoTotal)}
            base={modelCons.lucroLiquidoTotal}
            atual={model.lucroLiquidoTotal}
          />
          <KpiChave
            label="Margem Líquida"
            value={PCT(model.margemLiquida)}
            base={modelCons.margemLiquida}
            atual={model.margemLiquida}
          />
          <KpiChave
            label="Resultado do Empreendedor"
            value={BRL(model.resultadoEmpreendedor)}
            base={modelCons.resultadoEmpreendedor}
            atual={model.resultadoEmpreendedor}
          />
          <KpiChave label="Resultado do Terrenista" value={BRL(model.resultadoTerrenista)} />
          <KpiChave
            label="Capital Próprio Necessário"
            value={BRL(model.capitalNecessario)}
            base={modelCons.capitalNecessario}
            atual={model.capitalNecessario}
            melhorSeMaior={false}
          />
          <KpiChave
            label="Pico de Investimento"
            value={BRL(model.picoInvestimento)}
            base={modelCons.picoInvestimento}
            atual={model.picoInvestimento}
            melhorSeMaior={false}
          />
          <KpiChave
            label="Caixa Mínimo"
            value={BRL(model.caixaMinimo)}
            base={modelCons.caixaMinimo}
            atual={model.caixaMinimo}
          />
          <KpiChave
            label="Lote Médio"
            value={`${model.loteAreaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²`}
            breakdown={[
              { label: 'Valor médio de venda à vista', value: BRL(model.loteValorAvista) },
              { label: 'Valor médio da parcela (financiado)', value: BRL(model.loteParcelaMedia) },
              { label: 'Prazo máximo de pagamento', value: `${premissas.prazoLonga} meses` },
            ]}
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Indicadores de Rentabilidade
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            mensal · anual · spread vs. TMA
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RateCard
            titulo="Project IRR"
            desc="TIR global do empreendimento"
            mensal={model.tirMensal}
            anual={model.tirAnual}
            tma={premissas.tma}
          />
          <RateCard
            titulo="Equity IRR"
            desc="TIR do empreendedor (100% do resultado)"
            mensal={model.tirMensal}
            anual={model.tirAnual}
            tma={premissas.tma}
          />
          <RateCard
            titulo="TIR do Terrenista"
            desc="Terrenista = empreendedor · participação 0%"
            mensal={0}
            anual={0}
            na
          />
          <RateCard
            titulo="TIR Alavancada"
            desc="Não há dívida bancária no modelo (financiamento direto)"
            mensal={model.tirMensal}
            anual={model.tirAnual}
            tma={premissas.tma}
          />
          <RateCard
            titulo="TIR Desalavancada"
            desc="Igual à alavancada — sem dívida bancária"
            mensal={model.tirMensal}
            anual={model.tirAnual}
            tma={premissas.tma}
          />
          <RateCard
            titulo="TMA"
            desc="Taxa mínima de atratividade adotada"
            mensal={Math.pow(1 + premissas.tma, 1 / 12) - 1}
            anual={premissas.tma}
            isTma
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Fluxo de Caixa e Vendas
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex flex-col gap-3">
          <ChartCard
            title="Fluxo de Caixa Mensal"
            subtitle="Entradas, saídas, saldo e saldo acumulado"
            legend={[
              { label: 'Receita bruta', color: CHART_COLORS.green },
              { label: 'Custos + despesas', color: CHART_COLORS.red },
              { label: 'Saldo acumulado', color: CHART_COLORS.blue },
            ]}
          >
            <SeriesChart
              months={mesesJanela}
              yFormat="brl"
              series={[
                { label: 'Receita bruta', color: CHART_COLORS.green, data: receitaJanela, kind: 'line' },
                { label: 'Custos + despesas', color: CHART_COLORS.red, data: saidaTotalMensalJanela, kind: 'line' },
                { label: 'Saldo acumulado', color: CHART_COLORS.blue, data: acumuladoJanela, kind: 'area' },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Curva de Vendas"
            subtitle={subtituloVendas}
            legend={[
              { label: 'Lotes vendidos/mês', color: CHART_COLORS.amber },
              { label: 'Acumulado', color: CHART_COLORS.blue },
            ]}
          >
            <SeriesChart
              months={mesesJanela}
              yFormat="number"
              series={[
                { label: 'Lotes vendidos/mês', color: CHART_COLORS.amber, data: lotesMesJanela, kind: 'bar' },
                { label: 'Acumulado', color: CHART_COLORS.blue, data: lotesAcumuladoJanela, kind: 'line' },
              ]}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard title="Composição do VGV" subtitle="Por modalidade comercial (valor nominal)">
              <DonutChart segments={composicaoVgv} total={model.vgvNominal} />
            </ChartCard>
            <ChartCard title="Composição de Custos" subtitle="Terra, obra, despesas e tributos">
              <DonutChart segments={composicaoCustos} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard title="Fluxo de Recebimentos" subtitle="Receita bruta mensal">
              <SeriesChart
                months={mesesJanela}
                yFormat="brl"
                series={[{ label: 'Receita bruta', color: CHART_COLORS.green, data: receitaJanela, kind: 'area' }]}
              />
            </ChartCard>
            <ChartCard title="Fluxo de Pagamentos" subtitle="Custos diretos mensais">
              <SeriesChart
                months={mesesJanela}
                yFormat="brl"
                series={[
                  {
                    label: 'Custos diretos',
                    color: CHART_COLORS.red,
                    data: model.custoDireto.slice(startIdx, endIdx + 1),
                    kind: 'area',
                  },
                ]}
              />
            </ChartCard>
            <ChartCard title="Receita por Modalidade Comercial" subtitle="Valor nominal recebido, por modalidade">
              <CategoryBarChart
                data={[
                  { label: 'À vista', value: model.nomAvista, color: CHART_COLORS.blue },
                  { label: 'Tabela curta', value: model.nomCurta, color: CHART_COLORS.green },
                  { label: 'Tabela longa', value: model.nomLonga, color: CHART_COLORS.purple },
                ]}
              />
            </ChartCard>
            <ChartCard
              title="Necessidade de Capital"
              subtitle="Capital investido vs. recuperado"
              legend={[
                { label: 'Capital investido (custo acum.)', color: CHART_COLORS.red },
                { label: 'Capital recuperado (receita acum.)', color: CHART_COLORS.green },
              ]}
            >
              <SeriesChart
                months={mesesJanela}
                yFormat="brl"
                series={[
                  { label: 'Capital investido (custo acum.)', color: CHART_COLORS.red, data: capitalInvestidoAcum, kind: 'line' },
                  {
                    label: 'Capital recuperado (receita acum.)',
                    color: CHART_COLORS.green,
                    data: capitalRecuperadoAcum,
                    kind: 'line',
                  },
                ]}
              />
            </ChartCard>
          </div>

          <ChartCard title="Resultado Acumulado" subtitle="Lucro acumulado do empreendimento ao longo do tempo">
            <SeriesChart
              months={mesesJanela}
              yFormat="brl"
              series={[{ label: 'Lucro acumulado', color: CHART_COLORS.blue, data: acumuladoJanela, kind: 'area' }]}
            />
          </ChartCard>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Análise de Risco
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            classificação automática por categoria
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {riscos.categorias.map((r) => (
            <RiskGauge key={r.label} label={r.label} nivel={r.nivel} score={r.score} />
          ))}
          <RiskGauge label={riscos.geral.label} nivel={riscos.geral.nivel} score={riscos.geral.score} />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Oportunidades de Otimização
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            recálculo automático do motor
          </span>
        </div>
        <OportunidadesOtimizacao oportunidades={oportunidades} />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Parecer Executivo
          </h2>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        </div>
        <ParecerExecutivoCard
          veredito={parecerNarrativo.veredito}
          headline={parecerNarrativo.headline}
          subtitulo={parecerNarrativo.subtitulo}
          justificativa={parecerNarrativo.justificativa}
          nomeEstudo={estudoNome}
          localizacao={[estudoCidade, estudoEstado].filter(Boolean).join('/') || 'Localização não informada'}
          responsavelNome={estudoResponsavelNome || '—'}
          responsavelCrea={estudoResponsavelCrea ? `CREA ${estudoResponsavelCrea}` : 'CREA não informado'}
          versao={estudoVersao || '1.0'}
        />
      </section>

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
    </>
  );
}
