import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const ClientesModule = () => {
  const {
    clientes, addCliente, updateCliente, churnCliente, reactivateCliente, deleteCliente,
    planos, aluguel, pacotes, funcionarios, addAuditLog, validateClientSale,
    isAdmin, user
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: '', empresa: '', email: '', telefone: '', plano: 'Imobiliária Pro', mrr: 350, metodoPagamento: 'Pix', canalOrigem: 'Tráfego Pago', dataEntrada: new Date().toISOString().split('T')[0] });

  // Validation Modal
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState(null);
  const [valData, setValData] = useState({
    cpfCnpj: '',
    endereco: '',
    vendedorResponsavel: '',
    suporteResponsavel: '',
    modalidade: 'mensal', // mensal, anualVista, anualParcelado
    desconto: 0,
    duracaoDesconto: '1 mes',
    plano: '',
    mrr: 0,
    moduloAluguel: 'Não',
    pacotesSelecionados: [],
    metodoPagamento: 'Pix',
    dataEntrada: new Date().toISOString().split('T')[0]
  });

  // Churn Modal
  const [isChurnModalOpen, setIsChurnModalOpen] = useState(false);
  const [churnData, setChurnData] = useState({ id: null, date: new Date().toISOString().split('T')[0] });

  const accessibleClientes = useMemo(() => {
    return (clientes || []).filter(c => {
      if (isAdmin || !user) return true;
      const isSeller = c.vendedorResponsavel === user.name || c.vendedorResponsavel === user.email;
      const isSupport = c.suporteResponsavel === user.name || c.suporteResponsavel === user.email;
      return isSeller || isSupport;
    });
  }, [clientes, isAdmin, user]);

  const filteredClientes = accessibleClientes.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.nome.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q) || false;
    return matchesSearch && (statusFilter === 'all' || c.status === statusFilter);
  });

  const userClientesAtivos = accessibleClientes.filter(c => c.status === 'Ativo');
  const userClientesChurned = accessibleClientes.filter(c => c.status === 'Churned');
  const userMrrTotal = userClientesAtivos.reduce((acc, c) => acc + (Number(c.mrr) || 0), 0);
  const userArpuMedio = userClientesAtivos.length > 0 ? userMrrTotal / userClientesAtivos.length : 0;
  const userChurnRate = accessibleClientes.length > 0 ? ((userClientesChurned.length / accessibleClientes.length) * 100).toFixed(1) : '0.0';

  const handleSaveCliente = (e) => { 
    e.preventDefault(); 
    if (!formData.nome) {
      alert("Por favor, preencha o nome do cliente.");
      return;
    }
    addCliente(formData); 
    addAuditLog('Cadastro de Cliente', `Cliente "${formData.nome}" (${formData.empresa || 'Sem empresa'}) cadastrado com plano ${formData.plano}, MRR R$${formData.mrr}`);
    setIsAddModalOpen(false); 
  };

  const handleOpenValidate = (cliente) => {
    setSelectedPendingId(cliente.id);
    setValData({
      cpfCnpj: cliente.cpfCnpj || '',
      endereco: cliente.endereco || '',
      vendedorResponsavel: cliente.vendedorResponsavel || '',
      suporteResponsavel: cliente.suporteResponsavel || '',
      modalidade: cliente.modalidade || 'mensal',
      desconto: cliente.desconto || 0,
      duracaoDesconto: cliente.duracaoDesconto || '1 mes',
      plano: cliente.plano || (planos[0]?.plano || ''),
      mrr: cliente.mrr || (planos[0]?.mensal || 350),
      moduloAluguel: cliente.moduloAluguel || 'Não',
      pacotesSelecionados: cliente.pacotesSelecionados || [],
      metodoPagamento: cliente.metodoPagamento || 'Pix',
      dataEntrada: cliente.dataEntrada || new Date().toISOString().split('T')[0]
    });
    setIsValidateModalOpen(true);
  };

  const handleVendedorChange = (e) => {
    const vName = e.target.value;
    const vend = funcionarios.find(f => f.nome === vName);
    
    let newSuporte = valData.suporteResponsavel;
    if (vend && vend.status === 'Ativo' && (vend.cargo === 'Suporte' || vend.cargo === 'Administrador' || vend.cargo === 'Vendedor e Suporte')) {
      newSuporte = vName; // Auto-selects same person due to preference rule
    }
    
    setValData({ ...valData, vendedorResponsavel: vName, suporteResponsavel: newSuporte });
  };

  const recalculateMRR = (planoName, modAluguel, pacotesSel = [], modalidade = 'mensal', desconto = 0) => {
    const isAnual = modalidade === 'anualVista' || modalidade === 'anualParcelado';
    
    const p = planos.find(x => x.plano === planoName);
    let pValor = 0;
    if (p) {
      pValor = isAnual
        ? (Number(p.anualMensal) || (Number(p.anualVista) / 12) || Number(p.mensal) || 0)
        : Number(p.mensal || 0);
    }
    
    let aValor = 0;
    if (modAluguel === 'Sim') {
      const a = aluguel.length > 0 ? aluguel[0] : null;
      if (a) {
        aValor = isAnual
          ? (Number(a.anualMensal) || (Number(a.anualVista) / 12) || Number(a.mensal) || 0)
          : Number(a.mensal || 200);
      } else {
        aValor = isAnual ? 160 : 200;
      }
    }
    
    const pacValorTotal = pacotesSel.reduce((acc, item) => {
      const pac = pacotes.find(x => x.pacote === item.pacote);
      const pacPrice = pac ? Number(pac.valor) : 29.99;
      return acc + (pacPrice * Number(item.qtd));
    }, 0);

    const subtotal = pValor + aValor + pacValorTotal;
    const descPct = Number(desconto) || 0;
    const total = subtotal * (1 - descPct / 100);

    return Number(total.toFixed(2));
  };

  const handlePlanoChange = (e) => {
    const val = e.target.value;
    setValData(prev => ({
      ...prev,
      plano: val,
      mrr: recalculateMRR(val, prev.moduloAluguel, prev.pacotesSelecionados, prev.modalidade, prev.desconto)
    }));
  };

  const handleAluguelChange = (e) => {
    const val = e.target.value;
    setValData(prev => ({
      ...prev,
      moduloAluguel: val,
      mrr: recalculateMRR(prev.plano, val, prev.pacotesSelecionados, prev.modalidade, prev.desconto)
    }));
  };

  const handleModalidadeChange = (e) => {
    const val = e.target.value;
    setValData(prev => ({
      ...prev,
      modalidade: val,
      mrr: recalculateMRR(prev.plano, prev.moduloAluguel, prev.pacotesSelecionados, val, prev.desconto)
    }));
  };

  const handleDescontoChange = (e) => {
    const val = e.target.value;
    setValData(prev => ({
      ...prev,
      desconto: val,
      mrr: recalculateMRR(prev.plano, prev.moduloAluguel, prev.pacotesSelecionados, prev.modalidade, val)
    }));
  };

  const handleAddPacote = () => {
    if (pacotes.length === 0) return;
    setValData(prev => {
      const novos = [...(prev.pacotesSelecionados || []), { pacote: pacotes[0].pacote, qtd: 1 }];
      return {
        ...prev,
        pacotesSelecionados: novos,
        mrr: recalculateMRR(prev.plano, prev.moduloAluguel, novos, prev.modalidade, prev.desconto)
      };
    });
  };

  const handleUpdatePacote = (index, field, value) => {
    setValData(prev => {
      const novos = [...(prev.pacotesSelecionados || [])];
      novos[index] = { ...novos[index], [field]: value };
      return {
        ...prev,
        pacotesSelecionados: novos,
        mrr: recalculateMRR(prev.plano, prev.moduloAluguel, novos, prev.modalidade, prev.desconto)
      };
    });
  };

  const handleRemovePacote = (index) => {
    setValData(prev => {
      const novos = (prev.pacotesSelecionados || []).filter((_, i) => i !== index);
      return {
        ...prev,
        pacotesSelecionados: novos,
        mrr: recalculateMRR(prev.plano, prev.moduloAluguel, novos, prev.modalidade, prev.desconto)
      };
    });
  };

  const handleConfirmValidate = (e) => {
    e.preventDefault();
    if (!valData.cpfCnpj || !valData.endereco || !valData.vendedorResponsavel || !valData.suporteResponsavel) {
      alert("Por favor, preencha todos os campos obrigatórios (*):\n- CPF/CNPJ\n- Endereço Completo\n- Vendedor\n- Suporte");
      return;
    }
    
    const client = clientes.find(c => c.id === selectedPendingId);
    if (client && client.status === 'Pendente') {
      validateClientSale(selectedPendingId, valData);
      addAuditLog('Validação de Cliente', `Cliente "${client.empresa || client.nome}" validado e ativado. Vendedor: ${valData.vendedorResponsavel}, Suporte: ${valData.suporteResponsavel}, MRR: R$${valData.mrr}`);
    } else {
      updateCliente(selectedPendingId, valData);
      addAuditLog('Edição de Cliente', `Dados de "${client?.empresa || client?.nome}" atualizados. MRR: R$${valData.mrr}`);
    }
    
    setIsValidateModalOpen(false);
    setSelectedPendingId(null);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie sua base de assinantes</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white w-44 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 focus:outline-none">
            <option value="all">Todos</option>
            <option value="Ativo">Ativos</option>
            <option value="Pendente">Pendentes</option>
            <option value="Churned">Cancelados</option>
          </select>
          <button onClick={() => { setFormData({ nome: '', empresa: '', email: '', telefone: '', plano: 'Imobiliária Pro', mrr: 350, metodoPagamento: 'Pix', canalOrigem: 'Tráfego Pago', dataEntrada: new Date().toISOString().split('T')[0] }); setIsAddModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{isAdmin ? 'Clientes Ativos' : 'Meus Clientes Ativos'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userClientesAtivos.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{isAdmin ? 'MRR Total' : 'Meu MRR Gerado'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {userMrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">ARPU Médio</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">R$ {userArpuMedio.toFixed(0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Churn Rate</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{userChurnRate}%</p>
          <p className="text-[10px] text-gray-400">{userClientesChurned.length} cancelados</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-2.5 font-medium">Cliente</th>
              <th className="px-4 py-2.5 font-medium">Plano</th>
              <th className="px-4 py-2.5 font-medium">MRR</th>
              <th className="px-4 py-2.5 font-medium">Pagamento</th>
              <th className="px-4 py-2.5 font-medium">Origem</th>
              <th className="px-4 py-2.5 font-medium">Entrada</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredClientes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900 dark:text-white">{c.nome}</p>
                  <p className="text-[10px] text-gray-400">{c.empresa}</p>
                </td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{c.plano}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">R$ {Number(c.mrr).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.metodoPagamento}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.canalOrigem || '-'}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="date"
                    value={c.dataEntrada || ''}
                    onChange={e => {
                      addAuditLog('Edição de Data de Entrada', `Data de entrada de "${c.empresa || c.nome}" alterada para ${e.target.value}`);
                      updateCliente(c.id, { dataEntrada: e.target.value });
                    }}
                    className="bg-transparent text-gray-500 dark:text-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 w-[110px] cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2.5">
                  {c.status === 'Ativo' && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">Ativo</span>}
                  {c.status === 'Churned' && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">Churn</span>}
                  {c.status === 'Pendente' && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    {c.status === 'Ativo' && (
                      <button onClick={() => {
                        setChurnData({ id: c.id, date: new Date().toISOString().split('T')[0] });
                        setIsChurnModalOpen(true);
                      }} className="px-2 py-0.5 rounded text-[10px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Churn</button>
                    )}
                    {c.status === 'Churned' && (
                      <button onClick={() => reactivateCliente(c.id)} className="px-2 py-0.5 rounded text-[10px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Reativar</button>
                    )}
                    {c.status === 'Pendente' && (
                      <button onClick={() => handleOpenValidate(c)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Validar Venda
                      </button>
                    )}
                    {(c.status === 'Ativo' || c.status === 'Churned') && (
                      <button onClick={() => handleOpenValidate(c)} className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">Editar</button>
                    )}
                    {user?.role === 'Administrador' && (
                      <button onClick={() => { if(window.confirm('Tem certeza que deseja excluir permanentemente este cliente?')) { addAuditLog('Exclusão de Cliente', `Cliente "${c.empresa || c.nome}" excluído permanentemente`); deleteCliente(c.id); } }} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir Cliente">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VALIDATION MODAL */}
      {isValidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Editar Dados do Cliente' : 'Aprovar & Validar Venda'}
              </h3>
              <button onClick={() => setIsValidateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg">×</button>
            </div>
            <div className="text-xs text-gray-500 mb-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span>{clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Edite os dados do cliente.' : 'Complete os dados para aprovar a venda.'}</span>
              <div className="font-bold text-gray-900 dark:text-white text-right">
                {valData.modalidade === 'anualVista' ? (
                  <span>À Vista: R$ {(Number(valData.mrr) * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[11px] font-normal text-gray-500">(1ª Parcela / MRR: R$ {Number(valData.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span></span>
                ) : (
                  <span>Mensal: R$ {Number(valData.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                )}
              </div>
            </div>
            <form onSubmit={handleConfirmValidate} noValidate className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">CPF / CNPJ *</label>
                  <input required value={valData.cpfCnpj} onChange={e => setValData({ ...valData, cpfCnpj: e.target.value })} className={inputCls} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Desconto (%) e Duração</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max="100" value={valData.desconto} onChange={handleDescontoChange} className={inputCls} placeholder="%" />
                    <select value={valData.duracaoDesconto} onChange={e => setValData({ ...valData, duracaoDesconto: e.target.value })} className={inputCls}>
                      <option value="1 mes">1 mês</option>
                      <option value="3 meses">3 meses</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Plano Escolhido *</label>
                  <select required value={valData.plano} onChange={handlePlanoChange} className={inputCls}>
                    {planos.map(p => <option key={p.plano} value={p.plano}>{p.plano}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Módulo Aluguel *</label>
                  <select required value={valData.moduloAluguel} onChange={handleAluguelChange} className={inputCls}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-500 dark:text-gray-400 font-medium">Pacotes Adicionais</label>
                  <button type="button" onClick={handleAddPacote} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar Pacote
                  </button>
                </div>
                <div className="space-y-2">
                  {(!valData.pacotesSelecionados || valData.pacotesSelecionados.length === 0) && (
                    <p className="text-xs text-gray-400 italic">Nenhum pacote adicional.</p>
                  )}
                  {(valData.pacotesSelecionados || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select value={item.pacote} onChange={(e) => handleUpdatePacote(idx, 'pacote', e.target.value)} className={inputCls + " flex-1"}>
                        {pacotes.map(p => <option key={p.pacote} value={p.pacote}>{p.pacote}</option>)}
                      </select>
                      <input type="number" min="1" required value={item.qtd} onChange={(e) => handleUpdatePacote(idx, 'qtd', e.target.value)} className={inputCls} placeholder="Qtd" style={{ width: '80px' }} />
                      <button type="button" onClick={() => handleRemovePacote(idx)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Método de Pagamento *</label>
                  <select required value={valData.metodoPagamento} onChange={e => setValData({ ...valData, metodoPagamento: e.target.value })} className={inputCls}>
                    <option value="Pix">Pix</option>
                    <option value="Boleto Bancário">Boleto</option>
                    <option value="Cartão de Crédito (À Vista)">Cartão à Vista</option>
                    <option value="Cartão de Crédito (Parcelado)">Cartão Parcelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Modalidade de Venda *</label>
                  <select required value={valData.modalidade} onChange={handleModalidadeChange} className={inputCls}>
                    <option value="mensal">Mensal (Recorrente)</option>
                    <option value="anualVista">Anual (À Vista — com desconto)</option>
                    <option value="anualParcelado">Anual (Parcelado Mensal — com desconto)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Data de Entrada *</label>
                  <input type="date" required value={valData.dataEntrada} onChange={e => setValData({ ...valData, dataEntrada: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Endereço Completo *</label>
                  <input required value={valData.endereco} onChange={e => setValData({ ...valData, endereco: e.target.value })} className={inputCls} placeholder="Rua, número, cidade..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Vendedor *</label>
                  <select required value={valData.vendedorResponsavel} onChange={handleVendedorChange} className={inputCls}>
                    <option value="">Selecione...</option>
                    {funcionarios.filter(f => f.status === 'Ativo' && (f.cargo === 'Vendedor' || f.cargo === 'Administrador' || f.cargo === 'Parceiro' || f.cargo === 'Vendedor e Suporte')).map(f => (
                      <option key={f.id} value={f.nome}>{f.nome} ({f.cargo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Suporte *</label>
                  <select required value={valData.suporteResponsavel} onChange={e => setValData({ ...valData, suporteResponsavel: e.target.value })} className={inputCls}>
                    <option value="">Selecione...</option>
                    {funcionarios.filter(f => f.status === 'Ativo' && (f.cargo === 'Suporte' || f.cargo === 'Administrador' || f.cargo === 'Vendedor e Suporte' || f.cargo === 'Apoio Técnico')).map(f => (
                      <option key={f.id} value={f.nome}>{f.nome} ({f.cargo})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modalidade de Venda movida para cima, junto ao Método de Pagamento */}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsValidateModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  {clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Salvar Alterações' : 'Confirmar & Validar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Novo Cliente</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg">×</button>
            </div>
            <form onSubmit={handleSaveCliente} noValidate className="space-y-3 text-xs">
              <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Nome *</label><input required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Empresa</label><input value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Telefone</label><input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-500 dark:text-gray-400 mb-1">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Data de Entrada</label><input type="date" required value={formData.dataEntrada} onChange={e => setFormData({ ...formData, dataEntrada: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Plano</label>
                  <select value={formData.plano} onChange={e => { const p = planos.find(x => x.plano === e.target.value); setFormData({ ...formData, plano: e.target.value, mrr: p ? p.mensal : 350 }); }} className={inputCls}>
                    {planos.map(p => <option key={p.plano} value={p.plano}>{p.plano}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Pagamento</label>
                  <select value={formData.metodoPagamento} onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })} className={inputCls}>
                    <option value="Pix">Pix</option><option value="Boleto Bancário">Boleto</option><option value="Cartão de Crédito (À Vista)">Cartão à Vista</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CHURN MODAL */}
      {isChurnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Confirmar Cancelamento</h3>
              <button onClick={() => setIsChurnModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg">×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const cl = clientes.find(c => c.id === churnData.id);
              churnCliente(churnData.id, churnData.date);
              addAuditLog('Churn de Cliente', `Cliente "${cl?.empresa || cl?.nome}" cancelado em ${churnData.date}`);
              setIsChurnModalOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">Data de Cancelamento *</label>
                <input type="date" required value={churnData.date} onChange={e => setChurnData({ ...churnData, date: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsChurnModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm">Confirmar Churn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
