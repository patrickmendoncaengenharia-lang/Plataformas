import { buildModel, CENARIO_BASE, type Premissas } from '../src/lib/calc-engine';

const premissas: Premissas = {
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

const base = buildModel(premissas, CENARIO_BASE);
console.log('BASE       TIR=' + (base.tirAnual*100).toFixed(2) + '%  VPL=' + base.vpl.toFixed(0));

const maisPreco = buildModel(premissas, { ...CENARIO_BASE, preco: 1.1 });
console.log('+10% preco TIR=' + (maisPreco.tirAnual*100).toFixed(2) + '%  VPL=' + maisPreco.vpl.toFixed(0), maisPreco.tirAnual > base.tirAnual ? 'OK (subiu)' : 'ERRO (deveria subir)');

const maisCusto = buildModel(premissas, { ...CENARIO_BASE, custoMult: 1.1 });
console.log('+10% custo TIR=' + (maisCusto.tirAnual*100).toFixed(2) + '%  VPL=' + maisCusto.vpl.toFixed(0), maisCusto.tirAnual < base.tirAnual ? 'OK (caiu)' : 'ERRO (deveria cair)');

const maisPrazo = buildModel({ ...premissas, prazoObra: premissas.prazoObra + 6 }, CENARIO_BASE);
console.log('+6m obra   TIR=' + (maisPrazo.tirAnual*100).toFixed(2) + '%  Capital=' + maisPrazo.capitalNecessario.toFixed(0), maisPrazo.capitalNecessario >= base.capitalNecessario ? 'OK (capital nao caiu)' : 'suspeito');

const maisVelocidade = buildModel(premissas, { ...CENARIO_BASE, velocidade: 2 });
console.log('2x veloc.  TIR=' + (maisVelocidade.tirAnual*100).toFixed(2) + '%  Payback=' + maisVelocidade.payback);
