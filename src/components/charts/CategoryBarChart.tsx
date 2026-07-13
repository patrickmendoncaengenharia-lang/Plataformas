'use client';

import { useState } from 'react';
import { niceTicks, formatBRLShort } from './chart-utils';

export interface CategoryBar {
  label: string;
  value: number;
  color: string;
}

export default function CategoryBarChart({
  data,
  height = 210,
  yFormat = formatBRLShort,
}: {
  data: CategoryBar[];
  height?: number;
  yFormat?: (v: number) => string;
}) {
  const width = 900;
  const pad = { l: 58, r: 12, t: 24, b: 26 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const maxVal = Math.max(0, ...data.map((d) => d.value));
  const ticks = niceTicks(0, maxVal, 5);
  const topTick = ticks[ticks.length - 1] || 1;
  const y = (v: number) => pad.t + plotH - (v / topTick) * plotH;
  const n = data.length;
  const slot = plotW / n;
  const barW = Math.min(72, slot * 0.45);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras por categoria interativo">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} y1={y(t)} x2={width - pad.r} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
          <text x={pad.l - 8} y={y(t) + 3.5} fontSize="10" textAnchor="end" fill="var(--text-3)">
            {yFormat(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const barY = y(d.value);
        const active = activeIdx === i;
        return (
          <g
            key={d.label}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            onClick={() => setActiveIdx(active ? null : i)}
          >
            <rect x={cx - slot / 2} y={pad.t} width={slot} height={plotH} fill="transparent" />
            <rect
              x={cx - barW / 2}
              y={barY}
              width={barW}
              height={Math.max(1, pad.t + plotH - barY)}
              rx={5}
              fill={d.color}
              opacity={activeIdx === null || active ? 1 : 0.5}
              style={{ transition: 'opacity .12s' }}
            />
            {active && (
              <text x={cx} y={barY - 8} fontSize="11.5" fontWeight={700} textAnchor="middle" fill="var(--text)">
                {yFormat(d.value)}
              </text>
            )}
            <text x={cx} y={height - 6} fontSize="11" textAnchor="middle" fill="var(--text-2)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
