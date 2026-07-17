'use client';

export default function ExportarPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      title="Abre a caixa de impressão do navegador — escolha 'Salvar como PDF' como destino"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9V2h9l3 3v4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Exportar PDF
    </button>
  );
}
