import React, { useState, useEffect } from 'react';
import { VistoriaRF, UserProfile } from '../types/inventory';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ChevronRight, 
  Plus, 
  Camera, 
  CheckSquare, 
  Square,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Trash2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { VISTORIA_PHOTO_SECTIONS } from '../constants/vistoria';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface VistoriaApprovalTabProps {
  vistorias: VistoriaRF[];
  onApprove: (id: string, feedback: string) => Promise<void>;
  onReject: (id: string, feedback: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onView: (vistoria: VistoriaRF) => void;
  currentUser: { uid: string };
  profile: UserProfile;
}

export default function VistoriaApprovalTab({ 
  vistorias, 
  onApprove, 
  onReject, 
  onDelete,
  onView,
  currentUser,
  profile
}: VistoriaApprovalTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [newRequestData, setNewRequestData] = useState({
    site: '',
    data: new Date().toISOString().split('T')[0],
    detentora: '',
    id_detentora: '',
    regional: '',
    tipo_site: '',
    infra: '',
    latitude: '',
    longitude: '',
    altitude: '',
    altura_torre: '',
    uf: '',
    municipio: '',
    endereco: '',
    numero: '',
    bairro: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');

  const pendingVistorias = vistorias.filter(v => v.status === 'pending' || v.status === 'submitted' || !v.status);
  const resolvedVistorias = vistorias.filter(v => v.status === 'approved' || v.status === 'rejected');

  const filteredVistorias = (activeSubTab === 'pending' ? pendingVistorias : resolvedVistorias).filter(v => 
    v.site.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = VISTORIA_PHOTO_SECTIONS.flatMap(s => s.fields.map(f => f.id));
    setSelectedFields(allIds);
  };

  const selectMandatory = () => {
    // Definindo algumas fotos como padrão "obrigatórias" para facilitar
    const mandatory = ['5_1', '5_2', '5_6', '5_9', '5_12', '5_21'];
    setSelectedFields(mandatory);
  };

  const handleCreateRequest = async () => {
    if (!newRequestData.site) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'vistorias_rf'), {
        ...newRequestData,
        status: 'pending',
        requiredFields: selectedFields,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        photos: {}
      });
      setIsCustomFormOpen(false);
      setNewRequestData({ 
        site: '', 
        data: new Date().toISOString().split('T')[0],
        detentora: '',
        id_detentora: '',
        regional: '',
        tipo_site: '',
        infra: '',
        latitude: '',
        longitude: '',
        altitude: '',
        altura_torre: '',
        uf: '',
        municipio: '',
        endereco: '',
        numero: '',
        bairro: ''
      });
      setSelectedFields([]);
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'pending' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'history' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Histórico
          </button>
        </div>

        <button
          onClick={() => setIsCustomFormOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Solicitar Vistoria Customizada
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text"
          placeholder="Buscar vistorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVistorias.map((vistoria) => (
          <motion.div
            layout
            key={vistoria.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-900 p-5 rounded-3xl border ${
              vistoria.status === 'approved' ? 'border-green-100 dark:border-green-900/30' :
              vistoria.status === 'rejected' ? 'border-red-100 dark:border-red-900/30' :
              'border-gray-200 dark:border-gray-800'
            } shadow-sm group hover:shadow-md transition-all`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  vistoria.status === 'approved' ? 'bg-green-50 dark:bg-green-900/30 text-green-600' :
                  vistoria.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' :
                  vistoria.status === 'submitted' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
                  'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                }`}>
                  {vistoria.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> :
                   vistoria.status === 'rejected' ? <XCircle className="w-6 h-6" /> :
                   vistoria.status === 'submitted' ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Send className="w-6 h-6" /></motion.div> :
                   <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase">{vistoria.site}</h4>
                    {vistoria.status === 'submitted' && (
                      <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Aguardando Aprovação</span>
                    )}
                    {vistoria.status === 'rejected' && (
                      <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Ajuste Necessário</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {vistoria.data ? format(new Date(vistoria.data), 'dd/MM/yyyy') : '-'}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {vistoria.municipio || 'Sem município'}</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {Object.keys(vistoria.photos || {}).length} fotos registradas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onView(vistoria)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Visualizar Detalhes
                </button>
                {activeSubTab === 'pending' && (
                  <button
                    onClick={() => onView(vistoria)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    Ações de Aprovação
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {profile.role === 'admin' && onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta vistoria?')) {
                        onDelete(vistoria.id!);
                      }
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                    title="Excluir Vistoria"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {vistoria.approvalFeedback && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-3">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Feedback de {vistoria.status === 'approved' ? 'Aprovação' : 'Reprovação'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{vistoria.approvalFeedback}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {filteredVistorias.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nada por aqui!</h3>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma vistoria {activeSubTab === 'pending' ? 'pendente encontrada' : 'no histórico'}.</p>
          </div>
        )}
      </div>

      {/* Custom Request Form Modal */}
      <AnimatePresence>
        {isCustomFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <header className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white italic tracking-tight">Nova Vistoria Customizada</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Defina quais fotos são necessárias para este site.</p>
                </div>
                <button 
                  onClick={() => setIsCustomFormOpen(false)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Informações Gerais */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Informações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Site ID</label>
                      <input 
                        type="text"
                        value={newRequestData.site}
                        onChange={e => setNewRequestData({...newRequestData, site: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-bold"
                        placeholder="Ex: SITE01"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Data Limite</label>
                      <input 
                        type="date"
                        value={newRequestData.data}
                        onChange={e => setNewRequestData({...newRequestData, data: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Detentora</label>
                      <input 
                        type="text"
                        value={newRequestData.detentora}
                        onChange={e => setNewRequestData({...newRequestData, detentora: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">ID da Detentora</label>
                      <input 
                        type="text"
                        value={newRequestData.id_detentora}
                        onChange={e => setNewRequestData({...newRequestData, id_detentora: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Regional</label>
                      <input 
                        type="text"
                        value={newRequestData.regional}
                        onChange={e => setNewRequestData({...newRequestData, regional: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tipo de Site</label>
                      <input 
                        type="text"
                        value={newRequestData.tipo_site}
                        onChange={e => setNewRequestData({...newRequestData, tipo_site: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Infra</label>
                      <input 
                        type="text"
                        value={newRequestData.infra}
                        onChange={e => setNewRequestData({...newRequestData, infra: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordenadas e Altura */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Coordenadas e Altura</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Latitude</label>
                      <input 
                        type="text"
                        value={newRequestData.latitude}
                        onChange={e => setNewRequestData({...newRequestData, latitude: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Longitude</label>
                      <input 
                        type="text"
                        value={newRequestData.longitude}
                        onChange={e => setNewRequestData({...newRequestData, longitude: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Altitude</label>
                      <input 
                        type="text"
                        value={newRequestData.altitude}
                        onChange={e => setNewRequestData({...newRequestData, altitude: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Altura Torre</label>
                      <input 
                        type="text"
                        value={newRequestData.altura_torre}
                        onChange={e => setNewRequestData({...newRequestData, altura_torre: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Localização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">UF (2 letras)</label>
                      <input 
                        type="text"
                        value={newRequestData.uf}
                        onChange={e => setNewRequestData({...newRequestData, uf: e.target.value.toUpperCase().slice(0, 2)})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Município</label>
                      <input 
                        type="text"
                        value={newRequestData.municipio}
                        onChange={e => setNewRequestData({...newRequestData, municipio: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Endereço</label>
                      <input 
                        type="text"
                        value={newRequestData.endereco}
                        onChange={e => setNewRequestData({...newRequestData, endereco: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Número</label>
                      <input 
                        type="text"
                        value={newRequestData.numero}
                        onChange={e => setNewRequestData({...newRequestData, numero: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Bairro</label>
                      <input 
                        type="text"
                        value={newRequestData.bairro}
                        onChange={e => setNewRequestData({...newRequestData, bairro: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-500" />
                      Escolha as Fotos Obrigatórias
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectMandatory}
                        className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        Padrão
                      </button>
                      <button 
                        onClick={selectAll}
                        className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        Todas
                      </button>
                      <button 
                        onClick={() => setSelectedFields([])}
                        className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all"
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    {VISTORIA_PHOTO_SECTIONS.map(section => (
                      <div key={section.title} className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">{section.title}</p>
                        <div className="grid grid-cols-1 gap-1">
                          {section.fields.map(field => (
                            <button
                              key={field.id}
                              onClick={() => toggleField(field.id)}
                              className={`flex items-center gap-3 w-full p-2.5 rounded-xl border transition-all text-left group ${
                                selectedFields.includes(field.id)
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                              }`}
                            >
                              <div className={`shrink-0 ${selectedFields.includes(field.id) ? 'text-indigo-600' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                {selectedFields.includes(field.id) ? <CheckSquare className="w-5 h-5 shadow-sm" /> : <Square className="w-5 h-5" />}
                              </div>
                              <span className={`text-xs font-bold flex-1 min-w-0 ${
                                selectedFields.includes(field.id) ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {field.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedFields.length === 0 && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-900 dark:text-amber-400 text-xs font-bold animate-in slide-in-from-top-1">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Se nenhuma foto for selecionada, todas serão consideradas opcionais.</span>
                  </div>
                )}
              </div>

              <footer className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setIsCustomFormOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!newRequestData.site || isSaving}
                  onClick={handleCreateRequest}
                  className="px-10 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  CRIAR SOLICITAÇÃO
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
