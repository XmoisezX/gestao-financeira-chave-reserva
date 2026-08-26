import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Users, DollarSign, TrendingDown, Target, LayoutDashboard } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DashboardModule = () => {
  const {
    clientesAtivos, clientesChurned, mrrTotalReal, arpuMedioReal, churnRateReal,
    cacMedioReal, projecaoMensal, leads, theme
  } = useApp();

  const target = projecaoMensal[3] || projecaoMensal[0];
  const isDark = theme === 'dark';
  const tooltipStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#e5e7eb' }
    : { backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' };
  const gridStroke = isDark ? '#1f2937' : '#f3f4f6';
  const axisStroke = isDark ? '#6b7280' : '#9ca3af';

  const planCounts = clientesAtivos.reduce((acc, c) => { acc[c.plano] = (acc[c.plano] || 0) + 1; return acc; }, {});
  const pieData = Object.keys(planCounts).map(p => ({ name: p, value: planCounts[p] }));

  const funnelStages = ['Lead', 'Contato Feito', 'Proposta Enviada', 'Negociação', 'Fechado/Ganho', 'Perdido'];
  const funnelData = funnelStages.map(s => ({ stage: s, total: leads.filter(l => l.estagio === s).length }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visão consolidada de vendas, clientes e projeção</p>
      </div>

      {/* KPI Row */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">MRR vs Saldo de Caixa</h3>
          <div className="h-72">
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
          </div>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Planos Ativos</h3>
          <div className="h-52 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">Sem dados</p>
            )}
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>ARPU Médio</span>
              <span className="font-semibold text-gray-900 dark:text-white">R$ {arpuMedioReal.toFixed(0)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline do Funil de Vendas</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="stage" stroke={axisStroke} tick={{ fontSize: 10 }} />
              <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" name="Oportunidades" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
