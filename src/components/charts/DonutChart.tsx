'use client';

import { useState } from 'react';
import { formatBRLShort } from './chart-utils';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// Donut interativo — passar o mouse (ou tocar/clicar, que fixa a selecao)
// sobre uma fatia troca o centro do total pelo detalhe daquela categoria.
export default function DonutChart({
  segments,
  total,
  totalLabel = 'TOTAL',
  size = 168,
}: {
  segments: DonutSegment[];
  total?: number;
  totalLabel?: string;
  size?: number;
}) {
  const sum = total ?? segments.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 13;
  const c = 2 * Math.PI * r;
  const gap = 3;
  const cx = size / 2;
  const cy = size / 2;

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  const offsets: number[] = [];
  segments.reduce((acc, s) => {
    offsets.push(acc);
    return acc + (sum > 0 ? (s.value / sum) * c : 0);
  }, 0);

  function select(i: number | null) {
    if (!pinned) setActiveIdx(i);
  }
  function toggle(i: number) {
    if (pinned && activeIdx === i) {
      setPinned(false);
      setActiveIdx(null);
    } else {
      setPinned(true);
      setActiveIdx(i);
    }
  }

  const ativo = activeIdx !== null ? segments[activeIdx] : null;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Gráfico de composição interativo"
        onMouseLeave={() => select(null)}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={22} />
        {segments.map((s, i) => {
          const frac = sum > 0 ? s.value / sum : 0;
          const full = frac * c;
          const len = Math.max(0, full - gap);
          const dashoffset = -offsets[i];
          if (full <= 0) return null;
          return (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={activeIdx === i ? 26 : 22}
              strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={activeIdx === null || activeIdx === i ? 1 : 0.45}
              style={{ cursor: 'pointer', transition: 'stroke-width .12s, opacity .12s' }}
              onMouseEnter={() => select(i)}
              onClick={() => toggle(i)}
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9.5" fill="var(--text-3)" style={{ letterSpacing: '.06em' }}>
          {ativo ? ativo.label.slice(0, 16).toUpperCase() : totalLabel}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="14" fontWeight="800" fill={ativo ? ativo.color : 'var(--text)'}>
          {formatBRLShort(ativo ? ativo.value : sum)}
        </text>
        {ativo && (
          <text x={cx} y={cy + 28} textAnchor="middle" fontSize="9.5" fill="var(--text-3)">
            {sum > 0 ? ((ativo.value / sum) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}%
          </text>
        )}
      </svg>
      <div className="flex flex-1 flex-col gap-1.5 text-[11.5px]">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className="flex cursor-pointer items-center gap-2 rounded-[6px] px-1 py-0.5 transition-colors"
            style={{
              color: 'var(--text-2)',
              background: activeIdx === i ? 'var(--surface-2)' : 'transparent',
              opacity: activeIdx === null || activeIdx === i ? 1 : 0.55,
            }}
            onMouseEnter={() => select(i)}
            onMouseLeave={() => select(null)}
            onClick={() => toggle(i)}
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <b className="num ml-auto shrink-0" style={{ color: 'var(--text)' }}>
              {sum > 0 ? ((s.value / sum) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}%
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
