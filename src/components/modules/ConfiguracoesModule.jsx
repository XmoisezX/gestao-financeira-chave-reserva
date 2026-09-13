import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateBR, formatDateTimeBR } from '../../utils/formatters';
import {
  Settings, CreditCard, Layers, Package, Home, Percent, Plus, Trash2, ClipboardList, Search,
  Image, Upload, Globe, Check, AlertCircle, RefreshCcw, Palette, Key, ShieldCheck, Sparkles,
  Users, Calendar, Clock, DollarSign, Briefcase
} from 'lucide-react';

/* ─── Reusable Input Components ─── */
const CurrencyInput = ({ value, onChange, className }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!isFocused) setLocalValue(value);
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    onChange(Number(localValue));
  };

  const displayValue = isFocused
    ? localValue
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

  return (
    <input
      type={isFocused ? "number" : "text"}
      value={displayValue}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
    />
  );
};

const PercentInput = ({ value, onChange, className, isDecimal = true, isString = false }) => {
  const [isFocused, setIsFocused] = useState(false);

  const getPercentNum = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'string') {
      const cleaned = val.replace('%', '').replace(',', '.').trim();
      return parseFloat(cleaned) || 0;
    }
    const num = Number(val) || 0;
    return isDecimal ? num * 100 : num;
  };

  const [localValue, setLocalValue] = useState(() => getPercentNum(value));

  useEffect(() => {
    if (!isFocused) setLocalValue(getPercentNum(value));
  }, [value, isFocused, isDecimal]);

  const handleBlur = () => {
    setIsFocused(false);
    const numVal = parseFloat(localValue) || 0;
    if (isString) {
      const formatted = `${numVal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
      onChange(formatted);
    } else if (isDecimal) {
      onChange(Number((numVal / 100).toFixed(4)));
    } else {
      onChange(numVal);
    }
  };

  const displayValue = isFocused
    ? localValue
    : `${getPercentNum(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

  return (
    <input
      type={isFocused ? "number" : "text"}
      value={displayValue}
      onFocus={() => {
        setIsFocused(true);
        setLocalValue(getPercentNum(value));
      }}
      onBlur={handleBlur}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
    />
  );
};

/* ─── Module ─── */
export const ConfiguracoesModule = () => {
  const {
    premissas, taxasPagamento, planos, pacotes, aluguel, projecaoMensal, clientes,
    updatePremissaCell, updateTaxaCell,
    updatePlanoCell, addPlano, removePlano,
    updatePacoteCell, addPacote, removePacote,
    updateAluguelCell, addAluguel, removeAluguel,
    configEquipeOperacao, updateConfigEquipeItem, saveConfigEquipeOperacao,
    auditLog, addAuditLog,
    customBrand, updateCustomBrand, isAdmin
  } = useApp();

  const [activeConfigTab, setActiveConfigTab] = useState('comissoes');

  // Brand Identity Form State
  const [brandForm, setBrandForm] = useState({
    logoUrl: customBrand?.logoUrl || '',
    faviconUrl: customBrand?.faviconUrl || '',
    appName: customBrand?.appName || 'Chave Reserva'
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    setBrandForm({
      logoUrl: customBrand?.logoUrl || '',
      faviconUrl: customBrand?.faviconUrl || '',
      appName: customBrand?.appName || 'Chave Reserva'
    });
  }, [customBrand]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem do logo deve ter no máximo 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setBrandForm(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('O favicon deve ter no máximo 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setBrandForm(prev => ({ ...prev, faviconUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = (e) => {
    e?.preventDefault();
    if (!isAdmin) {
      alert('Apenas administradores podem alterar a identidade visual.');
      return;
    }
    updateCustomBrand(brandForm);
    if (addAuditLog) {
      addAuditLog('Identidade Visual', `Identidade visual atualizada (Nome: "${brandForm.appName}", Logo: ${brandForm.logoUrl ? 'Personalizado' : 'Padrão'}, Favicon: ${brandForm.faviconUrl ? 'Personalizado' : 'Padrão'}).`);
    }
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleResetBrand = () => {
    if (window.confirm('Deseja restaurar o logo e favicon padrões do sistema?')) {
      const defaultBrand = { logoUrl: '', faviconUrl: '', appName: 'Chave Reserva' };
      setBrandForm(defaultBrand);
      updateCustomBrand(defaultBrand);
      if (addAuditLog) {
        addAuditLog('Identidade Visual', 'Identidade visual restaurada para os padrões de fábrica.');
      }
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 3000);
    }
  };

  const [isEquipeSavedNotice, setIsEquipeSavedNotice] = useState(false);

  const configTabs = [
    { id: 'comissoes', label: 'Comissões', icon: Percent },
    { id: 'equipeOperacao', label: 'Pró-Labore & Equipe', icon: Users },
    { id: 'taxas', label: 'Taxas de Pagamento', icon: CreditCard },
    { id: 'planos', label: 'Planos', icon: Layers },
    { id: 'pacotes', label: 'Pacotes Adicionais', icon: Package },
    { id: 'aluguel', label: 'Aluguel', icon: Home },
    ...(isAdmin ? [{ id: 'identidade', label: 'Identidade Visual & Logo', icon: Palette }] : []),
    { id: 'auditoria', label: 'Auditoria', icon: ClipboardList },
  ];

  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('todos');

  const cellInputCls = "w-full bg-transparent px-1.5 py-1 text-xs focus:outline-none focus:bg-amber-50 dark:focus:bg-amber-950/30 focus:ring-1 focus:ring-brand-500 rounded transition-colors";

  // Filter premissas for comissões tab
  const comissoesPremissas = premissas.filter(pr => {
    const name = String(pr.premissa).toLowerCase();
    return name.includes('imposto') || name.includes('reserva de impostos') ||
           name.includes('comissão de vendas') || name.includes('comissao de vendas') ||
           name.includes('comissão de suporte') || name.includes('comissao de suporte') ||
           name.includes('comissão influenciador') || name.includes('comissao influenciador') ||
           name.includes('bônus venda anual') || name.includes('bonus venda anual');
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Configurações
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configurações globais de comissões, taxas, planos e produtos
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
        {configTabs.map((ct) => {
          const Icon = ct.icon;
          const isActive = activeConfigTab === ct.id;
          return (
            <button
              key={ct.id}
              onClick={() => setActiveConfigTab(ct.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {ct.label}
            </button>
          );
        })}
      </div>

      {/* ===== COMISSÕES ===== */}
      {activeConfigTab === 'comissoes' && (
        <div className="space-y-4">
          <div className="card p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Comissões e Impostos</h3>
            <p className="text-xs text-gray-400 mt-1">Configure os percentuais de comissões e reserva de impostos gerencial.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comissoesPremissas.map((pr) => {
              // Find the original index in premissas array
              const originalIdx = premissas.findIndex(p => p.premissa === pr.premissa);
              return (
                <div key={originalIdx} className="card p-4 flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{pr.premissa}</span>
                  <PercentInput
                    value={pr.valor}
                    isString={true}
                    onChange={(val) => updatePremissaCell(originalIdx, 'valor', val)}
                    className="text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg w-full text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TAXAS DE PAGAMENTO ===== */}
      {activeConfigTab === 'taxas' && (() => {
        // Compute real usage from clientes
        const clientesAtivos = clientes.filter(c => c.status === 'Ativo');
        const totalAtivos = clientesAtivos.length;
        const usoPorMetodo = {};
        clientesAtivos.forEach(c => {
          const metodo = c.metodoPagamento || 'Pix';
          usoPorMetodo[metodo] = (usoPorMetodo[metodo] || 0) + 1;
        });

        return (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Taxas dos Meios de Pagamento</h3>
              <p className="text-xs text-gray-400 mt-1">A coluna "Uso Real (%)" é calculada automaticamente com base nos métodos de pagamento dos clientes ativos cadastrados ({totalAtivos} clientes ativos).</p>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Método de Pagamento</th>
                  <th className="px-4 py-2.5 font-medium">Taxa Fixa (R$)</th>
                  <th className="px-4 py-2.5 font-medium">Taxa Variável (%)</th>
                  <th className="px-4 py-2.5 font-medium">Uso Real (%)</th>
                  <th className="px-4 py-2.5 font-medium">Clientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {taxasPagamento.map((t, idx) => {
                  const qtdClientes = usoPorMetodo[t.metodo] || 0;
                  const usoPct = totalAtivos > 0 ? ((qtdClientes / totalAtivos) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        <input
                          type="text"
                          value={t.metodo}
                          onChange={(e) => updateTaxaCell(idx, 'metodo', e.target.value)}
                          className={`${cellInputCls} font-semibold`}
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                        <input
                          type="number"
                          step="0.01"
                          value={t.taxaFixa}
                          onChange={(e) => updateTaxaCell(idx, 'taxaFixa', Number(e.target.value))}
                          className={cellInputCls}
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                        <PercentInput
                          value={t.taxaVar}
                          isDecimal={true}
                          onChange={(val) => updateTaxaCell(idx, 'taxaVar', val)}
                          className={cellInputCls}
                        />
                      </td>
                      <td className="px-4 py-2 font-medium">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          Number(usoPct) > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}>
                          {usoPct}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
                        {qtdClientes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* ===== PLANOS (sem Mix de Vendas) ===== */}
      {activeConfigTab === 'planos' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Planos de Assinatura</h3>
              <p className="text-xs text-gray-400">Configure os preços dos planos. O Mix de Vendas é definido na aba Metas.</p>
            </div>
            <button
              onClick={() => addPlano()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition-colors"
              title="Adicionar novo plano de assinatura"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Novo Plano</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planos.map((pl, idx) => (
              <div key={idx} className="card p-5 space-y-3 relative group">
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={pl.plano}
                    onChange={(e) => updatePlanoCell(idx, 'plano', e.target.value)}
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-brand-500"
                    placeholder="Nome do Plano"
                  />
                  {planos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlano(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Excluir Plano"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase">Preço Mensal (R$)</label>
                  <CurrencyInput
                    value={pl.mensal}
                    onChange={(val) => updatePlanoCell(idx, 'mensal', val)}
                    className="text-xl font-bold text-gray-900 dark:text-white bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Anual /mês (R$)</label>
                    <CurrencyInput
                      value={pl.anualMensal}
                      onChange={(val) => updatePlanoCell(idx, 'anualMensal', val)}
                      className="text-xs text-gray-600 dark:text-gray-300 bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Anual à Vista (R$)</label>
                    <CurrencyInput
                      value={pl.anualVista || (pl.anualMensal * 12)}
                      onChange={(val) => updatePlanoCell(idx, 'anualVista', val)}
                      className="text-xs text-gray-600 dark:text-gray-300 bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PACOTES ADICIONAIS (sem Mix) ===== */}
      {activeConfigTab === 'pacotes' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pacotes Adicionais</h3>
              <p className="text-xs text-gray-400">Configure os pacotes adicionais. O Mix de Vendas (%) é definido na aba Metas.</p>
            </div>
            <button
              onClick={() => addPacote()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition-colors"
              title="Adicionar novo pacote adicional"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Pacote Adicional</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pacotes.map((pc, idx) => (
              <div key={idx} className="card p-5 space-y-3 relative group">
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={pc.pacote}
                    onChange={(e) => updatePacoteCell(idx, 'pacote', e.target.value)}
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-brand-500"
                    placeholder="Nome do Pacote"
                  />
                  {pacotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePacote(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Excluir Pacote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Qtd Adicional</label>
                    <input
                      type="number"
                      value={pc.qtd || 1}
                      onChange={(e) => updatePacoteCell(idx, 'qtd', Number(e.target.value))}
                      className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Valor (R$)</label>
                    <CurrencyInput
                      value={pc.valor}
                      onChange={(val) => updatePacoteCell(idx, 'valor', val)}
                      className="text-sm font-bold text-gray-900 dark:text-white bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Vendido para a base</label>
                    <select
                      value={pc.vendidoBase || 'Sim'}
                      onChange={(e) => updatePacoteCell(idx, 'vendidoBase', e.target.value)}
                      className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                    >
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Previsão Lançamento</label>
                    <select
                      value={pc.previsaoLancamento || (projecaoMensal[0]?.month || 'Sep/2026')}
                      onChange={(e) => updatePacoteCell(idx, 'previsaoLancamento', e.target.value)}
                      className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-brand-200 dark:border-brand-900/40"
                    >
                      {projecaoMensal.map((p, mIdx) => (
                        <option key={mIdx} value={p.month}>{p.month}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ALUGUEL (sem Mix / Previsão Vendas) ===== */}
      {activeConfigTab === 'aluguel' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Módulos de Aluguel</h3>
              <p className="text-xs text-gray-400">Configure os preços dos módulos de aluguel. A previsão de vendas (%) é definida na aba Metas.</p>
            </div>
            <button
              onClick={() => addAluguel()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition-colors"
              title="Adicionar novo módulo de aluguel"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Módulo de Aluguel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aluguel.map((al, idx) => (
              <div key={idx} className="card p-5 space-y-3 relative group">
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={al.plano}
                    onChange={(e) => updateAluguelCell(idx, 'plano', e.target.value)}
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-brand-500"
                    placeholder="Nome do Módulo"
                  />
                  {aluguel.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAluguel(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Excluir Módulo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase">Preço Mensal (R$)</label>
                  <CurrencyInput
                    value={al.mensal}
                    onChange={(val) => updateAluguelCell(idx, 'mensal', val)}
                    className="text-xl font-bold text-gray-900 dark:text-white bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Anual /mês (R$)</label>
                    <CurrencyInput
                      value={al.anualMensal}
                      onChange={(val) => updateAluguelCell(idx, 'anualMensal', val)}
                      className="text-xs text-gray-600 dark:text-gray-300 bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Anual à Vista (R$)</label>
                    <CurrencyInput
                      value={al.anualVista || (al.anualMensal * 12)}
                      onChange={(val) => updateAluguelCell(idx, 'anualVista', val)}
                      className="text-xs text-gray-600 dark:text-gray-300 bg-transparent w-full focus:outline-none border-b border-gray-100 dark:border-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Vendido para a base</label>
                    <select
                      value={al.vendidoBase || 'Sim'}
                      onChange={(e) => updateAluguelCell(idx, 'vendidoBase', e.target.value)}
                      className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                    >
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase">Previsão Lançamento</label>
                    <select
                      value={al.previsaoLancamento || (projecaoMensal[0]?.month || 'Sep/2026')}
                      onChange={(e) => updateAluguelCell(idx, 'previsaoLancamento', e.target.value)}
                      className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-brand-200 dark:border-brand-900/40"
                    >
                      {projecaoMensal.map((p, mIdx) => (
                        <option key={mIdx} value={p.month}>{p.month}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PRÓ-LABORE & EQUIPE OPERACIONAL (OPERAÇÃO DIÁRIA) ===== */}
      {activeConfigTab === 'equipeOperacao' && (() => {
        const equipeList = configEquipeOperacao || [];
        const hojeStr = new Date().toISOString().split('T')[0];

        const isVigenteHoje = (dataInicio, dataFim, status) => {
          if (status === 'Inativo') return { status: 'inativo', label: 'Inativo', badgeClass: 'cr-badge-neutral' };
          if (dataInicio && hojeStr < dataInicio) {
            return { status: 'futuro', label: `Inicia em ${formatDateBR ? formatDateBR(dataInicio) : dataInicio}`, badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
          }
          if (dataFim && hojeStr > dataFim) {
            return { status: 'encerrado', label: `Encerrado em ${formatDateBR ? formatDateBR(dataFim) : dataFim}`, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
          }
          return { status: 'vigente', label: 'Vigente Agora', badgeClass: 'cr-badge-success' };
        };

        const totalCustoVigenteHoje = equipeList
          .filter(it => it.status !== 'Inativo' && (!it.dataInicio || hojeStr >= it.dataInicio) && (!it.dataFim || hojeStr <= it.dataFim))
          .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

        const totalSocios = equipeList
          .filter(it => it.id.startsWith('proLabore') && it.status !== 'Inativo' && (!it.dataInicio || hojeStr >= it.dataInicio) && (!it.dataFim || hojeStr <= it.dataFim))
          .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

        const totalOperacional = equipeList
          .filter(it => !it.id.startsWith('proLabore') && it.status !== 'Inativo' && (!it.dataInicio || hojeStr >= it.dataInicio) && (!it.dataFim || hojeStr <= it.dataFim))
          .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

        const ativasCount = equipeList
          .filter(it => it.status !== 'Inativo' && (!it.dataInicio || hojeStr >= it.dataInicio) && (!it.dataFim || hojeStr <= it.dataFim)).length;

        const handleSaveEquipe = () => {
          saveConfigEquipeOperacao(equipeList);
          if (addAuditLog) {
            addAuditLog('Configurações de Equipe', `Custos de pró-labore e equipe atualizados por ${isAdmin ? 'Admin' : 'Usuário'}. Total vigente: R$${totalCustoVigenteHoje.toFixed(2)}.`);
          }
          setIsEquipeSavedNotice(true);
          setTimeout(() => setIsEquipeSavedNotice(false), 3500);
        };

        const handleResetEquipe = () => {
          if (window.confirm('Deseja restaurar as configurações padrão de pró-labore e equipe da operação diária?')) {
            saveConfigEquipeOperacao(initialConfigEquipeOperacao);
            if (addAuditLog) {
              addAuditLog('Configurações de Equipe', 'Configurações de pró-labore e equipe restauradas para o padrão inicial.');
            }
            setIsEquipeSavedNotice(true);
            setTimeout(() => setIsEquipeSavedNotice(false), 3000);
          }
        };

        return (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-l-indigo-500">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Custos Fixos de Pró-Labore & Equipe (Operação Diária)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                  Defina os valores de remuneração mensal e as datas de início e término de vigência para cada função. 
                  Na DRE da Operação Diária, os custos incidirão estritamente durante o período contratual especificado.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetEquipe}
                  className="cr-btn cr-btn-secondary flex items-center gap-1.5 text-xs py-2"
                  title="Restaurar valores padrão"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Padrões
                </button>
                <button
                  type="button"
                  onClick={handleSaveEquipe}
                  className="cr-btn cr-btn-primary flex items-center gap-1.5 text-xs py-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </div>

            {/* Success Alert */}
            {isEquipeSavedNotice && (
              <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs animate-cr-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Configurações de Pró-Labore e Equipe salvas e sincronizadas no Supabase com sucesso!</span>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="cr-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Custo Mensal Vigente</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCustoVigenteHoje)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Soma das funções ativas hoje</p>
              </div>

              <div className="cr-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pró-Labore Sócios</span>
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSocios)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Dev, Gestor, Mkt e Fin vigentes</p>
              </div>

              <div className="cr-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipe Operacional</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOperacional)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Suporte, Apoio, SDR, Mkt Criação</p>
              </div>

              <div className="cr-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Funções Vigentes</span>
                  <Check className="w-4 h-4 text-brand-500" />
                </div>
                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                  {ativasCount} <span className="text-sm font-normal text-gray-400">de {equipeList.length}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Em vigência no mês atual</p>
              </div>
            </div>

            {/* Table Card */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="px-4 py-3">Função / Coluna Operação</th>
                      <th className="px-4 py-3">Descrição / Área</th>
                      <th className="px-4 py-3 min-w-[150px]">Remuneração Mensal (R$)</th>
                      <th className="px-4 py-3 min-w-[150px]">Data Início</th>
                      <th className="px-4 py-3 min-w-[150px]">Data Término</th>
                      <th className="px-4 py-3 min-w-[110px]">Status</th>
                      <th className="px-4 py-3 text-center">Situação Hoje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                    {equipeList.map((item) => {
                      const vigencia = isVigenteHoje(item.dataInicio, item.dataFim, item.status);
                      const isSocio = item.id.startsWith('proLabore');

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                isSocio 
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                              }`}>
                                {item.cargo}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {item.descricao}
                          </td>

                          <td className="px-4 py-3">
                            <div className="relative">
                              <CurrencyInput
                                value={item.valor}
                                onChange={(newVal) => updateConfigEquipeItem(item.id, 'valor', newVal)}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={item.dataInicio || ''}
                              onChange={(e) => updateConfigEquipeItem(item.id, 'dataInicio', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={item.dataFim || ''}
                                onChange={(e) => updateConfigEquipeItem(item.id, 'dataFim', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                              {item.dataFim && (
                                <button
                                  type="button"
                                  onClick={() => updateConfigEquipeItem(item.id, 'dataFim', '')}
                                  title="Remover data de término (manter indeterminado)"
                                  className="p-1 hover:text-red-500 text-gray-400 font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={item.status || 'Ativo'}
                              onChange={(e) => updateConfigEquipeItem(item.id, 'status', e.target.value)}
                              className="px-2 py-1.5 text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="Ativo">Ativo</option>
                              <option value="Inativo">Inativo</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${vigencia.badgeClass}`}>
                              {vigencia.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== IDENTIDADE VISUAL & LOGO (ADMIN ONLY) ===== */}
      {activeConfigTab === 'identidade' && isAdmin && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-l-amber-500">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Identidade Visual da Empresa</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <ShieldCheck className="w-3 h-3" /> Exclusivo Administrador
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Personalize o logotipo do canto superior esquerdo, o ícone da aba do navegador (favicon) e o nome exibido em todo o sistema.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetBrand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                title="Restaurar logo e favicon originais"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
              <button
                type="button"
                onClick={handleSaveBrand}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {isSavedNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">Identidade visual atualizada com sucesso em todo o sistema!</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Favicon e logo sincronizados</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Controls and Uploaders (7 cols) */}
            <div className="lg:col-span-7 space-y-5">

              {/* 1. Nome do Sistema */}
              <div className="card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Nome da Empresa / Sistema</h4>
                    <p className="text-[11px] text-gray-400">Exibido na barra lateral, tela de login e no título da aba do navegador.</p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={brandForm.appName}
                    onChange={e => setBrandForm({ ...brandForm, appName: e.target.value })}
                    placeholder="Ex: Chave Reserva"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors font-medium"
                  />
                </div>
              </div>

              {/* 2. Upload do Logo do Sistema */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">Logo do Sistema (Canto Superior Esquerdo)</h4>
                      <p className="text-[11px] text-gray-400">Substitui o ícone padrão de chave na barra lateral e na tela de login.</p>
                    </div>
                  </div>

                  {brandForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandForm({ ...brandForm, logoUrl: '' })}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover Logo</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {/* Drag & Drop / Click Upload Box */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-900/30 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    Clique para fazer upload do Logo
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Formatos suportados: PNG, SVG, JPG, WebP (Recomendado: imagem quadrada ou com fundo transparente, máx 3MB)
                  </p>
                </div>

                {/* Alternative: Image URL */}
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">
                    Ou cole a URL direta da imagem:
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={brandForm.logoUrl}
                      onChange={e => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                      placeholder="https://suaempresa.com/logo.png"
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Upload do Favicon da Aba do Navegador */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">Favicon da Aba do Navegador</h4>
                      <p className="text-[11px] text-gray-400">Ícone exibido na aba do navegador web ao lado do título da página.</p>
                    </div>
                  </div>

                  {brandForm.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandForm({ ...brandForm, faviconUrl: '' })}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover Favicon</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />

                {/* Drag & Drop / Click Upload Box */}
                <div
                  onClick={() => faviconInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-900/30 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 group"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    Clique para fazer upload do Favicon
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Formatos: .ICO, .PNG, .SVG (Recomendado: 32x32px ou 64x64px)
                  </p>
                </div>

                {/* Alternative: Favicon URL */}
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">
                    Ou cole a URL direta do favicon:
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={brandForm.faviconUrl}
                      onChange={e => setBrandForm({ ...brandForm, faviconUrl: e.target.value })}
                      placeholder="https://suaempresa.com/favicon.ico"
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Salvar no Rodapé */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveBrand}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar & Aplicar Identidade Visual</span>
                </button>
              </div>

            </div>

            {/* Right Column: Live Previews (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Preview 1: Browser Tab Mockup */}
              <div className="card p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-500" />
                    Prévia: Aba do Navegador
                  </span>
                  <span className="text-[10px] text-gray-400">Ao vivo</span>
                </div>

                {/* Chrome Window Mockup */}
                <div className="rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900 overflow-hidden shadow-sm">
                  {/* Browser top bar */}
                  <div className="px-3 pt-2 pb-0 flex items-center gap-2 bg-gray-200 dark:bg-gray-900">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
                    </div>

                    {/* Active tab */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-950 px-3 py-1.5 rounded-t-lg text-xs font-medium text-gray-900 dark:text-white max-w-[220px] shadow-xs border-t border-x border-gray-200 dark:border-gray-800">
                      {brandForm.faviconUrl ? (
                        <img
                          src={brandForm.faviconUrl}
                          alt="Favicon"
                          className="w-3.5 h-3.5 object-contain rounded shrink-0"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Key className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      )}
                      <span className="truncate text-[11px] font-semibold">
                        {brandForm.appName || 'Chave Reserva'} | Gestão
                      </span>
                      <span className="text-gray-400 hover:text-gray-600 text-[11px] ml-auto leading-none">×</span>
                    </div>
                  </div>

                  {/* Browser URL Bar */}
                  <div className="bg-white dark:bg-gray-950 px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">🔒 https</span>
                    <span className="truncate">app.{brandForm.appName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'chavereserva'}.com.br</span>
                  </div>
                </div>
              </div>

              {/* Preview 2: Sidebar Header Mockup (Light & Dark) */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-brand-500" />
                    Prévia: Menu Superior Esquerdo
                  </span>
                </div>

                {/* Light Mode Mock */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Modo Claro:</p>
                  <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center gap-2.5 shadow-xs">
                    {brandForm.logoUrl ? (
                      <img
                        src={brandForm.logoUrl}
                        alt="Logo Preview"
                        className="max-h-9 max-w-[170px] w-auto object-contain shadow-xs"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0 shadow-xs">
                          <Key className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight truncate">
                          Chave Reserva
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Dark Mode Mock */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Modo Escuro:</p>
                  <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center gap-2.5 shadow-xs">
                    {brandForm.logoUrl ? (
                      <img
                        src={brandForm.logoUrl}
                        alt="Logo Preview"
                        className="max-h-9 max-w-[170px] w-auto object-contain shadow-xs"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0 shadow-xs">
                          <Key className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight truncate">
                          Chave Reserva
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview 3: Login Header Mockup */}
              <div className="card p-4 space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-500" />
                  Prévia: Tela de Login
                </span>
                
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-center space-y-2">
                  {brandForm.logoUrl ? (
                    <img
                      src={brandForm.logoUrl}
                      alt="Logo Login"
                      className="max-h-14 max-w-[190px] w-auto object-contain mx-auto shadow-sm"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mx-auto shadow-sm">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                        Chave Reserva
                      </h5>
                    </>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Gestão Financeira, CRM & Projeção Estratégica
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ─── AUDITORIA TAB ─── */}
      {activeConfigTab === 'auditoria' && (
        <div className="card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                Log de Auditoria
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Histórico de todas as alterações realizadas no sistema</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 w-48" />
              </div>
              <select value={auditUserFilter} onChange={e => setAuditUserFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400">
                <option value="todos">Todos os usuários</option>
                {[...new Set((auditLog || []).map(a => a.user))].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium w-[160px]">Data / Hora</th>
                  <th className="px-4 py-2.5 font-medium w-[130px]">Usuário</th>
                  <th className="px-4 py-2.5 font-medium w-[180px]">Ação</th>
                  <th className="px-4 py-2.5 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(() => {
                  const filtered = (auditLog || []).filter(a => {
                    const matchUser = auditUserFilter === 'todos' || a.user === auditUserFilter;
                    const matchSearch = !auditSearch || a.action.toLowerCase().includes(auditSearch.toLowerCase()) || a.details.toLowerCase().includes(auditSearch.toLowerCase());
                    return matchUser && matchSearch;
                  });
                  if (filtered.length === 0) return (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      <ClipboardList className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                      Nenhum registro de auditoria encontrado.
                    </td></tr>
                  );
                  return filtered.map(a => {
                    const dt = new Date(a.timestamp);
                    const actionColors = {
                      'Cadastro de Cliente': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                      'Validação de Cliente': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
                      'Edição de Cliente': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                      'Churn de Cliente': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                      'Exclusão de Cliente': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                      'Edição de Data de Entrada': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                      'Lançamento de Comissão': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                      'Lançamento Diário': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
                    };
                    const colorCls = actionColors[a.action] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                          {formatDateTimeBR(a.timestamp)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{a.user}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colorCls}`}>{a.action}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 max-w-[400px]">{a.details}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 text-right">{(auditLog || []).length} registros totais (máximo 500)</p>
        </div>
      )}

    </div>
  );
};
