import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign, Calendar, CheckCircle, Clock, Search, Filter
} from 'lucide-react';

export const ComissoesModule = () => {
  const {
    clientes, addLancamentoDiario, updateCliente,
    projecaoMensal, premissas, funcionarios, addAuditLog
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return projecaoMensal[0]?.month || 'Sep/2026';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // todos, pendente, paga

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    clienteId: null,
    clienteNome: '',
    tipo: 'vendas', // 'vendas' or 'suporte'
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    vendedor: '',
    suporte: ''
  });

  const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };

  // Helper to calculate commissions dynamically for any active client
  const getClientComissoes = (client) => {
    const isAnualVista = client.modalidade === 'anualVista';
    const vVendasPremissa = premissas?.find(p => String(p.premissa).toLowerCase().includes('comissão de vendas'));
    const vVendasPct = vVendasPremissa ? parseFloat(String(vVendasPremissa.valor).replace('%', '')) || 50 : 50;
    
    const vBonusPremissa = premissas?.find(p => String(p.premissa).toLowerCase().includes('bônus venda anual'));
    const vBonusPct = vBonusPremissa ? parseFloat(String(vBonusPremissa.valor).replace('%', '')) || 20 : 20;

    const vSuportePremissa = premissas?.find(p => String(p.premissa).toLowerCase().includes('comissão de suporte'));
    const vSuportePct = vSuportePremissa ? parseFloat(String(vSuportePremissa.valor).replace('%', '')) || 50 : 50;

    // Base para comissão: 1 parcela mensal (1/12 do valor à vista ou 1 mensalidade)
    const parcelaBase = Number(client.mrr || 0);

    // Vendas: 50% da 1ª parcela + 20% bônus anual à vista = 70% da 1ª parcela
    const calcVenda = (parcelaBase * (vVendasPct / 100)) + (isAnualVista ? (parcelaBase * (vBonusPct / 100)) : 0);
    // Suporte: 50% da 1ª parcela
    const calcSuporte = parcelaBase * (vSuportePct / 100);

    const comissaoVenda = client.comissaoVendaValor !== undefined && client.comissaoVendaValor !== null
      ? Number(client.comissaoVendaValor)
      : calcVenda;
      
    const comissaoSuporte = client.comissaoSuporteValor !== undefined && client.comissaoSuporteValor !== null
      ? Number(client.comissaoSuporteValor)
      : calcSuporte;

    return { comissaoVenda, comissaoSuporte, parcelaBase };
  };

  // Get active clients with their commissions
  const clientesComComissao = useMemo(() => {
    return clientes.filter(c => {
      if (c.status !== 'Ativo') return false;

      // Filter by month of entry (if not 'todos')
      if (selectedMonth !== 'todos' && c.dataEntrada) {
        const parts = selectedMonth.split('/');
        if (parts.length === 2) {
          const mesIdx = monthMap[parts[0]];
          const ano = parseInt(parts[1]);
          const d = new Date(c.dataEntrada + 'T00:00:00');
          if (d.getMonth() !== mesIdx || d.getFullYear() !== ano) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNome = c.nome?.toLowerCase().includes(q);
        const matchEmpresa = c.empresa?.toLowerCase().includes(q);
        if (!matchNome && !matchEmpresa) return false;
      }

      // Status filter
      if (filterStatus === 'pendente') {
        if (c.comissaoVendaPaga && c.comissaoSuportePaga) return false;
      } else if (filterStatus === 'paga') {
        if (!c.comissaoVendaPaga && !c.comissaoSuportePaga) return false;
      }

      return true;
    });
  }, [clientes, selectedMonth, searchQuery, filterStatus, premissas]);

  // Available months from projecaoMensal
  const availableMonths = projecaoMensal.map(p => p.month);

  // Summary KPIs
  const totalComissaoVendas = clientesComComissao.reduce((acc, c) => acc + getClientComissoes(c).comissaoVenda, 0);
  const totalComissaoSuporte = clientesComComissao.reduce((acc, c) => acc + getClientComissoes(c).comissaoSuporte, 0);
  const totalPendenteVendas = clientesComComissao.filter(c => !c.comissaoVendaPaga).reduce((acc, c) => acc + getClientComissoes(c).comissaoVenda, 0);
  const totalPendenteSuporte = clientesComComissao.filter(c => !c.comissaoSuportePaga).reduce((acc, c) => acc + getClientComissoes(c).comissaoSuporte, 0);

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

  const openLancarModal = (cliente, tipo) => {
    const { comissaoVenda, comissaoSuporte, parcelaBase } = getClientComissoes(cliente);
    const isAnualVista = cliente.modalidade === 'anualVista';
    const pct = tipo === 'vendas' ? (isAnualVista ? '70% (50% + 20% Bônus Anual)' : '50%') : '50%';
    const initialResp = tipo === 'vendas' ? (cliente.vendedorResponsavel || '') : (cliente.suporteResponsavel || '');
    
    setModalData({
      clienteId: cliente.id,
      clienteNome: cliente.empresa || cliente.nome,
      tipo,
      valor: tipo === 'vendas' ? comissaoVenda : comissaoSuporte,
      data: cliente.dataEntrada || new Date().toISOString().split('T')[0],
      responsavel: initialResp,
      originalResponsavel: initialResp,
      vendedor: cliente.vendedorResponsavel || '',
      suporte: cliente.suporteResponsavel || '',
      infoBase: `Base: 1ª Parcela de ${formatCurrency(parcelaBase)} (${pct}) = ${formatCurrency(tipo === 'vendas' ? comissaoVenda : comissaoSuporte)}`
    });
    setIsModalOpen(true);
  };

  const handleLancarComissao = (e) => {
    e.preventDefault();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateObj = new Date(modalData.data + 'T00:00:00');
    const mesRef = `${monthNames[dateObj.getMonth()]}/${dateObj.getFullYear()}`;

    const responsavel = modalData.responsavel || (modalData.tipo === 'vendas' ? modalData.vendedor : modalData.suporte);

    addLancamentoDiario({
      data: modalData.data,
      mesReferencia: mesRef,
      novosClientes: 0,
      gastoTrafego: 0,
      comissaoVendas: modalData.tipo === 'vendas' ? Number(modalData.valor) : 0,
      comissaoSuporte: modalData.tipo === 'suporte' ? Number(modalData.valor) : 0,
      custosOperacionais: 0,
      receitaReais: 0,
      aportesFinanceiros: 0,
      observacao: `Comissão de ${modalData.tipo === 'vendas' ? 'Vendas' : 'Suporte'} — ${modalData.clienteNome}. Responsável: ${responsavel}.`
    });

    // Check if responsible person was changed from the one chosen in validation
    const original = modalData.originalResponsavel;
    if (responsavel && original && responsavel !== original) {
      addAuditLog(
        'Alteração de Responsável de Comissão',
        `Responsável pela comissão de ${modalData.tipo === 'vendas' ? 'Vendas' : 'Suporte'} do cliente "${modalData.clienteNome}" alterado de "${original}" para "${responsavel}".`
      );
    }

    // Mark commission as paid on the client and update responsible
    if (modalData.tipo === 'vendas') {
      updateCliente(modalData.clienteId, { comissaoVendaPaga: true, vendedorResponsavel: responsavel });
    } else {
      updateCliente(modalData.clienteId, { comissaoSuportePaga: true, suporteResponsavel: responsavel });
    }

    addAuditLog('Lançamento de Comissão', `Comissão de ${modalData.tipo === 'vendas' ? 'Vendas' : 'Suporte'} de R$${Number(modalData.valor).toFixed(2)} lançada para "${modalData.clienteNome}" em ${modalData.data}. Responsável: ${responsavel}`);

    setIsModalOpen(false);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Comissões
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie e lance comissões de vendas e suporte para clientes ativos
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Total Vendas</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalComissaoVendas)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Total Suporte</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalComissaoSuporte)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">Pendente Vendas</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalPendenteVendas)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">Pendente Suporte</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalPendenteSuporte)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className={inputCls + ' !w-auto font-medium'}
          >
            <option value="todos">Todos os Meses</option>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cliente ou empresa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={inputCls + ' !pl-9'}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={inputCls + ' !w-auto'}
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-2.5 font-medium">Cliente / Empresa</th>
              <th className="px-4 py-2.5 font-medium">Entrada</th>
              <th className="px-4 py-2.5 font-medium">MRR</th>
              <th className="px-4 py-2.5 font-medium">Modalidade</th>
              <th className="px-4 py-2.5 font-medium">Vendedor</th>
              <th className="px-4 py-2.5 font-medium">Suporte</th>
              <th className="px-4 py-2.5 font-medium text-center">Com. Vendas</th>
              <th className="px-4 py-2.5 font-medium text-center">Status Venda</th>
              <th className="px-4 py-2.5 font-medium text-center">Com. Suporte</th>
              <th className="px-4 py-2.5 font-medium text-center">Status Suporte</th>
              <th className="px-4 py-2.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {clientesComComissao.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                    <p>Nenhum cliente ativo encontrado para o filtro selecionado (<strong>{selectedMonth === 'todos' ? 'Todos os Meses' : selectedMonth}</strong>).</p>
                    <p className="text-[11px]">Dica: Selecione "Todos os Meses" no filtro acima para ver todos os clientes ativos.</p>
                  </div>
                </td>
              </tr>
            ) : (
              clientesComComissao.map(c => {
                const { comissaoVenda, comissaoSuporte } = getClientComissoes(c);
                const modalidadeLabel = c.modalidade === 'anualVista' ? 'Anual à Vista' : c.modalidade === 'anualParcelado' ? 'Anual Parcelado' : 'Mensal';
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{c.empresa || c.nome}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{c.nome}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {c.dataEntrada ? new Date(c.dataEntrada + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(c.mrr)}</span>
                      {c.modalidade === 'anualVista' && (
                        <span className="block text-[10px] text-gray-400">Total: {formatCurrency(Number(c.mrr) * 12)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        c.modalidade === 'anualVista' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {modalidadeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.vendedorResponsavel || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.suporteResponsavel || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{formatCurrency(comissaoVenda)}</td>
                    <td className="px-4 py-3 text-center">
                      {c.comissaoVendaPaga ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> Paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{formatCurrency(comissaoSuporte)}</td>
                    <td className="px-4 py-3 text-center">
                      {c.comissaoSuportePaga ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> Paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!c.comissaoVendaPaga && (
                          <button
                            onClick={() => openLancarModal(c, 'vendas')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors whitespace-nowrap"
                          >
                            Lançar Vendas
                          </button>
                        )}
                        {!c.comissaoSuportePaga && (
                          <button
                            onClick={() => openLancarModal(c, 'suporte')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors whitespace-nowrap"
                          >
                            Lançar Suporte
                          </button>
                        )}
                        {c.comissaoVendaPaga && c.comissaoSuportePaga && (
                          <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">✓ Completo</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Lançamento de Comissão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Lançar Comissão de {modalData.tipo === 'vendas' ? 'Vendas' : 'Suporte'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg">×</button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs space-y-1">
              <p className="text-gray-500">Cliente: <strong className="text-gray-900 dark:text-white">{modalData.clienteNome}</strong></p>
              {modalData.infoBase && <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{modalData.infoBase}</p>}
            </div>

            <form onSubmit={handleLancarComissao} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">
                  {modalData.tipo === 'vendas' ? 'Vendedor Responsável *' : 'Suporte Responsável *'}
                </label>
                <select
                  required
                  value={modalData.responsavel || ''}
                  onChange={e => setModalData({ ...modalData, responsavel: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Selecione o responsável...</option>
                  {(funcionarios || [])
                    .filter(f => f.status === 'Ativo')
                    .map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome} ({f.cargo}) {f.nome === modalData.originalResponsavel ? '— [Validado]' : ''}
                      </option>
                    ))}
                </select>
                {modalData.originalResponsavel && modalData.responsavel !== modalData.originalResponsavel && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Alterado de "{modalData.originalResponsavel}" (esta mudança ficará registrada na auditoria).
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={modalData.valor}
                    onChange={e => setModalData({ ...modalData, valor: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Data do Pagamento *</label>
                  <input
                    type="date"
                    required
                    value={modalData.data}
                    onChange={e => setModalData({ ...modalData, data: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancelar</button>
                <button type="submit" className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm ${
                  modalData.tipo === 'vendas' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}>
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
