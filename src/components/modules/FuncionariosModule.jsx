import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Plus, Edit2, Trash2, Search, Key, Mail, Shield, Eye, EyeOff, Calendar, Clock, UserCheck } from 'lucide-react';

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

  const totalAtivos = (funcionarios || []).filter(f => f.status === 'Ativo').length;

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

  const getSelectedCargos = (cargoVal) => {
    if (!cargoVal) return ['Vendedor'];
    if (Array.isArray(cargoVal)) return cargoVal;
    return String(cargoVal).split(',').map(s => s.trim()).filter(Boolean);
  };

  const toggleCargo = (roleName) => {
    const current = getSelectedCargos(formData.cargo);
    let updated;
    if (current.includes(roleName)) {
      if (current.length === 1) return; // Keep at least one
      updated = current.filter(r => r !== roleName);
    } else {
      updated = [...current, roleName];
    }
    setFormData(prev => ({ ...prev, cargo: updated.join(', ') }));
  };

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
        status: func.status || 'Ativo',
        photoUrl: func.photoUrl || ''
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
        status: 'Ativo',
        photoUrl: ''
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
          setFuncionarios(prev => (prev || []).map(f => f.id === formData.id ? { ...f, ...formData } : f));
        } else {
          setFuncionarios(prev => [...(prev || []), formData]);
        }
      }

      addAuditLog(
        isEditing ? 'Atualização de Usuário' : 'Novo Usuário',
        `Usuário "${formData.nome}" (${formData.cargo}) ${isEditing ? 'atualizado' : 'cadastrado'} por ${user?.name || 'Admin'}.`
      );

      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (func) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${func.nome}"?`)) {
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

  const inputCls = "cr-input";

  const formatDateBR = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="cr-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-5 h-5 text-indigo-500" />
            Gestão de Usuários & Acessos
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Cadastre novos membros da equipe, defina cargos, senhas de login e dados financeiros (Pix/CPF).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="cr-btn cr-btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cr-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Usuários</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{(funcionarios || []).length}</p>
          <p className="text-xs text-gray-400 mt-1">{(funcionarios || []).filter(f => f.status === 'Ativo').length} ativos na plataforma</p>
        </div>

        <div className="cr-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuários Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {totalAtivos}
          </p>
          <p className="text-xs text-gray-400 mt-1">Com acesso ativo à plataforma</p>
        </div>

        <div className="cr-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfis & Segurança</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
            {(funcionarios || []).filter(f => (f.cargo || '').toLowerCase().includes('administrador')).length} Admins
          </p>
          <p className="text-xs text-gray-400 mt-1">Com acesso total aos módulos do sistema</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="cr-card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cr-input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cr-table">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Usuário / Acesso</th>
                <th className="px-4 py-3">CPF & Chave Pix</th>
                <th className="px-4 py-3">Cargo / Função</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data de Entrada</th>
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
                        {func.photoUrl ? (
                          <img
                            src={func.photoUrl}
                            alt={func.nome}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-brand-200 dark:border-brand-800"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                            {(func.nome || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
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
                      <div className="flex flex-wrap gap-1">
                        {getSelectedCargos(func.cargo).map((c, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${
                              c === 'Administrador' || c === 'Gestor'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                : c.includes('Suporte')
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                                : c.includes('Vendedor')
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
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
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Desde: <strong>{formatDateBR(func.dataInicio) || '01/09/2026'}</strong></span>
                        </p>
                        {func.dataFim && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                            Até: <strong>{formatDateBR(func.dataFim)}</strong>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(func)}
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-600)'; e.currentTarget.style.background = 'var(--neutral-100)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
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
        <div className="cr-modal-overlay">
          <div className="cr-modal cr-modal-lg">
            {/* Modal Header */}
            <div className="cr-modal-header">
              <h3 className="text-[15px] font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {(funcionarios || []).find(f => f.id === formData.id) ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cr-btn cr-btn-ghost w-8 h-8 p-0"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="cr-modal-body space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo <span className="text-red-500 font-bold ml-0.5">*</span>
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
                      Chave Pix para Pagamentos <span className="text-red-500 font-bold ml-0.5">*</span>
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
                <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                  <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--brand-700)' }}>
                    <Key className="w-3.5 h-3.5" /> Credenciais de Login no Sistema
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-mail de Acesso <span className="text-red-500 font-bold ml-0.5">*</span>
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
                        Senha de Acesso <span className="text-red-500 font-bold ml-0.5">*</span>
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

                {/* Cargos / Funções (Múltipla Seleção) */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Cargos / Funções Designadas <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <span className="text-[11px] text-gray-400">
                        Clique para marcar um ou mais cargos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                      {cargosDisponiveis.map(c => {
                        const isSelected = getSelectedCargos(formData.cargo).includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCargo(c)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                              isSelected
                                ? 'border-brand-500 ring-1 ring-brand-500/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            style={{
                              background: isSelected ? 'var(--brand-50)' : 'var(--bg-surface)',
                              color: isSelected ? 'var(--brand-700)' : 'var(--text-secondary)',
                            }}
                          >
                            <span className="truncate">{c}</span>
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ml-1 ${
                              isSelected
                                ? 'text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                            style={isSelected ? { background: 'var(--brand-600)' } : {}}>
                              {isSelected ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-indigo-700 dark:text-indigo-300">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Cargos selecionados: <strong>{formData.cargo || 'Nenhum'}</strong></span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status da Conta <span className="text-red-500 font-bold ml-0.5">*</span>
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

                {/* Período de Atividade no Sistema */}
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                  <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Período de Atividade no Sistema
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Início / Admissão <span className="text-red-500 font-bold ml-0.5">*</span>
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
                        Data de Saída (Opcional)
                      </label>
                      <input
                        type="date"
                        value={formData.dataFim || ''}
                        onChange={e => setFormData({ ...formData, dataFim: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="cr-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cr-btn cr-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cr-btn cr-btn-primary"
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
