import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Kanban, List, Plus, Search, Trash2, UserCheck, Building, CheckCircle2,
  Phone, Mail, Calendar, GripVertical, ChevronDown, ArrowRight, Eye
} from 'lucide-react';

const STAGES = [
  { id: 'Lead', label: 'Lead', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', headerBorder: 'border-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { id: 'Contato Feito', label: 'Contato Feito', dot: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', headerBorder: 'border-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  { id: 'Proposta Enviada', label: 'Proposta', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', headerBorder: 'border-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { id: 'Negociação', label: 'Negociação', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40', headerBorder: 'border-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  { id: 'Fechado/Ganho', label: 'Fechado', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', headerBorder: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { id: 'Perdido', label: 'Perdido', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/40', headerBorder: 'border-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' }
];

const PLAN_COLORS = {
  'Grátis': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'Corretor Pro': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Imobiliária Basic': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Imobiliária Pro': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Imobiliária Master': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const CHANNEL_ICONS = {
  'Tráfego Pago': '📢',
  'Listas Frias': '📋',
  'Microinfluenciadores': '🎤',
};

export const KanbanModule = () => {
  const { leads, addLead, deleteLead, moveLeadStage, convertLeadToClient, planos } = useApp();

  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const [formData, setFormData] = useState({
    nome: '', empresa: '', email: '', telefone: '',
    planoInteresse: 'Imobiliária Pro', mrrEstimado: 350, canal: 'Tráfego Pago', estagio: 'Lead', observacoes: ''
  });
  const [convertFormData, setConvertFormData] = useState({ plano: 'Imobiliária Pro', mrr: 350, metodoPagamento: 'Pix', modulosAdicionais: [] });

  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = l.nome.toLowerCase().includes(q) || l.empresa.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
    return matchesSearch && (selectedChannel === 'all' || l.canal === selectedChannel);
  });

  const handleSaveNewLead = (e) => { e.preventDefault(); addLead(formData); setIsAddModalOpen(false); };

  const handleOpenConvertModal = (lead) => {
    setSelectedLeadForConvert(lead);
    setConvertFormData({
      plano: lead.planoInteresse || 'Imobiliária Pro',
      mrr: lead.mrrEstimado || 350,
      metodoPagamento: 'Pix',
      modulosAdicionais: [],
      dataEntrada: new Date().toISOString().split('T')[0]
    });
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = (e) => {
    e.preventDefault();
    if (selectedLeadForConvert) convertLeadToClient(selectedLeadForConvert, convertFormData);
    setIsConvertModalOpen(false);
    setSelectedLeadForConvert(null);
  };

  // Pipeline value per stage
  const pipelineTotal = filteredLeads.reduce((acc, l) => acc + (Number(l.mrrEstimado) || 0), 0);
  const totalWon = filteredLeads.filter(l => l.estagio === 'Fechado/Ganho').length;
  const conversionRate = filteredLeads.length > 0 ? ((totalWon / filteredLeads.length) * 100).toFixed(0) : 0;

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

  const moveToNextStage = (lead) => {
    const currentIdx = STAGES.findIndex(s => s.id === lead.estagio);
    if (currentIdx >= 0 && currentIdx < STAGES.length - 1) {
      const nextStage = STAGES[currentIdx + 1].id;
      if (nextStage === 'Fechado/Ganho' && lead.estagio !== 'Fechado/Ganho') {
        handleOpenConvertModal(lead);
      } else if (nextStage !== 'Perdido') {
        moveLeadStage(lead.id, nextStage);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Funil de Vendas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {filteredLeads.length} oportunidades · Pipeline R$ {pipelineTotal.toLocaleString('pt-BR')} · {conversionRate}% conversão
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-[9px]" />
              <input type="text" placeholder="Buscar lead..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
            </div>
            {/* Channel Filter */}
            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-200 focus:outline-none appearance-none cursor-pointer">
              <option value="all">Todos os canais</option>
              <option value="Tráfego Pago">📢 Tráfego Pago</option>
              <option value="Listas Frias">📋 Listas Frias</option>
              <option value="Microinfluenciadores">🎤 Influenciadores</option>
            </select>
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button onClick={() => setViewMode('kanban')} title="Kanban"
                className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Kanban className="w-3.5 h-3.5" /><span className="hidden sm:inline">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} title="Lista"
                className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <List className="w-3.5 h-3.5" /><span className="hidden sm:inline">Lista</span>
              </button>
            </div>
            {/* Add Button */}
            <button onClick={() => { setFormData({ nome: '', empresa: '', email: '', telefone: '', planoInteresse: 'Imobiliária Pro', mrrEstimado: 350, canal: 'Tráfego Pago', estagio: 'Lead', observacoes: '' }); setIsAddModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /><span>Novo Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── KANBAN VIEW ─── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
          {STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.estagio === stage.id);
            const stageMRR = stageLeads.reduce((acc, l) => acc + (Number(l.mrrEstimado) || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 flex flex-col"
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedLeadId) {
                    const lead = leads.find(l => l.id === draggedLeadId);
                    if (lead) {
                      if (stage.id === 'Fechado/Ganho' && lead.estagio !== 'Fechado/Ganho') {
                        handleOpenConvertModal(lead);
                      } else {
                        moveLeadStage(draggedLeadId, stage.id);
                      }
                    }
                    setDraggedLeadId(null);
                    setDragOverStage(null);
                  }
                }}
              >
                {/* Column Header */}
                <div className={`rounded-t-xl border-t-2 ${stage.headerBorder} bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 px-3 py-2.5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.dot}`}></div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{stage.label}</span>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      R$ {stageMRR.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Column Body */}
                <div className={`flex-1 rounded-b-xl ${stage.bg} border-x border-b border-gray-200 dark:border-gray-800 p-2 space-y-2 min-h-[400px] transition-all duration-150 ${
                  dragOverStage === stage.id ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/50 dark:bg-blue-950/30' : ''
                }`}>
                  {stageLeads.map(lead => {
                    const isExpanded = expandedCardId === lead.id;
                    const planColor = PLAN_COLORS[lead.planoInteresse] || PLAN_COLORS['Imobiliária Pro'];
                    const channelIcon = CHANNEL_ICONS[lead.canal] || '📌';

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedLeadId(lead.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                          setDraggedLeadId(null);
                          setDragOverStage(null);
                        }}
                        className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm hover:shadow-md group cursor-grab active:cursor-grabbing ${
                          draggedLeadId === lead.id ? 'opacity-50 scale-[0.97]' : ''
                        }`}
                        onClick={() => setExpandedCardId(isExpanded ? null : lead.id)}
                      >
                        {/* Card Top */}
                        <div className="p-3">
                          {/* Name + Actions Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight truncate">
                                {lead.nome}
                              </h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                <Building className="w-3 h-3 shrink-0" />
                                {lead.empresa}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                              className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0.5 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Plan Badge + Value */}
                          <div className="flex items-center justify-between mt-2.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${planColor}`}>
                              {lead.planoInteresse}
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              R$ {lead.mrrEstimado}
                              <span className="text-[9px] font-normal text-gray-400">/mês</span>
                            </span>
                          </div>

                          {/* Channel + Date */}
                          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                            <span>{channelIcon} {lead.canal}</span>
                            <span>{lead.dataCriacao}</span>
                          </div>
                        </div>

                        {/* Expanded Area */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-gray-800 px-3 pb-3 pt-2 space-y-2.5 animate-in">
                            {/* Contact Info */}
                            {(lead.email || lead.telefone) && (
                              <div className="space-y-1">
                                {lead.email && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3 text-gray-400" />{lead.email}
                                  </p>
                                )}
                                {lead.telefone && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-gray-400" />{lead.telefone}
                                  </p>
                                )}
                              </div>
                            )}

                            {lead.observacoes && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                                "{lead.observacoes}"
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-1.5">
                              {stage.id !== 'Fechado/Ganho' && stage.id !== 'Perdido' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveToNextStage(lead); }}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Avançar <ArrowRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenConvertModal(lead); }}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
                                  >
                                    <UserCheck className="w-3 h-3" /> Converter
                                  </button>
                                </>
                              )}
                              {stage.id === 'Fechado/Ganho' && (
                                <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Cliente Convertido
                                </div>
                              )}
                            </div>

                            {/* Stage Selector */}
                            <div className="pt-1">
                              <select
                                value={lead.estagio}
                                onClick={e => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newStage = e.target.value;
                                  if (newStage === 'Fechado/Ganho' && lead.estagio !== 'Fechado/Ganho') {
                                    handleOpenConvertModal(lead);
                                  } else {
                                    moveLeadStage(lead.id, newStage);
                                  }
                                }}
                                className="w-full text-[10px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer"
                              >
                                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                        <Kanban className="w-4 h-4" />
                      </div>
                      <p className="text-[11px]">Nenhum lead</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium text-right">MRR</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Estágio</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLeads.map(lead => {
                const planColor = PLAN_COLORS[lead.planoInteresse] || PLAN_COLORS['Imobiliária Pro'];
                const stageInfo = STAGES.find(s => s.id === lead.estagio);
                return (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-[13px]">{lead.nome}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lead.empresa}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${planColor}`}>{lead.planoInteresse}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">R$ {lead.mrrEstimado}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{CHANNEL_ICONS[lead.canal]} {lead.canal}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${stageInfo?.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageInfo?.dot}`}></span>
                        {stageInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{lead.dataCriacao}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.estagio !== 'Fechado/Ganho' && (
                          <button onClick={() => handleOpenConvertModal(lead)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium text-[10px] hover:bg-emerald-500 transition-colors shadow-sm">
                            Converter
                          </button>
                        )}
                        <button onClick={() => deleteLead(lead.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ADD LEAD MODAL ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-[2px] p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Adicionar Lead</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Preencha os dados do novo contato</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">×</button>
            </div>
            <form onSubmit={handleSaveNewLead} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Nome do contato *</label>
                <input required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className={inputCls} placeholder="Ex: Rodrigo Fonseca" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Empresa</label>
                  <input value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} className={inputCls} placeholder="Fonseca Imóveis" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Telefone</label>
                  <input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className={inputCls} placeholder="(11) 99999-8888" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">E-mail</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="contato@empresa.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Plano de interesse</label>
                  <select value={formData.planoInteresse} onChange={e => { const p = planos.find(x => x.plano === e.target.value); setFormData({ ...formData, planoInteresse: e.target.value, mrrEstimado: p ? p.mensal : 350 }); }} className={inputCls}>
                    {planos.filter(p => p.mensal > 0).map(p => <option key={p.plano} value={p.plano}>{p.plano} — R$ {p.mensal}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Canal de origem</label>
                  <select value={formData.canal} onChange={e => setFormData({ ...formData, canal: e.target.value })} className={inputCls}>
                    <option value="Tráfego Pago">📢 Tráfego Pago</option>
                    <option value="Listas Frias">📋 Listas Frias</option>
                    <option value="Microinfluenciadores">🎤 Influenciadores</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Observações</label>
                <input value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} className={inputCls} placeholder="Notas sobre o lead (opcional)" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONVERT MODAL ─── */}
      {isConvertModalOpen && selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-[2px] p-4" onClick={() => setIsConvertModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Converter em Cliente</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Confirme os dados do novo assinante</p>
              </div>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">×</button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 mb-4">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                {selectedLeadForConvert.nome.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedLeadForConvert.nome}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{selectedLeadForConvert.empresa} · {selectedLeadForConvert.canal}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmConvert} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Plano escolhido</label>
                <select value={convertFormData.plano} onChange={e => { const p = planos.find(x => x.plano === e.target.value); setConvertFormData({ ...convertFormData, plano: e.target.value, mrr: p ? p.mensal : 350 }); }} className={inputCls}>
                  {planos.filter(p => p.mensal > 0).map(p => <option key={p.plano} value={p.plano}>{p.plano} — R$ {p.mensal}/mês</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Data de Entrada</label>
                <input
                  type="date"
                  required
                  value={convertFormData.dataEntrada || new Date().toISOString().split('T')[0]}
                  onChange={e => setConvertFormData({ ...convertFormData, dataEntrada: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Método de pagamento</label>
                <select value={convertFormData.metodoPagamento} onChange={e => setConvertFormData({ ...convertFormData, metodoPagamento: e.target.value })} className={inputCls}>
                  <option value="Pix">Pix</option><option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Cartão de Crédito (À Vista)">Cartão à Vista</option><option value="Cartão de Crédito (Parcelado)">Cartão Parcelado</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsConvertModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm">Confirmar Conversão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
