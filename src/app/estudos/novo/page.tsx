'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Premissas } from '@/lib/calc-engine';

const campoCls = 'flex flex-col gap-1';
const labelCls = 'text-[12px]';

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

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={campoCls}>
      <label className={labelCls} style={{ color: 'var(--text-2)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function NovoEstudoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [spe, setSpe] = useState('');
  const [proprietario, setProprietario] = useState('');

  const [areaGleba, setAreaGleba] = useState(0);
  const [areaVendavel, setAreaVendavel] = useState(0);
  const [qtdLotes, setQtdLotes] = useState(0);
  const [precoBase, setPrecoBase] = useState(0);

  const [mixAvista, setMixAvista] = useState(10);
  const [mixCurta, setMixCurta] = useState(15);
  const [mixLonga, setMixLonga] = useState(75);
  const [descontoAvista, setDescontoAvista] = useState(5);

  const [entrada, setEntrada] = useState(10);
  const [parcelasEntrada, setParcelasEntrada] = useState(4);
  const [prazoCurta, setPrazoCurta] = useState(36);
  const [prazoLonga, setPrazoLonga] = useState(180);
  const [jurosPrice, setJurosPrice] = useState(0.8);

  const [mesInicioVendas, setMesInicioVendas] = useState(8);
  const [prazoVendas, setPrazoVendas] = useState(0);
  const [mesInicioObras, setMesInicioObras] = useState(7);
  const [prazoObra, setPrazoObra] = useState(18);
  const [custoObraTotal, setCustoObraTotal] = useState(0);

  const [custoProjetos, setCustoProjetos] = useState(0);
  const [custoComercial, setCustoComercial] = useState(0);
  const [custoJuridico, setCustoJuridico] = useState(0);
  const [valorTerraEconomico, setValorTerraEconomico] = useState(0);

  const [pctComissao, setPctComissao] = useState(6);
  const [pctMarketing, setPctMarketing] = useState(2);
  const [pctImpostos, setPctImpostos] = useState(15.08);
  const [pctGestaoCarteira, setPctGestaoCarteira] = useState(5);
  const [pctInad, setPctInad] = useState(2);
  const [pctDistrato, setPctDistrato] = useState(3);
  const [pctAdmin, setPctAdmin] = useState(10);
  const [pctConting, setPctConting] = useState(5);

  const [tma, setTma] = useState(15);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErro('Sessao expirada, faca login novamente.');
      setSalvando(false);
      return;
    }

    const cronogramaObra = new Array(prazoObra).fill(custoObraTotal / Math.max(1, prazoObra));

    const premissas: Premissas = {
      areaGleba,
      areaVendavel,
      qtdLotes,
      precoBase,
      quadras: [],
      mix: { avista: mixAvista / 100, curta: mixCurta / 100, longa: mixLonga / 100 },
      descontoAvista: descontoAvista / 100,
      entrada: entrada / 100,
      parcelasEntrada,
      prazoCurta,
      prazoLonga,
      jurosPrice: jurosPrice / 100,
      tma: tma / 100,
      mesInicioVendas,
      mesFimVendas: prazoVendas > 0 ? mesInicioVendas + prazoVendas : undefined,
      mesInicioObras,
      prazoObra,
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
      valorTerraEconomico,
      cronogramaObra,
    };

    const { data, error } = await supabase
      .from('estudos')
      .insert({
        user_id: user.id,
        nome,
        cidade,
        estado,
        spe,
        proprietario,
        premissas,
      })
      .select('id')
      .single();

    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.push(`/estudos/${data.id}`);
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[900px] px-6 py-8">
        <h1 className="mb-1 text-[22px] font-extrabold">Novo estudo de viabilidade</h1>
        <p className="mb-6 text-[13px]" style={{ color: 'var(--text-2)' }}>
          Preencha as premissas do loteamento — o dashboard e todos os indicadores sao gerados automaticamente.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Secao titulo="Identificacao do projeto">
            <Campo label="Nome do empreendimento">
              <input required value={nome} onChange={(e) => setNome(e.target.value)} />
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
            <Campo label="Proprietario">
              <input value={proprietario} onChange={(e) => setProprietario(e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Terreno e lotes">
            <Campo label="Area da gleba (m²)">
              <input type="number" value={areaGleba} onChange={(e) => setAreaGleba(+e.target.value)} />
            </Campo>
            <Campo label="Area vendavel (m²)">
              <input type="number" value={areaVendavel} onChange={(e) => setAreaVendavel(+e.target.value)} />
            </Campo>
            <Campo label="Quantidade de lotes">
              <input type="number" value={qtdLotes} onChange={(e) => setQtdLotes(+e.target.value)} />
            </Campo>
            <Campo label="Preco base (R$/m²)">
              <input type="number" value={precoBase} onChange={(e) => setPrecoBase(+e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Mix comercial">
            <Campo label="% a vista">
              <input type="number" value={mixAvista} onChange={(e) => setMixAvista(+e.target.value)} />
            </Campo>
            <Campo label="% tabela curta">
              <input type="number" value={mixCurta} onChange={(e) => setMixCurta(+e.target.value)} />
            </Campo>
            <Campo label="% tabela longa">
              <input type="number" value={mixLonga} onChange={(e) => setMixLonga(+e.target.value)} />
            </Campo>
            <Campo label="Desconto a vista (%)">
              <input type="number" value={descontoAvista} onChange={(e) => setDescontoAvista(+e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Condicoes de financiamento">
            <Campo label="Entrada (%)">
              <input type="number" value={entrada} onChange={(e) => setEntrada(+e.target.value)} />
            </Campo>
            <Campo label="Parcelas da entrada">
              <input type="number" value={parcelasEntrada} onChange={(e) => setParcelasEntrada(+e.target.value)} />
            </Campo>
            <Campo label="Prazo tabela curta (meses)">
              <input type="number" value={prazoCurta} onChange={(e) => setPrazoCurta(+e.target.value)} />
            </Campo>
            <Campo label="Prazo tabela longa (meses)">
              <input type="number" value={prazoLonga} onChange={(e) => setPrazoLonga(+e.target.value)} />
            </Campo>
            <Campo label="Juros mensal (%)">
              <input type="number" step="0.01" value={jurosPrice} onChange={(e) => setJurosPrice(+e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Cronograma">
            <Campo label="Mes de inicio das vendas">
              <input type="number" value={mesInicioVendas} onChange={(e) => setMesInicioVendas(+e.target.value)} />
            </Campo>
            <Campo label="Prazo de vendas (meses ate vender 100%)">
              <input type="number" value={prazoVendas} onChange={(e) => setPrazoVendas(+e.target.value)} />
            </Campo>
            <Campo label="Mes de inicio da obra">
              <input type="number" value={mesInicioObras} onChange={(e) => setMesInicioObras(+e.target.value)} />
            </Campo>
            <Campo label="Prazo de obra (meses)">
              <input type="number" value={prazoObra} onChange={(e) => setPrazoObra(+e.target.value)} />
            </Campo>
            <Campo label="Custo total de infraestrutura (R$)">
              <input type="number" value={custoObraTotal} onChange={(e) => setCustoObraTotal(+e.target.value)} />
            </Campo>
          </Secao>
          <p className="-mt-3 text-[11.5px]" style={{ color: 'var(--text-3)' }}>
            Prazo de vendas 0 = venda instantanea no mes de lancamento (100% do estoque). Distribuicao de obra automatica por mes.
            O cronograma fisico-financeiro detalhado por etapa pode ser editado depois de criar o estudo.
          </p>

          <Secao titulo="Custos">
            <Campo label="Projetos/aprovacao (R$)">
              <input type="number" value={custoProjetos} onChange={(e) => setCustoProjetos(+e.target.value)} />
            </Campo>
            <Campo label="Comercial fixo (R$)">
              <input type="number" value={custoComercial} onChange={(e) => setCustoComercial(+e.target.value)} />
            </Campo>
            <Campo label="Juridico fixo (R$)">
              <input type="number" value={custoJuridico} onChange={(e) => setCustoJuridico(+e.target.value)} />
            </Campo>
            <Campo label="Valor economico da terra (R$)">
              <input type="number" value={valorTerraEconomico} onChange={(e) => setValorTerraEconomico(+e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Despesas percentuais sobre a receita">
            <Campo label="Comissao (%)">
              <input type="number" step="0.01" value={pctComissao} onChange={(e) => setPctComissao(+e.target.value)} />
            </Campo>
            <Campo label="Marketing (%)">
              <input type="number" step="0.01" value={pctMarketing} onChange={(e) => setPctMarketing(+e.target.value)} />
            </Campo>
            <Campo label="Tributos (%)">
              <input type="number" step="0.01" value={pctImpostos} onChange={(e) => setPctImpostos(+e.target.value)} />
            </Campo>
            <Campo label="Gestao de carteira (%)">
              <input type="number" step="0.01" value={pctGestaoCarteira} onChange={(e) => setPctGestaoCarteira(+e.target.value)} />
            </Campo>
            <Campo label="Inadimplencia (%)">
              <input type="number" step="0.01" value={pctInad} onChange={(e) => setPctInad(+e.target.value)} />
            </Campo>
            <Campo label="Distrato (%)">
              <input type="number" step="0.01" value={pctDistrato} onChange={(e) => setPctDistrato(+e.target.value)} />
            </Campo>
            <Campo label="Administracao (% s/ custo direto)">
              <input type="number" step="0.01" value={pctAdmin} onChange={(e) => setPctAdmin(+e.target.value)} />
            </Campo>
            <Campo label="Contingencia (% s/ custo de obra)">
              <input type="number" step="0.01" value={pctConting} onChange={(e) => setPctConting(+e.target.value)} />
            </Campo>
          </Secao>

          <Secao titulo="Parametros financeiros">
            <Campo label="TMA anual (%)">
              <input type="number" step="0.01" value={tma} onChange={(e) => setTma(+e.target.value)} />
            </Campo>
          </Secao>

          {erro && (
            <div className="rounded-[8px] px-3 py-2 text-[12.5px]" style={{ background: 'var(--crit-soft)', color: 'var(--crit)' }}>
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {salvando ? 'Salvando…' : 'Criar estudo e gerar dashboard'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
