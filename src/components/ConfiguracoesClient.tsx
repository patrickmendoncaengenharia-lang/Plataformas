'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DatasEmpreendimento, Premissas } from '@/lib/calc-engine';
import { mesesEntre, fmtMesAno } from '@/lib/dates';

const hoje = new Date().toISOString().slice(0, 10);

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px]" style={{ color: 'var(--text-2)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {titulo}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default function ConfiguracoesClient({
  estudoId,
  estudo,
  premissas,
}: {
  estudoId: string;
  estudo: { nome: string; cidade: string; estado: string; spe: string; proprietario: string };
  premissas: Premissas;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState(estudo.nome);
  const [cidade, setCidade] = useState(estudo.cidade);
  const [estado, setEstado] = useState(estudo.estado);
  const [spe, setSpe] = useState(estudo.spe);
  const [proprietario, setProprietario] = useState(estudo.proprietario);

  const [valorTerra, setValorTerra] = useState(premissas.valorTerraEconomico);
  const [areaBruta, setAreaBruta] = useState(premissas.areaGleba);
  const [areaLiquida, setAreaLiquida] = useState(premissas.areaVendavel);

  const d0: DatasEmpreendimento = premissas.datas ?? { dataBase: hoje };
  const [datas, setDatas] = useState<DatasEmpreendimento>(d0);

  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function setData(campo: keyof DatasEmpreendimento, valor: string) {
    setDatas((prev) => ({ ...prev, [campo]: valor || undefined }));
  }

  const derivados = useMemo(() => {
    const mesInicioVendas = datas.lancamento ? mesesEntre(datas.dataBase, datas.lancamento) : null;
    const mesInicioObras = datas.inicioObras ? mesesEntre(datas.dataBase, datas.inicioObras) : null;
    const prazoObra =
      datas.inicioObras && datas.entrega ? mesesEntre(datas.inicioObras, datas.entrega) : null;
    return { mesInicioVendas, mesInicioObras, prazoObra };
  }, [datas]);

  const qtdLotesAtual = premissas.lotes && premissas.lotes.length ? premissas.lotes.length : premissas.qtdLotes;

  async function salvar() {
    setSalvando(true);

    const novaPremissas: Premissas = {
      ...premissas,
      valorTerraEconomico: valorTerra,
      areaGleba: areaBruta,
      areaVendavel: areaLiquida,
      datas,
      mesInicioVendas: derivados.mesInicioVendas ?? premissas.mesInicioVendas,
      mesInicioObras: derivados.mesInicioObras ?? premissas.mesInicioObras,
      prazoObra: derivados.prazoObra ?? premissas.prazoObra,
    };

    const { error } = await supabase
      .from('estudos')
      .update({
        nome,
        cidade,
        estado,
        spe,
        proprietario,
        premissas: novaPremissas,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', estudoId);

    setSalvando(false);
    if (!error) {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
      router.refresh();
    }
  }

  const camposData: { key: keyof DatasEmpreendimento; label: string; obrigatorio?: boolean }[] = [
    { key: 'dataBase', label: 'Data-base do estudo', obrigatorio: true },
    { key: 'aquisicaoGleba', label: 'Aquisição da gleba' },
    { key: 'inicioProjetos', label: 'Início dos projetos' },
    { key: 'aprovacao', label: 'Aprovação' },
    { key: 'registro', label: 'Registro' },
    { key: 'inicioObras', label: 'Início das obras' },
    { key: 'lancamento', label: 'Lançamento (início das vendas)' },
    { key: 'entrega', label: 'Entrega' },
    { key: 'encerramento', label: 'Encerramento' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Secao titulo="Identificação">
        <Campo label="Nome do empreendimento">
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo label="Cidade">
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </Campo>
        <Campo label="Estado">
          <input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
        </Campo>
        <Campo label="SPE">
          <input value={spe} onChange={(e) => setSpe(e.target.value)} />
        </Campo>
        <Campo label="Proprietário">
          <input value={proprietario} onChange={(e) => setProprietario(e.target.value)} />
        </Campo>
      </Secao>

      <Secao titulo="Terra e área">
        <Campo label="Valor da terra (R$)">
          <input type="number" value={valorTerra} onChange={(e) => setValorTerra(+e.target.value)} />
        </Campo>
        <Campo label="Área bruta (m²)">
          <input type="number" value={areaBruta} onChange={(e) => setAreaBruta(+e.target.value)} />
        </Campo>
        <Campo label="Área líquida (m²)">
          <input type="number" value={areaLiquida} onChange={(e) => setAreaLiquida(+e.target.value)} />
        </Campo>
        <Campo label="Número de lotes">
          <input value={qtdLotesAtual} disabled className="opacity-70" />
        </Campo>
      </Secao>

      <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
          Datas principais
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {camposData.map((c) => (
            <Campo key={c.key} label={c.label + (c.obrigatorio ? ' *' : '')}>
              <input
                type="date"
                value={datas[c.key] ?? ''}
                onChange={(e) => setData(c.key, e.target.value)}
              />
            </Campo>
          ))}
        </div>

        <div
          className="mt-5 rounded-[10px] p-4 text-[12.5px]"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        >
          <div className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>
            Traduzido para o motor de cálculo
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              Lançamento (início das vendas):{' '}
              <b className="num" style={{ color: 'var(--text)' }}>
                {derivados.mesInicioVendas !== null ? `mês ${derivados.mesInicioVendas}` : '—'}
              </b>
              {datas.lancamento && <div>{fmtMesAno(datas.lancamento)}</div>}
            </div>
            <div>
              Início das obras:{' '}
              <b className="num" style={{ color: 'var(--text)' }}>
                {derivados.mesInicioObras !== null ? `mês ${derivados.mesInicioObras}` : '—'}
              </b>
              {datas.inicioObras && <div>{fmtMesAno(datas.inicioObras)}</div>}
            </div>
            <div>
              Prazo de obra:{' '}
              <b className="num" style={{ color: 'var(--text)' }}>
                {derivados.prazoObra !== null ? `${derivados.prazoObra} meses` : '—'}
              </b>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {salvo && <span className="text-[12.5px]" style={{ color: 'var(--good)' }}>Salvo</span>}
        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {salvando ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
