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
  DollarSign,
  Headphones
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, clientes, clientesAtivos, mrrTotalReal, user, isAdmin, isSupport, customBrand } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  // Calculate pending commissions
  const pendingComissoesCount = (clientes || []).filter(c => {
    if (c.status !== 'Ativo') return false;
    if (isAdmin) {
      return !c.comissaoVendaPaga || !c.comissaoSuportePaga;
    }
    const isSeller = c.vendedorResponsavel === user?.name || c.vendedorResponsavel === user?.email;
    const isSupportUser = c.suporteResponsavel === user?.name || c.suporteResponsavel === user?.email;
    const vendPendente = isSeller && !c.comissaoVendaPaga;
    const supPendente = isSupportUser && !c.comissaoSuportePaga;
    return vendPendente || supPendente;
  }).length;

  // Seller-specific vs Admin stats for the sidebar bottom-left KPIs
  const displayedClientesAtivos = (clientesAtivos || []).filter(c => {
    if (isAdmin) return true;
    const seller = (c.vendedorResponsavel || '').toLowerCase().trim();
    const uName = (user?.name || '').toLowerCase().trim();
    const uEmail = (user?.email || '').toLowerCase().trim();
    return (uName && seller === uName) || (uEmail && seller === uEmail);
  });

  const sidebarClientesCount = displayedClientesAtivos.length;
  const sidebarMrrTotal = isAdmin
    ? mrrTotalReal
    : displayedClientesAtivos.reduce((acc, c) => acc + Number(c.mrr || 0), 0);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'metas', label: 'Metas', icon: Target, adminOnly: true },
    { id: 'crm', label: 'Funil de Vendas', icon: Kanban },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'suporte', label: 'Suporte', icon: Headphones, supportOrAdminOnly: true },
    { id: 'comissoes', label: 'Comissões', icon: DollarSign, badge: pendingComissoesCount },
    { id: 'operacao', label: 'Operação Diária', icon: TrendingUp, adminOnly: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
    { id: 'funcionarios', label: 'Usuários', icon: Users, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (item.supportOrAdminOnly) return isAdmin || isSupport;
    return true;
  });

  return (
    <aside
      className={`
        sticky top-0 h-screen flex flex-col justify-between
        border-r transition-all duration-200 ease-in-out z-30
        ${collapsed ? 'w-[68px]' : 'w-[248px]'}
      `}
      style={{
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* Top Section: Logo + Nav */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* Brand */}
        <div
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} h-[60px] shrink-0 overflow-hidden`}
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          {customBrand?.logoUrl ? (
            <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'justify-start max-w-full'}`}>
              <img
                src={customBrand.logoUrl}
                alt="Logo"
                className={`object-contain ${collapsed ? 'max-h-8 max-w-[36px]' : 'max-h-10 max-w-[190px] w-auto'} transition-all brightness-0 invert`}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-white" />
              </div>
              {!collapsed && (
                <span className="text-[14px] font-bold text-white tracking-tight truncate">
                  Chave Reserva
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2.5 space-y-0.5">
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
                  relative w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150
                  ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                `}
                style={{
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--sidebar-text)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && <span className="cr-sidebar-indicator" />}

                <div className="relative shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                  {hasBadge && collapsed && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 animate-pulse" style={{ ringColor: 'var(--sidebar-bg)' }} />
                  )}
                </div>

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {hasBadge && (
                      <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* KPIs when expanded */}
        {!collapsed && (
          <div
            className="mx-3 mb-3 p-3.5 rounded-lg space-y-2.5 shrink-0"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--sidebar-border)',
            }}
          >
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--sidebar-text)' }}>
                {isAdmin ? 'Clientes Ativos' : 'Meus Clientes'}
              </span>
              <span className="font-semibold text-white">{sidebarClientesCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--sidebar-text)' }}>
                {isAdmin ? 'MRR Total' : 'Meu MRR'}
              </span>
              <span className="font-semibold text-white">
                R$ {sidebarMrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="p-2.5 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`
            w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
          `}
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--sidebar-text-hover)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--sidebar-text)';
            e.currentTarget.style.background = 'transparent';
          }}
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
