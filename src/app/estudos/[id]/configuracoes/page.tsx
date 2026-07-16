import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Premissas } from '@/lib/calc-engine';
import TopBar from '@/components/TopBar';
import ConfiguracoesClient from '@/components/ConfiguracoesClient';

export default async function ConfiguracoesPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="mt-1 mb-1 text-[22px] font-extrabold">Configurações do empreendimento</h1>
        <p className="mb-6 max-w-[640px] text-[13px]" style={{ color: 'var(--text-2)' }}>
          Fonte única das informações principais do estudo. As datas aqui alimentam automaticamente o cronograma, o
          fluxo de caixa e todos os indicadores — não é preciso editar meses relativos em nenhuma outra aba.
        </p>

        <ConfiguracoesClient
          estudoId={id}
          estudo={{
            nome: estudo.nome,
            cidade: estudo.cidade ?? '',
            estado: estudo.estado ?? '',
            spe: estudo.spe ?? '',
            proprietario: estudo.proprietario ?? '',
            responsavel_nome: estudo.responsavel_nome ?? '',
            responsavel_crea: estudo.responsavel_crea ?? '',
            tipo_empreendimento: estudo.tipo_empreendimento ?? 'loteamento',
            finalidade: estudo.finalidade ?? 'residencial',
          }}
          premissas={estudo.premissas as Premissas}
        />
      </main>
    </div>
  );
}
