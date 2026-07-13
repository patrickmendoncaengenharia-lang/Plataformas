import { buildModel, CENARIO_BASE, calcularIndiceViabilidade, gerarParecer, type Premissas } from '../src/lib/calc-engine';

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

const m = buildModel(premissas, CENARIO_BASE);
const indice = calcularIndiceViabilidade(m, premissas);
const parecer = gerarParecer(m, premissas, indice);

console.log('Indice:', indice.nota.toFixed(1), indice.classificacao);
console.log('Componentes:', indice.componentes.map(c => c.label+'='+c.nota.toFixed(0)).join(', '));
console.log('\nRecomendacao:', parecer.recomendacao);
console.log('\nPontos fortes:'); parecer.pontosFortes.forEach(t=>console.log(' -', t));
console.log('\nRiscos:'); parecer.riscos.forEach(t=>console.log(' -', t));
console.log('\nPontos de atencao:'); parecer.pontosAtencao.forEach(t=>console.log(' -', t));
