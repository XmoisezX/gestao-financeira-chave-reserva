import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import {
  FileText, BarChart3, CreditCard, Award, Target, Home, Layers, Package, Server, Users, Sliders, Edit2, RotateCcw, Check, Plus, Trash2,
  HelpCircle, Info, BookOpen, ChevronDown, ChevronUp, Sparkles, Lock, Unlock
} from 'lucide-react';

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
    if (!isFocused) {
      setLocalValue(getPercentNum(value));
    }
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

export const MetasModule = () => {
  const {
    activeSubTab, setActiveSubTab, projecaoMensal, planos, aluguel, pacotes, equipe,
    infraestrutura, aquisicao, premissas, taxasPagamento, resumoExecutivo, theme,
    updateProjecaoMensalCell, addProjecaoMonth, removeProjecaoMonth, toggleLockNovos,
    updatePlanoCell, addPlano, removePlano, updateAluguelCell, addAluguel, removeAluguel, updatePacoteCell, addPacote, removePacote,
    updateEquipeCell, updateInfraCell, updateAquisicaoCell, updatePremissaCell,
    updateTaxaCell, updateResumoCell, resetAllData
  } = useApp();

  const subTabs = [
    { id: 'projecao', label: 'Projeção Mensal', icon: FileText },
    { id: 'dashboard_metas', label: 'Dashboard', icon: BarChart3 },
    { id: 'taxas', label: 'Taxas de Pagamento', icon: CreditCard },
    { id: 'resumo', label: 'Resumo Executivo', icon: Award },
    { id: 'aquisicao', label: 'Aquisição', icon: Target },
    { id: 'aluguel', label: 'Aluguel', icon: Home },
    { id: 'planos', label: 'Planos', icon: Layers },
    { id: 'pacotes', label: 'Pacotes Adicionais', icon: Package },
    { id: 'infra', label: 'Infraestrutura', icon: Server },
    { id: 'equipe', label: 'Equipe', icon: Users },
    { id: 'premissas', label: 'Premissas', icon: Sliders }
  ];

  const isDark = theme === 'dark';
  const tooltipStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#e5e7eb' }
    : { backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' };
  const gridStroke = isDark ? '#1f2937' : '#f3f4f6';
  const axisStroke = isDark ? '#6b7280' : '#9ca3af';

  const cellInputCls = "w-full bg-transparent px-1.5 py-1 text-xs focus:outline-none focus:bg-amber-50 dark:focus:bg-amber-950/30 focus:ring-1 focus:ring-amber-500 rounded transition-colors";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Centro de Metas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Projeção financeira unificada · Todos os campos e sub-abas são totalmente editáveis
          </p>
        </div>
      </div>

      {/* Sub-tab pills */}
      <div className="flex flex-wrap gap-1.5">
        {subTabs.map(st => {
          const Icon = st.icon;
          const isActive = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== PROJEÇÃO MENSAL ===== */}
      {activeSubTab === 'projecao' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Projeção Financeira Mensal (Editável)</h2>
              <p className="text-[11px] text-gray-400">Passe o mouse sobre os títulos das colunas com ícone para ver o cálculo detalhado</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addProjecaoMonth}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors shrink-0"
                title="Adicionar próximo mês à projeção"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Mês</span>
              </button>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> Edição em tempo real ativada
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-3 py-2.5 font-medium sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 min-w-[80px]" title="1. Mês&#10;• De onde sai o número: É a linha do tempo (cronograma) do seu planejamento financeiro.&#10;• Como é calculated: É uma sequência direta de meses, começando em setembro de 2026 (Sep/2026) e avançando mês a mês até dezembro de 2027 (Dec/2027). Clique no botão + ao lado do último mês para adicionar os meses seguintes.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Mês</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]" title="2. Clientes ativos&#10;• De onde sai o número: Depende do histórico do mês anterior e do crescimento do mês atual.&#10;• Como é calculado: No primeiro mês (Sep/2026), começa igual à meta de novos clientes líquidos (5). Nos meses seguintes: Clientes ativos (do mês anterior) + Novos líquidos meta (do mês atual).&#10;• Exemplo prático (Out/2026): Tinha 5 clientes em setembro e a meta líquida era somar 7. Logo, 5 + 7 = 12 clientes ativos.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Clientes Meta</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]" title="3. Churn (Cancelamentos)&#10;• De onde sai o número: É calculado aplicando a taxa de cancelamento estipulada na tabela de Premissas sobre a base de clientes do mês anterior/atual.&#10;• Como é calculado: Clientes ativos × Taxa de Churn mensal (3,00%), arredondado (>= 0.5 arredonda para cima, < 0.5 para baixo).&#10;• Exemplo prático (Fev/2027): 60 clientes × 3% = 1,8 → arredondado resulta em 2 cancelamentos.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Churn</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[110px]" title="4. Novos líquidos meta&#10;• De onde sai o número: Meta de crescimento real (saldo líquido) inserida pelo usuário. Use o ícone de cadeado na célula para fixar o valor.&#10;• Como é calculado: É um valor inserido pelo usuário como objetivo estratégico de crescimento.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Novos Liq</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[105px]" title="5. Novos brutos necessários&#10;• De onde sai o número: É calculado somando o crescimento que você quer ter (líquido) com os clientes que você sabe que vai perder (churn).&#10;• Como é calculado: Novos líquidos meta + Churn. Ele mostra quantas vendas totais a sua equipe comercial precisa realizar para compensar cancelamentos e atingir a meta.&#10;• Exemplo prático (Dez/2026): Sua meta é crescer 10 clientes líquidos e a previsão de churn é 1. Logo, você precisa vender para 10 + 1 = 11 novos clientes brutos.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Novos Brutos</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[115px]" title="6. MRR meta (ou MMR meta)&#10;• De onde sai o número: É a Receita Recorrente Mensal calculada distribuindo os Clientes Meta pelo Mix de Vendas (%) dos planos e pela proporção Mensal vs Anual.&#10;• Como é calculado: Para cada plano: (Preço Mensal × % Mensal + Preço Anual Mensal × % Anual) × % Mix de Vendas × Clientes Meta. Soma de todos os planos.&#10;• Exemplo prático: Com 100 clientes e mix de planos (Corretor 10%, Basic 25%, Pro 50%, Master 15%) e proporção 70% mensal / 30% anual, resulta em um Ticket Médio dos planos de R$ 312,08 → MRR Meta = R$ 31.208,00.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>MRR Meta (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[125px]" title="7. MRR Aluguel (ou MMR aluguel)&#10;• De onde sai o número: É a receita vinda do módulo opcional de aluguéis, cujas regras estão na tabela de Aluguel.&#10;• Como é calculado: Previsão de lançamento para novembro de 2026 (2026-11-01). Antes dessa data é R$ 0. A partir de novembro de 2026, 30% da base de clientes ativos contratará esse módulo por R$ 200,00 mensais. Fórmula: Clientes ativos × 30% (Adesão) × R$ 200,00.&#10;• Exemplo prático (Nov/2026): 20 clientes ativos × 30% × R$ 200,00 = R$ 1.200,00.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>MRR Aluguel (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[125px]" title="8. MRR Pacotes (ou MMR Pacotes)&#10;• De onde sai o número: É o faturamento recorrente somado de todos os pequenos pacotes adicionais (Usuários extras, Imóveis adicionais, E-mail profissional e Assinatura digital) listados na tabela de Pacotes adicionais.&#10;• Como é calculated: Para cada pacote já lançado até aquele mês: Clientes ativos × % Previsão de vendas × Valor do pacote. Soma de todos eles.&#10;• Exemplo prático (Set/2026): Usuários (5 × 7% × 29,99 = 10,50) + Imóveis (5 × 8% × 19,99 = 8,00) = R$ 18,49.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>MRR Pacotes (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[115px]" title="9. MRR Total (ou MMR total)&#10;• De onde sai o número: É o faturamento recorrente total bruto do mês.&#10;• Como é calculado: Soma simples das três frentes de receita recorrente: MRR meta + MRR Aluguel + MRR Pacotes.&#10;• Exemplo prático (Nov/2026): R$ 6.640,00 (Meta) + R$ 1.200,00 (Aluguel) + R$ 188,97 (Pacotes) = R$ 8.028,97.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>MRR Total (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]">Receita Emp (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Comissão Vend (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]" title="Bônus Venda Anual (R$)&#10;• De onde sai o número: Bônus de 20% adicional sobre a 1ª parcela de planos anuais.&#10;• Como é calculado: (Novos Brutos × % Anual) × Ticket Anual 1ª Parcela × 20%.">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Bônus Anual (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]" title="Comissão Suporte (R$)&#10;• De onde sai o número: Paga na 2ª parcela para clientes mensais e no 1º mês para vendas anuais (à vista).&#10;• Como é calculado: (Novos Anuais do Mês × Ticket Anual × 50%) + (Novos Mensais do Mês Anterior × Ticket Mensal × 50%).">
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Comissão Sup (R$)</span>
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]">Novos Tráfego</th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]">CAC Tráfego (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Invest Tráfego (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]">Novos Lista</th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]">Contatos Frios</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo Lista (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[70px]">Novos Influ</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo 1ª Inf (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Custo Rec Inf (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Pró-labore Dev (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Pró-labore Ges (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Pró-labore Mkt (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Pró-labore Fin (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Suporte Fixo (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Apoio Téc (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">SDR (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Mkt/Criação (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Bônus Metas (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Infra (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Taxas Pgto (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Impostos (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Bruto (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Líquido (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]">Receita Caixa (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[90px]">Imp. Caixa (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[100px]">Res. Caixa (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[110px]">Saldo Caixa (R$)</th>
                  <th className="px-2 py-2.5 font-medium min-w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projecaoMensal.map((p, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-gray-900/60 transition-colors">
                    <td className="px-3 py-1.5 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-950 z-10">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">{p.month}</span>
                        {idx === projecaoMensal.length - 1 && (
                          <button
                            type="button"
                            onClick={addProjecaoMonth}
                            className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-xs transition-colors flex items-center gap-0.5 shrink-0"
                            title="Adicionar próximo mês"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold text-gray-900 dark:text-white bg-gray-50/70 dark:bg-gray-900/40 rounded">
                      {p.clientesAtivosMeta}
                    </td>
                    <td className="px-2 py-1.5 text-center font-semibold text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20 rounded">
                      {p.churn}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={p.novosLiquidosMeta}
                          disabled={!!p.isLockedNovos}
                          onChange={(e) => updateProjecaoMensalCell(idx, 'novosLiquidosMeta', Number(e.target.value))}
                          className={`${cellInputCls} text-green-600 dark:text-green-400 font-semibold ${
                            p.isLockedNovos ? 'bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400/60 rounded cursor-not-allowed opacity-80' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleLockNovos(idx)}
                          className={`p-1 rounded transition-colors shrink-0 ${
                            p.isLockedNovos
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200'
                              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
                          }`}
                          title={p.isLockedNovos ? 'Valor fixado/bloqueado (Clique para desbloquear)' : 'Clique para fixar valor'}
                        >
                          {p.isLockedNovos ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={p.novosBrutosNecessarios} onChange={(e) => updateProjecaoMensalCell(idx, 'novosBrutosNecessarios', Number(e.target.value))} className={cellInputCls} />
                    </td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.mrrMeta} onChange={(val) => updateProjecaoMensalCell(idx, 'mrrMeta', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.mrrAluguel} onChange={(val) => updateProjecaoMensalCell(idx, 'mrrAluguel', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.mrrPacotes} onChange={(val) => updateProjecaoMensalCell(idx, 'mrrPacotes', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5 font-medium"><CurrencyInput value={p.mrrTotal} onChange={(val) => updateProjecaoMensalCell(idx, 'mrrTotal', val)} className={`${cellInputCls} font-bold text-gray-900 dark:text-white`} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.receitaEmpresa} onChange={(val) => updateProjecaoMensalCell(idx, 'receitaEmpresa', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.comissaoVendas} onChange={(val) => updateProjecaoMensalCell(idx, 'comissaoVendas', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.bonusVendaAnual} onChange={(val) => updateProjecaoMensalCell(idx, 'bonusVendaAnual', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.comissaoSuporte} onChange={(val) => updateProjecaoMensalCell(idx, 'comissaoSuporte', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={p.novosTrafego} onChange={(e) => updateProjecaoMensalCell(idx, 'novosTrafego', Number(e.target.value))} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.cacTrafego} onChange={(val) => updateProjecaoMensalCell(idx, 'cacTrafego', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.investimentoTrafego} onChange={(val) => updateProjecaoMensalCell(idx, 'investimentoTrafego', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={p.novosLista} onChange={(e) => updateProjecaoMensalCell(idx, 'novosLista', Number(e.target.value))} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={p.contatosFrios} onChange={(e) => updateProjecaoMensalCell(idx, 'contatosFrios', Number(e.target.value))} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.custoListaFria} onChange={(val) => updateProjecaoMensalCell(idx, 'custoListaFria', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={p.novosInfluencer} onChange={(e) => updateProjecaoMensalCell(idx, 'novosInfluencer', Number(e.target.value))} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.custo1aInfluencer} onChange={(val) => updateProjecaoMensalCell(idx, 'custo1aInfluencer', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.custoRecorrenteInfluencer} onChange={(val) => updateProjecaoMensalCell(idx, 'custoRecorrenteInfluencer', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.proLaboreDev} onChange={(val) => updateProjecaoMensalCell(idx, 'proLaboreDev', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.proLaboreGestor} onChange={(val) => updateProjecaoMensalCell(idx, 'proLaboreGestor', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.proLaboreMkt} onChange={(val) => updateProjecaoMensalCell(idx, 'proLaboreMkt', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.proLaboreFin} onChange={(val) => updateProjecaoMensalCell(idx, 'proLaboreFin', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.suporteFixo} onChange={(val) => updateProjecaoMensalCell(idx, 'suporteFixo', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.apoioTecnico} onChange={(val) => updateProjecaoMensalCell(idx, 'apoioTecnico', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.sdr} onChange={(val) => updateProjecaoMensalCell(idx, 'sdr', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.marketingCriacao} onChange={(val) => updateProjecaoMensalCell(idx, 'marketingCriacao', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.bonusMetas} onChange={(val) => updateProjecaoMensalCell(idx, 'bonusMetas', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.infraestrutura} onChange={(val) => updateProjecaoMensalCell(idx, 'infraestrutura', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.taxasPagamento} onChange={(val) => updateProjecaoMensalCell(idx, 'taxasPagamento', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.impostos} onChange={(val) => updateProjecaoMensalCell(idx, 'impostos', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5 font-medium"><CurrencyInput value={p.resultadoBruto} onChange={(val) => updateProjecaoMensalCell(idx, 'resultadoBruto', val)} className={`${cellInputCls} font-bold text-gray-900 dark:text-white`} /></td>
                    <td className="px-2 py-1.5 font-semibold"><CurrencyInput value={p.resultadoLiquido} onChange={(val) => updateProjecaoMensalCell(idx, 'resultadoLiquido', val)} className={`${cellInputCls} font-bold ${p.resultadoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} /></td>
                    <td className="px-2 py-1.5 font-medium"><CurrencyInput value={p.receitaCaixa} onChange={(val) => updateProjecaoMensalCell(idx, 'receitaCaixa', val)} className={`${cellInputCls} font-bold text-blue-600 dark:text-blue-400`} /></td>
                    <td className="px-2 py-1.5"><CurrencyInput value={p.impostosCaixa8} onChange={(val) => updateProjecaoMensalCell(idx, 'impostosCaixa8', val)} className={cellInputCls} /></td>
                    <td className="px-2 py-1.5 font-semibold"><CurrencyInput value={p.resultadoCaixa} onChange={(val) => updateProjecaoMensalCell(idx, 'resultadoCaixa', val)} className={`${cellInputCls} font-bold ${p.resultadoCaixa >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} /></td>
                    <td className="px-2 py-1.5 font-semibold"><CurrencyInput value={p.saldoCaixaAcumulado} onChange={(val) => updateProjecaoMensalCell(idx, 'saldoCaixaAcumulado', val)} className={`${cellInputCls} font-bold text-gray-900 dark:text-white`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DASHBOARD ESTRATÉGICO ===== */}
      {activeSubTab === 'dashboard_metas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">MRR e Saldo de Caixa (Gráfico Dinâmico)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projecaoMensal}>
                  <defs>
                    <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="caixaG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="mrrTotal" name="MRR Total" stroke="#f59e0b" fillOpacity={1} fill="url(#mrrG)" />
                  <Area type="monotone" dataKey="saldoCaixaAcumulado" name="Saldo Caixa" stroke="#3b82f6" fillOpacity={1} fill="url(#caixaG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Crescimento de Clientes</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projecaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clientesAtivosMeta" name="Clientes" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="churn" name="Churn" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAXAS DE PAGAMENTO ===== */}
      {activeSubTab === 'taxas' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Taxas dos Meios de Pagamento (Editável)</h3>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Método de Pagamento</th>
                  <th className="px-4 py-2.5 font-medium">Taxa Fixa (R$)</th>
                  <th className="px-4 py-2.5 font-medium">Taxa Variável (%)</th>
                  <th className="px-4 py-2.5 font-medium">Participação / Uso (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {taxasPagamento.map((t, idx) => (
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
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                      <PercentInput
                        value={t.uso}
                        isDecimal={true}
                        onChange={(val) => updateTaxaCell(idx, 'uso', val)}
                        className={cellInputCls}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== RESUMO EXECUTIVO ===== */}
      {activeSubTab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Meta Clientes (Dez/27)</p>
              <input
                type="number"
                value={resumoExecutivo.clientesAtivosFinais}
                onChange={(e) => updateResumoCell('clientesAtivosFinais', Number(e.target.value))}
                className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Brutos necessários:</span>
                <input
                  type="number"
                  value={resumoExecutivo.clientesBrutosNecessarios}
                  onChange={(e) => updateResumoCell('clientesBrutosNecessarios', Number(e.target.value))}
                  className="bg-transparent border-b border-gray-200 dark:border-gray-700 w-16 text-center text-xs text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="card p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">MRR Meta Final (R$)</p>
              <CurrencyInput
                value={resumoExecutivo.mrrFinalMeta}
                onChange={(val) => updateResumoCell('mrrFinalMeta', val)}
                className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-gray-400">Ticket médio projetado: R$ 332</p>
            </div>

            <div className="card p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Resultado Líquido Final (R$)</p>
              <CurrencyInput
                value={resumoExecutivo.resultadoDez2027AposImpostos}
                onChange={(val) => updateResumoCell('resultadoDez2027AposImpostos', val)}
                className="text-3xl font-bold text-green-600 dark:text-green-400 bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-gray-400">Após reserva de caixa (8%)</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== AQUISIÇÃO ===== */}
      {activeSubTab === 'aquisicao' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aquisicao.map((aq, idx) => (
            <div key={idx} className="card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={aq.canal}
                  onChange={(e) => updateAquisicaoCell(idx, 'canal', e.target.value)}
                  className="font-semibold text-gray-900 dark:text-white text-sm bg-transparent border-b border-gray-200 dark:border-gray-700 w-2/3 focus:outline-none"
                />
                <PercentInput
                  value={aq.participacao}
                  isDecimal={false}
                  isString={true}
                  onChange={(val) => updateAquisicaoCell(idx, 'participacao', val)}
                  className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-20 text-center focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Regra de Aquisição</label>
                <textarea
                  value={aq.regra}
                  onChange={(e) => updateAquisicaoCell(idx, 'regra', e.target.value)}
                  rows={3}
                  className="w-full text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-gray-700 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}



      {/* ===== PLANOS ===== */}
      {activeSubTab === 'planos' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Planos & Mix de Vendas (%)</h3>
              <p className="text-xs text-gray-400">A soma do Mix de Vendas de todos os planos não pode ultrapassar 100%.</p>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const totalMixPct = (planos.reduce((acc, p) => acc + (Number(p.previsaoVendas) || 0), 0) * 100).toFixed(1);
                const isExact = Math.abs(totalMixPct - 100) < 0.1;
                const isOver = totalMixPct > 100;
                return (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isExact
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : isOver
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    Soma Mix: {totalMixPct}% {isExact ? '✓ (100%)' : isOver ? '⚠️ (Excede 100%)' : `(Disponível: ${(100 - totalMixPct).toFixed(1)}%)`}
                  </span>
                );
              })()}
              <button
                onClick={() => addPlano()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                title="Adicionar novo plano de assinatura"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Plano</span>
              </button>
            </div>
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

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-gray-400 uppercase">Mix Vendas (%)</label>
                    <span className="text-[10px] text-gray-400 font-medium">máx 100% total</span>
                  </div>
                  <PercentInput
                    value={pl.previsaoVendas}
                    isDecimal={true}
                    onChange={(val) => updatePlanoCell(idx, 'previsaoVendas', val)}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ===== ALUGUEL ===== */}
      {activeSubTab === 'aluguel' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Módulos de Aluguel (Vendido para a Base de Clientes)</h3>
              <p className="text-xs text-gray-400">Defina o preço, mix de adesão da base e a data de lançamento. O módulo passa a ser computado na projeção a partir da data prevista.</p>
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
                    <label className="block text-[10px] text-gray-400 uppercase">Previsão Vendas (%)</label>
                    <PercentInput
                      value={al.previsaoVendas}
                      isDecimal={true}
                      onChange={(val) => updateAluguelCell(idx, 'previsaoVendas', val)}
                      className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                    />
                  </div>
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
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase">Previsão de Lançamento</label>
                  <select
                    value={al.previsaoLancamento || (projecaoMensal[0]?.month || 'Sep/2026')}
                    onChange={(e) => updateAluguelCell(idx, 'previsaoLancamento', e.target.value)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-amber-200 dark:border-amber-900/40"
                  >
                    {projecaoMensal.map((p, mIdx) => (
                      <option key={mIdx} value={p.month}>
                        {p.month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PACOTES ADICIONAIS ===== */}
      {activeSubTab === 'pacotes' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pacotes Adicionais (Vendido para a Base de Clientes)</h3>
              <p className="text-xs text-gray-400">Defina o valor, quantidade adicional, adesão da base e mês de lançamento. O pacote passa a ser computado na projeção a partir da data prevista.</p>
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
                    <label className="block text-[10px] text-gray-400 uppercase">Previsão Vendas (%)</label>
                    <PercentInput
                      value={pc.previsaoVendas}
                      isDecimal={true}
                      onChange={(val) => updatePacoteCell(idx, 'previsaoVendas', val)}
                      className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded w-full focus:outline-none"
                    />
                  </div>
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
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase">Previsão de Lançamento</label>
                  <select
                    value={pc.previsaoLancamento || (projecaoMensal[0]?.month || 'Sep/2026')}
                    onChange={(e) => updatePacoteCell(idx, 'previsaoLancamento', e.target.value)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded w-full focus:outline-none border border-amber-200 dark:border-amber-900/40"
                  >
                    {projecaoMensal.map((p, mIdx) => (
                      <option key={mIdx} value={p.month}>
                        {p.month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== INFRAESTRUTURA ===== */}
      {activeSubTab === 'infra' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infraestrutura.map((inf, fIdx) => (
            <div key={fIdx} className="card p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
                <input
                  type="text"
                  value={inf.faixa}
                  onChange={(e) => {
                    const newInfra = [...infraestrutura];
                    newInfra[fIdx].faixa = e.target.value;
                  }}
                  className="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                  Total: R$ {inf.total.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {inf.itens.map((it, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between gap-2 text-xs">
                    <input
                      type="text"
                      value={it.item}
                      onChange={(e) => updateInfraCell(fIdx, iIdx, 'item', e.target.value)}
                      className="text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-100 dark:border-gray-800 w-2/3 focus:outline-none"
                    />
                    <div className="flex items-center gap-1 w-1/3">
                      <CurrencyInput
                        value={it.valor}
                        onChange={(val) => updateInfraCell(fIdx, iIdx, 'valor', val)}
                        className="font-semibold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== EQUIPE ===== */}
      {activeSubTab === 'equipe' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Equipe e Remuneração (Editável)</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Área</th>
                <th className="px-4 py-2.5 font-medium">Modelo</th>
                <th className="px-4 py-2.5 font-medium">Remuneração</th>
                <th className="px-4 py-2.5 font-medium">Gatilho / Condição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {equipe.map((eq, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                  <td className="px-4 py-1.5 font-medium text-gray-900 dark:text-white">
                    <input
                      type="text"
                      value={eq.area}
                      onChange={(e) => updateEquipeCell(idx, 'area', e.target.value)}
                      className={`${cellInputCls} font-semibold`}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-gray-600 dark:text-gray-300">
                    <input
                      type="text"
                      value={eq.modelo}
                      onChange={(e) => updateEquipeCell(idx, 'modelo', e.target.value)}
                      className={cellInputCls}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-gray-600 dark:text-gray-300">
                    <input
                      type="text"
                      value={eq.remuneracao}
                      onChange={(e) => updateEquipeCell(idx, 'remuneracao', e.target.value)}
                      className={cellInputCls}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-gray-600 dark:text-gray-300">
                    <input
                      type="text"
                      value={eq.gatilho}
                      onChange={(e) => updateEquipeCell(idx, 'gatilho', e.target.value)}
                      className={cellInputCls}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== PREMISSAS ===== */}
      {activeSubTab === 'premissas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {premissas.map((pr, idx) => {
            const isTicket = String(pr.premissa).toLowerCase().includes('ticket');
            return (
              <div key={idx} className="card p-3 flex justify-between items-center gap-3">
                <input
                  type="text"
                  value={pr.premissa}
                  onChange={(e) => updatePremissaCell(idx, 'premissa', e.target.value)}
                  className="text-xs text-gray-600 dark:text-gray-300 bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none"
                  readOnly={isTicket}
                />
                {isTicket ? (
                  <div className="flex items-center gap-1 shrink-0" title="Calculado automaticamente baseado nos preços dos planos, mix de vendas e proporção mensal/anual">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded text-center min-w-[90px]">
                      {pr.valor}
                    </span>
                    <span className="text-[10px] text-amber-500 font-semibold">(Auto)</span>
                  </div>
                ) : String(pr.valor).includes('%') || String(pr.premissa).toLowerCase().includes('churn') || String(pr.premissa).toLowerCase().includes('comissão') || String(pr.premissa).toLowerCase().includes('proporção') || String(pr.premissa).toLowerCase().includes('reserva') || String(pr.premissa).toLowerCase().includes('taxa') ? (
                  <PercentInput
                    value={pr.valor}
                    isString={true}
                    onChange={(val) => updatePremissaCell(idx, 'valor', val)}
                    className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded w-28 text-center focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={pr.valor}
                    onChange={(e) => updatePremissaCell(idx, 'valor', e.target.value)}
                    className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded w-28 text-center focus:outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
