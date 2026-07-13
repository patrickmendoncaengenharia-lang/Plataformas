'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  buildModel,
  CENARIO_BASE,
  calcularTodosParticipantes,
  type Premissas,
  type Participante,
} from '@/lib/calc-engine';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const PCT = (v: number) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

const TIPO_LABEL: Record<Participante['tipo'], string> = {
  terrenista: 'Terrenista',
  loteador: 'Loteador',
  investidor: 'Investidor',
  outro: 'Outro',
};

type ParticipanteRow = Participante & { id: string; estudo_id?: string };

function vazio(): Omit<ParticipanteRow, 'id'> {
  return {
    tipo: 'investidor',
    nome: '',
    percentualParticipacao: 0,
    valorIntegralizado: 0,
    formaParticipacao: 'dinheiro',
    percentualLucro: 0,
    timingAporte: 'mes_0',
    timingRecebimento: 'mensal',
  } as Omit<ParticipanteRow, 'id'>;
}

function fromDbRow(row: Record<string, unknown>): ParticipanteRow {
  return {
    id: row.id as string,
    tipo: row.tipo as Participante['tipo'],
    nome: row.nome as string,
    percentualParticipacao: Number(row.percentual_participacao),
    valorIntegralizado: Number(row.valor_integralizado),
    formaParticipacao: row.forma_participacao as Participante['formaParticipacao'],
    percentualLucro: Number(row.percentual_lucro),
    timingAporte: row.timing_aporte as Participante['timingAporte'],
    timingRecebimento: row.timing_recebimento as Participante['timingRecebimento'],
    tma: row.tma != null ? Number(row.tma) : undefined,
  };
}

function toDbRow(p: ParticipanteRow, estudoId: string, ordem: number) {
  return {
    estudo_id: estudoId,
    tipo: p.tipo,
    nome: p.nome,
    percentual_participacao: p.percentualParticipacao,
    valor_integralizado: p.valorIntegralizado,
    forma_participacao: p.formaParticipacao,
    percentual_lucro: p.percentualLucro,
    timing_aporte: p.timingAporte,
    timing_recebimento: p.timingRecebimento,
    tma: p.tma ?? null,
    ordem,
  };
}

