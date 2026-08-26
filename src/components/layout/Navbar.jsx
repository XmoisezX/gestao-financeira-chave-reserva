import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  Kanban,
  Users,
  LayoutDashboard,
  TrendingUp,
  Settings,
  Key,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, clientes, clientesAtivos, mrrTotalReal, user, isAdmin } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  // Calculate pending commissions
  const pendingComissoesCount = (clientes || []).filter(c => {
    if (c.status !== 'Ativo') return false;
    if (isAdmin) {
      return !c.comissaoVendaPaga || !c.comissaoSuportePaga;
    }
    const isSeller = c.vendedorResponsavel === user?.name || c.vendedorResponsavel === user?.email;
    const isSupport = c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email;
    const vendPendente = isSeller && !c.comissaoVendaPaga;
    const supPendente = isSupport && !c.comissaoSuportePaga;
    return vendPendente || supPendente;
  }).length;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'metas', label: 'Metas', icon: Target, adminOnly: true },
    { id: 'crm', label: 'Funil de Vendas', icon: Kanban },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'comissoes', label: 'Comissões', icon: DollarSign, badge: pendingComissoesCount },
    { id: 'operacao', label: 'Operação Diária', icon: TrendingUp, adminOnly: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
    { id: 'funcionarios', label: 'Usuários', icon: Users, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`
        sticky top-0 h-screen flex flex-col justify-between
        border-r transition-all duration-200 ease-in-out z-30
        bg-white border-gray-200 dark:bg-gray-950 dark:border-gray-800
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Top Section: Logo + Nav */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
            <Key className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate">
              Chave Reserva
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasBadge = item.badge && item.badge > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? (hasBadge ? `${item.label} (${item.badge} pendentes)` : item.label) : undefined}
                className={`
                  relative w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors
                  ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60'
                  }
                `}
              >
                <div className="relative shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                  {hasBadge && collapsed && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950 animate-pulse"></span>
                  )}
                </div>

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {hasBadge && (
                      <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact KPIs — only when expanded */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">Clientes Ativos</span>
              <span className="font-semibold text-gray-900 dark:text-white">{clientesAtivos.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">MRR</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                R$ {mrrTotalReal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`
            w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors
            text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60
            ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
          `}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-[18px] h-[18px] shrink-0" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px] shrink-0" />
          )}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
};
