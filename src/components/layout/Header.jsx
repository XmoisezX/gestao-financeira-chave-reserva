import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  Cloud,
  RefreshCw,
  Check,
  Bell,
  DollarSign
} from 'lucide-react';

const TAB_TITLES = {
  dashboard: { title: 'Dashboard', icon: LayoutDashboard },
  metas: { title: 'Centro de Metas', icon: Target },
  crm: { title: 'Funil de Vendas', icon: Kanban },
  clientes: { title: 'Clientes', icon: Users },
  operacao: { title: 'Operação Diária', icon: TrendingUp },
};

export const Header = () => {
  const {
    user, logout, activeTab, setActiveTab, theme, toggleTheme,
    isSyncing, lastSyncedAt, pushLocalStateToSupabase,
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
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 transition-colors duration-200">
        
        {/* Left Section: Active View Title */}
        <div className="flex items-center gap-2">
          <ActiveIcon className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
            {activeInfo.title}
          </h2>
        </div>

        {/* Right Section (Canto Superior Direito) */}
        <div className="flex items-center gap-3">

          {/* Cloud Sync Button / Indicator */}
          <button
            onClick={async () => {
              const res = await pushLocalStateToSupabase();
              if (res?.success) {
                alert('Dados sincronizados com o Supabase com sucesso! Todas as alterações estão na nuvem.');
              }
            }}
            disabled={isSyncing}
            title={lastSyncedAt ? `Última sincronização: ${lastSyncedAt.toLocaleTimeString('pt-BR')}` : 'Sincronizar com a nuvem'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Salvar na Nuvem'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notificações"
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-950 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold">
                        {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificacoesAsRead()}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {userNotificacoes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
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
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                          !n.lida ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {n.tipo === 'comissao' && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>}
                            {n.tipo === 'venda' && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>}
                            {n.tipo !== 'comissao' && n.tipo !== 'venda' && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                            <p className="font-semibold text-gray-900 dark:text-white leading-tight">{n.titulo}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {n.mensagem}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800"></div>

          {/* User Menu Dropdown (Canto Superior Direito) */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors group cursor-pointer"
              >
                {/* Photo / Avatar */}
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-500 shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center border border-amber-400 shrink-0">
                    {user.avatar || 'MT'}
                  </div>
                )}

                {/* User Name & Role */}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-normal">
                    {user.role}
                  </p>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 z-30 text-xs animate-in">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
                  </div>

                  {/* Options */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Configurações do Perfil</span>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-800"></div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
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
