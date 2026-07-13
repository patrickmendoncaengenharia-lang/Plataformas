// Motor de calculo financeiro do estudo de viabilidade.
// Portado e auditado formula a formula contra a planilha Excel (fonte de verdade)
// do Residencial Nair Retuci II, generalizado para aceitar premissas dinamicas de
// qualquer estudo. TIR = IRR(Resultado_Mes) sequencial, sem ajuste de terra. VPL =
// SOMA(Resultado_Mes / (1+TMA_Mensal)^C), C = numero real do mes. Validado batendo
// TIR/VPL/lucro/capital necessario/payback/mes pico dentro de 0,001% da planilha
// quando a mesma base de VGV e usada (ver `lotes` abaixo para precisao maxima).

export interface Quadra {
  nome: string;
  lotes: number;
  area: number;
}

export interface Lote {
  numero: number;
  area: number;
  /** multiplicador sobre o preco base do m² — 1 = padrao, >1 = lote premium (esquina, frente pra praca etc.) */
  fator: number;
}

export interface DatasEmpreendimento {
  /** data-base do estudo — ancora t=0 usada por todos os offsets mensais do motor */
  dataBase: string;
  aquisicaoGleba?: string;
  inicioProjetos?: string;
  aprovacao?: string;
  registro?: string;
  inicioObras?: string;
  lancamento?: string;
  entrega?: string;
  encerramento?: string;
}

export interface Premissas {
  areaGleba: number;
  areaVendavel: number;
  qtdLotes: number;
  precoBase: number;
  quadras: Quadra[];
  /** datas reais do empreendimento — fonte de verdade opcional para mesInicioVendas,
   * mesInicioObras e prazoObra. Quando presente, essas datas devem ser convertidas
   * para os offsets mensais abaixo (ver src/lib/dates.ts) antes de rodar o motor. */
  datas?: DatasEmpreendimento;
  /** cadastro lote-a-lote (opcional). Quando presente, e a fonte exata do VGV Base —
   * mais preciso que area total x preco medio, pois captura o multiplicador individual
   * de cada lote (esquina, frente pra praca etc.), igual a planilha original. */
  lotes?: Lote[];
  mix: { avista: number; curta: number; longa: number };
  descontoAvista: number;
  entrada: number;
  parcelasEntrada: number;
  prazoCurta: number;
  prazoLonga: number;
  jurosPrice: number;
  tma: number;
  mesInicioVendas: number;
  /** fim da janela de absorcao de vendas. Se omitido ou igual a mesInicioVendas,
   * comportamento e venda instantanea (100% no mes de lancamento). */
  mesFimVendas?: number;
  /** formato da curva de absorcao entre mesInicioVendas e mesFimVendas — igual ao
   * Tipo_Curva_Vendas da planilha. 'manual' usa `curvaManual` diretamente. */
  tipoCurvaVendas?: 'linear' | 'scurve' | 'manual';
  /** inclinacao da S-Curve (Steepness_SCurve na planilha). Default 0.35. */
  steepnessSCurve?: number;
  /** fracao incremental vendida por mes (indice 0 = mesInicioVendas), usada so quando
   * tipoCurvaVendas='manual'. */
  curvaManual?: number[];
  /** faixas de precificacao por % de estoque vendido (Faixa1/2/3 na planilha) —
   * ordenadas por limite crescente. Default: uma faixa unica sem escalonamento. */
  faixasPreco?: { limite: number; mult: number }[];
  mesInicioObras: number;
  prazoObra: number;
  pctComissao: number;
  pctMarketing: number;
  pctImpostos: number;
  pctGestaoCarteira: number;
  pctInad: number;
  pctDistrato: number;
  pctAdmin: number;
  pctConting: number;
  custoProjetos: number;
  custoComercial: number;
  custoJuridico: number;
  valorTerraEconomico: number;
  /** custo mensal de obra, indice 0 = mesInicioObras. Se vazio, usar cronogramaEtapas. */
  cronogramaObra: number[];
  /** cronograma fisico-financeiro detalhado por etapa (opcional) */
  cronogramaEtapas?: { nome: string; custos: number[] }[];
}

export interface Cenario {
  velocidade: number;
  preco: number;
  jurosMult: number;
  sistema: 'price' | 'sac';
  entradaMult: number;
  custoMult: number;
}

export const CENARIO_BASE: Cenario = {
  velocidade: 1,
  preco: 1,
  jurosMult: 1,
  sistema: 'price',
  entradaMult: 1,
  custoMult: 1,
};

