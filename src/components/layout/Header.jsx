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
  TrendingUp
} from 'lucide-react';

const TAB_TITLES = {
  dashboard: { title: 'Dashboard', icon: LayoutDashboard },
  metas: { title: 'Centro de Metas', icon: Target },
  crm: { title: 'Funil de Vendas', icon: Kanban },
  clientes: { title: 'Clientes', icon: Users },
  operacao: { title: 'Operação Diária', icon: TrendingUp },
};

export const Header = () => {
  const { user, logout, activeTab, theme, toggleTheme } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeInfo = TAB_TITLES[activeTab] || { title: 'Dashboard', icon: LayoutDashboard };
  const ActiveIcon = activeInfo.icon;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
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

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

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
