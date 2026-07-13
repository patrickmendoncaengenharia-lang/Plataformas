// Paleta categorica fixa (nunca ciclada) + helpers de formatacao/escala usados
// por todos os graficos SVG server-side do dashboard.

export const CHART_COLORS = {
  blue: '#3987E5',
  green: '#1EBE6E',
  red: '#E15258',
  amber: '#F2AE1E',
  purple: '#9C7CF4',
  teal: '#35C5D0',
  gray: '#6B7280',
  orange: '#E1875C',
};

export function formatBRLShort(v: number): string {
  const abs = Math.abs(v);
  const sinal = v < 0 ? '-' : '';
  if (abs >= 1e6) return `${sinal}R$ ${(abs / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (abs >= 1e3) return `${sinal}R$ ${(abs / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
  return `${sinal}R$ ${abs.toFixed(0)}`;
}

export function formatNumberShort(v: number): string {
  return Math.round(v).toLocaleString('pt-BR');
}

// Gera ticks "redondos" (1/2/2.5/5/10 x 10^n) cobrindo [min,max], sempre incluindo 0.
export function niceTicks(min: number, max: number, count = 5): number[] {
  let lo = Math.min(0, min);
  let hi = Math.max(0, max);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  const rawStep = span / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

export function cumsum(arr: number[]): number[] {
  const out: number[] = [];
  arr.reduce((a, v, i) => {
    const s = a + v;
    out[i] = s;
    return s;
  }, 0);
  return out;
}

function firstNonZeroIdx(arr: number[]): number {
  for (let i = 0; i < arr.length; i++) if (Math.abs(arr[i]) > 1e-6) return i;
  return 0;
}
function lastNonZeroIdx(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) if (Math.abs(arr[i]) > 1e-6) return i;
  return arr.length - 1;
}

// Janela comum de exibicao para os graficos de serie temporal do dashboard —
// do inicio real de custo (obra/projetos) ate o fim real de recebimento,
// com uma pequena folga em cada ponta. Evita cortar a cauda de recebimento
// de vendas financiadas em prazos longos (ex.: tabela longa de 180 meses).
export function janelaAtiva(custoDireto: number[], receitaBruta: number[], mesZeroIdx: number) {
  const startIdx = Math.max(0, Math.min(firstNonZeroIdx(custoDireto), mesZeroIdx) - 2);
  const endIdx = Math.min(
    custoDireto.length - 1,
    Math.max(lastNonZeroIdx(custoDireto), lastNonZeroIdx(receitaBruta)) + 4
  );
  return { startIdx, endIdx };
}
