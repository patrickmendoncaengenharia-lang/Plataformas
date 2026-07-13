'use client';

import { useMemo, useState } from 'react';
import { buildModel, calcularTributacao, CENARIO_BASE, type Premissas } from '@/lib/calc-engine';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number, casas = 2) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: casas }) + '%';

export default function TributacaoClient({ premissas }: { premissas: Premissas }) {
  const [regime, setRegime] = useState<'presumido' | 'real'>('presumido');
  const [pctIss, setPctIss] = useState(0);

  const baseAtual = useMemo(() => buildModel(premissas, CENARIO_BASE), [premissas]);

  const semImposto = useMemo(
    () => buildModel({ ...premissas, pctImpostos: 0 }, CENARIO_BASE),
    [premissas]
  );

  const anosProjeto = Math.max(1, Math.round((premissas.prazoLonga + premissas.parcelasEntrada) / 12));

  const tributacao = useMemo(
    () =>
      calcularTributacao(
        regime,
        semImposto.vgvNominal,
        semImposto.lucroLiquidoTotal,
        anosProjeto,
        pctIss / 100
      ),
    [regime, semImposto, anosProjeto, pctIss]
  );

  const modeloComRegime = useMemo(
    () => buildModel({ ...premissas, pctImpostos: tributacao.pctImpostosEfetivo }, CENARIO_BASE),
    [premissas, tributacao]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex gap-1 rounded-[10px] p-1" style={{ background: 'var(--surface-2)' }}>
            <button
              onClick={() => setRegime('presumido')}
              className="rounded-[8px] px-4 py-2 text-[13px] font-semibold"
              style={regime === 'presumido' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-2)' }}
            >
              Lucro Presumido
            </button>
            <button
              onClick={() => setRegime('real')}
              className="rounded-[8px] px-4 py-2 text-[13px] font-semibold"
              style={regime === 'real' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-2)' }}
            >
              Lucro Real
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              ISS (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={pctIss}
              onChange={(e) => setPctIss(+e.target.value)}
              style={{ width: 80 }}
            />
          </div>
        </div>

        <p className="mb-4 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
          Aproximação: adicional de IRPJ considera {anosProjeto} ano(s) de duração do projeto (prazo longo + parcelas
          de entrada). Lucro Real usa o lucro operacional antes de IRPJ/CSLL como base — sem aproveitamento de
          créditos de PIS/COFINS nesta versão.
        </p>

        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="pb-2 text-left font-semibold" style={{ color: 'var(--text-2)' }}>
                Tributo
              </th>
              <th className="pb-2 text-right font-semibold" style={{ color: 'var(--text-2)' }}>
                Base de cálculo
              </th>
              <th className="pb-2 text-right font-semibold" style={{ color: 'var(--text-2)' }}>
                Alíquota
              </th>
              <th className="pb-2 text-right font-semibold" style={{ color: 'var(--text-2)' }}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {tributacao.linhas.map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">{l.label}</td>
                <td className="py-2 text-right num">{BRL(l.base)}</td>
                <td className="py-2 text-right num">{PCT(l.aliquota, 2)}</td>
                <td className="py-2 text-right num font-semibold">{BRL(l.valor)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 font-bold">Total de tributos</td>
              <td></td>
              <td className="pt-3 text-right num font-bold">{PCT(tributacao.pctImpostosEfetivo, 2)} da receita</td>
              <td className="pt-3 text-right num font-bold">{BRL(tributacao.totalTributos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Comparativo label="Alíquota efetiva" base={PCT(premissas.pctImpostos, 2)} novo={PCT(tributacao.pctImpostosEfetivo, 2)} />
        <Comparativo label="Lucro econômico" base={BRL(baseAtual.lucroLiquidoTotal)} novo={BRL(modeloComRegime.lucroLiquidoTotal)} />
        <Comparativo label="VPL" base={BRL(baseAtual.vpl)} novo={BRL(modeloComRegime.vpl)} />
        <Comparativo label="TIR anual" base={PCT(baseAtual.tirAnual, 1)} novo={PCT(modeloComRegime.tirAnual, 1)} />
        <Comparativo label="Margem líquida" base={PCT(baseAtual.margemLiquida, 1)} novo={PCT(modeloComRegime.margemLiquida, 1)} />
      </div>
    </div>
  );
}

function Comparativo({ label, base, novo }: { label: string; base: string; novo: string }) {
  return (
    <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[18px] font-extrabold">{novo}</div>
      <div className="num mt-1 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
        premissa atual: {base}
      </div>
    </div>
  );
}
