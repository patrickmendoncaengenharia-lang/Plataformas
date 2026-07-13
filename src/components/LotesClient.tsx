'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Lote, Premissas } from '@/lib/calc-engine';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

export default function LotesClient({ estudoId, premissas }: { estudoId: string; premissas: Premissas }) {
  const supabase = createClient();
  const [lotes, setLotes] = useState<Lote[]>(
    premissas.lotes && premissas.lotes.length
      ? premissas.lotes
      : []
  );
  const [colar, setColar] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const areaTotal = useMemo(() => lotes.reduce((a, l) => a + l.area, 0), [lotes]);
  const vgvBasePreview = useMemo(
    () => lotes.reduce((a, l) => a + l.area * premissas.precoBase * l.fator, 0),
    [lotes, premissas.precoBase]
  );

  function addLinha() {
    setLotes((prev) => [...prev, { numero: prev.length + 1, area: 0, fator: 1 }]);
  }

  function removerLinha(i: number) {
    setLotes((prev) => prev.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, numero: idx + 1 })));
  }

  function atualizarCampo(i: number, campo: 'area' | 'fator', valor: number) {
    setLotes((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }

  function importarColado() {
    const linhas = colar
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const novos: Lote[] = linhas.map((linha, i) => {
      const partes = linha.split(/[,;\t]/).map((p) => parseFloat(p.trim().replace(',', '.')));
      return { numero: i + 1, area: partes[0] || 0, fator: partes[1] || 1 };
    });
    setLotes(novos);
    setColar('');
  }

  async function salvar() {
    setSalvando(true);
    const novaPremissas: Premissas = { ...premissas, lotes, qtdLotes: lotes.length };
    const { error } = await supabase
      .from('estudos')
      .update({ premissas: novaPremissas, atualizado_em: new Date().toISOString() })
      .eq('id', estudoId);
    setSalvando(false);
    if (!error) {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="mb-1 text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Lotes cadastrados
          </div>
          <div className="num text-[19px] font-extrabold">{lotes.length}</div>
        </div>
        <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="mb-1 text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            Area total
          </div>
          <div className="num text-[19px] font-extrabold">{areaTotal.toFixed(2)} m²</div>
        </div>
        <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="mb-1 text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
            VGV Base (preview)
          </div>
          <div className="num text-[19px] font-extrabold">{BRL(vgvBasePreview)}</div>
        </div>
      </div>

      <div className="rounded-[16px] border p-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
        <label className="mb-2 block text-[12px]" style={{ color: 'var(--text-2)' }}>
          Colar em lote — uma linha por lote, formato <span className="num">area,fator</span> (fator opcional, padrao 1)
        </label>
        <textarea
          rows={4}
          value={colar}
          onChange={(e) => setColar(e.target.value)}
          placeholder={'172.74,1\n179.88,1\n179.82,1.12'}
          className="w-full font-mono text-[12px]"
        />
        <button
          onClick={importarColado}
          disabled={!colar.trim()}
          className="mt-2 rounded-[8px] border px-3 py-1.5 text-[12px] disabled:opacity-50"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          Importar e substituir lista
        </button>
      </div>

      <div className="overflow-x-auto rounded-[16px] border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th className="px-3 py-2 text-left" style={{ color: 'var(--text-2)' }}>
                Lote
              </th>
              <th className="px-3 py-2 text-right" style={{ color: 'var(--text-2)' }}>
                Area (m²)
              </th>
              <th className="px-3 py-2 text-right" style={{ color: 'var(--text-2)' }}>
                Fator
              </th>
              <th className="px-3 py-2 text-right" style={{ color: 'var(--text-2)' }}>
                Valor (R$)
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((l, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-3 py-1.5 num">{l.numero}</td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={l.area}
                    onChange={(e) => atualizarCampo(i, 'area', +e.target.value)}
                    className="w-full text-right"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={l.fator}
                    onChange={(e) => atualizarCampo(i, 'fator', +e.target.value)}
                    className="w-full text-right"
                  />
                </td>
                <td className="px-3 py-1.5 text-right num">{BRL(l.area * premissas.precoBase * l.fator)}</td>
                <td className="px-2 py-1 text-right">
                  <button onClick={() => removerLinha(i)} style={{ color: 'var(--crit)' }} className="text-[12px]">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {lotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[13px]" style={{ color: 'var(--text-2)' }}>
                  Nenhum lote cadastrado — adicione manualmente ou cole a lista acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={addLinha}
          className="rounded-[10px] border px-4 py-2 text-[13px]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          + Adicionar lote
        </button>
        <div className="flex items-center gap-3">
          {salvo && <span className="text-[12.5px]" style={{ color: 'var(--good)' }}>Salvo</span>}
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {salvando ? 'Salvando…' : 'Salvar lotes'}
          </button>
        </div>
      </div>
    </div>
  );
}
