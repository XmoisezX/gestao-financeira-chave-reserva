import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Key, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { login, theme, toggleTheme } = useApp();

  const [email, setEmail] = useState('moiseztorres100@gmail.com');
  const [password, setPassword] = useState('Geral123@');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err) {
      setError('Erro ao realizar autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('moiseztorres100@gmail.com');
    setPassword('Geral123@');
    setError('');
    setIsLoading(true);
    try {
      await login('moiseztorres100@gmail.com', 'Geral123@');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-center items-center p-4 transition-colors duration-200">
      
      {/* Top Brand Logo */}
      <div className="mb-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mx-auto shadow-md">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Chave Reserva
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Gestão Financeira, CRM & Projeção Estratégica
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Acesso ao Sistema</h2>
            <p className="text-[11px] text-gray-400">Entre com seu e-mail e senha cadastrados</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Acesso
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                placeholder="seu.email@empresa.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleQuickAdminLogin}
            className="w-full py-2 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200 dark:border-amber-800/60 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Entrar como Administrador (Moisés)</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-8 text-[11px] text-gray-400">
        Ambiente Seguro — Chave Reserva Gestão Financeira v1.0
      </p>

    </div>
  );
};
