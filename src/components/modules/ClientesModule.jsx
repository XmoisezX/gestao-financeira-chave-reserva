import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateBR } from '../../utils/formatters';
import { Users, Search, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

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
  const [addErrors, setAddErrors] = useState([]);
  const [formData, setFormData] = useState({ nome: '', empresa: '', email: '', telefone: '', plano: 'Imobiliária Pro', mrr: 350, metodoPagamento: 'Pix', canalOrigem: 'Tráfego Pago', dataEntrada: new Date().toISOString().split('T')[0] });

  // Validation Modal
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [validateErrors, setValidateErrors] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState(null);
  const [vendedorDesejaSuporte, setVendedorDesejaSuporte] = useState(true);
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

  const getRouletteSupportAgent = () => {
    const activeSupport = (funcionarios || []).filter(f => 
      f.status === 'Ativo' && (f.cargo === 'Suporte' || f.cargo === 'Vendedor e Suporte' || f.cargo === 'Apoio Técnico')
    );
    if (activeSupport.length === 0) {
      const adminFallback = (funcionarios || []).filter(f => f.status === 'Ativo' && f.cargo === 'Administrador');
      if (adminFallback.length > 0) return adminFallback[0].nome;
      return 'Equipe Suporte';
    }
    // Fair distribution based on active client count
    const supportWithCounts = activeSupport.map(agent => ({
      name: agent.nome,
      count: (clientes || []).filter(c => c.suporteResponsavel === agent.nome && c.status === 'Ativo').length
    }));
    supportWithCounts.sort((a, b) => a.count - b.count);
    return supportWithCounts[0].name;
  };

  const getSellerInfo = (sellerName) => {
    if (!sellerName) return { name: '—', photoUrl: null, initial: '?' };
    const norm = sellerName.toLowerCase().trim();
    if (user && ((user.name && user.name.toLowerCase().trim() === norm) || (user.email && user.email.toLowerCase().trim() === norm))) {
      return {
        name: user.name || sellerName,
        photoUrl: user.photoUrl || null,
        initial: (user.name || sellerName).charAt(0).toUpperCase()
      };
    }
    const found = (funcionarios || []).find(f => 
      (f.nome && f.nome.toLowerCase().trim() === norm) || 
      (f.email && f.email.toLowerCase().trim() === norm)
    );
    return {
      name: found?.nome || sellerName,
      photoUrl: found?.photoUrl || null,
      initial: (found?.nome || sellerName).charAt(0).toUpperCase()
    };
  };

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

  const clearValError = (field) => {
    setValidateErrors(prev => prev.filter(e => e.field !== field));
  };

  const hasValError = (field) => validateErrors.some(e => e.field === field);

  const clearAddError = (field) => {
    setAddErrors(prev => prev.filter(e => e.field !== field));
  };

  const hasAddError = (field) => addErrors.some(e => e.field === field);

  const handleOpenAddModal = () => {
    setAddErrors([]);
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      plano: planos[0]?.plano || 'Imobiliária Pro',
      mrr: planos[0]?.mensal || 350,
      metodoPagamento: 'Pix',
      canalOrigem: 'Tráfego Pago',
      vendedorResponsavel: user?.name || '',
      dataEntrada: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCliente = (e) => { 
    e.preventDefault(); 
    const errors = [];
    if (!formData.nome?.trim()) errors.push({ field: 'nome', label: 'Nome' });
    if (!formData.dataEntrada?.trim()) errors.push({ field: 'dataEntrada', label: 'Data de Entrada' });
    if (!formData.plano?.trim()) errors.push({ field: 'plano', label: 'Plano' });
    if (!formData.metodoPagamento?.trim()) errors.push({ field: 'metodoPagamento', label: 'Pagamento' });

    if (errors.length > 0) {
      setAddErrors(errors);
      return;
    }
    setAddErrors([]);

    addCliente(formData); 
    addAuditLog('Cadastro de Cliente', `Cliente "${formData.nome}" (${formData.empresa || 'Sem empresa'}) cadastrado com plano ${formData.plano}, MRR R$${formData.mrr}`);
    setIsAddModalOpen(false); 
  };

  const handleOpenValidate = (cliente) => {
    setSelectedPendingId(cliente.id);
    setValidateErrors([]);
    const seller = cliente.vendedorResponsavel || user?.name || '';
    const hasOptedSupport = cliente.suporteResponsavel ? (cliente.suporteResponsavel === seller) : true;
    setVendedorDesejaSuporte(hasOptedSupport);

    setValData({
      cpfCnpj: cliente.cpfCnpj || '',
      endereco: cliente.endereco || '',
      vendedorResponsavel: seller,
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
    clearValError('vendedorResponsavel');
    const vend = funcionarios.find(f => f.nome === vName);
    
    let newSuporte = valData.suporteResponsavel;
    if (vend && vend.status === 'Ativo' && (vend.cargo === 'Suporte' || vend.cargo === 'Administrador' || vend.cargo === 'Vendedor e Suporte')) {
      newSuporte = vName; // Auto-selects same person due to preference rule
      clearValError('suporteResponsavel');
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
    clearValError('plano');
    setValData(prev => ({
      ...prev,
      plano: val,
      mrr: recalculateMRR(val, prev.moduloAluguel, prev.pacotesSelecionados, prev.modalidade, prev.desconto)
    }));
  };

  const handleAluguelChange = (e) => {
    const val = e.target.value;
    clearValError('moduloAluguel');
    setValData(prev => ({
      ...prev,
      moduloAluguel: val,
      mrr: recalculateMRR(prev.plano, val, prev.pacotesSelecionados, prev.modalidade, prev.desconto)
    }));
  };

  const handleModalidadeChange = (e) => {
    const val = e.target.value;
    clearValError('modalidade');
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
    const errors = [];
    if (!valData.cpfCnpj?.trim()) errors.push({ field: 'cpfCnpj', label: 'CPF / CNPJ' });
    if (!valData.plano?.trim()) errors.push({ field: 'plano', label: 'Plano Escolhido' });
    if (!valData.moduloAluguel?.trim()) errors.push({ field: 'moduloAluguel', label: 'Módulo Aluguel' });
    if (!valData.metodoPagamento?.trim()) errors.push({ field: 'metodoPagamento', label: 'Método de Pagamento' });
    if (!valData.modalidade?.trim()) errors.push({ field: 'modalidade', label: 'Modalidade de Venda' });
    if (!valData.dataEntrada?.trim()) errors.push({ field: 'dataEntrada', label: 'Data de Entrada' });
    if (!valData.endereco?.trim()) errors.push({ field: 'endereco', label: 'Endereço Completo da Imobiliária/Corretor' });
    if (!valData.vendedorResponsavel?.trim()) errors.push({ field: 'vendedorResponsavel', label: 'Vendedor' });

    let finalSuporte = valData.suporteResponsavel;
    if (isAdmin) {
      if (!valData.suporteResponsavel?.trim()) {
        errors.push({ field: 'suporteResponsavel', label: 'Suporte' });
      }
    } else {
      // Non-admin (Vendedor)
      if (valData.modalidade === 'anualVista') {
        if (vendedorDesejaSuporte) {
          finalSuporte = valData.vendedorResponsavel || user?.name || 'Vendedor';
        } else {
          finalSuporte = getRouletteSupportAgent();
        }
      } else {
        // Mensal / Anual Parcelado -> Roleta Automática
        finalSuporte = getRouletteSupportAgent();
      }
    }

    if (errors.length > 0) {
      setValidateErrors(errors);
      return;
    }
    setValidateErrors([]);
    
    const finalData = {
      ...valData,
      suporteResponsavel: finalSuporte
    };

    const client = clientes.find(c => c.id === selectedPendingId);
    if (client && client.status === 'Pendente') {
      validateClientSale(selectedPendingId, finalData);
      addAuditLog('Validação de Cliente', `Cliente "${client.empresa || client.nome}" validado e ativado. Vendedor: ${finalData.vendedorResponsavel}, Suporte: ${finalData.suporteResponsavel}, Modalidade: ${finalData.modalidade}, MRR: R$${finalData.mrr}`);
    } else {
      updateCliente(selectedPendingId, finalData);
      addAuditLog('Edição de Cliente', `Dados de "${client?.empresa || client?.nome}" atualizados. MRR: R$${finalData.mrr}`);
    }
    
    setIsValidateModalOpen(false);
    setSelectedPendingId(null);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400";
  const getInputCls = (isError) => `w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none transition-colors ${isError ? 'border border-red-500 ring-1 ring-red-500 bg-red-50/20 dark:bg-red-950/20 placeholder-red-300' : 'border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-gray-400'}`;

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
          <button onClick={handleOpenAddModal}
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
              <th className="px-4 py-2.5 font-medium">Vendedor</th>
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
                <td className="px-4 py-2.5">
                  {(() => {
                    if (!c.vendedorResponsavel) return <span className="text-gray-400">—</span>;
                    const seller = getSellerInfo(c.vendedorResponsavel);
                    return (
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {seller.photoUrl ? (
                          <img src={seller.photoUrl} alt={seller.name} className="w-5 h-5 rounded-full object-cover shrink-0 border border-indigo-200 dark:border-indigo-800" onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {seller.initial}
                          </div>
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                          {seller.name}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{c.plano}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">R$ {Number(c.mrr).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.metodoPagamento}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.canalOrigem || '-'}</td>
                <td className="px-4 py-2.5 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                  {formatDateBR(c.dataEntrada)}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 dark:bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Editar Dados do Cliente' : 'Aprovar & Validar Venda'}
              </h3>
              <button onClick={() => setIsValidateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">×</button>
            </div>

            <form onSubmit={handleConfirmValidate} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                {/* Error Banner */}
                {validateErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold text-red-800 dark:text-red-200">
                          Por favor, preencha todos os campos obrigatórios (<span className="text-red-500 font-bold">*</span>):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {validateErrors.map(err => (
                            <span
                              key={err.field}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100/90 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-[11px] font-medium border border-red-200/80 dark:border-red-800"
                            >
                              • {err.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-900/20 p-2.5 rounded-lg border border-yellow-200 dark:border-yellow-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span>{clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Edite os dados do cliente.' : 'Complete os dados para aprovar a venda.'}</span>
                  <div className="font-bold text-gray-900 dark:text-white text-right">
                    {valData.modalidade === 'anualVista' ? (
                      <span>À Vista: R$ {(Number(valData.mrr) * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[11px] font-normal text-gray-500">(1ª Parcela / MRR: R$ {Number(valData.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span></span>
                    ) : (
                      <span>Mensal: R$ {Number(valData.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      CPF / CNPJ <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      required
                      value={valData.cpfCnpj}
                      onChange={e => { clearValError('cpfCnpj'); setValData({ ...valData, cpfCnpj: e.target.value }); }}
                      className={getInputCls(hasValError('cpfCnpj'))}
                      placeholder="000.000.000-00"
                    />
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Plano Escolhido <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select required value={valData.plano} onChange={handlePlanoChange} className={getInputCls(hasValError('plano'))}>
                      <option value="">Selecione um plano...</option>
                      {planos.map(p => <option key={p.plano} value={p.plano}>{p.plano}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Módulo Aluguel <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select required value={valData.moduloAluguel} onChange={handleAluguelChange} className={getInputCls(hasValError('moduloAluguel'))}>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Método de Pagamento <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      required
                      value={valData.metodoPagamento}
                      onChange={e => { clearValError('metodoPagamento'); setValData({ ...valData, metodoPagamento: e.target.value }); }}
                      className={getInputCls(hasValError('metodoPagamento'))}
                    >
                      <option value="">Selecione...</option>
                      <option value="Pix">Pix</option>
                      <option value="Boleto Bancário">Boleto</option>
                      <option value="Cartão de Crédito (À Vista)">Cartão à Vista</option>
                      <option value="Cartão de Crédito (Parcelado)">Cartão Parcelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Modalidade de Venda <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select required value={valData.modalidade} onChange={handleModalidadeChange} className={getInputCls(hasValError('modalidade'))}>
                      <option value="mensal">Mensal (Recorrente)</option>
                      <option value="anualVista">Anual (À Vista — com desconto)</option>
                      <option value="anualParcelado">Anual (Parcelado Mensal — com desconto)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Data de Entrada <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={valData.dataEntrada}
                      onChange={e => { clearValError('dataEntrada'); setValData({ ...valData, dataEntrada: e.target.value }); }}
                      className={getInputCls(hasValError('dataEntrada'))}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                      Endereço Completo <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      required
                      value={valData.endereco}
                      onChange={e => { clearValError('endereco'); setValData({ ...valData, endereco: e.target.value }); }}
                      className={getInputCls(hasValError('endereco'))}
                      placeholder="Rua, número, sala/complemento, bairro, cidade - UF"
                    />
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400 mt-1 leading-tight flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Endereço da imobiliária ou do corretor autônomo (<strong>não preencher o do sócio</strong>).</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Vendedor <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    {isAdmin ? (
                      <select required value={valData.vendedorResponsavel} onChange={handleVendedorChange} className={getInputCls(hasValError('vendedorResponsavel'))}>
                        <option value="">Selecione...</option>
                        {funcionarios.filter(f => f.status === 'Ativo' && (f.cargo === 'Vendedor' || f.cargo === 'Administrador' || f.cargo === 'Parceiro' || f.cargo === 'Vendedor e Suporte')).map(f => (
                          <option key={f.id} value={f.nome}>{f.nome} ({f.cargo})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        disabled
                        value={valData.vendedorResponsavel || user?.name || 'Vendedor'}
                        className={`${inputCls} bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed`}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Suporte Responsável {isAdmin && <span className="text-red-500 font-bold ml-0.5">*</span>}
                    </label>

                    {isAdmin ? (
                      <select
                        required
                        value={valData.suporteResponsavel}
                        onChange={e => { clearValError('suporteResponsavel'); setValData({ ...valData, suporteResponsavel: e.target.value }); }}
                        className={getInputCls(hasValError('suporteResponsavel'))}
                      >
                        <option value="">Selecione o suporte...</option>
                        {funcionarios.filter(f => f.status === 'Ativo' && (f.cargo === 'Suporte' || f.cargo === 'Administrador' || f.cargo === 'Vendedor e Suporte' || f.cargo === 'Apoio Técnico')).map(f => (
                          <option key={f.id} value={f.nome}>{f.nome} ({f.cargo})</option>
                        ))}
                      </select>
                    ) : valData.modalidade === 'anualVista' ? (
                      <div className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-1.5">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={vendedorDesejaSuporte}
                            onChange={e => setVendedorDesejaSuporte(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 leading-snug">
                            O vendedor deseja realizar o suporte deste cliente?
                          </span>
                        </label>
                        <div className="pl-6 text-[11px]">
                          {vendedorDesejaSuporte ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Suporte atribuído a você ({valData.vendedorResponsavel || user?.name || 'Vendedor'}).
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              O suporte será definido pela roleta automática entre a equipe de suporte.
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                            Roleta Automática de Suporte
                          </p>
                          <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight mt-0.5">
                            O suporte será definido por uma roleta automática entre a equipe de suporte.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50/70 dark:bg-gray-900/90 z-10">
                <button type="button" onClick={() => setIsValidateModalOpen(false)} className="px-3.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">
                  {clientes.find(c => c.id === selectedPendingId)?.status !== 'Pendente' ? 'Salvar Alterações' : 'Confirmar & Validar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 dark:bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Novo Cliente</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">×</button>
            </div>

            <form onSubmit={handleSaveCliente} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                {/* Error Banner */}
                {addErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold text-red-800 dark:text-red-200">
                          Por favor, preencha os campos obrigatórios (<span className="text-red-500 font-bold">*</span>):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {addErrors.map(err => (
                            <span
                              key={err.field}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100/90 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-[11px] font-medium border border-red-200/80 dark:border-red-800"
                            >
                              • {err.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">
                    Nome <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    required
                    value={formData.nome}
                    onChange={e => { clearAddError('nome'); setFormData({ ...formData, nome: e.target.value }); }}
                    className={getInputCls(hasAddError('nome'))}
                    placeholder="Nome do cliente ou responsável"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Empresa</label><input value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} className={inputCls} placeholder="Nome da imobiliária / empresa" /></div>
                  <div><label className="block text-gray-500 dark:text-gray-400 mb-1">Telefone</label><input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className={inputCls} placeholder="(00) 00000-0000" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-gray-500 dark:text-gray-400 mb-1">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="cliente@email.com" /></div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Data de Entrada <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataEntrada}
                      onChange={e => { clearAddError('dataEntrada'); setFormData({ ...formData, dataEntrada: e.target.value }); }}
                      className={getInputCls(hasAddError('dataEntrada'))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Plano <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      value={formData.plano}
                      onChange={e => {
                        clearAddError('plano');
                        const p = planos.find(x => x.plano === e.target.value);
                        setFormData({ ...formData, plano: e.target.value, mrr: p ? p.mensal : 350 });
                      }}
                      className={getInputCls(hasAddError('plano'))}
                    >
                      {planos.map(p => <option key={p.plano} value={p.plano}>{p.plano}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-400 mb-1">
                      Pagamento <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      value={formData.metodoPagamento}
                      onChange={e => {
                        clearAddError('metodoPagamento');
                        setFormData({ ...formData, metodoPagamento: e.target.value });
                      }}
                      className={getInputCls(hasAddError('metodoPagamento'))}
                    >
                      <option value="Pix">Pix</option>
                      <option value="Boleto Bancário">Boleto</option>
                      <option value="Cartão de Crédito (À Vista)">Cartão à Vista</option>
                      <option value="Cartão de Crédito (Parcelado)">Cartão Parcelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">Vendedor Responsável</label>
                  {isAdmin ? (
                    <select
                      value={formData.vendedorResponsavel}
                      onChange={e => setFormData({ ...formData, vendedorResponsavel: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Selecione o vendedor...</option>
                      {funcionarios.filter(f => f.status === 'Ativo' && (f.cargo === 'Vendedor' || f.cargo === 'Administrador' || f.cargo === 'Parceiro' || f.cargo === 'Vendedor e Suporte')).map(f => (
                        <option key={f.id} value={f.nome}>{f.nome} ({f.cargo})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      disabled
                      value={user?.name || 'Vendedor'}
                      className={`${inputCls} bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed`}
                    />
                  )}
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50/70 dark:bg-gray-900/90 z-10">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-3.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHURN MODAL */}
      {isChurnModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 dark:bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Confirmar Cancelamento</h3>
              <button onClick={() => setIsChurnModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">×</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const cl = clientes.find(c => c.id === churnData.id);
              churnCliente(churnData.id, churnData.date);
              addAuditLog('Churn de Cliente', `Cliente "${cl?.empresa || cl?.nome}" cancelado em ${churnData.date}`);
              setIsChurnModalOpen(false);
            }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1">
                    Data de Cancelamento <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input type="date" required value={churnData.date} onChange={e => setChurnData({ ...churnData, date: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Pinned Modal Footer */}
              <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50/70 dark:bg-gray-900/90 z-10">
                <button type="button" onClick={() => setIsChurnModalOpen(false)} className="px-3.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors">Confirmar Churn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
