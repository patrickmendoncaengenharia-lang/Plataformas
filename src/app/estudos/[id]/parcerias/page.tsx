import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Premissas } from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';
import ParceriasClient from '@/components/ParceriasClient';

export default async function ParceriasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  const { data: participantes } = await supabase
    .from('participantes')
    .select('*')
    .eq('estudo_id', id)
    .order('ordem', { ascending: true });

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />
      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <Link href={`/estudos/${id}`} className="text-[12px]" style={{ color: 'var(--text-3)' }}>
          ← {estudo.nome}
        </Link>
        <h1 className="mt-1 mb-1 text-[22px] font-extrabold">Parcerias e TIR individual</h1>
        <p className="mb-6 text-[13px]" style={{ color: 'var(--text-2)' }}>
          Cadastre cada participante do negocio e veja o retorno individual — TIR, VPL, lucro, MOIC e ROIC — calculado a
          partir do fluxo de caixa que ele proprio recebe, nao apenas o resultado global do projeto.
        </p>

        <ParceriasClient
          estudoId={id}
          premissas={estudo.premissas as Premissas}
          participantesIniciais={participantes ?? []}
        />
      </main>
    </div>
  );
}
