'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold text-white print:hidden"
      style={{ background: 'var(--accent)' }}
    >
      Imprimir / exportar PDF
    </button>
  );
}
