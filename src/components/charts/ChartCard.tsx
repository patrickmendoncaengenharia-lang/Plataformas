export default function ChartCard({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="print-avoid-break rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <b className="text-[14px] font-bold">{title}</b>
          {subtitle && (
            <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
              {subtitle}
            </div>
          )}
        </div>
        {legend && legend.length > 0 && (
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-2)' }}>
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
