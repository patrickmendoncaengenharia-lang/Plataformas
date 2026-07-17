import { VEREDITOS, type Veredito } from '@/lib/calc-engine';

const COR_VEREDITO: Record<Veredito, string> = {
  'Não comprar': 'var(--crit)',
  'Comprar com ressalvas': 'var(--warn)',
  'Boa operação': 'var(--good)',
  'Muito boa': 'var(--good)',
  Excelente: 'var(--good)',
};

const PILL_VEREDITO: Record<Veredito, string> = {
  'Não comprar': 'NÃO COMPRAR',
  'Comprar com ressalvas': 'AVALIAR COM CUIDADO',
  'Boa operação': 'COMPRAR',
  'Muito boa': 'COMPRAR',
  Excelente: 'COMPRAR',
};

export default function ParecerExecutivoCard({
  veredito,
  headline,
  subtitulo,
  justificativa,
  nomeEstudo,
  localizacao,
  responsavelNome,
  responsavelCrea,
  versao,
}: {
  veredito: Veredito;
  headline: string;
  subtitulo: string;
  justificativa: string;
  nomeEstudo: string;
  localizacao: string;
  responsavelNome: string;
  responsavelCrea: string;
  versao: string;
}) {
  const cor = COR_VEREDITO[veredito];

  return (
    <div
      className="print-avoid-break overflow-hidden rounded-[20px] border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_1.3fr]">
        <div
          className="rounded-[16px] p-5"
          style={{ background: cor + '14', border: `1px solid ${cor}33` }}
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ background: cor + '26', color: cor }}
          >
            {PILL_VEREDITO[veredito]}
          </span>
          <h3 className="mt-3 text-[24px] font-extrabold tracking-tight">{headline}</h3>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
            {subtitulo}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {VEREDITOS.map((v) => {
              const ativo = v === veredito;
              return (
                <span
                  key={v}
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                  style={{
                    background: ativo ? COR_VEREDITO[v] : 'var(--surface-2)',
                    color: ativo ? '#0A0A0F' : 'var(--text-3)',
                  }}
                >
                  {v}
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
              Justificativa Técnica
            </h4>
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text)' }}>
            {justificativa}
          </p>
        </div>
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3 text-[11.5px]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
      >
        <span>
          {nomeEstudo} — {localizacao} · {responsavelNome}, Eng. Civil, {responsavelCrea}
        </span>
        <span>Estudo de viabilidade econômico-financeira · v{versao}</span>
      </div>
    </div>
  );
}
