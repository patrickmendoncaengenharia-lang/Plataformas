import { notFound } from 'next/navigation';
import {
  buildModel,
  calcularIndiceViabilidade,
  calcularRiscos,
  gerarOportunidades,
  gerarParecerNarrativo,
  CENARIO_BASE,
  CENARIO_CONSERVADOR,
  type Premissas,
} from '@/lib/calc-engine';
import { createPublicClient } from '@/lib/supabase/public';
import EstudoDashboardBody from '@/components/EstudoDashboardBody';

function fmtData(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default async function EstudoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createPublicClient();

  const { data: linhas } = await supabase.rpc('get_estudo_publico', { p_token: token });
  const estudo = linhas?.[0];
  if (!estudo) notFound();

  const premissas = estudo.premissas as Premissas;
  const model = buildModel(premissas, CENARIO_BASE);
  const modelCons = buildModel(premissas, CENARIO_CONSERVADOR);
  const indice = calcularIndiceViabilidade(model, premissas);
  const riscos = calcularRiscos(model, modelCons, premissas, false);
  const oportunidades = gerarOportunidades(model, modelCons, premissas);
  const parecerNarrativo = gerarParecerNarrativo(model, premissas, indice, riscos);

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: 'rgba(10,10,15,.86)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-6 py-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sia.png" alt="SIA Planejamento Urbano" className="h-8 w-auto shrink-0" />
          <div className="leading-tight">
            <div className="text-[13.5px] font-bold">Plataforma de Viabilidade</div>
          </div>
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            Visualização — somente leitura
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div
            className="relative overflow-hidden rounded-[20px] border p-7"
            style={{
              background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 130%)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(420px 220px at 100% 0%, rgba(57,135,229,.16), transparent 70%)' }}
            />
            <div className="relative">
              <div className="text-[11.5px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--accent)' }}>
                Parcelamento de solo urbano
              </div>
              <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">{estudo.nome}</h1>
              <p className="mb-5 mt-1 text-[13.5px]" style={{ color: 'var(--text-2)' }}>
                {[estudo.cidade, estudo.estado].filter(Boolean).join(' / ') || 'Localização não informada'}
                {estudo.spe ? ` · SPE: ${estudo.spe}` : ''}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <div>
                  <b className="block text-[15px] font-bold">
                    {fmtData(premissas.datas?.dataBase) || fmtData(estudo.data_base)}
                  </b>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Data-base
                  </span>
                </div>
                <div>
                  <b className="block text-[15px] font-bold">{estudo.versao || 'v1.0'}</b>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Versão do estudo
                  </span>
                </div>
                <div>
                  <b className="block text-[15px] font-bold">{premissas.lotes?.length ?? premissas.qtdLotes}</b>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Lotes ({premissas.quadras?.length ?? 0} quadras)
                  </span>
                </div>
                <div>
                  <b className="block text-[15px] font-bold">{premissas.areaVendavel.toLocaleString('pt-BR')} m²</b>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Área vendável
                  </span>
                </div>
              </div>
            </div>
          </div>
          {estudo.imagem_url && (
            <div
              className="overflow-hidden rounded-[20px] border"
              style={{ background: 'var(--surface-3)', borderColor: 'var(--border)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={estudo.imagem_url} alt="Imagem do projeto" className="h-full w-full object-cover" style={{ minHeight: 190 }} />
            </div>
          )}
        </div>

        <EstudoDashboardBody
          estudoNome={estudo.nome}
          estudoCidade={estudo.cidade}
          estudoEstado={estudo.estado}
          estudoStatus={estudo.status}
          estudoResponsavelNome={estudo.responsavel_nome}
          estudoResponsavelCrea={estudo.responsavel_crea}
          estudoVersao={estudo.versao}
          premissas={premissas}
          model={model}
          modelCons={modelCons}
          indice={indice}
          riscos={riscos}
          oportunidades={oportunidades}
          parecerNarrativo={parecerNarrativo}
        />

        <p className="mt-8 text-center text-[11px]" style={{ color: 'var(--text-3)' }}>
          Link de visualização gerado pela SIA Planejamento Urbano LTDA — dados sujeitos a revisão pelo responsável técnico.
        </p>
      </main>
    </div>
  );
}
