import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings, CreditCard, Layers, Package, Home, Percent, Plus, Trash2, ClipboardList, Search
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
    auditLog
  } = useApp();

  const [activeConfigTab, setActiveConfigTab] = useState('comissoes');

  const configTabs = [
    { id: 'comissoes', label: 'Comissões', icon: Percent },
    { id: 'taxas', label: 'Taxas de Pagamento', icon: CreditCard },
    { id: 'planos', label: 'Planos', icon: Layers },
    { id: 'pacotes', label: 'Pacotes Adicionais', icon: Package },
    { id: 'aluguel', label: 'Aluguel', icon: Home },
    { id: 'auditoria', label: 'Auditoria', icon: ClipboardList },
  ];

  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('todos');

  const cellInputCls = "w-full bg-transparent px-1.5 py-1 text-xs focus:outline-none focus:bg-amber-50 dark:focus:bg-amber-950/30 focus:ring-1 focus:ring-amber-500 rounded transition-colors";

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
                    className="text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg w-full text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
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
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
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
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
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
                      className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-amber-200 dark:border-amber-900/40"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
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
                    className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
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
                      className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-amber-200 dark:border-amber-900/40"
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
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {dt.toLocaleDateString('pt-BR')} {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
