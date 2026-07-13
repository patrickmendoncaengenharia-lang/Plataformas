import type { Premissas, Lote } from '../src/lib/calc-engine';

const lotesReais: { area: number; fator: number }[] = [
  {"area": 172.74, "fator": 1.0}, {"area": 179.88, "fator": 1.0}, {"area": 179.88, "fator": 1.0}, {"area": 179.89, "fator": 1.0}, {"area": 179.89, "fator": 1.0}, {"area": 179.9, "fator": 1.0}, {"area": 180.79, "fator": 1.0}, {"area": 184.97, "fator": 1.0}, {"area": 192.93, "fator": 1.0}, {"area": 179.82, "fator": 1.12}, {"area": 159.66, "fator": 1.12}, {"area": 189.56, "fator": 1.0}, {"area": 179.21, "fator": 1.12}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 178.21, "fator": 1.0}, {"area": 159.46, "fator": 1.0}, {"area": 157.93, "fator": 1.0}, {"area": 161.46, "fator": 1.0},
  {"area": 177.34, "fator": 1.0}, {"area": 155.82, "fator": 1.0}, {"area": 177.83, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 182.37, "fator": 1.12}, {"area": 292.31, "fator": 1.12}, {"area": 179.72, "fator": 1.0}, {"area": 178.93, "fator": 1.0}, {"area": 163.06, "fator": 1.0}, {"area": 156.51, "fator": 1.0}, {"area": 165.98, "fator": 1.0},
  {"area": 177.69, "fator": 1.0}, {"area": 155.93, "fator": 1.0}, {"area": 178.24, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 261.11, "fator": 1.12}, {"area": 163.54, "fator": 1.12}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 178.84, "fator": 1.0}, {"area": 162.52, "fator": 1.0}, {"area": 156.68, "fator": 1.0}, {"area": 158.32, "fator": 1.0},
  {"area": 177.23, "fator": 1.0}, {"area": 155.93, "fator": 1.0}, {"area": 166.99, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.66, "fator": 1.0}, {"area": 247.07, "fator": 1.12}, {"area": 250.34, "fator": 1.12}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 178.98, "fator": 1.0}, {"area": 163.37, "fator": 1.0}, {"area": 156.41, "fator": 1.0}, {"area": 165.81, "fator": 1.0},
  {"area": 164.4, "fator": 1.12}, {"area": 155.5, "fator": 1.0}, {"area": 165.04, "fator": 1.0}, {"area": 179.7, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 167.57, "fator": 1.0}, {"area": 165.24, "fator": 1.12}, {"area": 175.54, "fator": 1.12}, {"area": 163.74, "fator": 1.0}, {"area": 178.19, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 179.72, "fator": 1.0}, {"area": 192.64, "fator": 1.0},
];

const lotes: Lote[] = lotesReais.map((l, i) => ({ numero: i + 1, area: l.area, fator: l.fator }));

const premissas: Premissas = {
  areaGleba: 77136,
  areaVendavel: 15899.13,
  qtdLotes: 89,
  precoBase: 800,
  quadras: [
    { nome: 'A', lotes: 21, area: 3715.10 },
    { nome: 'B', lotes: 13, area: 2369.00 },
    { nome: 'C', lotes: 13, area: 2311.74 },
    { nome: 'D', lotes: 19, area: 3459.28 },
    { nome: 'E', lotes: 23, area: 4043.99 },
  ],
  lotes,
  datas: {
    dataBase: '2026-07-01',
    inicioProjetos: '2025-03-01',
    inicioObras: '2027-02-01',
    lancamento: '2027-03-01',
    entrega: '2028-08-01',
  },
  mix: { avista: 0.10, curta: 0.15, longa: 0.75 },
  descontoAvista: 0.05,
  entrada: 0.10,
  parcelasEntrada: 4,
  prazoCurta: 36,
  prazoLonga: 180,
  jurosPrice: 0.008,
  tma: 0.15,
  mesInicioVendas: 8,
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

const json = JSON.stringify(premissas).replace(/'/g, "''");

const sql = `update public.estudos set
  cidade = 'Franca',
  estado = 'SP',
  responsavel_nome = 'Patrick Mendonça',
  responsavel_crea = '5069509021',
  premissas = '${json}'::jsonb,
  atualizado_em = now()
where id = 'f26859a7-fc95-484b-8661-737bb3f79094';`;

console.log(sql);
