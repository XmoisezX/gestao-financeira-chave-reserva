import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Key, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { login, theme, toggleTheme, customBrand } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="cr-login-bg min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-200">
      
      {/* Logo / Brand */}
      <div className="mb-10 text-center animate-cr-fadeIn">
        {customBrand?.logoUrl ? (
          <img
            src={customBrand.logoUrl}
            alt="Logo"
            className="max-h-16 max-w-[220px] w-auto object-contain mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20 mb-4">
              <Key className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Chave Reserva
            </h1>
          </>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          Gestão Financeira, CRM & Projeção Estratégica
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[400px] cr-card p-0 animate-cr-slideUp" style={{ boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Card Header */}
        <div className="px-7 pt-7 pb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Acesso ao Sistema</h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Entre com seu e-mail e senha cadastrados
          </p>
        </div>

        <div className="px-7 pb-7">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-[13px] flex items-start gap-2.5 animate-cr-scaleIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="cr-label">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cr-input pl-10"
                  placeholder="seu.email@empresa.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="cr-label">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cr-input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="cr-btn cr-btn-primary w-full py-2.5 text-sm font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-[11px] text-gray-400 dark:text-gray-500">
        Ambiente Seguro — Chave Reserva v1.0
      </p>
    </div>
  );
};
