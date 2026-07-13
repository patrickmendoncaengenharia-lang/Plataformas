'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Premissas } from '@/lib/calc-engine';

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

type Etapa = { nome: string; custos: number[] };

function redistribuir(total: number, prazo: number): number[] {
  return new Array(prazo).fill(total / Math.max(1, prazo));
}

function ajustarComprimento(arr: number[], prazo: number): number[] {
  const novo = arr.slice(0, prazo);
  while (novo.length < prazo) novo.push(0);
  return novo;
}

export default function ObrasClient({ estudoId, premissas }: { estudoId: string; premissas: Premissas }) {
  const supabase = createClient();
  const [prazo, setPrazo] = useState(premissas.prazoObra || 12);
  const [modo, setModo] = useState<'simples' | 'detalhado'>(
    premissas.cronogramaEtapas && premissas.cronogramaEtapas.length ? 'detalhado' : 'simples'
  );
  const custoInicialSimples = Math.round(premissas.cronogramaObra?.reduce((a, b) => a + b, 0) || 0);
  const [custoSimples, setCustoSimples] = useState(custoInicialSimples);
  const [etapas, setEtapas] = useState<Etapa[]>(
    premissas.cronogramaEtapas && premissas.cronogramaEtapas.length
      ? premissas.cronogramaEtapas.map((e) => ({ nome: e.nome, custos: ajustarComprimento(e.custos, premissas.prazoObra || 12) }))
      : [{ nome: 'Terraplenagem', custos: new Array(premissas.prazoObra || 12).fill(0) }]
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function mudarPrazo(novoPrazo: number) {
    if (novoPrazo < 1) return;
    setPrazo(novoPrazo);
    setEtapas((prev) => prev.map((e) => ({ ...e, custos: ajustarComprimento(e.custos, novoPrazo) })));
  }

  function addEtapa() {
    setEtapas((prev) => [...prev, { nome: 'Nova etapa', custos: new Array(prazo).fill(0) }]);
  }

  function removerEtapa(i: number) {
    setEtapas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function renomear(i: number, nome: string) {
    setEtapas((prev) => prev.map((e, idx) => (idx === i ? { ...e, nome } : e)));
  }

  function editarCelula(i: number, mes: number, valor: number) {
    setEtapas((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, custos: e.custos.map((v, m) => (m === mes ? valor : v)) } : e))
    );
  }

  // Lanca um custo pontual (etapa + mes + valor), somando ao que ja existir naquela
  // celula — cria a etapa se ainda nao existir. Usado pelo lancamento rapido e pela
  // importacao em lote; edicao direta na tabela continua definindo o valor exato.
  function lancarCusto(nomeEtapa: string, mes1based: number, valor: number) {
    const mes = mes1based - 1;
    if (mes < 0 || mes >= prazo || !nomeEtapa.trim() || !valor) return;
    setEtapas((prev) => {
      const idx = prev.findIndex((e) => e.nome.trim().toLowerCase() === nomeEtapa.trim().toLowerCase());
      if (idx === -1) {
        const custos = new Array(prazo).fill(0);
        custos[mes] = valor;
        return [...prev, { nome: nomeEtapa.trim(), custos }];
      }
      return prev.map((e, i) =>
        i === idx ? { ...e, custos: e.custos.map((v, m) => (m === mes ? v + valor : v)) } : e
      );
    });
  }

  const [novaEtapaNome, setNovaEtapaNome] = useState('');
  const [novoMes, setNovoMes] = useState(1);
  const [novoValor, setNovoValor] = useState(0);
  const [colarObras, setColarObras] = useState('');

  function adicionarLancamento() {
    lancarCusto(novaEtapaNome, novoMes, novoValor);
    setNovaEtapaNome('');
    setNovoValor(0);
  }

  function importarColado() {
    const linhas = colarObras
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    linhas.forEach((linha) => {
      const partes = linha.split(/[,;\t]/).map((p) => p.trim());
      if (partes.length < 3) return;
      const [nome, mesStr, valorStr] = partes;
      const mes = parseInt(mesStr.replace(',', '.'), 10);
      const valor = parseFloat(valorStr.replace(',', '.'));
      if (nome && mes && valor) lancarCusto(nome, mes, valor);
    });
    setColarObras('');
  }

  const totalPorEtapa = useMemo(() => etapas.map((e) => e.custos.reduce((a, b) => a + b, 0)), [etapas]);
  const totalPorMes = useMemo(
    () => new Array(prazo).fill(0).map((_, m) => etapas.reduce((a, e) => a + (e.custos[m] || 0), 0)),
    [etapas, prazo]
  );
  const totalGeral = totalPorEtapa.reduce((a, b) => a + b, 0);

  async function salvar() {
    setSalvando(true);
    const novaPremissas: Premissas =
      modo === 'simples'
        ? {
            ...premissas,
            prazoObra: prazo,
            cronogramaObra: redistribuir(custoSimples, prazo),
            cronogramaEtapas: undefined,
          }
        : {
            ...premissas,
            prazoObra: prazo,
            cronogramaEtapas: etapas,
          };

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
      <div className="flex flex-wrap items-center gap-4 rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <label className="mb-1 block text-[12px]" style={{ color: 'var(--text-2)' }}>
            Prazo de obra (meses)
          </label>
          <input type="number" min={1} value={prazo} onChange={(e) => mudarPrazo(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div className="flex gap-1 rounded-[10px] p-1" style={{ background: 'var(--surface-2)' }}>
          <button
            onClick={() => setModo('simples')}
            className="rounded-[8px] px-4 py-2 text-[13px] font-semibold"
            style={modo === 'simples' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-2)' }}
          >
            Simples
          </button>
          <button
            onClick={() => setModo('detalhado')}
            className="rounded-[8px] px-4 py-2 text-[13px] font-semibold"
            style={modo === 'detalhado' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-2)' }}
          >
            Detalhado
          </button>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px]" style={{ color: 'var(--text-2)' }}>
            Total da obra
          </div>
          <div className="num text-[19px] font-extrabold">
            {BRL(modo === 'simples' ? custoSimples : totalGeral)}
          </div>
        </div>
      </div>

      {modo === 'simples' ? (
        <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <label className="mb-1 block text-[12px]" style={{ color: 'var(--text-2)' }}>
            Custo total de infraestrutura (R$)
          </label>
          <input type="number" value={custoSimples} onChange={(e) => setCustoSimples(+e.target.value)} style={{ width: 260 }} />
          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
            Distribuído automaticamente em partes iguais ao longo dos {prazo} meses.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="mb-3 text-[13px] font-bold">Lançamento rápido</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                  Etapa / serviço
                </label>
                <input
                  list="etapas-existentes"
                  value={novaEtapaNome}
                  onChange={(e) => setNovaEtapaNome(e.target.value)}
                  placeholder="Ex.: Drenagem"
                  style={{ width: 200 }}
                />
                <datalist id="etapas-existentes">
                  {etapas.map((e, i) => (
                    <option key={i} value={e.nome} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                  Mês
                </label>
                <input
                  type="number"
                  min={1}
                  max={prazo}
                  value={novoMes}
                  onChange={(e) => setNovoMes(+e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                  Valor (R$)
                </label>
                <input type="number" value={novoValor} onChange={(e) => setNovoValor(+e.target.value)} style={{ width: 160 }} />
              </div>
              <button
                onClick={adicionarLancamento}
                disabled={!novaEtapaNome.trim() || !novoValor}
                className="rounded-[10px] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                + Lançar
              </button>
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
              Se a etapa já existir, o valor soma ao que já está lançado naquele mês. Se não existir, cria a etapa.
            </p>

            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <label className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                Ou importar em lote — uma linha por lançamento, formato <span className="num">etapa,mês,valor</span>
              </label>
              <textarea
                rows={3}
                value={colarObras}
                onChange={(e) => setColarObras(e.target.value)}
                placeholder={'Exemplo (cole o seu no lugar):\nTerraplenagem,1,74000\nDrenagem,3,52825'}
                className="w-full font-mono text-[12px]"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={importarColado}
                  disabled={!colarObras.trim()}
                  className="rounded-[8px] border px-3 py-1.5 text-[12px] disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                >
                  Importar lançamentos
                </button>
                <span className="text-[11.5px]" style={{ color: colarObras.trim() ? 'var(--good)' : 'var(--text-3)' }}>
                  {colarObras.trim()
                    ? `${colarObras.trim().split('\n').filter(Boolean).length} linha(s) prontas para importar`
                    : 'Caixa vazia — nada para importar ainda'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[16px] border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-max text-[12px]">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 px-3 py-2 text-left"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                  >
                    Etapa
                  </th>
                  {new Array(prazo).fill(0).map((_, m) => (
                    <th key={m} className="px-2 py-2 text-right" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', minWidth: 64 }}>
                      Mês {m + 1}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    Total
                  </th>
                  <th style={{ background: 'var(--surface-2)' }}></th>
                </tr>
              </thead>
              <tbody>
                {etapas.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="sticky left-0" style={{ background: 'var(--surface)' }}>
                      <input
                        value={e.nome}
                        onChange={(ev) => renomear(i, ev.target.value)}
                        style={{ width: 160, border: 'none', background: 'transparent' }}
                      />
                    </td>
                    {e.custos.map((v, m) => (
                      <td key={m} className="px-0.5">
                        <input
                          type="number"
                          value={v}
                          onChange={(ev) => editarCelula(i, m, +ev.target.value)}
                          className="w-full text-right"
                          style={{ border: 'none', background: 'transparent', minWidth: 64 }}
                        />
                      </td>
                    ))}
                    <td className="px-3 text-right num font-semibold">{BRL(totalPorEtapa[i])}</td>
                    <td className="px-2 text-right">
                      <button onClick={() => removerEtapa(i)} className="text-[11.5px]" style={{ color: 'var(--crit)' }}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <td className="sticky left-0 px-3 py-2 font-semibold" style={{ background: 'var(--surface-2)' }}>
                    Total mensal
                  </td>
                  {totalPorMes.map((v, m) => (
                    <td key={m} className="px-2 py-2 text-right num">
                      {BRL(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right num font-bold">{BRL(totalGeral)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            onClick={addEtapa}
            className="w-fit rounded-[10px] border px-4 py-2 text-[13px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
          >
            + Adicionar etapa
          </button>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {salvo && <span className="text-[12.5px]" style={{ color: 'var(--good)' }}>Salvo</span>}
        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {salvando ? 'Salvando…' : 'Salvar cronograma'}
        </button>
      </div>
    </div>
  );
}
