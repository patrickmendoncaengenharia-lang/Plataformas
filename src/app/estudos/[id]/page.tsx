import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  buildModel,
  calcularIndiceViabilidade,
  calcularRiscos,
  gerarOportunidades,
  gerarParecerNarrativo,
  cenarioBaseDe,
  cenarioConservadorDe,
  type Premissas,
} from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';
import ImagemHero from '@/components/ImagemHero';
import CompartilharDashboard from '@/components/CompartilharDashboard';
import EstudoDashboardBody from '@/components/EstudoDashboardBody';

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <b className="block text-[15px] font-bold">{value}</b>
      <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        {label}
      </span>
    </div>
  );
}

function fmtData(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default async function EstudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  const { count: qtdParticipantes } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true })
    .eq('estudo_id', id);

  const premissas = estudo.premissas as Premissas;
  const model = buildModel(premissas, cenarioBaseDe(premissas));
  const modelCons = buildModel(premissas, cenarioConservadorDe(premissas));
  const indice = calcularIndiceViabilidade(model, premissas);
  const riscos = calcularRiscos(model, modelCons, premissas, (qtdParticipantes ?? 0) > 0);
  const oportunidades = gerarOportunidades(model, modelCons, premissas);
  const parecerNarrativo = gerarParecerNarrativo(model, premissas, indice, riscos);

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            ← Meus estudos
          </Link>
          {estudo.public_token && (
            <CompartilharDashboard
              estudoId={id}
              publicToken={estudo.public_token}
              publicoHabilitadoInicial={!!estudo.publico_habilitado}
            />
          )}
        </div>

        <div className="mt-3 mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]">
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
                <MetaItem label="Data-base" value={fmtData(premissas.datas?.dataBase) || fmtData(estudo.data_base)} />
                <MetaItem label="Versão do estudo" value={estudo.versao || 'v1.0'} />
                <MetaItem label="Tipo" value="Loteamento" />
                <MetaItem
                  label={`Lotes (${premissas.quadras?.length ?? 0} quadras)`}
                  value={`${premissas.lotes?.length ?? premissas.qtdLotes}`}
                />
                <MetaItem label="Área da gleba" value={`${premissas.areaGleba.toLocaleString('pt-BR')} m²`} />
                <MetaItem label="Área vendável" value={`${premissas.areaVendavel.toLocaleString('pt-BR')} m²`} />
                <MetaItem label="Responsável pelo estudo" value={estudo.responsavel_nome || '—'} />
                <MetaItem label="Registro" value={estudo.responsavel_crea ? `CREA ${estudo.responsavel_crea}` : '—'} />
              </div>
            </div>
          </div>
          <ImagemHero estudoId={id} imagemUrl={estudo.imagem_url ?? null} />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ['Configurações', 'configuracoes'],
            ['Lotes', 'lotes'],
            ['Cronograma', 'cronograma'],
            ['Cronograma de obras', 'obras'],
            ['Sensibilidade', 'sensibilidade'],
            ['Parcerias e TIR individual', 'parcerias'],
            ['Planejamento tributário', 'tributacao'],
            ['Relatório executivo', 'relatorio'],
          ].map(([label, slug]) => (
            <Link
              key={slug}
              href={`/estudos/${id}/${slug}`}
              className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              {label} →
            </Link>
          ))}
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
      </main>
    </div>
  );
}
