import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Premissas } from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';
import LotesClient from '@/components/LotesClient';

export default async function LotesPage({ params }: { params: Promise<{ id: string }> }) {
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
      <main className="mx-auto max-w-[1000px] px-6 py-8">
        <Link href={`/estudos/${id}`} className="text-[12px]" style={{ color: 'var(--text-3)' }}>
          ← {estudo.nome}
        </Link>
        <h1 className="mt-1 mb-1 text-[22px] font-extrabold">Cadastro de lotes</h1>
        <p className="mb-6 max-w-[640px] text-[13px]" style={{ color: 'var(--text-2)' }}>
          Informe area e fator de cada lote individualmente para o VGV Base ficar exato — o fator captura lotes
          premium (esquina, frente para praca etc.). Sem esse cadastro, a plataforma usa area total x preco medio,
          que e uma aproximacao.
        </p>

        <LotesClient estudoId={id} premissas={estudo.premissas as Premissas} />
      </main>
    </div>
  );
}
