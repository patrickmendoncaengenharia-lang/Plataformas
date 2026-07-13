// Conversao entre datas reais (calendario) e os offsets mensais inteiros que o
// motor de calculo consome (mesInicioVendas, mesInicioObras, prazoObra etc.).
// O motor em si continua trabalhando em meses relativos a Data_Base — essa
// camada so traduz datas legiveis em numeros de mes, sem alterar nenhuma formula.

export function mesesEntre(dataBase: string, dataAlvo: string): number {
  const [ay, am] = dataBase.split('-').map(Number);
  const [by, bm] = dataAlvo.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function somarMeses(dataBase: string, meses: number): string {
  const [y, m] = dataBase.split('-').map(Number);
  const total = (m - 1) + meses;
  const novoAno = y + Math.floor(total / 12);
  const novoMes = ((total % 12) + 12) % 12;
  return `${novoAno}-${String(novoMes + 1).padStart(2, '0')}-01`;
}

export function fmtMesAno(iso?: string): string {
  if (!iso) return '—';
  const [y, m] = iso.split('-').map(Number);
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  return `${meses[m - 1]}/${y}`;
}
