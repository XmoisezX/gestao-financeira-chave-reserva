import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Plus, Edit2, Trash2, Search, Key, Mail, Shield, Eye, EyeOff, DollarSign, Calendar, Clock } from 'lucide-react';

export const FuncionariosModule = () => {
  const { funcionarios, setFuncionarios, saveFuncionario, deleteFuncionario, addAuditLog, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    cpf: '',
    pix: '',
    email: '',
    senha: '',
    cargo: 'Vendedor',
    custoMensal: 0,
    dataInicio: '2026-09-01',
    dataFim: '',
    status: 'Ativo'
  });

  const filteredFuncionarios = (funcionarios || []).filter(f =>
    (f.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.cargo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.cpf || '').includes(searchQuery)
  );

  const totalCusto = (funcionarios || [])
    .filter(f => f.status === 'Ativo')
    .reduce((acc, f) => acc + (Number(f.custoMensal) || 0), 0);

  const cargosDisponiveis = [
    'Administrador',
    'Gestor',
    'Vendedor',
    'SDR',
    'Suporte',
    'Apoio Técnico',
    'Dev/Programador',
    'Marketing/Criação',
    'Parceiro'
  ];

  const handleOpenModal = (func = null) => {
    setShowPassword(false);
    if (func) {
      setFormData({
        id: func.id,
        nome: func.nome || '',
        cpf: func.cpf || '',
        pix: func.pix || '',
        email: func.email || '',
        senha: func.senha || '',
        cargo: func.cargo || 'Vendedor',
        custoMensal: func.custoMensal || 0,
        dataInicio: func.dataInicio || '2026-09-01',
        dataFim: func.dataFim || '',
        status: func.status || 'Ativo'
      });
    } else {
      setFormData({
        id: `func-${Date.now()}`,
        nome: '',
        cpf: '',
        pix: '',
        email: '',
        senha: '',
        cargo: 'Vendedor',
        custoMensal: 0,
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: '',
        status: 'Ativo'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isEditing = (funcionarios || []).some(f => f.id === formData.id);
      
      if (saveFuncionario) {
        await saveFuncionario(formData);
      } else {
        if (isEditing) {
          setFuncionarios(prev => prev.map(f => f.id === formData.id ? formData : f));
        } else {
          setFuncionarios(prev => [...(prev || []), formData]);
        }
      }

      if (addAuditLog) {
        const actionName = isEditing ? 'Edição de Usuário' : 'Cadastro de Usuário';
        const vigenciaStr = formData.dataFim 
          ? `Período: ${formData.dataInicio} a ${formData.dataFim}`
          : `Início: ${formData.dataInicio} (Tempo Indeterminado)`;
        addAuditLog(actionName, `Usuário "${formData.nome}" (${formData.cargo}) salvo com remuneração de R$${Number(formData.custoMensal).toFixed(2)}/mês. ${vigenciaStr}.`);
      }

      setIsModalOpen(false);
    } catch (err) {
      alert('Erro ao salvar no Supabase: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (func) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${func.nome}"? O acesso no Supabase também será revogado.`)) {
      if (addAuditLog) {
        addAuditLog('Exclusão de Usuário', `Usuário "${func.nome}" (${func.cargo}) excluído.`);
      }
      if (deleteFuncionario) {
        await deleteFuncionario(func.id, func.email);
      } else {
        setFuncionarios(prev => prev.filter(f => f.id !== func.id));
      }
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

  const formatDateBR = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Usuários do Sistema
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Cadastre os usuários com acesso ao sistema, seus cargos, credenciais (e-mail e senha), dados cadastrais (CPF, Pix) e remuneração mensal com vigência.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total de Usuários</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{(funcionarios || []).length}</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {(funcionarios || []).filter(f => f.status === 'Ativo').length} ativos
            </span>
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Time de Vendas & Suporte</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(funcionarios || []).filter(f => ['Vendedor', 'SDR', 'Suporte', 'Apoio Técnico'].includes(f.cargo)).length}
            </p>
            <span className="text-xs text-gray-400">Comissionados</span>
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Custo Fixo Mensal Atual</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCusto)}
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Usuário / Acesso</th>
                <th className="px-4 py-3">CPF & Chave Pix</th>
                <th className="px-4 py-3">Cargo / Função</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Salário / Pró-labore</th>
                <th className="px-4 py-3">Período de Vigência</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                filteredFuncionarios.map(func => (
                  <tr key={func.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {(func.nome || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{func.nome}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 inline" /> {func.email || 'Sem e-mail cadastrado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-white font-mono text-[11px]">{func.cpf || '-'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Pix:</span> {func.pix || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[11px] font-semibold">
                        {func.cargo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        func.status === 'Ativo' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${func.status === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {func.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(func.custoMensal) || 0)}
                      <span className="text-[10px] text-gray-400 font-normal block">por mês</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Início: <strong>{formatDateBR(func.dataInicio) || '01/09/2026'}</strong></span>
                        </p>
                        <p className="text-[11px]">
                          {func.dataFim ? (
                            <span className="text-amber-700 dark:text-amber-400">Fim: <strong>{formatDateBR(func.dataFim)}</strong></span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                              Tempo Indeterminado
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(func)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(func)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                {(funcionarios || []).find(f => f.id === formData.id) ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className={inputCls}
                  placeholder="Ex: Carlos Eduardo Silva"
                />
              </div>

              {/* CPF e Chave Pix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPF (Cadastro de Pessoa Física)
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    className={inputCls}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chave Pix para Pagamentos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pix}
                    onChange={e => setFormData({ ...formData, pix: e.target.value })}
                    className={inputCls}
                    placeholder="Chave CPF, E-mail, Celular ou Aleatória"
                  />
                </div>
              </div>

              {/* Credenciais: E-mail e Senha */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Credenciais de Login no Sistema
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-mail de Acesso *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={inputCls}
                      placeholder="usuario@chavereserva.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Senha de Acesso *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.senha}
                        onChange={e => setFormData({ ...formData, senha: e.target.value })}
                        className={`${inputCls} pr-8`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cargo / Função *
                  </label>
                  <select
                    value={formData.cargo}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    className={inputCls}
                  >
                    {cargosDisponiveis.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status da Conta *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Ativo">Ativo (Acesso Liberado)</option>
                    <option value="Inativo">Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Remuneração & Vigência */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Remuneração Mensal & Período de Vigência
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Pago por Mês (Salário / Pró-labore em R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.custoMensal}
                    onChange={e => setFormData({ ...formData, custoMensal: e.target.value })}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataInicio}
                      onChange={e => setFormData({ ...formData, dataInicio: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Fim (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.dataFim || ''}
                      onChange={e => setFormData({ ...formData, dataFim: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  ℹ️ Se a <strong>Data de Fim</strong> for deixada em branco, a remuneração continuará por tempo indeterminado. Na aba <strong>Operação Diária</strong>, o custo será contabilizado apenas nos meses dentro deste período.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
