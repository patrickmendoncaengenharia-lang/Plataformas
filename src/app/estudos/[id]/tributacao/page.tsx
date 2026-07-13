import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Premissas } from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';
import TributacaoClient from '@/components/TributacaoClient';

export default async function TributacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudo } = await supabase.from('estudos').select('*').eq('id', id).single();
  if (!estudo) notFound();

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email ?? ''} />
      <main className="mx-auto max-w-[900px] px-6 py-8">
        <Link href={`/estudos/${id}`} className="text-[12px]" style={{ color: 'var(--text-3)' }}>
          ← {estudo.nome}
        </Link>
        <h1 className="mt-1 mb-1 text-[22px] font-extrabold">Planejamento tributário</h1>
        <p className="mb-6 max-w-[640px] text-[13px]" style={{ color: 'var(--text-2)' }}>
          Compare Lucro Presumido e Lucro Real com a memória de cálculo completa — nenhum número aqui é caixa-preta —
          e veja o impacto real em Lucro, VPL e TIR.
        </p>

        <TributacaoClient premissas={estudo.premissas as Premissas} />
      </main>
    </div>
  );
}
