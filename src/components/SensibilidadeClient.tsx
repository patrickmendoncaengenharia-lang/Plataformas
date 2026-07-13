'use client';

import { useMemo, useState } from 'react';
import { buildModel, cenarioBaseDe, type Premissas } from '@/lib/calc-engine';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

function Resultado({
  label,
  base,
  atual,
  fmt,
  menorEhMelhor,
}: {
  label: string;
  base: number;
  atual: number;
  fmt: (v: number) => string;
  menorEhMelhor?: boolean;
}) {
  const delta = atual - base;
  const melhorou = menorEhMelhor ? delta < 0 : delta > 0;
  const mudou = Math.abs(delta) > Math.abs(base) * 0.0001;
  return (
    <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[19px] font-extrabold">{fmt(atual)}</div>
      {mudou && (
        <div className="num mt-1 text-[12px]" style={{ color: melhorou ? 'var(--good)' : 'var(--crit)' }}>
          {delta > 0 ? '+' : ''}
          {fmt(delta)} vs. base
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold">{label}</label>
        <span className="num text-[13px] font-bold" style={{ color: 'var(--accent)' }}>
          {fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full"
      />
    </div>
  );
}

export default function SensibilidadeClient({ premissas }: { premissas: Premissas }) {
  const [preco, setPreco] = useState(0);
  const [custo, setCusto] = useState(0);
  const [prazoObra, setPrazoObra] = useState(0);
  const [velocidade, setVelocidade] = useState(0);

  const base = useMemo(() => buildModel(premissas, cenarioBaseDe(premissas)), [premissas]);

  const atual = useMemo(() => {
    const premissasAjustadas: Premissas = {
      ...premissas,
      prazoObra: Math.max(1, premissas.prazoObra + prazoObra),
    };
    const cenario = {
      ...cenarioBaseDe(premissas),
      preco: 1 + preco / 100,
      custoMult: 1 + custo / 100,
      velocidade: Math.max(0.1, 1 + velocidade / 100),
    };
    return buildModel(premissasAjustadas, cenario);
  }, [premissas, preco, custo, prazoObra, velocidade]);

  function resetar() {
    setPreco(0);
    setCusto(0);
    setPrazoObra(0);
    setVelocidade(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Variáveis
          </h2>
          <button
            onClick={resetar}
            className="text-[12px]"
            style={{ color: 'var(--accent)' }}
          >
            Restaurar base
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Slider
            label="Preço dos lotes"
            value={preco}
            min={-20}
            max={20}
            step={1}
            onChange={setPreco}
            fmt={(v) => (v > 0 ? '+' : '') + v + '%'}
          />
          <Slider
            label="Custo das obras"
            value={custo}
            min={-20}
            max={20}
            step={1}
            onChange={setCusto}
            fmt={(v) => (v > 0 ? '+' : '') + v + '%'}
          />
          <Slider
            label="Prazo das obras"
            value={prazoObra}
            min={-6}
            max={12}
            step={1}
            onChange={setPrazoObra}
            fmt={(v) => (v > 0 ? '+' : '') + v + ' meses'}
          />
          <div>
            <Slider
              label="Velocidade das vendas"
              value={velocidade}
              min={-50}
              max={100}
              step={5}
              onChange={setVelocidade}
              fmt={(v) => (v > 0 ? '+' : '') + v + '%'}
            />
            {(!premissas.mesFimVendas || premissas.mesFimVendas === premissas.mesInicioVendas) && (
              <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                Este estudo usa venda instantânea (sem janela de absorção) — essa alavanca não altera o resultado.
                Configure um &ldquo;mês fim de vendas&rdquo; para simular absorção gradual.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Resultado label="TIR anual" base={base.tirAnual} atual={atual.tirAnual} fmt={PCT} />
        <Resultado label="VPL" base={base.vpl} atual={atual.vpl} fmt={BRL} />
        <Resultado label="Lucro econômico" base={base.lucroLiquidoTotal} atual={atual.lucroLiquidoTotal} fmt={BRL} />
        <Resultado
          label="Capital necessário"
          base={base.capitalNecessario}
          atual={atual.capitalNecessario}
          fmt={BRL}
          menorEhMelhor
        />
        <Resultado
          label="Payback"
          base={base.payback ?? 0}
          atual={atual.payback ?? 0}
          fmt={(v) => `${v} meses`}
          menorEhMelhor
        />
      </div>
    </div>
  );
}
