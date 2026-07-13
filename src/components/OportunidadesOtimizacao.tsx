import type { Oportunidade } from '@/lib/calc-engine';

export default function OportunidadesOtimizacao({ oportunidades }: { oportunidades: Oportunidade[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {oportunidades.map((o, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-[14px] border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px]"
            style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
          >
            ✓
          </span>
          <div className="flex-1">
            <p className="text-[13px] leading-snug" style={{ color: 'var(--text)' }}>
              {o.texto}
            </p>
            {o.destaque && <b className="num block text-[16px] font-extrabold">{o.destaque}</b>}
            {o.rodape && (
              <p className="mt-0.5 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                {o.rodape}
              </p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {o.badge}
          </span>
        </div>
      ))}
    </div>
  );
}
