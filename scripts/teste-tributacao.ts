import { buildModel, CENARIO_BASE, calcularTributacao, type Premissas } from '../src/lib/calc-engine';

const premissas: Premissas = {
  areaGleba: 77136, areaVendavel: 15899.13, qtdLotes: 89, precoBase: 800,
  quadras: [{ nome: 'A', lotes: 89, area: 15899.13 }],
  mix: { avista: 0.10, curta: 0.15, longa: 0.75 }, descontoAvista: 0.05,
  entrada: 0.10, parcelasEntrada: 4, prazoCurta: 36, prazoLonga: 180, jurosPrice: 0.008, tma: 0.15,
  mesInicioVendas: 8, mesInicioObras: 7, prazoObra: 18,
  pctComissao: 0.06, pctMarketing: 0.02, pctImpostos: 0.1508, pctGestaoCarteira: 0.05,
  pctInad: 0.02, pctDistrato: 0.03, pctAdmin: 0.10, pctConting: 0.05,
  custoProjetos: 550000, custoComercial: 60000, custoJuridico: 25000, valorTerraEconomico: 4781157.02,
  cronogramaObra: [119243.48,151041.74,176082.87,176082.87,217375.18,236454.13,164908.05,164908.05,
                   164908.05,249332.43,192493.04,140707.30,102549.39,138322.43,163363.56,108511.56,122820.78,72738.52],
};

const semImposto = buildModel({ ...premissas, pctImpostos: 0 }, CENARIO_BASE);
const anos = Math.max(1, Math.round((premissas.prazoLonga + premissas.parcelasEntrada) / 12));
console.log('Receita (VGV Nominal):', semImposto.vgvNominal.toFixed(0));
console.log('Lucro antes de IR:', semImposto.lucroLiquidoTotal.toFixed(0));
console.log('Anos estimados:', anos);

for (const regime of ['presumido', 'real'] as const) {
  const t = calcularTributacao(regime, semImposto.vgvNominal, semImposto.lucroLiquidoTotal, anos, 0);
  console.log(`\n=== ${regime.toUpperCase()} ===`);
  t.linhas.forEach(l => console.log(`  ${l.label}: base=${l.base.toFixed(0)} aliq=${(l.aliquota*100).toFixed(2)}% valor=${l.valor.toFixed(0)}`));
  console.log(`  TOTAL: ${t.totalTributos.toFixed(0)} (${(t.pctImpostosEfetivo*100).toFixed(2)}% da receita)`);
}
