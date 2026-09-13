import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Users, DollarSign, TrendingDown, Target, LayoutDashboard, CheckCircle, Clock, TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';

const CHART_COLORS = ['#3B63F2', '#059669', '#D97706', '#7C3AED', '#EC4899'];

export const DashboardModule = () => {
  const {
    clientes, clientesAtivos, clientesChurned, mrrTotalReal, arpuMedioReal, churnRateReal,
    cacMedioReal, projecaoMensal, leads, theme, isAdmin, user, premissas
  } = useApp();

  const target = projecaoMensal[3] || projecaoMensal[0];
  const isDark = theme === 'dark';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0F1724' : '#fff',
    borderColor: isDark ? '#1E293B' : '#E5E7EB',
    borderRadius: '8px',
    color: isDark ? '#F1F5F9' : '#111827',
    fontSize: '12px',
    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
  };
  const gridStroke = isDark ? '#1E293B' : '#F0F1F3';
  const axisStroke = isDark ? '#64748B' : '#9CA3AF';

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

  const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, subColor }) => (
    <div className="cr-kpi">
      <div className="flex items-start justify-between">
        <div className="cr-kpi-icon" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-[26px] font-bold mt-3 leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && (
        <p className="text-[11px] mt-1 font-medium" style={{ color: subColor || 'var(--text-tertiary)' }}>{sub}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-cr-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {isAdmin ? 'Dashboard Executivo' : `Painel de Vendas — ${user?.name || 'Vendedor'}`}
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin 
            ? 'Visão consolidada de vendas, clientes, projeções e saúde financeira da empresa'
            : 'Acompanhe seu funil individual, clientes fechados e suas comissões'}
        </p>
      </div>

      {/* KPI Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={Users}
            iconBg="var(--brand-50)"
            iconColor="var(--brand-600)"
            label="Clientes Ativos"
            value={clientesAtivos.length}
            sub={`Meta: ${target.clientesAtivosMeta}`}
          />
          <KpiCard
            icon={DollarSign}
            iconBg="var(--success-light)"
            iconColor="var(--success)"
            label="MRR Total"
            value={`R$ ${mrrTotalReal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            sub={`Meta: R$ ${target.mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          />
          <KpiCard
            icon={TrendingDown}
            iconBg="var(--danger-light)"
            iconColor="var(--danger)"
            label="Churn Rate"
            value={`${churnRateReal}%`}
            sub="Premissa: 3%"
            subColor="var(--danger)"
          />
          <KpiCard
            icon={Target}
            iconBg="var(--warning-light)"
            iconColor="var(--warning)"
            label="CAC Médio"
            value={`R$ ${cacMedioReal > 0 ? cacMedioReal.toFixed(0) : '210'}`}
            sub="Meta: R$ 250 → R$ 160"
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="var(--purple-light)"
            iconColor="var(--purple)"
            label="Caixa Projetado"
            value={`R$ ${target.saldoCaixaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            sub={target.month}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={Users}
            iconBg="var(--brand-50)"
            iconColor="var(--brand-600)"
            label="Meus Clientes Ativos"
            value={myClientesAtivos.length}
            sub={`${wonCount} convertidos`}
            subColor="var(--success)"
          />
          <KpiCard
            icon={DollarSign}
            iconBg="var(--success-light)"
            iconColor="var(--success)"
            label="Meu MRR Gerado"
            value={`R$ ${myMrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            sub="Assinaturas ativas"
          />
          <KpiCard
            icon={Clock}
            iconBg="var(--warning-light)"
            iconColor="var(--warning)"
            label="Comissões a Receber"
            value={`R$ ${myComissoesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub="Aguardando liberação ADM"
            subColor="var(--warning)"
          />
          <KpiCard
            icon={CheckCircle}
            iconBg="var(--success-light)"
            iconColor="var(--success)"
            label="Comissões Recebidas"
            value={`R$ ${myComissoesPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub="Total já pago"
            subColor="var(--success)"
          />
          <KpiCard
            icon={BarChart3}
            iconBg="var(--purple-light)"
            iconColor="var(--purple)"
            label="Taxa de Conversão"
            value={`${myConversionRate}%`}
            sub={`${myLeads.length} leads no funil`}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main Chart */}
        <div className="lg:col-span-2 cr-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--brand-500)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isAdmin ? 'MRR vs Saldo de Caixa' : 'Distribuição do Meu Funil de Vendas'}
            </h3>
          </div>
          <div className="h-72">
            {isAdmin ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projecaoMensal}>
                  <defs>
                    <linearGradient id="dMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B63F2" stopOpacity={0.12}/><stop offset="95%" stopColor="#3B63F2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="dCx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.12}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} tick={{ fontSize: 11 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="mrrTotal" name="MRR Total" stroke="#3B63F2" strokeWidth={2} fillOpacity={1} fill="url(#dMrr)" />
                  <Area type="monotone" dataKey="saldoCaixaAcumulado" name="Saldo Caixa" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#dCx)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="stage" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Leads" fill="#3B63F2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="cr-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <PieIcon className="w-4 h-4" style={{ color: 'var(--brand-500)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isAdmin ? 'Planos Ativos (Geral)' : 'Meus Clientes por Plano'}
            </h3>
          </div>
          <div className="h-52 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={2} stroke={isDark ? '#0F1724' : '#fff'}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nenhum cliente ativo no momento</p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
            {pieData.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
