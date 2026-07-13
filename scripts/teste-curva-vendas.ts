import { buildModel, CENARIO_BASE, type Premissas } from '../src/lib/calc-engine';

const base: Premissas = {
  areaGleba: 77136,
  areaVendavel: 15899.13,
  qtdLotes: 89,
  precoBase: 800,
  quadras: [{ nome: 'A', lotes: 89, area: 15899.13 }],
  mix: { avista: 0.10, curta: 0.15, longa: 0.75 },
  descontoAvista: 0.05,
  entrada: 0.10,
  parcelasEntrada: 4,
  prazoCurta: 36,
  prazoLonga: 180,
  jurosPrice: 0.008,
  tma: 0.15,
  mesInicioVendas: 8,
  mesFimVendas: 13, // 6 meses de absorcao
  tipoCurvaVendas: 'linear',
  mesInicioObras: 7,
  prazoObra: 18,
  pctComissao: 0.06,
  pctMarketing: 0.02,
  pctImpostos: 0.1508,
  pctGestaoCarteira: 0.05,
  pctInad: 0.02,
  pctDistrato: 0.03,
  pctAdmin: 0.10,
  pctConting: 0.05,
  custoProjetos: 550000,
  custoComercial: 60000,
  custoJuridico: 25000,
  valorTerraEconomico: 4781157.02,
  cronogramaObra: [119243.48,151041.74,176082.87,176082.87,217375.18,236454.13,164908.05,164908.05,
                   164908.05,249332.43,192493.04,140707.30,102549.39,138322.43,163363.56,108511.56,122820.78,72738.52],
};

console.log('=== Curva LINEAR, 6 meses de absorcao (mes 8 a 13) ===');
const mLinear = buildModel(base, CENARIO_BASE);
for (let t = 6; t <= 15; t++) {
  console.log(`mes ${t}: ${mLinear.lotesVendidosMes[mLinear.idx(t)]} lotes`);
}
console.log('total vendido:', mLinear.lotesVendidosMes.reduce((a, b) => a + b, 0), '(esperado 89)');

console.log('\n=== Curva S-CURVE, 6 meses de absorcao (mes 8 a 13) ===');
const mS = buildModel({ ...base, tipoCurvaVendas: 'scurve' }, CENARIO_BASE);
for (let t = 6; t <= 15; t++) {
  console.log(`mes ${t}: ${mS.lotesVendidosMes[mS.idx(t)]} lotes`);
}
console.log('total vendido:', mS.lotesVendidosMes.reduce((a, b) => a + b, 0), '(esperado 89)');

console.log('\n=== Instantaneo (sem mesFimVendas, igual Nair Retuci II) ===');
const mInst = buildModel({ ...base, mesFimVendas: undefined, tipoCurvaVendas: 'linear' }, CENARIO_BASE);
for (let t = 6; t <= 10; t++) {
  console.log(`mes ${t}: ${mInst.lotesVendidosMes[mInst.idx(t)]} lotes`);
}
console.log('total vendido:', mInst.lotesVendidosMes.reduce((a, b) => a + b, 0), '(esperado 89)');
