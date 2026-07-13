'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DatasEmpreendimento, Premissas } from '@/lib/calc-engine';
import { mesesEntre, fmtMesAno } from '@/lib/dates';

const hoje = new Date().toISOString().slice(0, 10);

// Converte fracao (0-1) pra percentual (0-100) pra exibicao, arredondando pra
// nao mostrar ruido de ponto flutuante (0.1508*100 = 15.079999999999998).
const paraPct = (v: number) => Math.round(v * 100 * 10000) / 10000;

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

function Secao({ titulo, desc, children }: { titulo: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
        {titulo}
      </h2>
      {desc && (
        <p className="mb-4 mt-0.5 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
          {desc}
        </p>
      )}
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${desc ? '' : 'mt-4'}`}>{children}</div>
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
  const [precoBase, setPrecoBase] = useState(premissas.precoBase);

  // Comercial e financiamento — armazenados como % (0-100) na tela, convertidos
  // para fração (0-1) apenas ao salvar.
  const [mixAvista, setMixAvista] = useState(paraPct(premissas.mix.avista));
  const [mixCurta, setMixCurta] = useState(paraPct(premissas.mix.curta));
  const mixLonga = Math.max(0, 100 - mixAvista - mixCurta);
  const [descontoAvista, setDescontoAvista] = useState(paraPct(premissas.descontoAvista));
  const [entrada, setEntrada] = useState(paraPct(premissas.entrada));
  const [parcelasEntrada, setParcelasEntrada] = useState(premissas.parcelasEntrada);
  const [prazoCurta, setPrazoCurta] = useState(premissas.prazoCurta);
  const [prazoLonga, setPrazoLonga] = useState(premissas.prazoLonga);
  const [jurosPrice, setJurosPrice] = useState(paraPct(premissas.jurosPrice));
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<'price' | 'sac'>(
    premissas.sistemaAmortizacao ?? 'price'
  );
  const [tma, setTma] = useState(paraPct(premissas.tma));

  // Despesas variaveis (% sobre receita ou custo direto, conforme o motor).
  const [pctComissao, setPctComissao] = useState(paraPct(premissas.pctComissao));
  const [pctMarketing, setPctMarketing] = useState(paraPct(premissas.pctMarketing));
  const [pctImpostos, setPctImpostos] = useState(paraPct(premissas.pctImpostos));
  const [pctGestaoCarteira, setPctGestaoCarteira] = useState(paraPct(premissas.pctGestaoCarteira));
  const [pctInad, setPctInad] = useState(paraPct(premissas.pctInad));
  const [pctDistrato, setPctDistrato] = useState(paraPct(premissas.pctDistrato));
  const [pctAdmin, setPctAdmin] = useState(paraPct(premissas.pctAdmin));
  const [pctConting, setPctConting] = useState(paraPct(premissas.pctConting));

  // Custos fixos (R$, nao percentuais).
  const [custoProjetos, setCustoProjetos] = useState(premissas.custoProjetos);
  const [custoComercial, setCustoComercial] = useState(premissas.custoComercial);
  const [custoJuridico, setCustoJuridico] = useState(premissas.custoJuridico);

  const d0: DatasEmpreendimento = premissas.datas ?? { dataBase: hoje };
  const [datas, setDatas] = useState<DatasEmpreendimento>(d0);

  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const mixValido = Math.abs(mixAvista + mixCurta + mixLonga - 100) < 0.05 && mixAvista + mixCurta <= 100.001;

  async function salvar() {
    if (mixAvista + mixCurta > 100.001) {
      setErro('À vista + tabela curta não pode passar de 100% (tabela longa ficaria negativa).');
      return;
    }
    setErro(null);
    setSalvando(true);

    const novaPremissas: Premissas = {
      ...premissas,
      valorTerraEconomico: valorTerra,
      areaGleba: areaBruta,
      areaVendavel: areaLiquida,
      precoBase,
      mix: { avista: mixAvista / 100, curta: mixCurta / 100, longa: mixLonga / 100 },
      descontoAvista: descontoAvista / 100,
      entrada: entrada / 100,
      parcelasEntrada,
      prazoCurta,
      prazoLonga,
      jurosPrice: jurosPrice / 100,
      sistemaAmortizacao,
      tma: tma / 100,
      pctComissao: pctComissao / 100,
      pctMarketing: pctMarketing / 100,
      pctImpostos: pctImpostos / 100,
      pctGestaoCarteira: pctGestaoCarteira / 100,
      pctInad: pctInad / 100,
      pctDistrato: pctDistrato / 100,
      pctAdmin: pctAdmin / 100,
      pctConting: pctConting / 100,
      custoProjetos,
      custoComercial,
      custoJuridico,
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
    if (error) {
      setErro(error.message);
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
    router.refresh();
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

      <Secao titulo="Terra, área e preço">
        <Campo label="Valor da terra (R$)">
          <input type="number" value={valorTerra} onChange={(e) => setValorTerra(+e.target.value)} />
        </Campo>
        <Campo label="Área bruta (m²)">
          <input type="number" value={areaBruta} onChange={(e) => setAreaBruta(+e.target.value)} />
        </Campo>
        <Campo label="Área líquida (m²)">
          <input type="number" value={areaLiquida} onChange={(e) => setAreaLiquida(+e.target.value)} />
        </Campo>
        <Campo label="Preço base (R$/m²)">
          <input type="number" value={precoBase} onChange={(e) => setPrecoBase(+e.target.value)} />
        </Campo>
        <Campo label="Número de lotes">
          <input value={qtdLotesAtual} disabled className="opacity-70" />
        </Campo>
      </Secao>

      <Secao
        titulo="Comercial e financiamento"
        desc="Mix de vendas, prazos das tabelas, sistema de amortização e taxas."
      >
        <Campo label="À vista (%)">
          <input type="number" step="0.1" value={mixAvista} onChange={(e) => setMixAvista(+e.target.value)} />
        </Campo>
        <Campo label="Tabela curta (%)">
          <input type="number" step="0.1" value={mixCurta} onChange={(e) => setMixCurta(+e.target.value)} />
        </Campo>
        <Campo label="Tabela longa (%) — calculado">
          <input value={mixLonga.toFixed(1)} disabled className="opacity-70" />
        </Campo>
        <Campo label="Desconto à vista (%)">
          <input type="number" step="0.1" value={descontoAvista} onChange={(e) => setDescontoAvista(+e.target.value)} />
        </Campo>
        <Campo label="Entrada mínima (%)">
          <input type="number" step="0.1" value={entrada} onChange={(e) => setEntrada(+e.target.value)} />
        </Campo>
        <Campo label="Parcelas da entrada (qtd)">
          <input type="number" value={parcelasEntrada} onChange={(e) => setParcelasEntrada(+e.target.value)} />
        </Campo>
        <Campo label="Prazo tabela curta (meses)">
          <input type="number" value={prazoCurta} onChange={(e) => setPrazoCurta(+e.target.value)} />
        </Campo>
        <Campo label="Prazo tabela longa (meses)">
          <input type="number" value={prazoLonga} onChange={(e) => setPrazoLonga(+e.target.value)} />
        </Campo>
        <Campo label="Sistema de amortização">
          <select value={sistemaAmortizacao} onChange={(e) => setSistemaAmortizacao(e.target.value as 'price' | 'sac')}>
            <option value="price">Price (parcelas fixas)</option>
            <option value="sac">SAC (parcelas decrescentes)</option>
          </select>
        </Campo>
        <Campo label="Juros do financiamento (% a.m.)">
          <input type="number" step="0.01" value={jurosPrice} onChange={(e) => setJurosPrice(+e.target.value)} />
        </Campo>
        <Campo label="TMA (% a.a.)">
          <input type="number" step="0.1" value={tma} onChange={(e) => setTma(+e.target.value)} />
        </Campo>
        {!mixValido && (
          <div className="col-span-full text-[11.5px]" style={{ color: 'var(--crit)' }}>
            À vista + tabela curta + tabela longa deve somar 100% — ajuste os campos acima.
          </div>
        )}
      </Secao>

      <Secao titulo="Despesas variáveis (%)" desc="Percentuais aplicados sobre a receita ou o custo direto pelo motor de cálculo.">
        <Campo label="Comissão (% da receita)">
          <input type="number" step="0.1" value={pctComissao} onChange={(e) => setPctComissao(+e.target.value)} />
        </Campo>
        <Campo label="Marketing (% da receita)">
          <input type="number" step="0.1" value={pctMarketing} onChange={(e) => setPctMarketing(+e.target.value)} />
        </Campo>
        <Campo label="Impostos/tributos (% da receita)">
          <input type="number" step="0.01" value={pctImpostos} onChange={(e) => setPctImpostos(+e.target.value)} />
        </Campo>
        <Campo label="Gestão de carteira (% da receita)">
          <input type="number" step="0.1" value={pctGestaoCarteira} onChange={(e) => setPctGestaoCarteira(+e.target.value)} />
        </Campo>
        <Campo label="Inadimplência (% da receita)">
          <input type="number" step="0.1" value={pctInad} onChange={(e) => setPctInad(+e.target.value)} />
        </Campo>
        <Campo label="Distrato (% da receita)">
          <input type="number" step="0.1" value={pctDistrato} onChange={(e) => setPctDistrato(+e.target.value)} />
        </Campo>
        <Campo label="Administração (% do custo direto)">
          <input type="number" step="0.1" value={pctAdmin} onChange={(e) => setPctAdmin(+e.target.value)} />
        </Campo>
        <Campo label="Contingência (% do custo direto)">
          <input type="number" step="0.1" value={pctConting} onChange={(e) => setPctConting(+e.target.value)} />
        </Campo>
      </Secao>

      <Secao titulo="Custos fixos (R$)">
        <Campo label="Projetos, aprovação e registro">
          <input type="number" value={custoProjetos} onChange={(e) => setCustoProjetos(+e.target.value)} />
        </Campo>
        <Campo label="Estrutura comercial">
          <input type="number" value={custoComercial} onChange={(e) => setCustoComercial(+e.target.value)} />
        </Campo>
        <Campo label="Jurídico">
          <input type="number" value={custoJuridico} onChange={(e) => setCustoJuridico(+e.target.value)} />
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
        {erro && <span className="text-[12.5px]" style={{ color: 'var(--crit)' }}>{erro}</span>}
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