export interface ModeloResultado {
  months: number[];
  idx: (t: number) => number;
  T0: number;
  T1: number;
  receitaBruta: number[];
  custoDireto: number[];
  lotesVendidosMes: number[];
  resultado: number[];
  acumulado: number[];
  minVal: number;
  minIdx: number;
  mesPico: number;
  payback: number | null;
  capitalNecessario: number;
  vgvBase: number;
  vgvNominal: number;
  vgvPresente: number;
  custoTotal: number;
  custoImplantacao: number;
  custoTerreno: number;
  custoPorLote: number;
  custoPorM2Urbanizado: number;
  lucroBrutoTotal: number;
  lucroLiquidoTotal: number;
  margemLiquida: number;
  tirMensal: number;
  tirAnual: number;
  vpl: number;
  precoMedio: number;
  roi: number;
  moic: number;
}

function priceFactor(i: number, n: number): number {
  return i / (1 - Math.pow(1 + i, -n));
}

function cronogramaObraTotal(p: Premissas): number[] {
  if (p.cronogramaEtapas && p.cronogramaEtapas.length) {
    const n = Math.max(...p.cronogramaEtapas.map((e) => e.custos.length));
    const out = new Array(n).fill(0);
    p.cronogramaEtapas.forEach((e) => e.custos.forEach((v, i) => (out[i] += v || 0)));
    return out;
  }
  return p.cronogramaObra || [];
}

// Reescala um cronograma mensal para uma nova duracao preservando o total (usado
// pela Analise de Sensibilidade ao mexer no prazo de obra sem alterar o cronograma
// fisico-financeiro cadastrado). Resample sobre a curva acumulada — nunca perde
// nem duplica custo.
function redistribuirCronograma(original: number[], novoPrazo: number): number[] {
  if (original.length === 0 || novoPrazo === original.length) return original;
  const cum: number[] = [0];
  original.forEach((v) => cum.push(cum[cum.length - 1] + v));
  const total = cum[cum.length - 1];
  function cumInterp(x: number): number {
    const xClamped = Math.max(0, Math.min(original.length, x));
    const i0 = Math.floor(xClamped);
    const i1 = Math.min(original.length, i0 + 1);
    const frac = xClamped - i0;
    return cum[i0] + (cum[i1] - cum[i0]) * frac;
  }
  const escala = original.length / novoPrazo;
  const novo: number[] = [];
  let anterior = 0;
  for (let m = 1; m <= novoPrazo; m++) {
    const atual = m === novoPrazo ? total : cumInterp(m * escala);
    novo.push(atual - anterior);
    anterior = atual;
  }
  return novo;
}

