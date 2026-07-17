// Gauge semicircular (velocimetro) para uma categoria de risco 0-100 —
// zona verde (baixo) / amarela (moderado) / vermelha (alto) + ponteiro.
// SVG puro, sem interatividade — o nivel ja esta no rotulo abaixo.

const COR_NIVEL: Record<string, string> = {
  Baixo: 'var(--good)',
  Moderado: 'var(--warn)',
  Alto: 'var(--crit)',
};

export default function RiskGauge({
  label,
  nivel,
  score,
}: {
  label: string;
  nivel: 'Baixo' | 'Moderado' | 'Alto';
  score: number;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = 58;

  // Semicirculo de 180 graus, angulo -180 (esquerda) a 0 (direita).
  const angleFor = (frac: number) => -180 + frac * 180;
  const polar = (angleDeg: number, radius: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };
  const arcPath = (fromFrac: number, toFrac: number) => {
    const p0 = polar(angleFor(fromFrac), r);
    const p1 = polar(angleFor(toFrac), r);
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
  };

  const needleAngle = angleFor(Math.max(0, Math.min(100, score)) / 100);
  const needleTip = polar(needleAngle, r - 14);
  const cor = COR_NIVEL[nivel];

  return (
    <div
      className="print-avoid-break flex flex-col items-center rounded-[16px] border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <svg width={size} height={size / 2 + 26} viewBox={`0 0 ${size} ${size / 2 + 26}`} role="img" aria-label={`${label}: ${nivel}`}>
        <path d={arcPath(0, 0.34)} stroke="var(--good)" strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={arcPath(0.33, 0.67)} stroke="var(--warn)" strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={arcPath(0.66, 1)} stroke="var(--crit)" strokeWidth={12} fill="none" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="var(--text)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5.5} fill="var(--text)" />
      </svg>
      <b className="mt-1 text-[15px] font-extrabold" style={{ color: cor }}>
        {nivel}
      </b>
      <span className="mt-0.5 text-center text-[11.5px] font-semibold" style={{ color: 'var(--text-2)' }}>
        {label}
      </span>
    </div>
  );
}