export default function ParceriasClient({
  estudoId,
  premissas,
  participantesIniciais,
}: {
  estudoId: string;
  premissas: Premissas;
  participantesIniciais: Record<string, unknown>[];
}) {
  const supabase = createClient();
  const [participantes, setParticipantes] = useState<ParticipanteRow[]>(
    participantesIniciais.map(fromDbRow)
  );
  const [editando, setEditando] = useState<ParticipanteRow | (Omit<ParticipanteRow, 'id'> & { id?: undefined }) | null>(
    null
  );
  const [salvando, setSalvando] = useState(false);

  const model = useMemo(() => buildModel(premissas, CENARIO_BASE), [premissas]);
  const indicadores = useMemo(
    () => calcularTodosParticipantes(participantes, premissas, model),
    [participantes, premissas, model]
  );

  const somaParticipacao = participantes.reduce((a, p) => a + p.percentualParticipacao, 0);
  const somaLucro = participantes.reduce((a, p) => a + p.percentualLucro, 0);

  async function salvar(p: ParticipanteRow | Omit<ParticipanteRow, 'id'>) {
    setSalvando(true);
    const ordem = 'id' in p && p.id ? participantes.findIndex((x) => x.id === p.id) : participantes.length;
    const row = toDbRow(p as ParticipanteRow, estudoId, ordem < 0 ? participantes.length : ordem);

    if ('id' in p && p.id) {
      const { error } = await supabase.from('participantes').update(row).eq('id', p.id);
      if (!error) {
        setParticipantes((prev) => prev.map((x) => (x.id === p.id ? (p as ParticipanteRow) : x)));
      }
    } else {
      const { data, error } = await supabase.from('participantes').insert(row).select('id').single();
      if (!error && data) {
        setParticipantes((prev) => [...prev, { ...(p as Omit<ParticipanteRow, 'id'>), id: data.id }]);
      }
    }
    setSalvando(false);
    setEditando(null);
  }

  async function remover(id: string) {
    await supabase.from('participantes').delete().eq('id', id);
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKpi label="TIR global do projeto" value={PCT(model.tirAnual)} />
        <MiniKpi label="VPL do projeto" value={BRL(model.vpl)} />
        <MiniKpi
          label="Soma % participacao"
          value={somaParticipacao.toFixed(1) + '%'}
          alerta={Math.round(somaParticipacao) !== 100 && participantes.length > 0}
        />
        <MiniKpi
          label="Soma % lucro"
          value={somaLucro.toFixed(1) + '%'}
          alerta={Math.round(somaLucro) !== 100 && participantes.length > 0}
        />
      </div>

      <div className="flex flex-col gap-4">
        {indicadores.map((ind) => {
          const p = participantes.find((x) => x.id === ind.participanteId)!;
          return (
            <div
              key={ind.participanteId}
              className="rounded-[16px] border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span
                    className="mr-2 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {TIPO_LABEL[ind.tipo]}
                  </span>
                  <span className="text-[15px] font-bold">{ind.nome}</span>
                  <span className="ml-2 text-[12px]" style={{ color: 'var(--text-3)' }}>
                    {p.percentualParticipacao}% participacao · {p.percentualLucro}% do lucro
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditando(p)}
                    className="rounded-[8px] border px-3 py-1.5 text-[12px]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remover(ind.participanteId)}
                    className="rounded-[8px] border px-3 py-1.5 text-[12px]"
                    style={{ borderColor: 'var(--border)', color: 'var(--crit)' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                <Stat label="TIR anual" value={PCT(ind.tirAnual)} />
                <Stat label="VPL" value={BRL(ind.vpl)} />
                <Stat label="Lucro" value={BRL(ind.lucro)} />
                <Stat label="Capital investido" value={BRL(ind.capitalInvestido)} />
                <Stat label="MOIC" value={ind.moic.toFixed(2) + 'x'} />
                <Stat label="ROIC" value={PCT(ind.roic)} />
              </div>
            </div>
          );
        })}

        {participantes.length === 0 && (
          <div
            className="rounded-[16px] border border-dashed p-8 text-center text-[13px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
          >
            Nenhum participante cadastrado ainda. Adicione o terrenista, o loteador, investidores ou outros socios.
          </div>
        )}

        <button
          onClick={() => setEditando(vazio())}
          className="self-start rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          + Adicionar participante
        </button>
      </div>

      {editando && (
        <FormParticipante
          inicial={editando}
          salvando={salvando}
          onCancelar={() => setEditando(null)}
          onSalvar={salvar}
        />
      )}
    </div>
  );
}

function MiniKpi({ label, value, alerta }: { label: string; value: string; alerta?: boolean }) {
  return (
    <div
      className="rounded-[16px] border p-4"
      style={{
        background: 'var(--surface)',
        borderColor: alerta ? 'var(--warn)' : 'var(--border)',
      }}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {label}
      </div>
      <div className="num text-[18px] font-extrabold" style={alerta ? { color: 'var(--warn)' } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>
      <div className="num text-[14px] font-bold">{value}</div>
    </div>
  );
}

function FormParticipante({
  inicial,
  salvando,
  onCancelar,
  onSalvar,
}: {
  inicial: ParticipanteRow | Omit<ParticipanteRow, 'id'>;
  salvando: boolean;
  onCancelar: () => void;
  onSalvar: (p: ParticipanteRow | Omit<ParticipanteRow, 'id'>) => void;
}) {
  const [form, setForm] = useState(inicial);

  return (
    <div
      className="rounded-[16px] border p-5"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}
    >
      <h3 className="mb-4 text-[13.5px] font-bold">
        {'id' in form && form.id ? 'Editar participante' : 'Novo participante'}
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Tipo
          </label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Participante['tipo'] })}>
            <option value="terrenista">Terrenista</option>
            <option value="loteador">Loteador</option>
            <option value="investidor">Investidor</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Nome
          </label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            % de participacao
          </label>
          <input
            type="number"
            value={form.percentualParticipacao}
            onChange={(e) => setForm({ ...form, percentualParticipacao: +e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            % do lucro
          </label>
          <input
            type="number"
            value={form.percentualLucro}
            onChange={(e) => setForm({ ...form, percentualLucro: +e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Valor integralizado (R$)
          </label>
          <input
            type="number"
            value={form.valorIntegralizado}
            onChange={(e) => setForm({ ...form, valorIntegralizado: +e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Forma de participacao
          </label>
          <select
            value={form.formaParticipacao}
            onChange={(e) => setForm({ ...form, formaParticipacao: e.target.value as Participante['formaParticipacao'] })}
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="permuta">Permuta (terreno)</option>
            <option value="servico">Prestacao de servico</option>
            <option value="misto">Misto</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Quando aporta
          </label>
          <select
            value={form.timingAporte}
            onChange={(e) => setForm({ ...form, timingAporte: e.target.value as Participante['timingAporte'] })}
          >
            <option value="mes_0">A vista, no mes 0</option>
            <option value="parcelado">Parcelado durante a obra</option>
            <option value="conforme_cronograma">Conforme cronograma de custos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            Quando recebe
          </label>
          <select
            value={form.timingRecebimento}
            onChange={(e) => setForm({ ...form, timingRecebimento: e.target.value as Participante['timingRecebimento'] })}
          >
            <option value="mensal">Mensal, conforme caixa gerado</option>
            <option value="no_final">Tudo no final do projeto</option>
            <option value="conforme_distribuicao">Conforme politica de distribuicao</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            TMA especifica (opcional, % a.a.)
          </label>
          <input
            type="number"
            value={form.tma != null ? form.tma * 100 : ''}
            placeholder="usa a TMA do estudo"
            onChange={(e) => setForm({ ...form, tma: e.target.value ? +e.target.value / 100 : undefined })}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onCancelar}
          className="rounded-[10px] border px-4 py-2.5 text-[13px]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onSalvar(form)}
          disabled={salvando || !form.nome}
          className="rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {salvando ? 'Salvando…' : 'Salvar participante'}
        </button>
      </div>
    </div>
  );
}