export function buildModel(p: Premissas, scn: Cenario = CENARIO_BASE): ModeloResultado {
  // VGV Base: lote-a-lote quando disponivel (area x preco base x fator individual,
  // igual a planilha original) — mais preciso que area total x preco medio, pois
  // captura o multiplicador de lotes premium (esquina, frente pra praca etc.).
  const precoBaseTotal = p.lotes && p.lotes.length
    ? p.lotes.reduce((a, l) => a + l.area * p.precoBase * l.fator, 0)
    : p.quadras.length
    ? p.quadras.reduce((a, q) => a + q.area, 0) * p.precoBase
    : p.areaVendavel * p.precoBase;
  const vgvBaseReal = precoBaseTotal * scn.preco;
  const qtdLotesReal = p.lotes && p.lotes.length ? p.lotes.length : p.qtdLotes;

  const entradaPct = p.entrada * scn.entradaMult;
  const juros = p.jurosPrice * scn.jurosMult;

  function bucketNominalFactor(prazo: number): number {
    if (scn.sistema === 'sac') {
      const jurosTotal = juros * (prazo + 1) / 2;
      return entradaPct + (1 - entradaPct) * (1 + jurosTotal);
    }
    const f = priceFactor(juros, prazo);
    return entradaPct + (1 - entradaPct) * (f * prazo);
  }

  const nomAvista = p.mix.avista * vgvBaseReal * (1 - p.descontoAvista);
  const nomCurta = p.mix.curta * vgvBaseReal * bucketNominalFactor(p.prazoCurta);
  const nomLonga = p.mix.longa * vgvBaseReal * bucketNominalFactor(p.prazoLonga);
  const vgvNominal = nomAvista + nomCurta + nomLonga;

  const T0 = -24;
  const T1 = 220;
  const months: number[] = [];
  for (let t = T0; t <= T1; t++) months.push(t);
  const idx = (t: number) => t - T0;

  const obra = redistribuirCronograma(cronogramaObraTotal(p), p.prazoObra);
  const custoObraArr = new Array(months.length).fill(0);
  obra.forEach((v, i) => {
    const t = p.mesInicioObras + i;
    if (t >= T0 && t <= T1) custoObraArr[idx(t)] = v * scn.custoMult;
  });

  const distribuir = (total: number, mi: number, mf: number, arr: number[]) => {
    const n = mf - mi + 1;
    for (let t = mi; t <= mf; t++) if (t >= T0 && t <= T1) arr[idx(t)] += total / n;
  };
  const custoProjArr = new Array(months.length).fill(0);
  distribuir(p.custoProjetos * scn.custoMult, -16, p.mesInicioVendas - 1, custoProjArr);
  const custoComArr = new Array(months.length).fill(0);
  distribuir(p.custoComercial * scn.custoMult, p.mesInicioVendas - 1, p.mesInicioVendas + 1, custoComArr);
  const custoJurArr = new Array(months.length).fill(0);
  distribuir(p.custoJuridico * scn.custoMult, p.mesInicioVendas - 2, p.mesInicioObras + p.prazoObra - 1, custoJurArr);

  // Curva de absorcao de vendas — Linear/S-Curve/Manual, replicando exatamente
  // 07_CurvaVendas (Tipo_Curva_Vendas, Mes_Inicio_Vendas, Mes_Fim_Vendas, Steepness_SCurve).
  // scn.velocidade comprime/estica a janela de absorcao (>1 = mais rapido, <1 = mais lento);
  // se mesFimVendas nao for informado, cai no caso degenerado (venda 100% no mes de lancamento).
  const tipoCurva = p.tipoCurvaVendas ?? 'linear';
  const mesFimVendasBase = p.mesFimVendas ?? p.mesInicioVendas;
  const janelaBase = Math.max(0, mesFimVendasBase - p.mesInicioVendas);
  const mesFimVendas = p.mesInicioVendas + janelaBase / scn.velocidade;
  const steepness = p.steepnessSCurve ?? 0.35;
  const scMidpoint = (p.mesInicioVendas + mesFimVendas) / 2;
  const scRawInicio =
    tipoCurva === 'scurve' ? 1 / (1 + Math.exp(-steepness * (p.mesInicioVendas - scMidpoint))) : 0;
  const scRawFim = tipoCurva === 'scurve' ? 1 / (1 + Math.exp(-steepness * (mesFimVendas - scMidpoint))) : 1;

  function cumulativaVendas(t: number): number {
    if (t < p.mesInicioVendas) return 0;
    if (t >= mesFimVendas) return 1;
    if (tipoCurva === 'scurve') {
      const raw = 1 / (1 + Math.exp(-steepness * (t - scMidpoint)));
      return Math.min(1, Math.max(0, (raw - scRawInicio) / (scRawFim - scRawInicio)));
    }
    return (t - p.mesInicioVendas + 1) / (mesFimVendas - p.mesInicioVendas + 1);
  }

  const faixasPreco = p.faixasPreco && p.faixasPreco.length ? p.faixasPreco : [{ limite: 1, mult: 1 }];
  function tierMult(fracVendida: number): number {
    for (const f of faixasPreco) if (fracVendida <= f.limite) return f.mult;
    return faixasPreco[faixasPreco.length - 1].mult;
  }

  const lotesVendidosMes = new Array(months.length).fill(0);
  let cumulativoLotes = 0;
  for (let t = T0; t <= T1; t++) {
    let fracIncremental: number;
    if (tipoCurva === 'manual' && p.curvaManual) {
      const k = t - p.mesInicioVendas;
      fracIncremental = k >= 0 && k < p.curvaManual.length ? p.curvaManual[k] : 0;
    } else {
      fracIncremental = cumulativaVendas(t) - (t - 1 >= p.mesInicioVendas ? cumulativaVendas(t - 1) : 0);
    }
    let vendidos = Math.round(fracIncremental * qtdLotesReal);
    vendidos = Math.max(0, Math.min(vendidos, qtdLotesReal - cumulativoLotes));
    lotesVendidosMes[idx(t)] = vendidos;
    cumulativoLotes += vendidos;
  }

  function amortSchedule(prazo: number): number[] {
    const nEnt = p.parcelasEntrada;
    const N = nEnt + prazo;
    const prof = new Array(N).fill(0);
    for (let k = 0; k < nEnt; k++) prof[k] += entradaPct / nEnt;
    let saldo = 1 - entradaPct;
    const saldoIni = saldo;
    for (let k = nEnt; k < N; k++) {
      const juro = saldo * juros;
      let amort: number;
      if (scn.sistema === 'sac') {
        amort = saldoIni / prazo;
      } else {
        const nRest = N - k;
        amort = (saldo * juros) / (1 - Math.pow(1 + juros, -nRest)) - juro;
      }
      amort = Math.min(amort, saldo);
      prof[k] += juro + amort;
      saldo = Math.max(0, saldo - amort);
    }
    return prof;
  }
  const profCurta = amortSchedule(p.prazoCurta);
  const profLonga = amortSchedule(p.prazoLonga);

  const recAvista = new Array(months.length).fill(0);
  const recCurta = new Array(months.length).fill(0);
  const recLonga = new Array(months.length).fill(0);
  const precoMedio = vgvBaseReal / qtdLotesReal;

  let cumulativoParaTier = 0;
  for (let t = T0; t <= T1; t++) {
    const vendidos = lotesVendidosMes[idx(t)];
    if (!vendidos) continue;
    cumulativoParaTier += vendidos;
    const mult = tierMult(cumulativoParaTier / qtdLotesReal);
    const vgvMes = vendidos * precoMedio * mult;
    recAvista[idx(t)] += vgvMes * p.mix.avista * (1 - p.descontoAvista);
    const vgvCurta = vgvMes * p.mix.curta;
    const vgvLonga = vgvMes * p.mix.longa;
    for (let k = 0; k < profCurta.length; k++) {
      const tt = t + k;
      if (tt > T1) break;
      recCurta[idx(tt)] += vgvCurta * profCurta[k];
    }
    for (let k = 0; k < profLonga.length; k++) {
      const tt = t + k;
      if (tt > T1) break;
      recLonga[idx(tt)] += vgvLonga * profLonga[k];
    }
  }

  const receitaBruta = months.map((_, i) => recAvista[i] + recCurta[i] + recLonga[i]);
  const custoDireto = months.map((_, i) => custoObraArr[i] + custoProjArr[i] + custoComArr[i] + custoJurArr[i]);
  const despesaComercialPct =
    p.pctComissao + p.pctMarketing + p.pctImpostos + p.pctGestaoCarteira + p.pctInad + p.pctDistrato;
  const despesas = receitaBruta.map((r) => r * despesaComercialPct);
  const adminConting = custoDireto.map((c) => c * (p.pctAdmin + p.pctConting));
  const resultado = months.map((_, i) => receitaBruta[i] - despesas[i] - custoDireto[i] - adminConting[i]);

  const acumulado: number[] = [];
  resultado.reduce((a, v, i) => {
    const s = a + v;
    acumulado[i] = s;
    return s;
  }, 0);

  let minVal = 0;
  let minIdx = 0;
  acumulado.forEach((v, i) => {
    if (v < minVal) {
      minVal = v;
      minIdx = i;
    }
  });
  let paybackT: number | null = null;
  for (let i = minIdx; i < acumulado.length; i++) {
    if (acumulado[i] >= 0) {
      paybackT = months[i];
      break;
    }
  }

  const custoImplantacao = custoDireto.reduce((a, b) => a + b, 0);
  const custoTerreno = p.valorTerraEconomico * scn.custoMult;
  const custoTotal = custoImplantacao + custoTerreno;
  const custoPorLote = custoTotal / qtdLotesReal;
  const custoPorM2Urbanizado = custoTotal / p.areaVendavel;
  const lucroBrutoTotal = vgvNominal - custoImplantacao - custoTerreno;
  const lucroLiquidoTotal = resultado.reduce((a, b) => a + b, 0) - custoTerreno;
  const margemLiquida = lucroLiquidoTotal / vgvNominal;
  const capitalNecessario = -minVal;

  // TIR = IRR(Resultado_Mes) na planilha — sequencial, SEM subtrair a terra do mes 0.
  // O custo da terra so entra depois, no Lucro Liquido (Resultado_Caixa - Valor_Terra_Economico),
  // nunca dentro do fluxo usado para TIR/VPL. Nao alterar essa metodologia.
  const tirMensal = irrMonthly(resultado);
  const tirAnual = Math.pow(1 + tirMensal, 12) - 1;
  const tmaMensal = Math.pow(1 + p.tma, 1 / 12) - 1;
  // VPL = SOMA(Resultado_Mes / (1+TMA_Mensal)^C) na planilha, onde C e o numero do mes
  // real (pode ser negativo), nao a posicao sequencial no array.
  const vpl = npvAt(resultado, tmaMensal, months);
  // VGV Presente = SOMA(Receita_Bruta_Mes / (1+TMA_Mensal)^C), igual VP_ReceitaBruta_Mes.
  const vgvPresente = npvAt(receitaBruta, tmaMensal, months);

  return {
    months,
    idx,
    T0,
    T1,
    receitaBruta,
    custoDireto,
    lotesVendidosMes,
    resultado,
    acumulado,
    minVal,
    minIdx,
    mesPico: months[minIdx],
    payback: paybackT,
    capitalNecessario,
    vgvBase: vgvBaseReal,
    vgvNominal,
    vgvPresente,
    custoTotal,
    custoImplantacao,
    custoTerreno,
    custoPorLote,
    custoPorM2Urbanizado,
    lucroBrutoTotal,
    lucroLiquidoTotal,
    margemLiquida,
    tirMensal,
    tirAnual,
    vpl,
    precoMedio,
    roi: lucroLiquidoTotal / capitalNecessario,
    moic: (capitalNecessario + lucroLiquidoTotal) / capitalNecessario,
  };
}

