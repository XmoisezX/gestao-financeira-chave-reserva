import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Users, DollarSign, TrendingDown, Target, LayoutDashboard, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DashboardModule = () => {
  const {
    clientes, clientesAtivos, clientesChurned, mrrTotalReal, arpuMedioReal, churnRateReal,
    cacMedioReal, projecaoMensal, leads, theme, isAdmin, user, premissas
  } = useApp();

  const target = projecaoMensal[3] || projecaoMensal[0];
  const isDark = theme === 'dark';
  const tooltipStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#e5e7eb' }
    : { backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' };
  const gridStroke = isDark ? '#1f2937' : '#f3f4f6';
  const axisStroke = isDark ? '#6b7280' : '#9ca3af';

  // Helper for commission calculation
  const getCommissionForClient = (c, roleType = 'venda') => {
    const isAnualVista = c.modalidade === 'anualVista';
    const mrr = Number(c.mrr || 0);
    const parcelaBase = isAnualVista ? mrr : mrr;
    if (roleType === 'venda') {
      const pct = isAnualVista ? 0.70 : 0.50;
      return parcelaBase * pct * (1 - (c.desconto || 0) / 100);
    } else {
      return parcelaBase * 0.50 * (1 - (c.desconto || 0) / 100);
    }
  };

  // Seller specific data
  const myLeads = (leads || []).filter(l => {
    if (isAdmin || !user) return true;
    return l.vendedorResponsavel === user.name || l.responsavel === user.name || l.criadoPor === user.name || l.vendedorResponsavel === user.email;
  });

  const myClientes = (clientes || []).filter(c => {
    if (isAdmin || !user) return true;
    const isSeller = c.vendedorResponsavel === user.name || c.vendedorResponsavel === user.email;
    const isSupport = c.suporteResponsavel === user.name || c.suporteResponsavel === user.email;
    return isSeller || isSupport;
  });

  const myClientesAtivos = myClientes.filter(c => c.status === 'Ativo');
  const myMrrTotal = myClientesAtivos.reduce((acc, c) => acc + (Number(c.mrr) || 0), 0);

  // Seller commission calculations
  const myComissoesPendentes = myClientesAtivos.reduce((acc, c) => {
    let val = 0;
    const isSeller = c.vendedorResponsavel === user?.name || c.vendedorResponsavel === user?.email;
    const isSupport = c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email;
    if (isSeller && !c.comissaoVendaPaga) val += getCommissionForClient(c, 'venda');
    if (isSupport && !c.comissaoSuportePaga) val += getCommissionForClient(c, 'suporte');
    return acc + val;
  }, 0);

  const myComissoesPagas = myClientesAtivos.reduce((acc, c) => {
    let val = 0;
    const isSeller = c.vendedorResponsavel === user?.name || c.vendedorResponsavel === user?.email;
    const isSupport = c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email;
    if (isSeller && c.comissaoVendaPaga) val += getCommissionForClient(c, 'venda');
    if (isSupport && c.comissaoSuportePaga) val += getCommissionForClient(c, 'suporte');
    return acc + val;
  }, 0);

  const activePlanSource = isAdmin ? clientesAtivos : myClientesAtivos;
  const planCounts = activePlanSource.reduce((acc, c) => { acc[c.plano] = (acc[c.plano] || 0) + 1; return acc; }, {});
  const pieData = Object.keys(planCounts).map(p => ({ name: p, value: planCounts[p] }));

  const funnelStages = ['Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Fechado/Ganho', 'Perdido'];
  const activeLeadsSource = isAdmin ? leads : myLeads;
  const funnelData = funnelStages.map(s => ({ stage: s, total: activeLeadsSource.filter(l => l.estagio === s).length }));
  const wonCount = activeLeadsSource.filter(l => l.estagio === 'Fechado/Ganho').length;
  const myConversionRate = activeLeadsSource.length > 0 ? ((wonCount / activeLeadsSource.length) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isAdmin ? 'Dashboard Executivo' : `Painel de Vendas — ${user?.name || 'Vendedor'}`}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {isAdmin 
            ? 'Visão consolidada de vendas, clientes, projeções e saúde financeira da empresa'
            : 'Acompanhe seu funil individual, clientes fechados e suas comissões'}
        </p>
      </div>

      {/* KPI Row */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Clientes Ativos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clientesAtivos.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Meta: {target.clientesAtivosMeta}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">MRR Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {mrrTotalReal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Meta: R$ {target.mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Churn Rate</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{churnRateReal}%</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Premissa: 3%</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">CAC Médio</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {cacMedioReal > 0 ? cacMedioReal.toFixed(0) : '210'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Meta: R$ 250 → R$ 160</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Caixa Projetado</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {target.saldoCaixaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{target.month}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Meus Clientes Ativos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{myClientesAtivos.length}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{wonCount} convertidos</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Meu MRR Gerado</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {myMrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Assinaturas ativas</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Comissões a Receber</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              R$ {myComissoesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Aguardando liberação ADM</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Comissões Recebidas</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {myComissoesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Total já pago</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{myConversionRate}%</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{myLeads.length} leads no funil</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {isAdmin ? 'MRR vs Saldo de Caixa' : 'Distribuição do Meu Funil de Vendas'}
          </h3>
          <div className="h-72">
            {isAdmin ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projecaoMensal}>
                  <defs>
                    <linearGradient id="dMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="dCx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="mrrTotal" name="MRR Total" stroke="#f59e0b" fillOpacity={1} fill="url(#dMrr)" />
                  <Area type="monotone" dataKey="saldoCaixaAcumulado" name="Saldo Caixa" stroke="#10b981" fillOpacity={1} fill="url(#dCx)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="stage" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {isAdmin ? 'Planos Ativos (Geral)' : 'Meus Clientes por Plano'}
          </h3>
          <div className="h-52 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">Nenhum cliente ativo no momento</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
