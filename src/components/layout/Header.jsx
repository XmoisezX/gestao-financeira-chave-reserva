import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeBR } from '../../utils/formatters';
import { ConfiguracoesModal } from '../user/ConfiguracoesModal';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  LayoutDashboard,
  Target,
  Kanban,
  Users,
  TrendingUp,
  Bell,
  DollarSign,
  Headphones,
  X
} from 'lucide-react';

const TAB_TITLES = {
  dashboard: { title: 'Dashboard', icon: LayoutDashboard },
  metas: { title: 'Centro de Metas', icon: Target },
  crm: { title: 'Funil de Vendas', icon: Kanban },
  clientes: { title: 'Clientes', icon: Users },
  suporte: { title: 'Suporte', icon: Headphones },
  comissoes: { title: 'Comissões', icon: DollarSign },
  operacao: { title: 'Operação Diária', icon: TrendingUp },
  configuracoes: { title: 'Configurações', icon: Settings },
  funcionarios: { title: 'Usuários', icon: Users },
};

export const Header = () => {
  const {
    user, logout, activeTab, setActiveTab, theme, toggleTheme,
    notificacoes, markNotificacaoAsRead, markAllNotificacoesAsRead, deleteNotificacao, isAdmin
  } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const activeInfo = TAB_TITLES[activeTab] || { title: 'Dashboard', icon: LayoutDashboard };
  const ActiveIcon = activeInfo.icon;

  const userNotificacoes = (notificacoes || []).filter(n => {
    if (n.destinatario === 'ALL') return true;
    if (isAdmin && n.destinatario === 'ADMIN') return true;
    return n.destinatario === user?.name || n.destinatario === user?.email;
  });

  const unreadCount = userNotificacoes.filter(n => !n.lida).length;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="h-[60px] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 transition-colors duration-200"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        
        {/* Left: Page Title */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-50)' }}
          >
            <ActiveIcon className="w-4 h-4" style={{ color: 'var(--brand-600)' }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {activeInfo.title}
            </h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notificações"
              className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-950 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl py-0 z-50 animate-cr-slideDown overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" style={{ color: 'var(--brand-500)' }} />
                    <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="cr-badge cr-badge-brand text-[10px]">
                        {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificacoesAsRead()}
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: 'var(--brand-500)' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {userNotificacoes.length === 0 ? (
                    <div className="py-10 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    userNotificacoes.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificacaoAsRead(n.id);
                          if (n.linkTab) setActiveTab(n.linkTab);
                          setNotifOpen(false);
                        }}
                        className="px-4 py-3 text-xs transition-colors cursor-pointer"
                        style={{
                          background: !n.lida ? 'var(--brand-50)' : 'transparent',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = !n.lida ? 'var(--brand-50)' : 'transparent'}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                background: n.tipo === 'comissao' ? 'var(--success)' : n.tipo === 'venda' ? 'var(--brand-500)' : 'var(--warning)',
                              }}
                            />
                            <p className="font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{n.titulo}</p>
                          </div>
                          <span className="text-[10px] shrink-0 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDateTimeBR(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {n.mensagem}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px mx-1" style={{ background: 'var(--border-default)' }} />

          {/* User Menu */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg transition-colors group cursor-pointer"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {user.photoUrl ? (
                  <div className="cr-avatar-ring">
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-8 h-8 rounded-full font-bold text-[11px] flex items-center justify-center"
                    style={{
                      background: 'var(--brand-100)',
                      color: 'var(--brand-700)',
                    }}
                  >
                    {user.avatar || (user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {user.role}
                  </p>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl py-1 z-30 animate-cr-slideDown text-xs overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  {/* User info */}
                  <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Settings className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span>Configurações do Perfil</span>
                  </button>

                  <div className="my-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }} />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Settings Modal */}
      <ConfiguracoesModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
