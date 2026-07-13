'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CompartilharDashboard({
  estudoId,
  publicToken,
  publicoHabilitadoInicial,
}: {
  estudoId: string;
  publicToken: string;
  publicoHabilitadoInicial: boolean;
}) {
  const supabase = createClient();
  const [habilitado, setHabilitado] = useState(publicoHabilitadoInicial);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function copiarLink() {
    setErro(null);
    setCarregando(true);
    if (!habilitado) {
      const { error } = await supabase.from('estudos').update({ publico_habilitado: true }).eq('id', estudoId);
      if (error) {
        setCarregando(false);
        setErro(error.message);
        return;
      }
      setHabilitado(true);
    }
    const url = `${window.location.origin}/publico/${publicToken}`;
    await navigator.clipboard.writeText(url);
    setCarregando(false);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function desativar() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.from('estudos').update({ publico_habilitado: false }).eq('id', estudoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setHabilitado(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={copiarLink}
          disabled={carregando}
          className="flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold disabled:opacity-60"
          style={
            copiado
              ? { background: 'var(--good-soft)', color: 'var(--good)' }
              : { background: 'var(--accent)', color: '#fff' }
          }
        >
          {copiado ? 'Link copiado ✓' : habilitado ? 'Copiar link de visualização' : 'Gerar link de visualização'}
        </button>
        {habilitado && (
          <button
            onClick={desativar}
            disabled={carregando}
            className="rounded-[10px] px-3 py-2 text-[12px]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            Desativar link
          </button>
        )}
      </div>
      {erro && <span style={{ color: 'var(--crit)' }} className="text-[11.5px]">{erro}</span>}
      <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
        {habilitado
          ? 'Ativo — qualquer pessoa com o link acessa uma versão só de visualização, sem login.'
          : 'Gera um link para o cliente visualizar o dashboard, sem editar nada.'}
      </span>
    </div>
  );
}
