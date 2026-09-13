import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateBR, formatCurrencyBR } from '../../utils/formatters';
import {
  Headphones,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Phone,
  Mail,
  RefreshCw,
  Shield,
  UserCheck,
  Building,
  Settings,
  ArrowRight,
  Sliders
} from 'lucide-react';

export const SuporteModule = () => {
  const {
    clientes,
    updateCliente,
    funcionarios,
    addAuditLog,
    isAdmin,
    isSupport,
    user,
    roletaConfig,
    updateRoletaConfig,
    getRouletteSupportAgent
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('clientes'); // 'clientes' | 'roleta'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('all');
  const [reassignModalClient, setReassignModalClient] = useState(null);
  const [newAssignedAgent, setNewAssignedAgent] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Helper for seller/support avatar & info
  const getAgentInfo = (agentName) => {
    if (!agentName) return { name: '—', photoUrl: null, initial: '?' };
    const norm = agentName.toLowerCase().trim();
    if (user && ((user.name && user.name.toLowerCase().trim() === norm) || (user.email && user.email.toLowerCase().trim() === norm))) {
      return {
        name: user.name || agentName,
        photoUrl: user.photoUrl || null,
        initial: (user.name || agentName).charAt(0).toUpperCase()
      };
    }
    const found = (funcionarios || []).find(f => 
      (f.nome && f.nome.toLowerCase().trim() === norm) || 
      (f.email && f.email.toLowerCase().trim() === norm)
    );
    return {
      name: found?.nome || agentName,
      photoUrl: found?.photoUrl || null,
      initial: (found?.nome || agentName).charAt(0).toUpperCase()
    };
  };

  // Filter clients for support view
  const accessibleClientes = useMemo(() => {
    return (clientes || []).filter(c => {
      // Must be an active / validated client (or has support assigned)
      if (c.status !== 'Ativo' && !c.suporteResponsavel) return false;
      if (isAdmin) return true;
      // If user is support agent, show only their clients or all if allowed
      const isMySupport = c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email;
      return isMySupport;
    });
  }, [clientes, isAdmin, user]);

  const filteredClientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return accessibleClientes.filter(c => {
      const matchesSearch = !q || (
        (c.nome || '').toLowerCase().includes(q) ||
        (c.empresa || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.suporteResponsavel || '').toLowerCase().includes(q) ||
        (c.vendedorResponsavel || '').toLowerCase().includes(q)
      );
      const matchesAgent = selectedAgentFilter === 'all' || c.suporteResponsavel === selectedAgentFilter;
      return matchesSearch && matchesAgent;
    });
  }, [accessibleClientes, searchQuery, selectedAgentFilter]);

  // Statistics
  const totalClientesSuporte = accessibleClientes.length;
  const totalMrrSuporte = accessibleClientes.reduce((acc, c) => acc + (Number(c.mrr) || 0), 0);
  const myClientesCount = (clientes || []).filter(c => c.status === 'Ativo' && (c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email)).length;

  // Support Team List for Roulette
  const supportStaff = useMemo(() => {
    return (funcionarios || []).filter(f => {
      if (f.status !== 'Ativo') return false;
      const cargo = (f.cargo || '').toLowerCase();
      return cargo.includes('suporte') || cargo.includes('apoio técnico') || cargo.includes('administrador');
    });
  }, [funcionarios]);

  // Handle reassigning support agent (Admin only)
  const handleConfirmReassign = (e) => {
    e.preventDefault();
    if (!reassignModalClient || !newAssignedAgent) return;
    updateCliente(reassignModalClient.id, { suporteResponsavel: newAssignedAgent });
    if (addAuditLog) {
      addAuditLog(
        'Reatribuição de Suporte',
        `Cliente "${reassignModalClient.empresa || reassignModalClient.nome}" transferido de "${reassignModalClient.suporteResponsavel || 'Não definido'}" para "${newAssignedAgent}".`
      );
    }
    setReassignModalClient(null);
    setNewAssignedAgent('');
  };

  // Toggle agent in roulette
  const handleToggleRouletteAgent = (agentId) => {
    if (!isAdmin) return;
    const inativos = roletaConfig?.participantesInativos || [];
    let updated;
    if (inativos.includes(agentId)) {
      updated = inativos.filter(id => id !== agentId);
    } else {
      updated = [...inativos, agentId];
    }
    updateRoletaConfig({ participantesInativos: updated });
    if (addAuditLog) {
      const agent = (funcionarios || []).find(f => f.id === agentId);
      addAuditLog('Configuração da Roleta', `Agente de suporte "${agent?.nome || agentId}" ${inativos.includes(agentId) ? 'ativado na' : 'removido da'} roleta.`);
    }
  };

  // Simulate Roulette
  const handleSimulateRoulette = () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setTimeout(() => {
      const chosen = getRouletteSupportAgent ? getRouletteSupportAgent() : 'Suporte';
      setSimulationResult(chosen);
      setIsSimulating(false);
    }, 600);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Suporte ao Cliente</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin 
              ? 'Gestão de clientes validados, responsáveis pelo atendimento e controle da roleta automática.'
              : `Seus clientes validados em atendimento de suporte — ${user?.name || 'Suporte'}`}
          </p>
        </div>

        {/* View Switcher Tabs (Only Admin can access Roleta Configuration) */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveSubTab('clientes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'clientes'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Clientes Validados
            </button>
            <button
              onClick={() => setActiveSubTab('roleta')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'roleta'
                  ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Configuração da Roleta
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isAdmin ? 'Clientes em Suporte' : 'Meus Clientes em Suporte'}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalClientesSuporte}
          </p>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            {isAdmin ? 'Todos validados' : 'Atribuídos a você'}
          </span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">MRR Sob Suporte</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrencyBR(totalMrrSuporte)}
          </p>
          <span className="text-[10px] text-gray-400">Receita recorrente ativa</span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Equipe na Roleta</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {supportStaff.filter(s => !(roletaConfig?.participantesInativos || []).includes(s.id)).length}
          </p>
          <span className="text-[10px] text-gray-400">Membros ativos na fila</span>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Modo da Roleta</p>
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-2 truncate">
            {roletaConfig?.modo === 'sequencial'
              ? 'Fila 1 para Cada'
              : roletaConfig?.modo === 'aleatorio'
              ? 'Aleatório Ponderado'
              : 'Distribuição Equilibrada'}
          </p>
          <span className="text-[10px] text-gray-400">
            {roletaConfig?.modo === 'sequencial' ? 'Sem repetições consecutivas' : 'Menor sobrecarga'}
          </span>
        </div>
      </div>

      {/* ─── VIEW 1: CLIENTES VALIDADOS EM SUPORTE ─── */}
      {activeSubTab === 'clientes' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, empresa, suporte ou vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">Todos os Agentes de Suporte</option>
                  {supportStaff.map(agent => (
                    <option key={agent.id} value={agent.nome}>{agent.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente & Empresa</th>
                  <th className="px-4 py-3 font-medium">Responsável Suporte</th>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Plano & MRR</th>
                  <th className="px-4 py-3 font-medium">Modalidade</th>
                  <th className="px-4 py-3 font-medium">Data Entrada</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin && <th className="px-4 py-3 font-medium text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Headphones className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
                        <p className="text-xs font-medium">Nenhum cliente em suporte encontrado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c) => {
                    const supportInfo = getAgentInfo(c.suporteResponsavel);
                    const sellerInfo = getAgentInfo(c.vendedorResponsavel);

                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                        {/* Cliente */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">{c.nome}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 shrink-0" />
                            {c.empresa || 'Pessoa Física'}
                          </p>
                          {(c.telefone || c.email) && (
                            <div className="flex items-center gap-2 mt-1 text-[10.5px] text-gray-500 dark:text-gray-400">
                              {c.telefone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{c.telefone}</span>}
                              {c.email && <span className="flex items-center gap-0.5 truncate max-w-[140px]"><Mail className="w-2.5 h-2.5" />{c.email}</span>}
                            </div>
                          )}
                        </td>

                        {/* Suporte Responsável */}
                        <td className="px-4 py-3">
                          {c.suporteResponsavel ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50">
                              {supportInfo.photoUrl ? (
                                <img src={supportInfo.photoUrl} alt={supportInfo.name} className="w-5 h-5 rounded-full object-cover shrink-0 border border-teal-300 dark:border-teal-700" onError={e => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {supportInfo.initial}
                                </div>
                              )}
                              <span className="font-semibold text-teal-800 dark:text-teal-300 text-xs">
                                {supportInfo.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Pendente de Roleta</span>
                          )}
                        </td>

                        {/* Vendedor */}
                        <td className="px-4 py-3">
                          {c.vendedorResponsavel ? (
                            <div className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              {sellerInfo.photoUrl ? (
                                <img src={sellerInfo.photoUrl} alt={sellerInfo.name} className="w-4 h-4 rounded-full object-cover shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {sellerInfo.initial}
                                </div>
                              )}
                              <span className="text-xs">{sellerInfo.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Plano & MRR */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{c.plano}</p>
                          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrencyBR(c.mrr)}<span className="text-[9px] font-normal text-gray-400">/mês</span>
                          </p>
                        </td>

                        {/* Modalidade */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                            c.modalidade === 'anualVista'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-brand-200 dark:border-brand-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {c.modalidade === 'anualVista' ? 'Anual à Vista' : c.modalidade === 'anualParcelado' ? 'Anual Parcelado' : 'Mensal Recorrente'}
                          </span>
                        </td>

                        {/* Data Entrada */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 font-medium">
                          {formatDateBR(c.dataEntrada)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {c.status || 'Ativo'}
                          </span>
                        </td>

                        {/* Ações (Admin) */}
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setReassignModalClient(c);
                                setNewAssignedAgent(c.suporteResponsavel || (supportStaff[0]?.nome || ''));
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors"
                              title="Transferir ou Reatribuir Responsável pelo Suporte"
                            >
                              Transferir Suporte
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VIEW 2: CONFIGURAÇÃO DA ROLETA AUTOMÁTICA ─── */}
      {activeSubTab === 'roleta' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-teal-950 dark:text-teal-200">
                  Roleta Automática de Distribuição de Suporte
                </h3>
                <p className="text-xs text-teal-800 dark:text-teal-300 mt-0.5">
                  Distribui os novos clientes validados de forma justa e balanceada entre a equipe de suporte.
                </p>
              </div>
            </div>

            {/* Test Simulation Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {simulationResult && (
                <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 animate-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Próximo na fila: <strong>{simulationResult}</strong>
                </div>
              )}
              <button
                onClick={handleSimulateRoulette}
                disabled={isSimulating}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                {isSimulating ? 'Girando Roleta...' : 'Testar / Girar Roleta'}
              </button>
            </div>
          </div>

          {/* Mode Selector (Admin only) */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-500" /> Algoritmo de Distribuição
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Escolha como a roleta escolhe o membro da equipe ao validar uma nova venda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção 1: Fila Sequencial 1 para cada sem repetir */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                roletaConfig?.modo === 'sequencial' || !roletaConfig?.modo
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/50 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="roletaModo"
                  value="sequencial"
                  checked={roletaConfig?.modo === 'sequencial' || !roletaConfig?.modo}
                  disabled={!isAdmin}
                  onChange={() => isAdmin && updateRoletaConfig({ modo: 'sequencial' })}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Fila Sequencial (1 para cada)
                    </p>
                    <span className="px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[9px] font-bold">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Distribui <strong>1 cliente por vez para cada usuário</strong> em ordem circular contínua, sem repetir ninguém até que todos da fila tenham recebido.
                  </p>
                </div>
              </label>

              {/* Opção 2: Distribuição Equilibrada por Carga */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                roletaConfig?.modo === 'balanceado'
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/50 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="roletaModo"
                  value="balanceado"
                  checked={roletaConfig?.modo === 'balanceado'}
                  disabled={!isAdmin}
                  onChange={() => isAdmin && updateRoletaConfig({ modo: 'balanceado' })}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Distribuição Equilibrada
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Entrega o próximo cliente automaticamente ao membro com a <strong>menor quantidade total de clientes ativos</strong> no momento.
                  </p>
                </div>
              </label>

              {/* Opção 3: Roleta Aleatória */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                roletaConfig?.modo === 'aleatorio'
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/50 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="roletaModo"
                  value="aleatorio"
                  checked={roletaConfig?.modo === 'aleatorio'}
                  disabled={!isAdmin}
                  onChange={() => isAdmin && updateRoletaConfig({ modo: 'aleatorio' })}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Roleta Aleatória Pura
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Sorteia aleatoriamente entre todos os membros ativos da fila da roleta a cada nova validação.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Members Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Participantes da Roleta de Suporte
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin 
                    ? 'Ative ou pause a participação de cada profissional na fila da roleta automática.' 
                    : 'Membros da equipe que estão ativos na fila de atendimento.'}
                </p>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Membro da Equipe</th>
                  <th className="px-4 py-3 font-medium">Cargos Designados</th>
                  <th className="px-4 py-3 font-medium">Clientes Ativos Atuais</th>
                  <th className="px-4 py-3 font-medium">Status na Roleta</th>
                  {isAdmin && <th className="px-4 py-3 font-medium text-right">Controle</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {supportStaff.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-400">
                      Nenhum profissional com cargo de Suporte cadastrado em Usuários.
                    </td>
                  </tr>
                ) : (
                  supportStaff.map(agent => {
                    const isPaused = (roletaConfig?.participantesInativos || []).includes(agent.id);
                    const activeClientsCount = (clientes || []).filter(c => c.status === 'Ativo' && c.suporteResponsavel === agent.nome).length;
                    const agentInfo = getAgentInfo(agent.nome);

                    return (
                      <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {agentInfo.photoUrl ? (
                              <img src={agentInfo.photoUrl} alt={agent.nome} className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700" onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {agentInfo.initial}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{agent.nome}</p>
                              <p className="text-[11px] text-gray-400">{agent.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(agent.cargo || '').split(',').map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-medium border border-indigo-100 dark:border-indigo-900/50">
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {activeClientsCount}
                          </span>
                          <span className="text-gray-400 text-[11px] ml-1">clientes</span>
                        </td>

                        <td className="px-4 py-3">
                          {!isPaused ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Ativo na Roleta
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Pausado / Fora da Fila
                            </span>
                          )}
                        </td>

                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleToggleRouletteAgent(agent.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                !isPaused
                                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 border border-red-200 dark:border-red-900/50'
                                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/50'
                              }`}
                            >
                              {!isPaused ? 'Pausar da Roleta' : 'Ativar na Roleta'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REASSIGN SUPPORT MODAL (ADMIN ONLY) */}
      {reassignModalClient && (
        <div className="cr-modal-overlay">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Transferir Responsável pelo Suporte
              </h3>
              <button onClick={() => setReassignModalClient(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg w-6 h-6 flex items-center justify-center rounded">×</button>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{reassignModalClient.nome}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{reassignModalClient.empresa} · {reassignModalClient.plano}</p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">
                  Suporte Atual: <strong>{reassignModalClient.suporteResponsavel || 'Nenhum'}</strong>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Novo Responsável pelo Suporte
                </label>
                <select
                  value={newAssignedAgent}
                  onChange={(e) => setNewAssignedAgent(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Selecione o profissional...</option>
                  {supportStaff.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome} ({s.cargo})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignModalClient(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