// ---------------------------------------------------------------------------
// Indice Geral de Viabilidade — indicador composto 0-100, nao vem da planilha
// (autorizado explicitamente pelo usuario). Formula 100% transparente e
// documentada abaixo, nunca uma caixa-preta: media ponderada de 6 sub-notas,
// cada uma normalizada 0-100 por uma regra simples e auditavel.
// ---------------------------------------------------------------------------

export interface IndiceViabilidade {
  nota: number; // 0-100
  classificacao: 'Não recomendado' | 'Alto risco' | 'Viável com atenção' | 'Altamente viável';
  componentes: { label: string; nota: number; peso: number }[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function calcularIndiceViabilidade(m: ModeloResultado, p: Premissas): IndiceViabilidade {
  const spreadTir = m.tirAnual - p.tma;
  const scoreTir = clamp(50 + (spreadTir / p.tma) * 50, 0, 100);
  const scoreVpl = clamp(((m.vpl / m.vgvBase) / 0.15) * 100, 0, 100);
  const scoreMargem = clamp((m.margemLiquida / 0.3) * 100, 0, 100);
  const scorePayback = m.payback === null ? 0 : clamp(100 - ((m.payback - 12) / 48) * 100, 0, 100);
  const scoreCapital = clamp(100 - ((m.capitalNecessario / m.vgvBase) / 0.3) * 100, 0, 100);
  const scoreRoi = clamp((m.roi / 3) * 100, 0, 100);

  const componentes = [
    { label: 'TIR vs. TMA', nota: scoreTir, peso: 0.25 },
    { label: 'VPL sobre VGV Base', nota: scoreVpl, peso: 0.2 },
    { label: 'Margem líquida', nota: scoreMargem, peso: 0.2 },
    { label: 'Payback', nota: scorePayback, peso: 0.15 },
    { label: 'Capital necessário sobre VGV', nota: scoreCapital, peso: 0.1 },
    { label: 'ROI', nota: scoreRoi, peso: 0.1 },
  ];

  const nota = componentes.reduce((a, c) => a + c.nota * c.peso, 0);
  const classificacao: IndiceViabilidade['classificacao'] =
    nota <= 40 ? 'Não recomendado' : nota <= 60 ? 'Alto risco' : nota <= 80 ? 'Viável com atenção' : 'Altamente viável';

  return { nota, classificacao, componentes };
}

export function npvAt(cf: number[], rMensal: number, months?: number[]): number {
  // Quando `months` e fornecido, desconta pelo NUMERO REAL do mes (pode ser negativo),
  // exatamente como a planilha faz em VP_Resultado_Mes = P/(1+TMA_Mensal)^C.
  // Sem `months`, usa posicao sequencial (0,1,2...) — e o que IRR() faz internamente.
  let s = 0;
  for (let i = 0; i < cf.length; i++) {
    const expo = months ? months[i] : i;
    s += cf[i] / Math.pow(1 + rMensal, expo);
  }
  return s;
}

export function irrMonthly(cf: number[]): number {
  let lo = -0.5;
  let hi = 3;
  let nLo = npvAt(cf, lo);
  if (!isFinite(nLo)) return 0;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    const nMid = npvAt(cf, mid);
    if (nMid > 0 === nLo > 0) {
      lo = mid;
      nLo = nMid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Modulo de Parcerias — aloca o fluxo do projeto por participante e calcula
// TIR/VPL/MOIC/ROIC individuais.
// ---------------------------------------------------------------------------

export interface Participante {
  id: string;
  tipo: 'terrenista' | 'loteador' | 'investidor' | 'outro';
  nome: string;
  percentualParticipacao: number; // 0-100
  valorIntegralizado: number;
  formaParticipacao: 'dinheiro' | 'permuta' | 'servico' | 'misto';
  percentualLucro: number; // 0-100, pode diferir do percentual de participacao
  timingAporte: 'mes_0' | 'parcelado' | 'conforme_cronograma';
  timingRecebimento: 'mensal' | 'no_final' | 'conforme_distribuicao';
  tma?: number; // se omitido, usa a TMA do estudo
}

export interface IndicadoresParticipante {
  participanteId: string;
  nome: string;
  tipo: Participante['tipo'];
  capitalInvestido: number;
  lucro: number;
  patrimonioFinal: number;
  tirMensal: number;
  tirAnual: number;
  vpl: number;
  moic: number;
  roic: number;
}

function buildAporteSchedule(part: Participante, p: Premissas, model: ModeloResultado): number[] {
  const arr = new Array(model.months.length).fill(0);
  const idx0 = model.idx(0);

  if (part.formaParticipacao === 'permuta' || part.formaParticipacao === 'servico') {
    // entra sem aporte em dinheiro (ex.: terrenista permutando o terreno)
    if (part.valorIntegralizado) arr[idx0] = part.valorIntegralizado;
    return arr;
  }

  if (part.timingAporte === 'mes_0') {
    arr[idx0] = part.valorIntegralizado;
  } else if (part.timingAporte === 'parcelado') {
    const ini = model.idx(p.mesInicioObras);
    const fim = model.idx(p.mesInicioObras + p.prazoObra - 1);
    const n = Math.max(1, fim - ini + 1);
    for (let i = ini; i <= fim; i++) arr[i] = part.valorIntegralizado / n;
  } else {
    const totalCusto = model.custoDireto.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < model.months.length; i++) {
      arr[i] = part.valorIntegralizado * (model.custoDireto[i] / totalCusto);
    }
  }
  return arr;
}

function buildRecebimentoSchedule(part: Participante, model: ModeloResultado): number[] {
  const arr = new Array(model.months.length).fill(0);
  const frac = part.percentualLucro / 100;
  if (part.timingRecebimento === 'no_final') {
    const totalResultado = model.resultado.reduce((a, b) => a + b, 0);
    arr[arr.length - 1] = totalResultado * frac;
  } else {
    for (let i = 0; i < model.months.length; i++) arr[i] = model.resultado[i] * frac;
  }
  return arr;
}

export function calcularIndicadoresParticipante(
  part: Participante,
  p: Premissas,
  model: ModeloResultado
): IndicadoresParticipante {
  const aporte = buildAporteSchedule(part, p, model);
  const recebimento = buildRecebimentoSchedule(part, model);
  const fluxo = model.months.map((_, i) => recebimento[i] - aporte[i]);

  const capitalInvestido = aporte.reduce((a, b) => a + b, 0);
  const totalRecebido = recebimento.reduce((a, b) => a + b, 0);
  const lucro = totalRecebido - capitalInvestido;
  const patrimonioFinal = capitalInvestido + lucro;

  const tirMensal = capitalInvestido > 0 ? irrMonthly(fluxo) : 0;
  const tirAnual = Math.pow(1 + tirMensal, 12) - 1;
  const tmaMensal = Math.pow(1 + (part.tma ?? p.tma), 1 / 12) - 1;
  const vpl = npvAt(fluxo, tmaMensal, model.months);

  return {
    participanteId: part.id,
    nome: part.nome,
    tipo: part.tipo,
    capitalInvestido,
    lucro,
    patrimonioFinal,
    tirMensal,
    tirAnual,
    vpl,
    moic: capitalInvestido > 0 ? patrimonioFinal / capitalInvestido : 0,
    roic: capitalInvestido > 0 ? lucro / capitalInvestido : 0,
  };
}

export function calcularTodosParticipantes(
  participantes: Participante[],
  p: Premissas,
  model: ModeloResultado
): IndicadoresParticipante[] {
  return participantes.map((part) => calcularIndicadoresParticipante(part, p, model));
}

// ---------------------------------------------------------------------------
// Parecer executivo — texto gerado automaticamente a partir dos indicadores
// calculados, sem nenhum dado externo. Reutiliza os mesmos limiares do Indice
// Geral de Viabilidade para que os dois nunca se contradigam.
// ---------------------------------------------------------------------------

export interface ParecerExecutivo {
  recomendacao: 'Aprovar' | 'Aprovar com ressalvas' | 'Revisar premissas' | 'Não recomendado';
  pontosFortes: string[];
  riscos: string[];
  pontosAtencao: string[];
}

export function gerarParecer(m: ModeloResultado, p: Premissas, indice: IndiceViabilidade): ParecerExecutivo {
  const pontosFortes: string[] = [];
  const riscos: string[] = [];
  const pontosAtencao: string[] = [];

  const textos: Record<string, { forte: string; risco: string; atencao: string }> = {
    'TIR vs. TMA': {
      forte: `TIR de ${(m.tirAnual * 100).toFixed(1)}% a.a. supera a TMA de ${(p.tma * 100).toFixed(1)}% a.a. em ${((m.tirAnual - p.tma) * 100).toFixed(1)} p.p., retorno acima do mínimo exigido.`,
      risco: `TIR de ${(m.tirAnual * 100).toFixed(1)}% a.a. está abaixo da TMA de ${(p.tma * 100).toFixed(1)}% a.a. — o retorno não compensa o risco assumido.`,
      atencao: `TIR de ${(m.tirAnual * 100).toFixed(1)}% a.a. está próxima da TMA de ${(p.tma * 100).toFixed(1)}% a.a., margem de segurança pequena.`,
    },
    'VPL sobre VGV Base': {
      forte: `VPL de ${BRLcurta(m.vpl)} representa geração de valor relevante sobre o VGV Base.`,
      risco: `VPL de ${BRLcurta(m.vpl)} é baixo ou negativo em relação ao VGV Base — o projeto pode não remunerar o capital à TMA adotada.`,
      atencao: `VPL de ${BRLcurta(m.vpl)} é positivo, mas modesto frente ao porte do empreendimento.`,
    },
    'Margem líquida': {
      forte: `Margem líquida de ${(m.margemLiquida * 100).toFixed(1)}% está em patamar saudável para o setor.`,
      risco: `Margem líquida de ${(m.margemLiquida * 100).toFixed(1)}% é apertada para o risco de um loteamento.`,
      atencao: `Margem líquida de ${(m.margemLiquida * 100).toFixed(1)}% é mediana — pouca folga para imprevistos de custo.`,
    },
    Payback: {
      forte: `Payback de ${m.payback ?? '—'} meses é rápido, reduz a exposição a mudanças de mercado.`,
      risco: `Payback de ${m.payback ?? '—'} meses é longo, aumenta a exposição a variações de mercado ao longo do tempo.`,
      atencao: `Payback de ${m.payback ?? '—'} meses é razoável, mas vale monitorar prazos de obra e vendas.`,
    },
    'Capital necessário sobre VGV': {
      forte: `Capital necessário de ${BRLcurta(m.capitalNecessario)} representa uma fatia pequena do VGV Base — baixa exposição de caixa.`,
      risco: `Capital necessário de ${BRLcurta(m.capitalNecessario)} representa uma fatia relevante do VGV Base — exposição de caixa elevada.`,
      atencao: `Capital necessário de ${BRLcurta(m.capitalNecessario)} exige planejamento de caixa cuidadoso.`,
    },
    ROI: {
      forte: `ROI de ${m.roi.toFixed(2)}x é elevado para o capital investido.`,
      risco: `ROI de ${m.roi.toFixed(2)}x é modesto frente ao capital exigido.`,
      atencao: `ROI de ${m.roi.toFixed(2)}x é razoável, sem se destacar.`,
    },
  };

  indice.componentes.forEach((c) => {
    const t = textos[c.label];
    if (!t) return;
    if (c.nota >= 75) pontosFortes.push(t.forte);
    else if (c.nota <= 35) riscos.push(t.risco);
    else pontosAtencao.push(t.atencao);
  });

  const recomendacao: ParecerExecutivo['recomendacao'] =
    indice.classificacao === 'Altamente viável'
      ? 'Aprovar'
      : indice.classificacao === 'Viável com atenção'
      ? 'Aprovar com ressalvas'
      : indice.classificacao === 'Alto risco'
      ? 'Revisar premissas'
      : 'Não recomendado';

  return { recomendacao, pontosFortes, riscos, pontosAtencao };
}

function BRLcurta(v: number): string {
  const abs = Math.abs(v);
  const sinal = v < 0 ? '-' : '';
  if (abs >= 1e6) return sinal + 'R$ ' + (abs / 1e6).toFixed(2) + ' mi';
  if (abs >= 1e3) return sinal + 'R$ ' + (abs / 1e3).toFixed(0) + ' mil';
  return sinal + 'R$ ' + abs.toFixed(0);
}

// ---------------------------------------------------------------------------
// Planejamento tributario — Lucro Presumido x Lucro Real. Memoria de calculo
// linha a linha (nenhum numero e caixa-preta). Regras padrao da legislacao
// brasileira para pessoa juridica que explora loteamento/venda de imoveis:
//   Presumido: IRPJ 15%+10% adicional sobre base presumida 8% da receita;
//              CSLL 9% sobre base presumida 12% da receita; PIS 0,65% e
//              COFINS 3% cumulativos sobre a receita.
//   Real:      IRPJ e CSLL nas mesmas aliquotas, mas sobre o lucro real
//              apurado (nao a receita); PIS 1,65% e COFINS 7,6% nao-
//              cumulativos sobre a receita (sem aproveitamento de creditos
//              nesta primeira versao — ver nota abaixo).
// Em ambos os casos, o adicional de 10% de IRPJ incide sobre o que exceder
// R$20.000/mes de base de calculo, aproximado aqui pelo numero de anos que
// o projeto leva para gerar sua receita (receita nao e um evento unico).
// ---------------------------------------------------------------------------

export interface LinhaTributo {
  label: string;
  base: number;
  aliquota: number;
  valor: number;
}

export interface ResultadoTributacao {
  regime: 'presumido' | 'real';
  linhas: LinhaTributo[];
  totalTributos: number;
  pctImpostosEfetivo: number;
}

const LIMITE_ADICIONAL_IRPJ_MES = 20000;

export function calcularTributacao(
  regime: 'presumido' | 'real',
  receitaBruta: number,
  lucroAntesIR: number,
  anosProjeto: number,
  pctIss = 0
): ResultadoTributacao {
  const limiteAdicional = LIMITE_ADICIONAL_IRPJ_MES * 12 * Math.max(1, anosProjeto);
  const linhas: LinhaTributo[] = [];

  if (regime === 'presumido') {
    const baseIrpj = receitaBruta * 0.08;
    const baseCsll = receitaBruta * 0.12;
    const irpjNormal = baseIrpj * 0.15;
    const irpjAdicional = Math.max(0, baseIrpj - limiteAdicional) * 0.1;
    const csll = baseCsll * 0.09;
    const pis = receitaBruta * 0.0065;
    const cofins = receitaBruta * 0.03;
    const iss = receitaBruta * pctIss;
    linhas.push(
      { label: 'IRPJ (15% sobre base presumida de 8% da receita)', base: baseIrpj, aliquota: 0.15, valor: irpjNormal },
      { label: 'IRPJ adicional (10% sobre excedente do limite)', base: Math.max(0, baseIrpj - limiteAdicional), aliquota: 0.1, valor: irpjAdicional },
      { label: 'CSLL (9% sobre base presumida de 12% da receita)', base: baseCsll, aliquota: 0.09, valor: csll },
      { label: 'PIS (cumulativo)', base: receitaBruta, aliquota: 0.0065, valor: pis },
      { label: 'COFINS (cumulativo)', base: receitaBruta, aliquota: 0.03, valor: cofins }
    );
    if (pctIss > 0) linhas.push({ label: 'ISS', base: receitaBruta, aliquota: pctIss, valor: iss });
  } else {
    const baseIrpjCsll = Math.max(0, lucroAntesIR);
    const irpjNormal = baseIrpjCsll * 0.15;
    const irpjAdicional = Math.max(0, baseIrpjCsll - limiteAdicional) * 0.1;
    const csll = baseIrpjCsll * 0.09;
    const pis = receitaBruta * 0.0165;
    const cofins = receitaBruta * 0.076;
    const iss = receitaBruta * pctIss;
    linhas.push(
      { label: 'IRPJ (15% sobre o lucro real apurado)', base: baseIrpjCsll, aliquota: 0.15, valor: irpjNormal },
      { label: 'IRPJ adicional (10% sobre excedente do limite)', base: Math.max(0, baseIrpjCsll - limiteAdicional), aliquota: 0.1, valor: irpjAdicional },
      { label: 'CSLL (9% sobre o lucro real apurado)', base: baseIrpjCsll, aliquota: 0.09, valor: csll },
      { label: 'PIS (não-cumulativo, sem créditos aproveitados)', base: receitaBruta, aliquota: 0.0165, valor: pis },
      { label: 'COFINS (não-cumulativo, sem créditos aproveitados)', base: receitaBruta, aliquota: 0.076, valor: cofins }
    );
    if (pctIss > 0) linhas.push({ label: 'ISS', base: receitaBruta, aliquota: pctIss, valor: iss });
  }

  const totalTributos = linhas.reduce((a, l) => a + l.valor, 0);
  return { regime, linhas, totalTributos, pctImpostosEfetivo: totalTributos / receitaBruta };
}
