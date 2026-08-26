import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { recalculateProjecaoMensal, getNextMonthString, calculateAverageTicket } from '../utils/financialEngine';
import {
  initialProjecaoMensal,
  initialPlanos,
  initialAluguel,
  initialPacotes,
  initialEquipe,
  initialInfraestrutura,
  initialAquisicao,
  initialPremissas,
  initialTaxasPagamento,
  initialResumoExecutivo,
  initialLeads,
  initialClientes,
  initialLancamentosDiarios,
  initialFuncionarios
} from '../data/initialData';

const AppContext = createContext();

const STORAGE_KEYS = {
  LEADS: 'chave_reserva_leads_v1',
  CLIENTES: 'chave_reserva_clientes_v1',
  LANCAMENTOS: 'chave_reserva_lancamentos_v1',
  THEME: 'chave_reserva_theme_v1',
  USER: 'chave_reserva_user_v1',
  PROJECAO_MENSAL: 'chave_reserva_projecao_mensal_v1',
  PLANOS: 'chave_reserva_planos_v1',
  ALUGUEL: 'chave_reserva_aluguel_v1',
  PACOTES: 'chave_reserva_pacotes_v1',
  EQUIPE: 'chave_reserva_equipe_v1',
  INFRAESTRUTURA: 'chave_reserva_infraestrutura_v1',
  AQUISICAO: 'chave_reserva_aquisicao_v1',
  PREMISSAS: 'chave_reserva_premissas_v1',
  TAXAS_PAGAMENTO: 'chave_reserva_taxas_pagamento_v1',
  RESUMO_EXECUTIVO: 'chave_reserva_resumo_executivo_v1',
  FUNCIONARIOS: 'chave_reserva_funcionarios_v1',
  AUDIT_LOG: 'chave_reserva_audit_log_v1',
};

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('projecao');

  // Audit Log
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const addAuditLog = (action, details, userName) => {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user: userName || user?.name || user?.email || 'Sistema',
      action,
      details
    };
    setAuditLog(prev => {
      const updated = [entry, ...prev].slice(0, 500); // keep last 500 entries
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(updated));
      return updated;
    });
  };

  // User session state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (emailInput, passwordInput) => {
    const cleanEmail = (emailInput || '').toLowerCase().trim();
    const cleanPass = (passwordInput || '').trim();

    // 1. Primary Auth: Direct Supabase Cloud Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (data?.user) {
        const meta = data.user.user_metadata || {};
        
        // Find matching local details if any
        const localMatch = (funcionarios || []).find(f => f.email && f.email.toLowerCase().trim() === cleanEmail);

        if (meta.status === 'Inativo' || localMatch?.status === 'Inativo') {
          await supabase.auth.signOut();
          return { success: false, message: 'Este usuário está inativo no sistema. Contate o administrador.' };
        }

        const name = meta.nome || meta.full_name || localMatch?.nome || cleanEmail.split('@')[0];
        const role = meta.cargo || localMatch?.cargo || (cleanEmail === 'moiseztorres100@gmail.com' ? 'Administrador' : 'Vendedor');
        const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

        const loggedUser = {
          id: data.user.id,
          email: data.user.email,
          name,
          role,
          cpf: meta.cpf || localMatch?.cpf || '',
          pix: meta.pix || localMatch?.pix || '',
          avatar: initials
        };

        setUser(loggedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedUser));
        return { success: true, user: loggedUser };
      }
    } catch (err) {
      console.warn('Erro ao autenticar no Supabase:', err);
    }

    // 2. Master Super Admin fallback
    if ((cleanEmail === 'moiseztorres100@gmail.com' || cleanEmail === 'moisez.torres@sou.ucpel.edu.br') && cleanPass === 'Geral123@') {
      const adminUser = {
        id: 'func-1',
        email: cleanEmail,
        name: 'Moisés Torres',
        role: 'Administrador',
        cpf: '000.000.000-00',
        pix: cleanEmail,
        avatar: 'MT'
      };
      setUser(adminUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    // 3. Local state fallback (for offline or local users)
    const currentFuncionarios = (funcionarios && funcionarios.length > 0)
      ? funcionarios
      : JSON.parse(localStorage.getItem(STORAGE_KEYS.FUNCIONARIOS) || '[]');

    const foundUser = currentFuncionarios.find(f => 
      f.email && f.email.toLowerCase().trim() === cleanEmail && String(f.senha || '').trim() === cleanPass
    );

    if (foundUser) {
      if (foundUser.status === 'Inativo') {
        return { success: false, message: 'Este usuário está inativo no sistema. Contate o administrador.' };
      }

      const initials = (foundUser.nome || 'US')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const loggedUser = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.nome,
        role: foundUser.cargo,
        cpf: foundUser.cpf,
        pix: foundUser.pix,
        avatar: initials || 'US'
      };
      setUser(loggedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedUser));
      return { success: true, user: loggedUser };
    }

    return { success: false, message: 'E-mail ou senha incorretos no Supabase. Verifique e tente novamente.' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = {
        ...prev,
        ...updatedFields,
        email: prev.email // Ensure email is locked and immutable
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    });
  };

  // Theme: 'light' (default) or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Main state with localStorage fallback
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [clientes, setClientes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    return saved ? JSON.parse(saved) : initialClientes;
  });

  const [lancamentos, setLancamentos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANCAMENTOS);
    return saved ? JSON.parse(saved) : initialLancamentosDiarios;
  });

  const [funcionarios, setFuncionarios] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FUNCIONARIOS);
    let list = saved ? JSON.parse(saved) : initialFuncionarios;
    
    // Garantir que Moisés Torres esteja sempre cadastrado na lista de usuários
    const hasMoises = (list || []).some(f => f.email && f.email.toLowerCase().trim() === 'moiseztorres100@gmail.com');
    if (!hasMoises) {
      const moisesUser = {
        id: 'func-1',
        nome: 'Moisés Torres',
        cargo: 'Administrador',
        custoMensal: 5000,
        status: 'Ativo',
        cpf: '000.000.000-00',
        pix: 'moiseztorres100@gmail.com',
        email: 'moiseztorres100@gmail.com',
        senha: 'Geral123@'
      };
      const adminPrincipalIdx = (list || []).findIndex(f => f.nome === 'Admin Principal');
      if (adminPrincipalIdx !== -1) {
        list[adminPrincipalIdx] = moisesUser;
      } else {
        list = [moisesUser, ...(list || [])];
      }
    }
    return list;
  });

  // Editable Metas Sub-tab Datasets
  const [projecaoMensal, setProjecaoMensal] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECAO_MENSAL);
    const initial = saved ? JSON.parse(saved) : initialProjecaoMensal;
    const cleared = initial.map(p => ({ ...p, isManualMrrMeta: false }));
    return recalculateProjecaoMensal({
      projecaoCurrent: cleared,
      premissas: initialPremissas,
      planos: initialPlanos,
      aluguel: initialAluguel,
      pacotes: initialPacotes,
      aquisicao: initialAquisicao,
      infraestrutura: initialInfraestrutura,
      equipe: initialEquipe,
      taxasPagamento: initialTaxasPagamento
    });
  });

  const [planos, setPlanos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANOS);
    return saved ? JSON.parse(saved) : initialPlanos;
  });

  const [aluguel, setAluguel] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALUGUEL);
    return saved ? JSON.parse(saved) : initialAluguel;
  });

  const [pacotes, setPacotes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACOTES);
    return saved ? JSON.parse(saved) : initialPacotes;
  });

  const [equipe, setEquipe] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPE);
    return saved ? JSON.parse(saved) : initialEquipe;
  });

  const [infraestrutura, setInfraestrutura] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INFRAESTRUTURA);
    return saved ? JSON.parse(saved) : initialInfraestrutura;
  });

  const [aquisicao, setAquisicao] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AQUISICAO);
    return saved ? JSON.parse(saved) : initialAquisicao;
  });

  const [premissas, setPremissas] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PREMISSAS);
    return saved ? JSON.parse(saved) : initialPremissas;
  });

  const [taxasPagamento, setTaxasPagamento] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TAXAS_PAGAMENTO);
    return saved ? JSON.parse(saved) : initialTaxasPagamento;
  });

  const [resumoExecutivo, setResumoExecutivo] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESUMO_EXECUTIVO);
    return saved ? JSON.parse(saved) : initialResumoExecutivo;
  });

  const isSupabaseLoaded = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Helper for dual persistence (LocalStorage + Supabase DB)
  const syncData = async (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    
    // Do NOT push to Supabase until initial load from Supabase has completed!
    // This prevents empty local state from overwriting the cloud database on initial mount.
    if (!isSupabaseLoaded.current) return;

    try {
      await supabase.from('app_state').upsert({
        key,
        value: data,
        updated_at: new Date().toISOString()
      });
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Erro ao sincronizar chave com Supabase:', key, err);
    }
  };

  // Push all current local state to Supabase on-demand
  const pushLocalStateToSupabase = async () => {
    setIsSyncing(true);
    try {
      const itemsToSync = [
        { key: STORAGE_KEYS.LEADS, value: leads },
        { key: STORAGE_KEYS.CLIENTES, value: clientes },
        { key: STORAGE_KEYS.LANCAMENTOS, value: lancamentos },
        { key: STORAGE_KEYS.PROJECAO_MENSAL, value: projecaoMensal },
        { key: STORAGE_KEYS.PLANOS, value: planos },
        { key: STORAGE_KEYS.ALUGUEL, value: aluguel },
        { key: STORAGE_KEYS.PACOTES, value: pacotes },
        { key: STORAGE_KEYS.EQUIPE, value: equipe },
        { key: STORAGE_KEYS.INFRAESTRUTURA, value: infraestrutura },
        { key: STORAGE_KEYS.AQUISICAO, value: aquisicao },
        { key: STORAGE_KEYS.PREMISSAS, value: premissas },
        { key: STORAGE_KEYS.TAXAS_PAGAMENTO, value: taxasPagamento },
        { key: STORAGE_KEYS.RESUMO_EXECUTIVO, value: resumoExecutivo },
        { key: STORAGE_KEYS.FUNCIONARIOS, value: funcionarios },
        { key: STORAGE_KEYS.AUDIT_LOG, value: auditLog },
      ];

      for (const item of itemsToSync) {
        await supabase.from('app_state').upsert({
          key: item.key,
          value: item.value,
          updated_at: new Date().toISOString()
        });
      }
      setLastSyncedAt(new Date());
      return { success: true };
    } catch (err) {
      console.error('Erro ao enviar estado para Supabase:', err);
      return { success: false, error: err.message || err };
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load from Supabase Database on app startup
  const fetchSupabaseData = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('app_state').select('*');
      if (data && data.length > 0) {
        data.forEach(item => {
          if (!item.value) return;
          localStorage.setItem(item.key, JSON.stringify(item.value));
          if (item.key === STORAGE_KEYS.PROJECAO_MENSAL) setProjecaoMensal(item.value);
          if (item.key === STORAGE_KEYS.PLANOS) setPlanos(item.value);
          if (item.key === STORAGE_KEYS.ALUGUEL) setAluguel(item.value);
          if (item.key === STORAGE_KEYS.PACOTES) setPacotes(item.value);
          if (item.key === STORAGE_KEYS.EQUIPE) setEquipe(item.value);
          if (item.key === STORAGE_KEYS.INFRAESTRUTURA) setInfraestrutura(item.value);
          if (item.key === STORAGE_KEYS.AQUISICAO) setAquisicao(item.value);
          if (item.key === STORAGE_KEYS.PREMISSAS) setPremissas(item.value);
          if (item.key === STORAGE_KEYS.TAXAS_PAGAMENTO) setTaxasPagamento(item.value);
          if (item.key === STORAGE_KEYS.RESUMO_EXECUTIVO) setResumoExecutivo(item.value);
          if (item.key === STORAGE_KEYS.LEADS) setLeads(item.value);
          if (item.key === STORAGE_KEYS.CLIENTES) setClientes(item.value);
          if (item.key === STORAGE_KEYS.LANCAMENTOS) setLancamentos(item.value);
          if (item.key === STORAGE_KEYS.FUNCIONARIOS) setFuncionarios(item.value);
          if (item.key === STORAGE_KEYS.AUDIT_LOG) setAuditLog(item.value);
        });
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.warn('Fallback para cache local do navegador:', err);
    } finally {
      isSupabaseLoaded.current = true;
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSupabaseData();

    // Supabase Realtime synchronization
    const channel = supabase
      .channel('app_state_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, payload => {
        if (payload.new && payload.new.key) {
          const item = payload.new;
          if (item.key === STORAGE_KEYS.PROJECAO_MENSAL && item.value) setProjecaoMensal(item.value);
          if (item.key === STORAGE_KEYS.PLANOS && item.value) setPlanos(item.value);
          if (item.key === STORAGE_KEYS.ALUGUEL && item.value) setAluguel(item.value);
          if (item.key === STORAGE_KEYS.PACOTES && item.value) setPacotes(item.value);
          if (item.key === STORAGE_KEYS.EQUIPE && item.value) setEquipe(item.value);
          if (item.key === STORAGE_KEYS.INFRAESTRUTURA && item.value) setInfraestrutura(item.value);
          if (item.key === STORAGE_KEYS.AQUISICAO && item.value) setAquisicao(item.value);
          if (item.key === STORAGE_KEYS.PREMISSAS && item.value) setPremissas(item.value);
          if (item.key === STORAGE_KEYS.TAXAS_PAGAMENTO && item.value) setTaxasPagamento(item.value);
          if (item.key === STORAGE_KEYS.RESUMO_EXECUTIVO && item.value) setResumoExecutivo(item.value);
          if (item.key === STORAGE_KEYS.LEADS && item.value) setLeads(item.value);
          if (item.key === STORAGE_KEYS.CLIENTES && item.value) setClientes(item.value);
          if (item.key === STORAGE_KEYS.LANCAMENTOS && item.value) setLancamentos(item.value);
          if (item.key === STORAGE_KEYS.FUNCIONARIOS && item.value) setFuncionarios(item.value);
          if (item.key === STORAGE_KEYS.AUDIT_LOG && item.value) setAuditLog(item.value);
          localStorage.setItem(item.key, JSON.stringify(item.value));
          setLastSyncedAt(new Date());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync to LocalStorage + Supabase
  useEffect(() => { syncData(STORAGE_KEYS.LEADS, leads); }, [leads]);
  useEffect(() => { syncData(STORAGE_KEYS.CLIENTES, clientes); }, [clientes]);
  useEffect(() => { syncData(STORAGE_KEYS.LANCAMENTOS, lancamentos); }, [lancamentos]);
  useEffect(() => { syncData(STORAGE_KEYS.PROJECAO_MENSAL, projecaoMensal); }, [projecaoMensal]);
  useEffect(() => { syncData(STORAGE_KEYS.PLANOS, planos); }, [planos]);
  useEffect(() => { syncData(STORAGE_KEYS.ALUGUEL, aluguel); }, [aluguel]);
  useEffect(() => { syncData(STORAGE_KEYS.PACOTES, pacotes); }, [pacotes]);
  useEffect(() => { syncData(STORAGE_KEYS.EQUIPE, equipe); }, [equipe]);
  useEffect(() => { syncData(STORAGE_KEYS.INFRAESTRUTURA, infraestrutura); }, [infraestrutura]);
  useEffect(() => { syncData(STORAGE_KEYS.AQUISICAO, aquisicao); }, [aquisicao]);
  useEffect(() => { syncData(STORAGE_KEYS.PREMISSAS, premissas); }, [premissas]);
  useEffect(() => { syncData(STORAGE_KEYS.TAXAS_PAGAMENTO, taxasPagamento); }, [taxasPagamento]);
  useEffect(() => { syncData(STORAGE_KEYS.RESUMO_EXECUTIVO, resumoExecutivo); }, [resumoExecutivo]);
  useEffect(() => { syncData(STORAGE_KEYS.FUNCIONARIOS, funcionarios); }, [funcionarios]);
  useEffect(() => { syncData(STORAGE_KEYS.AUDIT_LOG, auditLog); }, [auditLog]);

  // Always enforce fresh engine calculation for projecaoMensal when premissas or plans change
  useEffect(() => {
    setProjecaoMensal(prev => recalculateProjecaoMensal({
      projecaoCurrent: prev, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
    }));
  }, [planos, premissas, aluguel, pacotes]);

  // Update handlers for Metas sub-tabs with automatic financial recalculation
  const updateProjecaoMensalCell = (index, field, value) => {
    if (field === 'novosLiquidosMeta' && projecaoMensal[index]?.isLockedNovos) {
      return;
    }
    const flagMap = {
      clientesAtivosMeta: 'isManualClients',
      churn: 'isManualChurn',
      novosLiquidosMeta: 'isManualNovos',
      novosBrutosNecessarios: 'isManualNovosBrutos',
      mrrMeta: 'isManualMrrMeta',
      mrrAluguel: 'isManualMrrAluguel',
      mrrPacotes: 'isManualMrrPacotes',
      mrrTotal: 'isManualMRR',
      receitaEmpresa: 'isManualReceita',
      comissaoVendas: 'isManualComissao',
      bonusVendaAnual: 'isManualBonusAnual',
      comissaoSuporte: 'isManualComissaoSuporte',
      novosTrafego: 'isManualNovosTrafego',
      cacTrafego: 'isManualCacTrafego',
      investimentoTrafego: 'isManualInvestTrafego',
      novosLista: 'isManualNovosLista',
      contatosFrios: 'isManualContatosFrios',
      custoListaFria: 'isManualCustoLista',
      novosInfluencer: 'isManualNovosInfluencer',
      custo1aInfluencer: 'isManualCusto1aInfluencer',
      custoRecorrenteInfluencer: 'isManualCustoRecorInfluencer',
      proLaboreDev: 'isManualProLaboreDev',
      proLaboreGestor: 'isManualProLaboreGestor',
      proLaboreMkt: 'isManualProLaboreMkt',
      proLaboreFin: 'isManualProLaboreFin',
      suporteFixo: 'isManualSuporteFixo',
      apoioTecnico: 'isManualApoioTecnico',
      sdr: 'isManualSdr',
      marketingCriacao: 'isManualMktCriacao',
      bonusMetas: 'isManualBonusMetas',
      infraestrutura: 'isManualInfra',
      taxasPagamento: 'isManualTaxasPagamento',
      impostos: 'isManualImpostos',
      resultadoBruto: 'isManualResultadoBruto',
      resultadoLiquido: 'isManualResultado',
      receitaCaixa: 'isManualReceitaCaixa',
      impostosCaixa8: 'isManualImpostosCaixa',
      resultadoCaixa: 'isManualResultadoCaixa',
      saldoCaixaAcumulado: 'isManualCaixa'
    };
    const flagField = flagMap[field] || '';

    setProjecaoMensal(prev => {
      const numVal = isNaN(Number(value)) ? value : Number(value);
      const updated = prev.map((item, idx) => idx === index ? {
        ...item,
        [field]: numVal,
        ...(flagField ? { [flagField]: true } : {})
      } : item);

      return recalculateProjecaoMensal({
        projecaoCurrent: updated,
        premissas,
        planos,
        aluguel,
        pacotes,
        aquisicao,
        infraestrutura,
        equipe,
        taxasPagamento
      });
    });
  };

  const toggleLockNovos = (index) => {
    setProjecaoMensal(prev => {
      const updated = prev.map((item, idx) => idx === index ? {
        ...item,
        isLockedNovos: !item.isLockedNovos
      } : item);
      return recalculateProjecaoMensal({
        projecaoCurrent: updated, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
      });
    });
  };

  const addProjecaoMonth = () => {
    setProjecaoMensal(prev => {
      const lastItem = prev[prev.length - 1];
      const nextMonthStr = getNextMonthString(lastItem?.month || 'Dec/2027');
      const newMonthObj = {
        month: nextMonthStr,
        clientesAtivosMeta: 0,
        churn: 0,
        novosLiquidosMeta: lastItem ? Number(lastItem.novosLiquidosMeta || 35) : 35,
        novosBrutosNecessarios: 0,
        mrrMeta: 0,
        mrrAluguel: 0,
        mrrPacotes: 0,
        mrrTotal: 0,
        receitaEmpresa: 0,
        comissaoVendas: 0,
        comissaoSuporte: 0,
        novosTrafego: 0,
        cacTrafego: 160,
        investimentoTrafego: 0,
        novosLista: 0,
        contatosFrios: 0,
        custoListaFria: 0,
        novosInfluencer: 0,
        custo1aInfluencer: 0,
        custoRecorrenteInfluencer: 0,
        proLaboreDev: 2500,
        proLaboreGestor: 2000,
        proLaboreMkt: 3000,
        proLaboreFin: 1500,
        suporteFixo: 7830,
        apoioTecnico: 3500,
        sdr: 2000,
        infraestrutura: 1359.24,
        impostos: 0,
        resultadoBruto: 0,
        resultadoLiquido: 0,
        receitaCaixa: 0,
        resultadoCaixa: 0,
        saldoCaixaAcumulado: 0,
        taxasPagamento: 0
      };
      const updated = [...prev, newMonthObj];
      return recalculateProjecaoMensal({
        projecaoCurrent: updated, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
      });
    });
  };

  const removeProjecaoMonth = (index) => {
    setProjecaoMensal(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((_, idx) => idx !== index);
      return recalculateProjecaoMensal({
        projecaoCurrent: updated, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
      });
    });
  };

  const updatePremissaTicketVal = (curPremissas, curPlanos) => {
    if (!curPremissas) return curPremissas;
    const ticketVal = calculateAverageTicket(curPlanos, aluguel, pacotes, curPremissas);
    const formatted = `R$ ${ticketVal.toFixed(2).replace('.', ',')}`;
    return curPremissas.map(p =>
      String(p.premissa).toLowerCase().includes('ticket')
        ? { ...p, valor: formatted }
        : p
    );
  };

  const updatePlanoCell = (index, field, value) => {
    setPlanos(prev => {
      let finalValue = value;
      if (field === 'previsaoVendas') {
        const reqVal = Number(value) || 0;
        const otherPlansSum = prev.reduce((acc, p, idx) => idx === index ? acc : acc + (Number(p.previsaoVendas) || 0), 0);
        if (otherPlansSum + reqVal > 1.0001) {
          const maxAvailable = Math.max(0, Number((1 - otherPlansSum).toFixed(4)));
          alert(`A soma do Mix de Vendas (%) de todos os planos não pode ultrapassar 100%. O valor foi ajustado para o limite máximo disponível de ${(maxAvailable * 100).toFixed(1)}%.`);
          finalValue = maxAvailable;
        }
      }
      const next = prev.map((item, idx) => idx === index ? { ...item, [field]: finalValue } : item);
      
      setPremissas(curPrem => {
        const updatedPrem = updatePremissaTicketVal(curPrem, next);
        setProjecaoMensal(proj => {
          const clearedProj = proj.map(p => ({ ...p, isManualMrrMeta: false }));
          return recalculateProjecaoMensal({
            projecaoCurrent: clearedProj, premissas: updatedPrem, planos: next, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
          });
        });
        return updatedPrem;
      });

      return next;
    });
  };

  const addPlano = (newPlanoData) => {
    setPlanos(prev => {
      const currentSum = prev.reduce((acc, p) => acc + (Number(p.previsaoVendas) || 0), 0);
      const remMix = Math.max(0, Number((1 - currentSum).toFixed(4)));
      const newPlan = {
        plano: newPlanoData?.plano || `Plano ${prev.length + 1}`,
        mensal: Number(newPlanoData?.mensal) || 290,
        anualMensal: Number(newPlanoData?.anualMensal) || 230,
        anualVista: Number(newPlanoData?.anualVista) || 2760,
        previsaoVendas: newPlanoData?.previsaoVendas !== undefined ? Number(newPlanoData.previsaoVendas) : remMix
      };
      const next = [...prev, newPlan];
      
      setPremissas(curPrem => {
        const updatedPrem = updatePremissaTicketVal(curPrem, next);
        setProjecaoMensal(proj => {
          const clearedProj = proj.map(p => ({ ...p, isManualMrrMeta: false }));
          return recalculateProjecaoMensal({
            projecaoCurrent: clearedProj, premissas: updatedPrem, planos: next, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
          });
        });
        return updatedPrem;
      });

      return next;
    });
  };

  const removePlano = (index) => {
    setPlanos(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      
      setPremissas(curPrem => {
        const updatedPrem = updatePremissaTicketVal(curPrem, next);
        setProjecaoMensal(proj => {
          const clearedProj = proj.map(p => ({ ...p, isManualMrrMeta: false }));
          return recalculateProjecaoMensal({
            projecaoCurrent: clearedProj, premissas: updatedPrem, planos: next, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
          });
        });
        return updatedPrem;
      });

      return next;
    });
  };

  const updateAluguelCell = (index, field, value) => {
    setAluguel(prev => {
      const next = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrAluguel: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel: next, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const addAluguel = (newAluguelData) => {
    setAluguel(prev => {
      const newItem = {
        plano: newAluguelData?.plano || `Módulo ${prev.length + 1}`,
        mensal: Number(newAluguelData?.mensal) || 200,
        anualMensal: Number(newAluguelData?.anualMensal) || 160,
        anualVista: Number(newAluguelData?.anualVista) || 1920,
        previsaoVendas: newAluguelData?.previsaoVendas !== undefined ? Number(newAluguelData.previsaoVendas) : 0.30,
        vendidoBase: newAluguelData?.vendidoBase || 'Sim',
        previsaoLancamento: newAluguelData?.previsaoLancamento || '01/11/2026'
      };
      const next = [...prev, newItem];
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrAluguel: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel: next, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const removeAluguel = (index) => {
    setAluguel(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrAluguel: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel: next, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const updatePacoteCell = (index, field, value) => {
    setPacotes(prev => {
      const next = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrPacotes: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel, pacotes: next, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const addPacote = (newPacoteData) => {
    setPacotes(prev => {
      const newItem = {
        pacote: newPacoteData?.pacote || `Pacote ${prev.length + 1}`,
        qtd: Number(newPacoteData?.qtd) || 1,
        valor: Number(newPacoteData?.valor) || 29.99,
        previsaoVendas: newPacoteData?.previsaoVendas !== undefined ? Number(newPacoteData.previsaoVendas) : 0.10,
        vendidoBase: newPacoteData?.vendidoBase || 'Sim',
        previsaoLancamento: newPacoteData?.previsaoLancamento || 'Sep/2026'
      };
      const next = [...prev, newItem];
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrPacotes: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel, pacotes: next, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const removePacote = (index) => {
    setPacotes(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({ ...p, isManualMrrPacotes: false }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas, planos, aluguel, pacotes: next, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return next;
    });
  };

  const updateEquipeCell = (index, field, value) => {
    setEquipe(prev => {
      const next = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
      setProjecaoMensal(proj => recalculateProjecaoMensal({
        projecaoCurrent: proj, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe: next, taxasPagamento
      }));
      return next;
    });
  };

  const updateInfraCell = (faixaIdx, itemIdx, field, value) => {
    setInfraestrutura(prev => {
      const next = prev.map((faixa, fIdx) => {
        if (fIdx !== faixaIdx) return faixa;
        const updatedItens = faixa.itens.map((it, iIdx) => iIdx === itemIdx ? { ...it, [field]: value } : it);
        const newTotal = updatedItens.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
        return { ...faixa, itens: updatedItens, total: newTotal };
      });
      setProjecaoMensal(proj => recalculateProjecaoMensal({
        projecaoCurrent: proj, premissas, planos, aluguel, pacotes, aquisicao, infraestrutura: next, equipe, taxasPagamento
      }));
      return next;
    });
  };

  const updateAquisicaoCell = (index, field, value) => {
    setAquisicao(prev => {
      const next = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
      setProjecaoMensal(proj => recalculateProjecaoMensal({
        projecaoCurrent: proj, premissas, planos, aluguel, pacotes, aquisicao: next, infraestrutura, equipe, taxasPagamento
      }));
      return next;
    });
  };

  const updatePremissaCell = (index, field, value) => {
    setPremissas(prev => {
      let next = prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item);

      const targetPremissa = String(prev[index]?.premissa || '');
      if (targetPremissa.toLowerCase().includes('anuais') && field === 'valor') {
        const numVal = parseFloat(String(value).replace('%', '').replace(',', '.')) || 0;
        const compVal = Math.max(0, 100 - numVal);
        next = next.map(p => String(p.premissa).toLowerCase().includes('mensais')
          ? { ...p, valor: `${compVal.toFixed(1).replace('.', ',')}%` }
          : p
        );
      } else if (targetPremissa.toLowerCase().includes('mensais') && field === 'valor') {
        const numVal = parseFloat(String(value).replace('%', '').replace(',', '.')) || 0;
        const compVal = Math.max(0, 100 - numVal);
        next = next.map(p => String(p.premissa).toLowerCase().includes('anuais')
          ? { ...p, valor: `${compVal.toFixed(1).replace('.', ',')}%` }
          : p
        );
      }

      const syncedNext = updatePremissaTicketVal(next, planos);

      setProjecaoMensal(proj => {
        const clearedProj = proj.map(p => ({
          ...p,
          isManualMrrMeta: false,
          isManualComissao: false,
          isManualBonusAnual: false
        }));
        return recalculateProjecaoMensal({
          projecaoCurrent: clearedProj, premissas: syncedNext, planos, aluguel, pacotes, aquisicao, infraestrutura, equipe, taxasPagamento
        });
      });
      return syncedNext;
    });
  };

  const updateTaxaCell = (index, field, value) => {
    setTaxasPagamento(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const updateResumoCell = (field, value) => {
    setResumoExecutivo(prev => ({ ...prev, [field]: value }));
  };

  // Lead CRUD
  const addLead = (newLead) => {
    const leadWithId = {
      ...newLead,
      id: `lead-${Date.now()}`,
      dataCriacao: new Date().toISOString().split('T')[0]
    };
    setLeads(prev => [leadWithId, ...prev]);
  };

  const updateLead = (id, updatedFields) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
  };

  const deleteLead = (id) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const moveLeadStage = (id, newStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, estagio: newStage } : l));
  };

  // Conversion Lead to Client
  const convertLeadToClient = (lead, formData) => {
    // 1. Mark lead as Won
    moveLeadStage(lead.id, 'Fechado/Ganho');

    // 2. Create Pendente Client
    const newClient = {
      id: `cli-${Date.now()}`,
      nome: lead.nome,
      empresa: lead.empresa,
      email: lead.email,
      telefone: lead.telefone,
      plano: formData.plano,
      mrr: formData.mrr,
      metodoPagamento: formData.metodoPagamento,
      canalOrigem: lead.canal,
      dataEntrada: formData.dataEntrada || new Date().toISOString().split('T')[0],
      status: 'Pendente', // ALL CONVERTED CLIENTS MUST BE COMPLETED FIRST
      modulosAdicionais: formData.modulosAdicionais || [],
      // Missing fields that must be filled before validation
      cpfCnpj: '',
      endereco: '',
      vendedorResponsavel: '',
      suporteResponsavel: '',
      modalidade: 'mensal', // 'mensal' ou 'anualVista' ou 'anualParcelado'
      desconto: 0
    };

    setClientes(prev => [newClient, ...prev]);
  };

  const validateClientSale = (clientId, valData) => {
    setClientes(prev => {
      const clientsList = [...prev];
      const index = clientsList.findIndex(c => c.id === clientId);
      if (index === -1) return prev;

      // Mescla os dados preenchidos no modal de validação com o cliente existente
      const client = { ...clientsList[index], ...valData };
      
      // Calculate Commissions based on Rules
      let comissaoVenda = 0;
      let comissaoSuporte = 0;
      const isAnualVista = client.modalidade === 'anualVista';
      
      const vVendasPremissa = premissas.find(p => String(p.premissa).toLowerCase().includes('comissão de vendas'));
      const vVendasPct = vVendasPremissa ? parseFloat(String(vVendasPremissa.valor).replace('%', '')) : 50;
      
      const vBonusPremissa = premissas.find(p => String(p.premissa).toLowerCase().includes('bônus venda anual'));
      const vBonusPct = vBonusPremissa ? parseFloat(String(vBonusPremissa.valor).replace('%', '')) : 20;

      const vSuportePremissa = premissas.find(p => String(p.premissa).toLowerCase().includes('comissão de suporte'));
      const vSuportePct = vSuportePremissa ? parseFloat(String(vSuportePremissa.valor).replace('%', '')) : 50;

      // Calcula a 1ª parcela (MRR mensal com desconto anual se for à vista)
      const ticketMensal = Number(client.mrr || 0);
      const receitaRecebida = isAnualVista ? (ticketMensal * 12) : ticketMensal;

      // Base para comissão: 1 parcela (1/12 do valor à vista ou 1 mensalidade)
      const parcelaBaseComissao = ticketMensal;

      // Vendedor: 50% da 1ª parcela + 20% bônus se anual à vista (total 70% da 1ª parcela)
      comissaoVenda = parcelaBaseComissao * (vVendasPct / 100);
      if (isAnualVista) {
        comissaoVenda += parcelaBaseComissao * (vBonusPct / 100);
      }

      // Suporte: 50% da 1ª parcela (se anual à vista) ou 50% da 2ª parcela (se mensal)
      comissaoSuporte = parcelaBaseComissao * (vSuportePct / 100);

      // Create Lancamento Diário — only receita and novos clientes (commissions are launched manually via Comissões tab)
      const today = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dataRef = client.dataEntrada || today.toISOString().split('T')[0];
      const refDate = new Date(dataRef + 'T00:00:00');
      const mesReferencia = `${monthNames[refDate.getMonth()]}/${refDate.getFullYear()}`;

      const lancamentoReceita = {
        id: `lanc-auto-venda-${Date.now()}`,
        clientId: client.id,
        data: dataRef,
        mesReferencia,
        novosClientes: 1,
        gastoTrafego: 0,
        comissaoVendas: 0,
        comissaoSuporte: 0,
        custosOperacionais: 0,
        receitaReais: receitaRecebida * (1 - (client.desconto || 0) / 100),
        aportesFinanceiros: 0,
        observacao: `Venda validada: ${client.empresa || client.nome}. Vendedor: ${client.vendedorResponsavel}. Suporte: ${client.suporteResponsavel}. Modalidade: ${isAnualVista ? 'Anual à Vista' : 'Mensal'}.`
      };

      // Remove any previous auto-venda lancamento for this client to avoid duplicates
      setLancamentos(prevL => [
        lancamentoReceita,
        ...prevL.filter(l => l.clientId !== client.id && !(l.observacao && (l.observacao.includes(client.empresa || '---') || l.observacao.includes(client.nome || '---')) && l.id.startsWith('lanc-auto-venda-')))
      ]);

      // Store calculated commission values on the client for the Comissões tab
      client.status = 'Ativo';
      client.comissaoVendaValor = comissaoVenda;
      client.comissaoSuporteValor = comissaoSuporte;
      client.comissaoVendaPaga = false;
      client.comissaoSuportePaga = false;
      clientsList[index] = client;
      return clientsList;
    });
  };

  // Customer CRUD
  const addCliente = (newCliente) => {
    const clientWithId = {
      ...newCliente,
      id: `cli-${Date.now()}`,
      status: 'Ativo',
      dataEntrada: newCliente.dataEntrada || new Date().toISOString().split('T')[0]
    };
    setClientes(prev => [clientWithId, ...prev]);
  };

  const updateCliente = (id, updatedFields) => {
    let clientName = '';
    let clientEmpresa = '';
    setClientes(prev => prev.map(c => {
      if (c.id === id) {
        clientName = c.nome;
        clientEmpresa = c.empresa;
        return { ...c, ...updatedFields };
      }
      return c;
    }));

    // If dataEntrada or financial values changed, update linked lancamentos
    if (updatedFields.dataEntrada) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const d = new Date(updatedFields.dataEntrada + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const newMesRef = `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
        setLancamentos(prevL => prevL.map(l => {
          const isLinked = l.clientId === id ||
            (l.observacao && ((clientEmpresa && l.observacao.includes(clientEmpresa)) || (clientName && l.observacao.includes(clientName))));
          if (isLinked) {
            return {
              ...l,
              data: updatedFields.dataEntrada,
              mesReferencia: newMesRef
            };
          }
          return l;
        }));
      }
    }
  };

  const churnCliente = (id, dataCancelamento) => {
    setClientes(prev => prev.map(c => c.id === id ? {
      ...c,
      status: 'Churned',
      dataCancelamento: dataCancelamento || new Date().toISOString().split('T')[0]
    } : c));
  };

  const reactivateCliente = (id) => {
    setClientes(prev => prev.map(c => c.id === id ? {
      ...c,
      status: 'Ativo',
      dataCancelamento: null
    } : c));
  };

  const deleteCliente = (id) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  // Daily Real Log CRUD
  const addLancamentoDiario = (novoLancamento) => {
    const lancWithId = {
      ...novoLancamento,
      id: `lanc-${Date.now()}`,
      novosClientes: Number(novoLancamento.novosClientes || 0),
      gastoTrafego: Number(novoLancamento.gastoTrafego || 0),
      comissaoVendas: Number(novoLancamento.comissaoVendas || novoLancamento.comissoesPagas || 0),
      comissaoSuporte: Number(novoLancamento.comissaoSuporte || 0),
      custosOperacionais: Number(novoLancamento.custosOperacionais || 0),
      receitaReais: Number(novoLancamento.receitaReais || 0),
      aportesFinanceiros: Number(novoLancamento.aportesFinanceiros || 0)
    };
    setLancamentos(prev => [lancWithId, ...prev]);
  };

  const deleteLancamentoDiario = (id) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
  };

  // Reset to initial defaults
  const resetAllData = () => {
    if (window.confirm("Deseja restaurar os dados originais da planilha para todos os módulos?")) {
      setLeads(initialLeads);
      setClientes(initialClientes);
      setLancamentos(initialLancamentosDiarios);
      setProjecaoMensal(initialProjecaoMensal);
      setPlanos(initialPlanos);
      setAluguel(initialAluguel);
      setPacotes(initialPacotes);
      setEquipe(initialEquipe);
      setInfraestrutura(initialInfraestrutura);
      setAquisicao(initialAquisicao);
      setPremissas(initialPremissas);
      setTaxasPagamento(initialTaxasPagamento);
      setResumoExecutivo(initialResumoExecutivo);
      setFuncionarios(initialFuncionarios);

      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.USER && key !== STORAGE_KEYS.THEME) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Save User directly to Supabase Auth and state
  const saveFuncionario = async (userData) => {
    try {
      if (userData.email && userData.senha) {
        // Create or update in Supabase Auth via supabaseAdmin
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email.toLowerCase().trim(),
          password: userData.senha,
          email_confirm: true,
          user_metadata: {
            nome: userData.nome,
            cargo: userData.cargo,
            cpf: userData.cpf,
            pix: userData.pix,
            custoMensal: Number(userData.custoMensal) || 0,
            dataInicio: userData.dataInicio || null,
            dataFim: userData.dataFim || null,
            status: userData.status
          }
        });

        if (createErr && (createErr.message.includes('already') || createErr.status === 422)) {
          // If already exists, update user password and metadata
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === userData.email.toLowerCase().trim());
          if (existingUser) {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              password: userData.senha,
              user_metadata: {
                nome: userData.nome,
                cargo: userData.cargo,
                cpf: userData.cpf,
                pix: userData.pix,
                custoMensal: Number(userData.custoMensal) || 0,
                dataInicio: userData.dataInicio || null,
                dataFim: userData.dataFim || null,
                status: userData.status
              }
            });
          }
        } else if (createErr) {
          // Fallback via standard client signUp if admin endpoint is unauthorized in browser
          await supabase.auth.signUp({
            email: userData.email.toLowerCase().trim(),
            password: userData.senha,
            options: {
              data: {
                nome: userData.nome,
                cargo: userData.cargo,
                cpf: userData.cpf,
                pix: userData.pix,
                custoMensal: Number(userData.custoMensal) || 0,
                dataInicio: userData.dataInicio || null,
                dataFim: userData.dataFim || null,
                status: userData.status
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('Erro ao salvar no Supabase Auth:', err);
    }

    // Update local state and storage
    setFuncionarios(prev => {
      const exists = (prev || []).find(f => f.id === userData.id || (f.email && f.email.toLowerCase() === userData.email?.toLowerCase()));
      let updated;
      if (exists) {
        updated = prev.map(f => (f.id === userData.id || (f.email && f.email.toLowerCase() === userData.email?.toLowerCase())) ? { ...f, ...userData } : f);
      } else {
        updated = [...(prev || []), userData];
      }
      localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(updated));
      return updated;
    });

    return { success: true };
  };

  const deleteFuncionario = async (id, email) => {
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email?.toLowerCase() === email?.toLowerCase() || u.id === id);
      if (existing) {
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
      }
    } catch (err) {
      console.warn('Erro ao excluir no Supabase Auth:', err);
    }
    setFuncionarios(prev => {
      const updated = (prev || []).filter(f => f.id !== id);
      localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(updated));
      return updated;
    });
  };

  // Sync Supabase Auth users on mount
  useEffect(() => {
    const syncUsersFromSupabase = async () => {
      try {
        // Ensure Moisés Torres master admin exists in Supabase Auth
        await supabaseAdmin.auth.admin.createUser({
          email: 'moiseztorres100@gmail.com',
          password: 'Geral123@',
          email_confirm: true,
          user_metadata: {
            nome: 'Moisés Torres',
            cargo: 'Administrador',
            cpf: '000.000.000-00',
            pix: 'moiseztorres100@gmail.com',
            custoMensal: 5000,
            status: 'Ativo'
          }
        }).catch(() => {});

        const { data } = await supabaseAdmin.auth.admin.listUsers();
        if (data?.users && data.users.length > 0) {
          const fetched = data.users.map(u => ({
            id: u.id,
            email: u.email,
            nome: u.user_metadata?.nome || u.user_metadata?.full_name || u.email.split('@')[0],
            cargo: u.user_metadata?.cargo || (u.email === 'moiseztorres100@gmail.com' ? 'Administrador' : 'Vendedor'),
            cpf: u.user_metadata?.cpf || '',
            pix: u.user_metadata?.pix || '',
            custoMensal: Number(u.user_metadata?.custoMensal) || 0,
            status: u.user_metadata?.status || 'Ativo',
            senha: ''
          }));

          setFuncionarios(prev => {
            const currentList = [...(prev || [])];
            fetched.forEach(fu => {
              const idx = currentList.findIndex(c => c.email?.toLowerCase() === fu.email?.toLowerCase());
              if (idx !== -1) {
                currentList[idx] = { ...currentList[idx], ...fu, senha: currentList[idx].senha || fu.senha };
              } else {
                currentList.push(fu);
              }
            });
            localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(currentList));
            return currentList;
          });
        }
      } catch (e) {
        console.warn('Erro ao sincronizar do Supabase:', e);
      }
    };

    syncUsersFromSupabase();
  }, []);

  // Computed Real-time metrics
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo');
  const clientesChurned = clientes.filter(c => c.status === 'Churned');
  const mrrTotalReal = clientesAtivos.reduce((acc, c) => acc + Number(c.mrr || 0), 0);
  const arpuMedioReal = clientesAtivos.length > 0 ? (mrrTotalReal / clientesAtivos.length) : 0;
  const churnRateReal = (clientesAtivos.length + clientesChurned.length) > 0
    ? ((clientesChurned.length / (clientesAtivos.length + clientesChurned.length)) * 100).toFixed(1)
    : 0;

  // Realized vs Meta totals for current period
  const totalGastoTrafegoReal = lancamentos.reduce((acc, l) => acc + (l.gastoTrafego || 0), 0);
  const totalNovosClientesReal = lancamentos.reduce((acc, l) => acc + (l.novosClientes || 0), 0);
  const cacMedioReal = totalNovosClientesReal > 0 ? (totalGastoTrafegoReal / totalNovosClientesReal) : 0;

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user,
      activeTab,
      setActiveTab,
      activeSubTab,
      setActiveSubTab,
      theme,
      toggleTheme,
      leads,
      clientes,
      lancamentos,
      projecaoMensal,
      planos,
      aluguel,
      pacotes,
      equipe,
      infraestrutura,
      aquisicao,
      premissas,
      taxasPagamento,
      resumoExecutivo,
      // Metas Updaters
      updateProjecaoMensalCell,
      addProjecaoMonth,
      removeProjecaoMonth,
      toggleLockNovos,
      updatePlanoCell,
      addPlano,
      removePlano,
      updateAluguelCell,
      addAluguel,
      removeAluguel,
      updatePacoteCell,
      addPacote,
      removePacote,
      updateEquipeCell,
      updateInfraCell,
      updateAquisicaoCell,
      updatePremissaCell,
      updateTaxaCell,
      updateResumoCell,
      // Main CRUDs
      addLead,
      updateLead,
      deleteLead,
      moveLeadStage,
      convertLeadToClient,
      addCliente,
      updateCliente,
      churnCliente,
      reactivateCliente,
      deleteCliente,
      addLancamentoDiario,
      deleteLancamentoDiario,
      funcionarios,
      setFuncionarios,
      saveFuncionario,
      deleteFuncionario,
      validateClientSale,
      resetAllData,
      // Computed Metrics
      clientesAtivos,
      clientesChurned,
      mrrTotalReal,
      arpuMedioReal,
      churnRateReal,
      totalGastoTrafegoReal,
      totalNovosClientesReal,
      cacMedioReal,
      // Audit
      auditLog,
      addAuditLog,
      // Cloud Sync Status & Actions
      isSyncing,
      lastSyncedAt,
      fetchSupabaseData,
      pushLocalStateToSupabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
