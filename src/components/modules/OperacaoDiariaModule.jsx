import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp, PlusCircle, CheckCircle, AlertTriangle, Trash2, BarChart3,
  HelpCircle, Info, Calendar, Filter, Download
} from 'lucide-react';

export const OperacaoDiariaModule = ({ isModalOpen, setIsModalOpen }) => {
  const {
    lancamentos, addLancamentoDiario, deleteLancamentoDiario,
    projecaoMensal, clientes, planos, aluguel, pacotes, premissas, taxasPagamento,
    funcionarios, addAuditLog
  } = useApp();

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    mesReferencia: projecaoMensal[0]?.month || 'Sep/2026',
    tipo: 'Custos',
    valor: 0,
    observacao: ''
  });

  const handleSaveLancamento = (e) => {
    e.preventDefault();
    const val = Number(formData.valor) || 0;
    const payload = {
      data: formData.data,
      mesReferencia: formData.mesReferencia,
      observacao: formData.observacao,
      novosClientes: 0,
      gastoTrafego: formData.tipo === 'Gasto em Tráfego' ? val : 0,
      comissaoVendas: formData.tipo === 'Comissão de Vendas' ? val : 0,
      comissaoSuporte: formData.tipo === 'Comissão de Suporte' ? val : 0,
      custosOperacionais: formData.tipo === 'Custos' ? val : 0,
      receitaReais: formData.tipo === 'Receitas' ? val : 0,
      aportesFinanceiros: formData.tipo === 'Aportes Financeiros' ? val : 0
    };
    addLancamentoDiario(payload);
    addAuditLog('Lançamento Diário', `${formData.tipo} de R$${val.toFixed(2)} lançado em ${formData.data} (Ref: ${formData.mesReferencia}). ${formData.observacao ? `Obs: ${formData.observacao}` : ''}`);
    setIsModalOpen(false);
  };

  const [expandedMonths, setExpandedMonths] = useState([]);
  const toggleMonth = (monthStr) => {
    setExpandedMonths(prev => prev.includes(monthStr) ? prev.filter(m => m !== monthStr) : [...prev, monthStr]);
  };

  // Month date helper
  const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };

  const isLancamentoInMonth = (l, monthStr) => {
    if (l.mesReferencia === monthStr) return true;
    if (l.data) {
      const parts = monthStr.split('/');
      if (parts.length === 2) {
        const mesIdx = monthMap[parts[0]];
        const ano = parseInt(parts[1]);
        const d = new Date(l.data + 'T00:00:00');
        if (d.getMonth() === mesIdx && d.getFullYear() === ano) return true;
      }
    }
    return false;
  };

  const getMonthStartEnd = (monthStr) => {
    if (!monthStr) return { start: null, end: null };
    const parts = monthStr.split('/');
    if (parts.length !== 2) return { start: null, end: null };
    const m = monthMap[parts[0]];
    const y = parseInt(parts[1]);
    if (m === undefined || isNaN(y)) return { start: null, end: null };
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 0, 23, 59, 59)
    };
  };

  // Build the complete 40-column real financial projection table
  const projecaoRealCompleta = useMemo(() => {
    let accumulatedCaixaReal = 0;
    let runningActiveClients = 0;

    return projecaoMensal.map((meta, index) => {
      const mes = meta.month;
      const { start: monthStart, end: monthEnd } = getMonthStartEnd(mes);

      // 1. Aggregated Lancamentos for this month
      const monthLancamentos = lancamentos.filter(l => isLancamentoInMonth(l, mes));
      const lancNovosClientes = monthLancamentos.reduce((acc, l) => acc + Number(l.novosClientes || 0), 0);
      const lancGastoTrafego = monthLancamentos.reduce((acc, l) => acc + Number(l.gastoTrafego || 0), 0);
      const lancComissaoVendas = monthLancamentos.reduce((acc, l) => acc + Number(l.comissaoVendas || l.comissoesPagas || 0), 0);
      const lancComissaoSuporte = monthLancamentos.reduce((acc, l) => acc + Number(l.comissaoSuporte || 0), 0);
      const lancCustosOperacionais = monthLancamentos.reduce((acc, l) => acc + Number(l.custosOperacionais || 0), 0);
      const lancReceita = monthLancamentos.reduce((acc, l) => acc + Number(l.receitaReais || 0), 0);
      const lancAportes = monthLancamentos.reduce((acc, l) => acc + Number(l.aportesFinanceiros || 0), 0);

      // 2. Client Database Aggregations for this month
      let clientesAtivosNoMes = [];
      let churnsNoMes = [];
      let novosCadastradosNoMes = [];

      if (monthStart && monthEnd) {
        clientesAtivosNoMes = clientes.filter(c => {
          const entrada = new Date(c.dataEntrada);
          const isBeforeOrIn = entrada <= monthEnd;
          const cancelamento = c.dataCancelamento ? new Date(c.dataCancelamento) : null;
          const notCancelledYet = !cancelamento || cancelamento > monthEnd;
          return isBeforeOrIn && notCancelledYet;
        });

        churnsNoMes = clientes.filter(c => {
          if (!c.dataCancelamento) return false;
          const cancel = new Date(c.dataCancelamento);
          return cancel >= monthStart && cancel <= monthEnd;
        });

        novosCadastradosNoMes = clientes.filter(c => {
          const entrada = new Date(c.dataEntrada);
          return entrada >= monthStart && entrada <= monthEnd;
        });
      }

      const hasDirectData = monthLancamentos.length > 0 || novosCadastradosNoMes.length > 0 || churnsNoMes.length > 0;

      // Active Clients & Churn
      const churn = churnsNoMes.length;
      const novosBrutos = Math.max(lancNovosClientes, novosCadastradosNoMes.length);
      const novosLiquidos = Math.max(0, novosBrutos - churn);

      const hasClientsInDb = clientes && clientes.length > 0;

      if (hasClientsInDb) {
        runningActiveClients = clientesAtivosNoMes.length;
      } else {
        if (index === 0) {
          runningActiveClients = novosLiquidos;
        } else {
          runningActiveClients = Math.max(0, runningActiveClients + novosLiquidos);
        }
      }
      const clientesAtivos = runningActiveClients;

      // MRRs
      const mrrFromClients = clientesAtivosNoMes.reduce((acc, c) => acc + Number(c.mrr || 0), 0);
      const mrrMetaPlano = hasClientsInDb ? mrrFromClients : (lancReceita > 0 ? lancReceita : Math.round(clientesAtivos * 332));

      // Check module breakdown from clients
      const mrrAluguel = clientesAtivosNoMes.reduce((acc, c) => {
        const hasAluguel = (c.modulosAdicionais || []).some(m => m.toLowerCase().includes('aluguel') || m.toLowerCase().includes('alugueis'));
        return acc + (hasAluguel ? 200 : 0);
      }, 0);

      const mrrPacotes = clientesAtivosNoMes.reduce((acc, c) => {
        const mods = c.modulosAdicionais || [];
        let pacVal = 0;
        mods.forEach(m => {
          if (m.toLowerCase().includes('usuários')) pacVal += 29.99;
          else if (m.toLowerCase().includes('imóveis')) pacVal += 19.99;
          else if (m.toLowerCase().includes('e-mail')) pacVal += 5.00;
          else if (m.toLowerCase().includes('assinatura')) pacVal += 50.00;
        });
        return acc + pacVal;
      }, 0);

      const mrrTotal = (mrrMetaPlano + mrrAluguel + mrrPacotes);

      // Commissions
      const comissaoVendas = lancComissaoVendas > 0 ? lancComissaoVendas : 0;
      const bonusVendaAnual = 0;
      const comissaoSuporte = lancComissaoSuporte > 0 ? lancComissaoSuporte : 0;
      const receitaEmpresa = lancReceita > 0 ? (lancReceita - comissaoVendas - bonusVendaAnual) : (mrrTotal - comissaoVendas - bonusVendaAnual);

      // Acquisition channels
      const novosTrafego = Number((novosBrutos * 0.6).toFixed(1));
      const investimentoTrafego = lancGastoTrafego > 0 ? lancGastoTrafego : 0;
      const cacTrafego = novosTrafego > 0 ? Math.round(investimentoTrafego / novosTrafego) : 0;

      const novosLista = Number((novosBrutos * 0.25).toFixed(2));
      const contatosFrios = Math.round(novosLista * 50);
      const custoListaFria = Number((contatosFrios * 0.5).toFixed(2));

      const novosInfluencer = Number((novosBrutos * 0.15).toFixed(2));
      const custo1aInfluencer = 0; // Not available in lancamentos natively yet
      const custoRecorrenteInfluencer = 0; // Not available in lancamentos natively yet

      // Fixed team & pro-labore costs (filtered by each employee's start/end validity dates)
      const funcAtivos = funcionarios ? funcionarios.filter(f => {
        if (f.status !== 'Ativo') return false;
        if (monthStart && monthEnd) {
          if (f.dataInicio) {
            const inicio = new Date(f.dataInicio + 'T00:00:00');
            if (inicio > monthEnd) return false; // Salary starts after this month
          }
          if (f.dataFim) {
            const fim = new Date(f.dataFim + 'T23:59:59');
            if (fim < monthStart) return false; // Salary ended before this month
          }
        }
        return true;
      }) : [];
      const sumCargo = (cargos) => funcAtivos
        .filter(f => cargos.some(c => f.cargo.toLowerCase().includes(c)))
        .reduce((acc, f) => acc + (Number(f.custoMensal) || 0), 0);

      const proLaboreDev = sumCargo(['dev', 'programador']);
      const proLaboreGestor = sumCargo(['gestor', 'administrador']);
      const proLaboreMkt = sumCargo(['marketing', 'criação']);
      const proLaboreFin = sumCargo(['financeiro']);
      const suporteFixo = sumCargo(['suporte']);
      const apoioTecnico = sumCargo(['apoio']);
      const sdr = sumCargo(['sdr', 'vendedor', 'parceiro']); // Fixed salaries of sellers/SDRs
      const marketingCriacao = 0; // Merged into Mkt
      const bonusMetas = 0; // Not available natively

      // Infrastructure & payment fees
      // We can use lancCustosOperacionais to represent real infra/extra costs for now
      const infraestrutura = lancCustosOperacionais;

      // Extract Impostos premise from Configurações
      const impostoPremissa = premissas ? premissas.find(p => String(p.premissa).toLowerCase().includes('imposto')) : null;
      const impostoPct = impostoPremissa ? parseFloat(String(impostoPremissa.valor).replace('%', '').replace(',', '.')) / 100 : 0.08;

      // Extract Taxa Pagamento Efetiva from Configurações
      const taxaEfetiva = taxasPagamento && taxasPagamento.length > 0 
        ? taxasPagamento.reduce((acc, t) => {
            const uso = parseFloat(t.uso) || 0;
            const taxaFixa = parseFloat(t.taxaFixa) || 0;
            const taxaVar = parseFloat(t.taxaVar) || 0;
            // Efetiva is an approximation based on total MRR
            return acc + ((taxaVar + (taxaFixa / 332)) * uso); // assuming average ticket of 332 for fixed fee
          }, 0) 
        : 0.025;
      
      const taxasPgto = Math.round(receitaEmpresa * taxaEfetiva);

      // Taxes & Results
      const impostos = Math.round(receitaEmpresa * impostoPct);

      const totalCustosVariaveis = investimentoTrafego + custoListaFria + custo1aInfluencer + custoRecorrenteInfluencer + comissaoSuporte + taxasPgto;
      const resultadoBruto = Math.round(receitaEmpresa - totalCustosVariaveis);

      const totalCustosFixos = proLaboreDev + proLaboreGestor + proLaboreMkt + proLaboreFin + suporteFixo + apoioTecnico + sdr + marketingCriacao + bonusMetas + infraestrutura;
      const resultadoLiquido = Math.round(resultadoBruto - totalCustosFixos - impostos);

      // Cash flow
      const receitaCaixa = Math.round(receitaEmpresa * 1.35); // inclui adiantamentos/anuais à vista
      const impostosCaixa8 = Math.round(receitaCaixa * 0.08);
      const resultadoCaixa = Math.round(receitaCaixa - totalCustosVariaveis - totalCustosFixos - impostosCaixa8) + Math.round(lancAportes);
      accumulatedCaixaReal += resultadoCaixa;

      return {
        month: mes,
        hasDirectData,
        clientesAtivosMeta: clientesAtivos,
        churn,
        novosLiquidosMeta: novosLiquidos,
        novosBrutosNecessarios: novosBrutos,
        mrrMeta: mrrMetaPlano,
        mrrAluguel,
        mrrPacotes,
        mrrTotal,
        receitaEmpresa,
        comissaoVendas,
        bonusVendaAnual,
        comissaoSuporte,
        novosTrafego,
        cacTrafego,
        investimentoTrafego,
        novosLista,
        contatosFrios,
        custoListaFria,
        novosInfluencer,
        custo1aInfluencer,
        custoRecorrenteInfluencer,
        proLaboreDev,
        proLaboreGestor,
        proLaboreMkt,
        proLaboreFin,
        suporteFixo,
        apoioTecnico,
        sdr,
        marketingCriacao,
        bonusMetas,
        infraestrutura,
        taxasPagamento: taxasPgto,
        impostos,
        resultadoBruto,
        resultadoLiquido,
        receitaCaixa,
        impostosCaixa8,
        resultadoCaixa,
        saldoCaixaAcumulado: accumulatedCaixaReal,
        metaOriginal: meta
      };
    });
  }, [projecaoMensal, lancamentos, clientes]);

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400";

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Operação Diária — Projeção Financeira Real
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Dados financeiros realizados e consolidados mês a mês (contém todas as colunas da projeção financeira)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Lançamento Diário</span>
        </button>
      </div>

      {/* ===== TABELA COMPLETA COM TODAS AS COLUNAS DA PROJEÇÃO FINANCEIRA ===== */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Projeção Mensal Real (Realizado da Operação)</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Exibindo todas as 40 colunas operacionais e financeiras
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3 py-2.5 font-medium min-w-[90px] sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">Mês</th>
                <th className="px-2 py-2.5 font-medium min-w-[70px]">Clientes Ativos</th>
                <th className="px-2 py-2.5 font-medium min-w-[60px]">Churn</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">Novos Liq</th>
                <th className="px-2 py-2.5 font-medium min-w-[105px]">MRR Meta (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px]">MRR Aluguel (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px]">MRR Pacotes (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px]">MRR Total (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Receita Emp (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Comissão Vend (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Bônus Anual (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Comissão Sup (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">Novos Tráfego</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">CAC Tráfego (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Invest Tráfego (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">Novos Lista</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">Contatos Frios</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo Lista (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[75px]">Novos Influ</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo 1ª Inf (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo Rec Inf (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Pró-labore Dev (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Pró-labore Ges (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Pró-labore Mkt (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[95px]">Pró-labore Fin (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Suporte Fixo (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Apoio Téc (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[85px]">SDR (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Mkt/Criação (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Bônus Metas (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Infra (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Taxas Pgto (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Impostos (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Bruto (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Líquido (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[105px]">Receita Caixa (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Imp. Caixa (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Caixa (R$)</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px]">Saldo Caixa (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {projecaoRealCompleta.map((p, idx) => (
                <React.Fragment key={idx}>
                  <tr className="hover:bg-amber-50/30 dark:hover:bg-gray-900/60 transition-colors">
                    {/* Month */}
                    <td onClick={() => toggleMonth(p.month)} className="px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 sticky left-0 bg-white dark:bg-gray-950 z-10 border-r border-gray-100 dark:border-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{p.month}</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded ml-2">
                          {expandedMonths.includes(p.month) ? '▲' : '▼'}
                        </span>
                      </div>
                    </td>

                  {/* Core Metrics */}
                  <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white bg-gray-50/60 dark:bg-gray-900/40 rounded">
                    {p.clientesAtivosMeta}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-red-600 dark:text-red-400 bg-red-50/20 dark:bg-red-950/20 rounded">
                    {p.churn}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-green-600 dark:text-green-400">
                    {p.novosLiquidosMeta}
                  </td>

                  {/* MRRs */}
                  <td className="px-2 py-2 font-medium text-gray-900 dark:text-white">{formatCurrency(p.mrrMeta)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.mrrAluguel)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.mrrPacotes)}</td>
                  <td className="px-2 py-2 font-bold text-gray-900 dark:text-white bg-amber-50/30 dark:bg-amber-950/20 rounded">
                    {formatCurrency(p.mrrTotal)}
                  </td>

                  {/* Commissions & Revenue */}
                  <td className="px-2 py-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(p.receitaEmpresa)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.comissaoVendas)}</td>
                  <td className="px-2 py-2 text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(p.bonusVendaAnual)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.comissaoSuporte)}</td>

                  {/* Traffic */}
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{p.novosTrafego}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.cacTrafego)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.investimentoTrafego)}</td>

                  {/* Cold List */}
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{p.novosLista}</td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{p.contatosFrios}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custoListaFria)}</td>

                  {/* Influencers */}
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">{p.novosInfluencer}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custo1aInfluencer)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custoRecorrenteInfluencer)}</td>

                  {/* Pro-labores */}
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreDev)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreGestor)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreMkt)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreFin)}</td>

                  {/* Support & Tech */}
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.suporteFixo)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.apoioTecnico)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.sdr)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.marketingCriacao)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.bonusMetas)}</td>

                  {/* Infrastructure & Taxes */}
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.infraestrutura)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.taxasPagamento)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.impostos)}</td>

                  {/* Financial Results */}
                  <td className="px-2 py-2 font-bold text-gray-900 dark:text-white">{formatCurrency(p.resultadoBruto)}</td>
                  <td className={`px-2 py-2 font-bold ${p.resultadoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(p.resultadoLiquido)}
                  </td>
                  <td className="px-2 py-2 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(p.receitaCaixa)}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.impostosCaixa8)}</td>
                  <td className={`px-2 py-2 font-bold ${p.resultadoCaixa >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(p.resultadoCaixa)}
                  </td>
                  <td className="px-2 py-2 font-bold text-gray-900 dark:text-white bg-gray-50/70 dark:bg-gray-900/50 rounded">
                    {formatCurrency(p.saldoCaixaAcumulado)}
                  </td>
                  </tr>
                  {expandedMonths.includes(p.month) && (
                    <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                      <td colSpan={35} className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                          <h4 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-200">Operações Diárias de {p.month}</h4>
                          {(() => {
                            const lmes = [...lancamentos.filter(l => isLancamentoInMonth(l, p.month))];

                            // Auto-include any active client whose dataEntrada is in this month
                            const { start: monthStart, end: monthEnd } = getMonthStartEnd(p.month);
                            if (monthStart && monthEnd) {
                              clientes.forEach(c => {
                                if (c.status === 'Ativo' && c.dataEntrada) {
                                  const d = new Date(c.dataEntrada + 'T00:00:00');
                                  if (d >= monthStart && d <= monthEnd) {
                                    const alreadyHasEntry = lmes.some(l => 
                                      l.clientId === c.id || 
                                      (l.observacao && ((c.empresa && l.observacao.includes(c.empresa)) || (c.nome && l.observacao.includes(c.nome))))
                                    );
                                    if (!alreadyHasEntry) {
                                      const isAnualVista = c.modalidade === 'anualVista';
                                      const ticketMensal = Number(c.mrr || 0);
                                      const receita = isAnualVista ? (ticketMensal * 12) : ticketMensal;
                                      lmes.push({
                                        id: `cli-auto-${c.id}`,
                                        clientId: c.id,
                                        data: c.dataEntrada,
                                        mesReferencia: p.month,
                                        novosClientes: 1,
                                        gastoTrafego: 0,
                                        comissaoVendas: 0,
                                        comissaoSuporte: 0,
                                        custosOperacionais: 0,
                                        receitaReais: receita * (1 - (c.desconto || 0) / 100),
                                        aportesFinanceiros: 0,
                                        observacao: `Venda validada: ${c.empresa || c.nome}. Vendedor: ${c.vendedorResponsavel || '—'}. Suporte: ${c.suporteResponsavel || '—'}. Modalidade: ${isAnualVista ? 'Anual à Vista' : 'Mensal'}.`
                                      });
                                    }
                                  }
                                }
                              });
                            }

                            if (lmes.length === 0) return <p className="text-xs text-gray-500">Nenhum lançamento para este mês.</p>;
                            
                            const grouped = lmes.reduce((acc, l) => {
                              acc[l.data] = acc[l.data] || [];
                              acc[l.data].push(l);
                              return acc;
                            }, {});

                            return Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                              <div key={date} className="mb-4 last:mb-0">
                                <h5 className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2 uppercase">Dia {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left min-w-[600px]">
                                    <thead>
                                      <tr className="text-gray-500 uppercase text-[10px]">
                                        <th className="pb-2 font-medium w-[90px]">Novos Clientes</th>
                                        <th className="pb-2 font-medium w-[90px]">Tráfego</th>
                                        <th className="pb-2 font-medium w-[90px]">Com. Vendas</th>
                                        <th className="pb-2 font-medium w-[90px]">Com. Suporte</th>
                                        <th className="pb-2 font-medium w-[90px]">Custos</th>
                                        <th className="pb-2 font-medium w-[90px]">Aportes</th>
                                        <th className="pb-2 font-medium w-[90px]">Receita</th>
                                        <th className="pb-2 font-medium">Observação</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {grouped[date].map(l => (
                                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                          <td className="py-2 text-green-600 font-medium">{l.novosClientes > 0 ? `+${l.novosClientes}` : '-'}</td>
                                          <td className="py-2 text-gray-600 dark:text-gray-400">{l.gastoTrafego > 0 ? formatCurrency(l.gastoTrafego) : '-'}</td>
                                          <td className="py-2 text-indigo-600 dark:text-indigo-400">{(l.comissaoVendas || l.comissoesPagas || 0) > 0 ? formatCurrency(l.comissaoVendas || l.comissoesPagas || 0) : '-'}</td>
                                          <td className="py-2 text-teal-600 dark:text-teal-400">{(l.comissaoSuporte || 0) > 0 ? formatCurrency(l.comissaoSuporte) : '-'}</td>
                                          <td className="py-2 text-gray-600 dark:text-gray-400">{l.custosOperacionais > 0 ? formatCurrency(l.custosOperacionais) : '-'}</td>
                                          <td className="py-2 text-indigo-600 dark:text-indigo-400">{l.aportesFinanceiros > 0 ? formatCurrency(l.aportesFinanceiros) : '-'}</td>
                                          <td className="py-2 font-medium text-gray-900 dark:text-white">{l.receitaReais > 0 ? formatCurrency(l.receitaReais) : '-'}</td>
                                          <td className="py-2 text-gray-500">{l.observacao || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Logs Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lançamentos Diários Realizados</h3>
          <span className="text-xs text-gray-400">{lancamentos.length} registros inseridos</span>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Mês Ref.</th>
                <th className="px-4 py-2.5 font-medium">Novos Clientes</th>
                <th className="px-4 py-2.5 font-medium">Tráfego</th>
                <th className="px-4 py-2.5 font-medium">Com. Vendas</th>
                <th className="px-4 py-2.5 font-medium">Com. Suporte</th>
                <th className="px-4 py-2.5 font-medium">Custos</th>
                <th className="px-4 py-2.5 font-medium">Aportes</th>
                <th className="px-4 py-2.5 font-medium">Receita</th>
                <th className="px-4 py-2.5 font-medium">Observações</th>
                <th className="px-4 py-2.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    Nenhum lançamento diário registrado ainda. Clique em "+ Novo Lançamento Diário" acima.
                  </td>
                </tr>
              ) : (
                lancamentos.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{l.data}</td>
                    <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium">{l.mesReferencia}</td>
                    <td className="px-4 py-2.5 text-green-600 dark:text-green-400 font-semibold">+{l.novosClientes}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatCurrency(l.gastoTrafego)}</td>
                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400">{formatCurrency(l.comissaoVendas || l.comissoesPagas || 0)}</td>
                    <td className="px-4 py-2.5 text-teal-600 dark:text-teal-400">{formatCurrency(l.comissaoSuporte || 0)}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatCurrency(l.custosOperacionais)}</td>
                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-medium">{formatCurrency(l.aportesFinanceiros || 0)}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">{formatCurrency(l.receitaReais)}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{l.observacao || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm('Deseja excluir este lançamento?')) {
                            addAuditLog('Exclusão de Lançamento', `Lançamento de ${l.data} (Ref: ${l.mesReferencia}) excluído`);
                            deleteLancamentoDiario(l.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Novo Lançamento Diário</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg">×</button>
            </div>
            <form onSubmit={handleSaveLancamento} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Data *</label>
                  <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Mês de Referência</label>
                  <select value={formData.mesReferencia} onChange={e => setFormData({ ...formData, mesReferencia: e.target.value })} className={inputCls}>
                    {projecaoMensal.map(p => <option key={p.month} value={p.month}>{p.month}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Tipo de Lançamento *</label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className={inputCls}>
                    <option value="Custos">Custos Operacionais Extras</option>
                    <option value="Gasto em Tráfego">Gasto em Tráfego</option>
                    <option value="Comissão de Vendas">Comissão de Vendas</option>
                    <option value="Comissão de Suporte">Comissão de Suporte</option>
                    <option value="Receitas">Receita Avulsa/Realizada</option>
                    <option value="Aportes Financeiros">Aportes Financeiros (Investimento)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Valor (R$) *</label>
                  <input type="number" min="0" step="0.01" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">Observações</label>
                <input value={formData.observacao} onChange={e => setFormData({ ...formData, observacao: e.target.value })} className={inputCls} placeholder="Detalhes opcionais sobre a operação" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
