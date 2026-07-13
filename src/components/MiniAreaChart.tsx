// Grafico de area minimalista, renderizado em SVG puro no servidor — sem lib de
// chart, sem JS no cliente. Usado no Relatorio Executivo (fluxo de caixa acumulado).

export default function MiniAreaChart({
  data,
  labels,
  width = 760,
  height = 180,
  color = '#3987E5',
}: {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const pad = { l: 10, r: 10, t: 12, b: 20 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const max = Math.max(0, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * plotW;
  const y = (v: number) => pad.t + plotH - ((v - min) / range) * plotH;
  const yZero = y(0);

  const linePoints = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const areaPoints = `${x(0)},${yZero} ${linePoints} ${x(data.length - 1)},${yZero}`;

  const idxLabels =
    labels && labels.length
      ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
      : [];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Fluxo de caixa acumulado ao longo do tempo">
      <line x1={pad.l} y1={yZero} x2={width - pad.r} y2={yZero} stroke="var(--border)" strokeWidth={1} />
      <polygon points={areaPoints} fill={color} opacity={0.14} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {idxLabels.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={height - 4}
          fontSize="10.5"
          fill="var(--text-3)"
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
        >
          {labels![i]}
        </text>
      ))}
    </svg>
  );
}
