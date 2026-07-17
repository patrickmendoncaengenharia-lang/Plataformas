// Capa formal exibida apenas na impressao/exportacao em PDF (window.print) —
// escondida na tela via a classe .print-cover (globals.css). O restante do
// dashboard (KPIs, graficos, riscos, parecer) e reaproveitado sem alteracao,
// so a paleta de cor muda pra impressao (ver @media print em globals.css).
export default function PdfCover({
  nomeEstudo,
  localizacao,
  tipoLabel,
  responsavelNome,
  responsavelCrea,
  dataBase,
  versao,
}: {
  nomeEstudo: string;
  localizacao: string;
  tipoLabel: string;
  responsavelNome: string;
  responsavelCrea: string;
  dataBase: string;
  versao: string;
}) {
  return (
    <div className="print-cover mb-8 flex-col border-b-2 pb-6" style={{ borderColor: 'var(--text)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sia.png" alt="SIA Planejamento Urbano" className="h-10 w-auto" style={{ filter: 'invert(1)' }} />
          <div className="leading-tight">
            <div className="text-[13px] font-bold">SIA Planejamento Urbano LTDA</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Plataforma de Viabilidade
            </div>
          </div>
        </div>
        <div className="text-right text-[10.5px]" style={{ color: 'var(--text-3)' }}>
          <div>Documento gerado em {new Date().toLocaleDateString('pt-BR')}</div>
          <div>Versão do estudo: {versao || 'v1.0'}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--accent)' }}>
          Estudo de Viabilidade Econômico-Financeira · {tipoLabel}
        </div>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight">{nomeEstudo}</h1>
        <p className="mt-1 text-[13.5px]" style={{ color: 'var(--text-2)' }}>
          {localizacao}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-2)' }}>
        <span>
          Responsável técnico: <b style={{ color: 'var(--text)' }}>{responsavelNome || 'Não informado'}</b>
        </span>
        {responsavelCrea && (
          <>
            <span>·</span>
            <span>
              Registro: <b style={{ color: 'var(--text)' }}>{responsavelCrea}</b>
            </span>
          </>
        )}
        <span>·</span>
        <span>
          Data-base: <b style={{ color: 'var(--text)' }}>{dataBase}</b>
        </span>
      </div>
    </div>
  );
}
