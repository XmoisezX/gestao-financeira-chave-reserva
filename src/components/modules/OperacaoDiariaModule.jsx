import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp, PlusCircle, CheckCircle, AlertTriangle, Trash2, BarChart3,
  HelpCircle, Info, Calendar, Filter, Download, Eye, FileText, DollarSign,
  Users, Building2, User, X, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Tag, ShieldCheck, Clock, ExternalLink
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

  const [selectedLancamento, setSelectedLancamento] = useState(null);

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

      // 2. Client Database Aggregations for this month (ONLY CONSIDER VALIDATED CLIENTS)
      const clientesValidados = (clientes || []).filter(c => c.status === 'Ativo' || c.status === 'Churned');
      let clientesAtivosNoMes = [];
      let churnsNoMes = [];
      let novosCadastradosNoMes = [];

      if (monthStart && monthEnd) {
        clientesAtivosNoMes = clientesValidados.filter(c => {
          const entrada = new Date(c.dataEntrada);
          const isBeforeOrIn = entrada <= monthEnd;
          const cancelamento = c.dataCancelamento ? new Date(c.dataCancelamento) : null;
          const notCancelledYet = !cancelamento || cancelamento > monthEnd;
          return isBeforeOrIn && notCancelledYet;
        });

        churnsNoMes = clientesValidados.filter(c => {
          if (c.status !== 'Churned' || !c.dataCancelamento) return false;
          const cancel = new Date(c.dataCancelamento);
          return cancel >= monthStart && cancel <= monthEnd;
        });

        novosCadastradosNoMes = clientesValidados.filter(c => {
          const entrada = new Date(c.dataEntrada);
          return entrada >= monthStart && entrada <= monthEnd;
        });
      }

      const hasDirectData = monthLancamentos.length > 0 || novosCadastradosNoMes.length > 0 || churnsNoMes.length > 0;

      // Active Clients & Churn
      const churn = churnsNoMes.length;
      const novosBrutos = Math.max(lancNovosClientes, novosCadastradosNoMes.length);
      const novosLiquidos = Math.max(0, novosBrutos - churn);

      const hasClientsInDb = clientesValidados.length > 0;

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
        const isPacote = (c.modulosAdicionais || []).some(m => m.toLowerCase().includes('pacote') || m.toLowerCase().includes('consultoria'));
        return acc + (isPacote ? 300 : 0);
      }, 0);

      const mrrTotal = mrrMetaPlano + mrrAluguel + mrrPacotes;

      // Cash flow calculations from real clients or lancamentos
      let totalAnualAVistaRecebido = 0;
      let totalAnualCartaoRecebido = 0;
      let totalMensalRecebido = 0;

      if (novosCadastradosNoMes.length > 0) {
        novosCadastradosNoMes.forEach(c => {
          const mrr = Number(c.mrr || 0);
          const ciclo = (c.ciclo || '').toLowerCase();
          const modalidade = (c.modalidadePagamento || '').toLowerCase();

          if (ciclo.includes('anual') && (modalidade.includes('vista') || modalidade.includes('pix') || modalidade.includes('boleto'))) {
            totalAnualAVistaRecebido += mrr * 12;
          } else if (ciclo.includes('anual') && (modalidade.includes('cartao') || modalidade.includes('crédito'))) {
            totalAnualCartaoRecebido += mrr * 12;
          } else {
            totalMensalRecebido += mrr;
          }
        });
      }

      const receitaCaixaAnualVista = totalAnualAVistaRecebido;
      const receitaCaixaAnualCartao = totalAnualCartaoRecebido;
      const receitaCaixaMensal = hasClientsInDb ? mrrTotal : (lancReceita > 0 ? lancReceita : 0);
      const receitaCaixa = receitaCaixaAnualVista + receitaCaixaAnualCartao + receitaCaixaMensal + lancAportes;

      // Projeção base: fallback to meta values if zero lancamentos
      const receitaEmpresa = lancReceita > 0 ? lancReceita : mrrTotal;

      // Real commissions
      const comissaoVendas = lancComissaoVendas;
      const comissaoSuporte = lancComissaoSuporte;
      const bonusVendaAnual = 0; // handled in comissaoVendas if applicable

      // Traffic
      const investimentoTrafego = lancGastoTrafego;
      const cacTrafego = novosLiquidos > 0 && investimentoTrafego > 0 ? Math.round(investimentoTrafego / novosLiquidos) : 0;
      const custoListaFria = 0;
      const custo1aInfluencer = 0; // Not available in lancamentos natively yet
      const custoRecorrenteInfluencer = 0; // Not available in lancamentos natively yet

      // Team & Fixed Costs (loaded from dynamic premissas)
      const premissaObj = premissas && Array.isArray(premissas) ? premissas.reduce((acc, p) => { acc[p.premissa] = p.valor; return acc; }, {}) : {};
      
      const proLaboreDev = Number(premissaObj.proLaboreDev || premissas?.proLaboreDev || 2000);
      const proLaboreGestor = Number(premissaObj.proLaboreGestor || premissas?.proLaboreGestor || 2000);
      const proLaboreMkt = Number(premissaObj.proLaboreMkt || premissas?.proLaboreMkt || 1000);
      const proLaboreFin = Number(premissaObj.proLaboreFin || premissas?.proLaboreFin || 1000);
      const suporteFixo = Number(premissaObj.suporteFixo || premissas?.suporteFixo || 0);
      const apoioTecnico = Number(premissaObj.apoioTecnico || premissas?.apoioTecnico || 0);
      const sdr = Number(premissaObj.sdr || premissas?.sdr || 0);
      const marketingCriacao = Number(premissaObj.marketingCriacao || premissas?.marketingCriacao || 0);
      const bonusMetas = Number(premissaObj.bonusMetas || premissas?.bonusMetas || 0);

      // Operational Overhead
      const infraestrutura = Number(premissaObj.infraestrutura || premissas?.infraestrutura || 100);
      const taxasPagamentoVal = (receitaCaixa * (Number(premissaObj.taxaCartao || premissas?.taxaCartao || 3) / 100));
      const impostos = (receitaEmpresa * (Number(premissaObj.impostoAliquota || premissas?.impostoAliquota || 8) / 100));
      const impostosCaixa8 = (receitaCaixa * (Number(premissaObj.impostoAliquota || premissas?.impostoAliquota || 8) / 100));

      const totalCustosFixoEquipe = proLaboreDev + proLaboreGestor + proLaboreMkt + proLaboreFin + suporteFixo + apoioTecnico + sdr + marketingCriacao + bonusMetas;
      const totalCustosVariaveis = comissaoVendas + bonusVendaAnual + comissaoSuporte + investimentoTrafego + custoListaFria + custo1aInfluencer + custoRecorrenteInfluencer + lancCustosOperacionais;
      const totalDespesasOperacionais = totalCustosFixoEquipe + totalCustosVariaveis + infraestrutura + taxasPagamentoVal + impostos;

      const resultadoBruto = receitaEmpresa - (comissaoVendas + bonusVendaAnual + comissaoSuporte + investimentoTrafego + lancCustosOperacionais);
      const resultadoLiquido = receitaEmpresa - totalDespesasOperacionais;

      const despesasCaixa = totalCustosFixoEquipe + totalCustosVariaveis + infraestrutura + taxasPagamentoVal + impostosCaixa8;
      const resultadoCaixa = receitaCaixa - despesasCaixa;

      accumulatedCaixaReal += resultadoCaixa;

      return {
        month: mes,
        // Active & Churn
        clientesAtivos,
        churn,
        novosClientes: novosLiquidos,
        // MRRs
        mrrMeta: mrrMetaPlano,
        mrrAluguel,
        mrrPacotes,
        mrrTotal,
        // Revenue
        receitaEmpresa,
        // Sales & Commissions
        comissaoVendas,
        bonusVendaAnual,
        comissaoSuporte,
        // Traffic & Mkt
        cacTrafego,
        investimentoTrafego,
        custoListaFria,
        custo1aInfluencer,
        custoRecorrenteInfluencer,
        // Team
        proLaboreDev,
        proLaboreGestor,
        proLaboreMkt,
        proLaboreFin,
        suporteFixo,
        apoioTecnico,
        sdr,
        marketingCriacao,
        bonusMetas,
        // Overhead
        infraestrutura,
        taxasPagamento: taxasPagamentoVal,
        impostos,
        // Profitability
        resultadoBruto,
        resultadoLiquido,
        // Cash flow & Taxes
        receitaCaixaAnualVista,
        receitaCaixaAnualCartao,
        receitaCaixaMensal,
        receitaCaixa,
        impostosCaixa8,
        resultadoCaixa,
        saldoCaixaAcumulado: accumulatedCaixaReal,
        // Meta references
        metaReceita: meta.receitaEmpresa || 0,
        metaCaixa: meta.receitaCaixa || 0,
        metaSaldoCaixa: meta.saldoCaixaAcumulado || 0,
        hasDirectData
      };
    });
  }, [projecaoMensal, lancamentos, clientes, premissas]);

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400";

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
  const formatCurrencyPrecise = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const getLancamentoTypeInfo = (l) => {
    if (!l) return { label: 'Lançamento Geral', color: 'gray', badgeBg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
    if (Number(l.receitaReais) > 0 && Number(l.novosClientes) > 0) {
      return { label: 'Nova Venda / Entrada de Cliente', color: 'green', badgeBg: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' };
    }
    if (Number(l.receitaReais) > 0) {
      return { label: 'Receita Realizada', color: 'emerald', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' };
    }
    if (Number(l.comissaoVendas || l.comissoesPagas || 0) > 0) {
      return { label: 'Comissão de Vendas', color: 'indigo', badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' };
    }
    if (Number(l.comissaoSuporte || 0) > 0) {
      return { label: 'Comissão de Suporte', color: 'teal', badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800' };
    }
    if (Number(l.gastoTrafego) > 0) {
      return { label: 'Investimento em Tráfego', color: 'blue', badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' };
    }
    if (Number(l.custosOperacionais) > 0) {
      return { label: 'Custo Operacional Extra', color: 'rose', badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' };
    }
    if (Number(l.aportesFinanceiros) > 0) {
      return { label: 'Aporte Financeiro', color: 'purple', badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' };
    }
    return { label: 'Lançamento Geral', color: 'gray', badgeBg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' };
  };

  // Find linked client if available for selectedLancamento
  const linkedClient = useMemo(() => {
    if (!selectedLancamento) return null;
    if (selectedLancamento.clientId) {
      const found = clientes.find(c => c.id === selectedLancamento.clientId);
      if (found) return found;
    }
    if (selectedLancamento.observacao) {
      const obs = selectedLancamento.observacao.toLowerCase();
      const found = clientes.find(c =>
        (c.empresa && obs.includes(c.empresa.toLowerCase())) ||
        (c.nome && obs.includes(c.nome.toLowerCase()))
      );
      if (found) return found;
    }
    return null;
  }, [selectedLancamento, clientes]);

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
                {/* 1. Métricas de Clientes */}
                <th className="px-2 py-2.5 font-medium min-w-[80px]">Ativos</th>
                <th className="px-2 py-2.5 font-medium min-w-[70px]">Churn</th>
                <th className="px-2 py-2.5 font-medium min-w-[70px]">Novos</th>

                {/* 2. MRR */}
                <th className="px-2 py-2.5 font-medium min-w-[90px]">MRR Meta</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">MRR Aluguel</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">MRR Pacotes</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px] bg-gray-100/50 dark:bg-gray-800/50">MRR Total</th>

                {/* 3. Receita da Empresa */}
                <th className="px-2 py-2.5 font-medium min-w-[110px] bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300">Rec. Empresa</th>

                {/* 4. Comissões e Bônus */}
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Com. Vendas</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Bônus Anual</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Com. Suporte</th>

                {/* 5. Tráfego & Marketing */}
                <th className="px-2 py-2.5 font-medium min-w-[80px]">CAC Tráf.</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Invest. Tráf.</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Lista Fria</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">1ª Influencer</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Rec. Influencer</th>

                {/* 6. Equipe e Pró-Labore */}
                <th className="px-2 py-2.5 font-medium min-w-[90px]">P-Lab Dev</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">P-Lab Gestor</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">P-Lab Mkt</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">P-Lab Fin</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Suporte Fixo</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Apoio Téc.</th>
                <th className="px-2 py-2.5 font-medium min-w-[80px]">SDR</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Mkt Criação</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Bônus Metas</th>

                {/* 7. Infraestrutura & Taxas */}
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Infra</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Taxas Pag.</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Impostos</th>

                {/* 8. Lucratividade */}
                <th className="px-2 py-2.5 font-medium min-w-[110px] bg-blue-50/50 dark:bg-blue-950/20">Res. Bruto</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px] bg-indigo-50/50 dark:bg-indigo-950/20">Res. Líquido</th>

                {/* 9. Fluxo de Caixa */}
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Rec. Anual Vista</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Rec. Anual Cartão</th>
                <th className="px-2 py-2.5 font-medium min-w-[100px]">Rec. Mensal</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px] bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-emerald-700 dark:text-emerald-300">Rec. Caixa</th>
                <th className="px-2 py-2.5 font-medium min-w-[90px]">Imp. Caixa (8%)</th>
                <th className="px-2 py-2.5 font-medium min-w-[110px] bg-violet-50/50 dark:bg-violet-950/20">Res. Caixa</th>
                <th className="px-2 py-2.5 font-medium min-w-[120px] bg-amber-50/50 dark:bg-amber-950/20 font-bold text-amber-700 dark:text-amber-400">Saldo Caixa Acum.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {projecaoRealCompleta.map((p) => (
                <React.Fragment key={p.month}>
                  <tr
                    onClick={() => toggleMonth(p.month)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-950 z-10 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">{expandedMonths.includes(p.month) ? '▼' : '▶'}</span>
                      {p.month}
                    </td>

                    {/* 1. Clientes */}
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{p.clientesAtivos}</td>
                    <td className="px-2 py-2 text-red-500">{p.churn > 0 ? `-${p.churn}` : 0}</td>
                    <td className="px-2 py-2 text-green-600 font-medium">+{p.novosClientes}</td>

                    {/* 2. MRR */}
                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-white">{formatCurrency(p.mrrMeta)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.mrrAluguel)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.mrrPacotes)}</td>
                    <td className="px-2 py-2 font-semibold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50">
                      {formatCurrency(p.mrrTotal)}
                    </td>

                    {/* 3. Receita Empresa */}
                    <td className="px-2 py-2 font-bold text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-950/10">
                      {formatCurrency(p.receitaEmpresa)}
                    </td>

                    {/* 4. Comissões e Bônus */}
                    <td className="px-2 py-2 text-indigo-600 dark:text-indigo-400">{formatCurrency(p.comissaoVendas)}</td>
                    <td className="px-2 py-2 text-amber-600 dark:text-amber-400">{formatCurrency(p.bonusVendaAnual)}</td>
                    <td className="px-2 py-2 text-teal-600 dark:text-teal-400">{formatCurrency(p.comissaoSuporte)}</td>

                    {/* 5. Tráfego */}
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.cacTrafego)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.investimentoTrafego)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custoListaFria)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custo1aInfluencer)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.custoRecorrenteInfluencer)}</td>

                    {/* 6. Equipe */}
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreDev)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreGestor)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreMkt)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.proLaboreFin)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.suporteFixo)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.apoioTecnico)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.sdr)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.marketingCriacao)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.bonusMetas)}</td>

                    {/* 7. Overhead */}
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.infraestrutura)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.taxasPagamento)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.impostos)}</td>

                    {/* 8. Lucratividade */}
                    <td className="px-2 py-2 font-bold text-gray-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/10">
                      {formatCurrency(p.resultadoBruto)}
                    </td>
                    <td className={`px-2 py-2 font-bold bg-indigo-50/30 dark:bg-indigo-950/10 ${p.resultadoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatCurrency(p.resultadoLiquido)}
                    </td>

                    {/* 9. Fluxo de Caixa */}
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.receitaCaixaAnualVista)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.receitaCaixaAnualCartao)}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.receitaCaixaMensal)}</td>
                    <td className="px-2 py-2 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                      {formatCurrency(p.receitaCaixa)}
                    </td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(p.impostosCaixa8)}</td>
                    <td className={`px-2 py-2 font-bold bg-violet-50/30 dark:bg-violet-950/10 ${p.resultadoCaixa >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatCurrency(p.resultadoCaixa)}
                    </td>
                    <td className={`px-2 py-2 font-bold bg-amber-50/30 dark:bg-amber-950/10 ${p.saldoCaixaAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatCurrency(p.saldoCaixaAcumulado)}
                    </td>
                  </tr>

                  {/* Accordion daily logs for this month */}
                  {expandedMonths.includes(p.month) && (
                    <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                      <td colSpan={40} className="px-6 py-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            Detalhamento Diário dos Lançamentos — {p.month}
                          </h4>

                          {(() => {
                            const lmes = [...lancamentos.filter(l => isLancamentoInMonth(l, p.month))];
                            
                            // Include newly validated clients in this month as synthetic logs if not already registered
                            const { start, end } = getMonthStartEnd(p.month);
                            if (start && end) {
                              const clientesValidadosNoMes = (clientes || []).filter(c => c.status === 'Ativo' || c.status === 'Churned');
                              clientesValidadosNoMes.forEach(c => {
                                const d = new Date(c.dataEntrada);
                                if (d >= start && d <= end) {
                                  const alreadyExists = lmes.some(l => 
                                    l.clientId === c.id || 
                                    (l.observacao && c.empresa && l.observacao.includes(c.empresa)) ||
                                    (l.observacao && c.nome && l.observacao.includes(c.nome))
                                  );
                                  if (!alreadyExists) {
                                    const isAnualVista = (c.ciclo || '').toLowerCase().includes('anual') &&
                                      ((c.modalidadePagamento || '').toLowerCase().includes('vista') || (c.modalidadePagamento || '').toLowerCase().includes('pix') || (c.modalidadePagamento || '').toLowerCase().includes('boleto'));
                                    const receita = isAnualVista ? (Number(c.mrr || 0) * 12) : Number(c.mrr || 0);

                                    lmes.push({
                                      id: `synth-cli-${c.id}`,
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
                              });
                            }

                            if (lmes.length === 0) return <p className="text-xs text-gray-500">Nenhum lançamento registrado para este mês.</p>;
                            
                            const grouped = lmes.reduce((acc, l) => {
                              acc[l.data] = acc[l.data] || [];
                              acc[l.data].push(l);
                              return acc;
                            }, {});

                            return Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                              <div key={date} className="mb-4 last:mb-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                                <h5 className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-800 pb-1 mb-2 uppercase flex items-center justify-between">
                                  <span>Dia {formatDateBR(date)}</span>
                                  <span className="text-[10px] text-gray-400 font-normal">{grouped[date].length} registro(s)</span>
                                </h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left min-w-[700px]">
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
                                        <th className="pb-2 font-medium text-right w-[80px]">Ação</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {grouped[date].map(l => (
                                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                          <td className="py-2 text-green-600 font-medium">{l.novosClientes > 0 ? `+${l.novosClientes}` : '-'}</td>
                                          <td className="py-2 text-gray-600 dark:text-gray-400">{l.gastoTrafego > 0 ? formatCurrencyPrecise(l.gastoTrafego) : '-'}</td>
                                          <td className="py-2 text-indigo-600 dark:text-indigo-400">{(l.comissaoVendas || l.comissoesPagas || 0) > 0 ? formatCurrencyPrecise(l.comissaoVendas || l.comissoesPagas || 0) : '-'}</td>
                                          <td className="py-2 text-teal-600 dark:text-teal-400">{(l.comissaoSuporte || 0) > 0 ? formatCurrencyPrecise(l.comissaoSuporte) : '-'}</td>
                                          <td className="py-2 text-gray-600 dark:text-gray-400">{l.custosOperacionais > 0 ? formatCurrencyPrecise(l.custosOperacionais) : '-'}</td>
                                          <td className="py-2 text-indigo-600 dark:text-indigo-400">{l.aportesFinanceiros > 0 ? formatCurrencyPrecise(l.aportesFinanceiros) : '-'}</td>
                                          <td className="py-2 font-medium text-gray-900 dark:text-white">{l.receitaReais > 0 ? formatCurrencyPrecise(l.receitaReais) : '-'}</td>
                                          <td className="py-2 text-gray-500 max-w-[260px] truncate">{l.observacao || '-'}</td>
                                          <td className="py-2 text-right">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLancamento(l);
                                              }}
                                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
                                              title="Ver detalhes da operação"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>Detalhes</span>
                                            </button>
                                          </td>
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
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatCurrencyPrecise(l.gastoTrafego)}</td>
                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400">{formatCurrencyPrecise(l.comissaoVendas || l.comissoesPagas || 0)}</td>
                    <td className="px-4 py-2.5 text-teal-600 dark:text-teal-400">{formatCurrencyPrecise(l.comissaoSuporte || 0)}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatCurrencyPrecise(l.custosOperacionais)}</td>
                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-medium">{formatCurrencyPrecise(l.aportesFinanceiros || 0)}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">{formatCurrencyPrecise(l.receitaReais)}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{l.observacao || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLancamento(l)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors shadow-xs"
                          title="Visualizar detalhes completos da operação"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja excluir este lançamento?')) {
                              addAuditLog('Exclusão de Lançamento', `Lançamento de ${l.data} (Ref: ${l.mesReferencia}) excluído`);
                              deleteLancamentoDiario(l.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL DE DETALHES DA OPERAÇÃO / LANÇAMENTO ===== */}
      {selectedLancamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getLancamentoTypeInfo(selectedLancamento).badgeBg}`}>
                    {getLancamentoTypeInfo(selectedLancamento).label}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    #{selectedLancamento.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Detalhes da Operação Realizada
                </h3>
              </div>
              <button
                onClick={() => setSelectedLancamento(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Cards Resumo Rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-500" /> Data Lançamento
                </span>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                  {formatDateBR(selectedLancamento.data)}
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{selectedLancamento.data}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> Mês de Referência
                </span>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {selectedLancamento.mesReferencia || '—'}
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Competência</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-500" /> Novos Clientes
                </span>
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                  +{selectedLancamento.novosClientes || 0}
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Ativações no dia</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-indigo-500" /> Valor Principal
                </span>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                  {Number(selectedLancamento.receitaReais) > 0 ? (
                    <span className="text-green-600 dark:text-green-400">+{formatCurrencyPrecise(selectedLancamento.receitaReais)}</span>
                  ) : Number(selectedLancamento.comissaoVendas || selectedLancamento.comissoesPagas || 0) > 0 ? (
                    <span className="text-indigo-600 dark:text-indigo-400">-{formatCurrencyPrecise(selectedLancamento.comissaoVendas || selectedLancamento.comissoesPagas || 0)}</span>
                  ) : Number(selectedLancamento.comissaoSuporte || 0) > 0 ? (
                    <span className="text-teal-600 dark:text-teal-400">-{formatCurrencyPrecise(selectedLancamento.comissaoSuporte)}</span>
                  ) : Number(selectedLancamento.gastoTrafego) > 0 ? (
                    <span className="text-blue-600 dark:text-blue-400">-{formatCurrencyPrecise(selectedLancamento.gastoTrafego)}</span>
                  ) : Number(selectedLancamento.custosOperacionais) > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">-{formatCurrencyPrecise(selectedLancamento.custosOperacionais)}</span>
                  ) : Number(selectedLancamento.aportesFinanceiros) > 0 ? (
                    <span className="text-purple-600 dark:text-purple-400">+{formatCurrencyPrecise(selectedLancamento.aportesFinanceiros)}</span>
                  ) : (
                    'R$ 0,00'
                  )}
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Impacto Direto</span>
              </div>
            </div>

            {/* Observações e Descrição Completa */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Observações & Informações da Operação</span>
              </div>
              <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-200/80 dark:border-gray-800/80 font-normal select-text whitespace-pre-wrap">
                {selectedLancamento.observacao || 'Nenhuma observação informada para este lançamento.'}
              </p>
            </div>

            {/* Dados do Cliente Vinculado (se houver) */}
            {linkedClient && (
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Cliente / Empresa Vinculada
                    </h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    linkedClient.status === 'Ativo' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {linkedClient.status || 'Ativo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-gray-900/90 p-3 rounded-lg border border-indigo-100/80 dark:border-indigo-900/40">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Empresa</span>
                    <strong className="text-gray-900 dark:text-white font-semibold">{linkedClient.empresa || linkedClient.nome}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Contato</span>
                    <span className="text-gray-700 dark:text-gray-300">{linkedClient.nome || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">CPF/CNPJ</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono text-[11px]">{linkedClient.cpfCnpj || linkedClient.documento || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Plano / Ciclo</span>
                    <span className="text-gray-700 dark:text-gray-300">{linkedClient.plano || '—'} ({linkedClient.ciclo || 'Mensal'})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">MRR Contratado</span>
                    <strong className="text-green-600 dark:text-green-400 font-semibold">{formatCurrencyPrecise(linkedClient.mrr)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Data de Entrada</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatDateBR(linkedClient.dataEntrada)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Vendedor Responsável</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{linkedClient.vendedorResponsavel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Suporte Responsável</span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">{linkedClient.suporteResponsavel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">E-mail</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate block text-[11px]" title={linkedClient.email}>{linkedClient.email || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhamento Financeiro Completo da Linha */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Discriminação Financeira Completa do Lançamento</span>
              </h4>
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Receita Bruta Realizada</td>
                      <td className="px-3.5 py-2 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrencyPrecise(selectedLancamento.receitaReais)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Comissão de Vendas</td>
                      <td className="px-3.5 py-2 text-right text-indigo-600 dark:text-indigo-400 font-medium">
                        {formatCurrencyPrecise(selectedLancamento.comissaoVendas || selectedLancamento.comissoesPagas || 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Comissão de Suporte</td>
                      <td className="px-3.5 py-2 text-right text-teal-600 dark:text-teal-400 font-medium">
                        {formatCurrencyPrecise(selectedLancamento.comissaoSuporte || 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Gasto em Tráfego Pago</td>
                      <td className="px-3.5 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                        {formatCurrencyPrecise(selectedLancamento.gastoTrafego)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Custos Operacionais Extras</td>
                      <td className="px-3.5 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                        {formatCurrencyPrecise(selectedLancamento.custosOperacionais)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2 text-gray-500 font-medium">Aportes Financeiros / Capital</td>
                      <td className="px-3.5 py-2 text-right text-purple-600 dark:text-purple-400 font-medium">
                        {formatCurrencyPrecise(selectedLancamento.aportesFinanceiros || 0)}
                      </td>
                    </tr>
                    {(() => {
                      const net = (Number(selectedLancamento.receitaReais) || 0) +
                        (Number(selectedLancamento.aportesFinanceiros) || 0) -
                        (Number(selectedLancamento.gastoTrafego) || 0) -
                        (Number(selectedLancamento.comissaoVendas || selectedLancamento.comissoesPagas || 0)) -
                        (Number(selectedLancamento.comissaoSuporte) || 0) -
                        (Number(selectedLancamento.custosOperacionais) || 0);
                      return (
                        <tr className="bg-gray-50 dark:bg-gray-800/80 font-bold border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3.5 py-2.5 text-gray-900 dark:text-white">Saldo Líquido da Operação</td>
                          <td className={`px-3.5 py-2.5 text-right ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {formatCurrencyPrecise(net)}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir esta operação?')) {
                    addAuditLog('Exclusão de Lançamento', `Lançamento de ${selectedLancamento.data} (Ref: ${selectedLancamento.mesReferencia}) excluído via modal de detalhes`);
                    deleteLancamentoDiario(selectedLancamento.id);
                    setSelectedLancamento(null);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Lançamento</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLancamento(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
