'use client';

import { useRef, useState } from 'react';
import { niceTicks, formatBRLShort, formatNumberShort } from './chart-utils';

export interface Serie {
  label: string;
  color: string;
  data: number[];
  kind?: 'line' | 'area' | 'bar';
}

// Grafico de serie temporal generico (linha/area/barra), SVG renderizado no
// cliente com crosshair interativo — passar o mouse (ou tocar/clicar, que
// tambem fixa o tooltip) mostra o mes e o valor de cada serie naquele ponto.
// yFormat recebe uma chave (nao uma funcao) porque funcoes nao atravessam a
// fronteira Server Component -> Client Component.
export default function SeriesChart({
  months,
  series,
  height = 210,
  yFormat = 'brl',
  xTickCount = 6,
}: {
  months: number[];
  series: Serie[];
  height?: number;
  yFormat?: 'brl' | 'number';
  xTickCount?: number;
}) {
  const format = yFormat === 'number' ? formatNumberShort : formatBRLShort;
  const width = 900;
  const pad = { l: 58, r: 12, t: 10, b: 22 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const n = months.length;

  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  let dataMin = 0;
  let dataMax = 0;
  series.forEach((s) =>
    s.data.forEach((v) => {
      if (v < dataMin) dataMin = v;
      if (v > dataMax) dataMax = v;
    })
  );
  const ticks = niceTicks(dataMin, dataMax, 5);
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const range = max - min || 1;

  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => pad.t + plotH - ((v - min) / range) * plotH;
  const yZero = y(0);

  const barW = Math.max(1.5, Math.min(10, (plotW / n) * 0.7));

  const xTickIdx = Array.from(
    new Set(Array.from({ length: xTickCount }, (_, k) => Math.round((k * (n - 1)) / (xTickCount - 1))))
  );

  function idxFromClientX(clientX: number): number {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    const frac = (relX - pad.l) / plotW;
    return Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
  }

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    if (pinned) return;
    setActiveIdx(idxFromClientX(e.clientX));
  }
  function handleLeave() {
    if (!pinned) setActiveIdx(null);
  }
  function handleClick(e: React.PointerEvent<SVGSVGElement>) {
    const i = idxFromClientX(e.clientX);
    if (pinned && activeIdx === i) {
      setPinned(false);
      setActiveIdx(null);
    } else {
      setPinned(true);
      setActiveIdx(i);
    }
  }

  const tooltipLineH = 15;
  const tooltipBoxW = 190;
  const tooltipBoxH = 20 + series.length * tooltipLineH;

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Gráfico de série temporal interativo"
      style={{ cursor: 'crosshair', touchAction: 'none' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={handleClick}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} y1={y(t)} x2={width - pad.r} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
          <text x={pad.l - 8} y={y(t) + 3.5} fontSize="10" textAnchor="end" fill="var(--text-3)">
            {format(t)}
          </text>
        </g>
      ))}
      <line x1={pad.l} y1={yZero} x2={width - pad.r} y2={yZero} stroke="var(--border-strong)" strokeWidth={1} />

      {series
        .filter((s) => s.kind === 'bar')
        .map((s) => (
          <g key={s.label}>
            {s.data.map(
              (v, i) =>
                v !== 0 && (
                  <rect
                    key={i}
                    x={x(i) - barW / 2}
                    y={Math.min(y(v), yZero)}
                    width={barW}
                    height={Math.max(1, Math.abs(y(v) - yZero))}
                    rx={2}
                    fill={s.color}
                  />
                )
            )}
          </g>
        ))}

      {series
        .filter((s) => s.kind !== 'bar')
        .map((s) => {
          const linePoints = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          const areaPoints = `${x(0)},${yZero} ${linePoints} ${x(n - 1)},${yZero}`;
          return (
            <g key={s.label}>
              {s.kind === 'area' && <polygon points={areaPoints} fill={s.color} opacity={0.16} />}
              <polyline
                points={linePoints}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}

      {xTickIdx.map((i, k) => (
        <text
          key={k}
          x={x(i)}
          y={height - 4}
          fontSize="10.5"
          fill="var(--text-3)"
          textAnchor={k === 0 ? 'start' : k === xTickIdx.length - 1 ? 'end' : 'middle'}
        >
          {months[i]}
        </text>
      ))}

      {activeIdx !== null && (
        <g pointerEvents="none">
          <line
            x1={x(activeIdx)}
            y1={pad.t}
            x2={x(activeIdx)}
            y2={pad.t + plotH}
            stroke="var(--border-strong)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          {series.map((s) => (
            <circle
              key={s.label}
              cx={x(activeIdx)}
              cy={y(s.data[activeIdx])}
              r={3.5}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          ))}
          {(() => {
            const rawX = x(activeIdx) + 12;
            const boxX = rawX + tooltipBoxW > width - pad.r ? x(activeIdx) - tooltipBoxW - 12 : rawX;
            const boxY = Math.max(pad.t, Math.min(pad.t + plotH - tooltipBoxH, pad.t + plotH / 2 - tooltipBoxH / 2));
            return (
              <g>
                <rect
                  x={boxX}
                  y={boxY}
                  width={tooltipBoxW}
                  height={tooltipBoxH}
                  rx={8}
                  fill="var(--surface-2)"
                  stroke="var(--border-strong)"
                  strokeWidth={1}
                />
                <text x={boxX + 10} y={boxY + 16} fontSize="10.5" fontWeight={700} fill="var(--text)">
                  Mês {months[activeIdx]}
                </text>
                {series.map((s, i) => (
                  <text key={s.label} x={boxX + 10} y={boxY + 16 + (i + 1) * tooltipLineH} fontSize="10.5">
                    <tspan fill={s.color}>●</tspan>
                    <tspan fill="var(--text-2)"> {s.label}: </tspan>
                    <tspan fontWeight={700} fill="var(--text)">
                      {format(s.data[activeIdx])}
                    </tspan>
                  </text>
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
