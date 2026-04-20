import React from 'react';
import { VistoriaRF } from '../types/inventory';
import { X, MapPin, Calendar, Camera, Image as ImageIcon, ChevronDown, ChevronUp, Maximize2, Edit2, Trash2, ExternalLink, Loader2, CheckCircle2, XCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import { VISTORIA_PHOTO_SECTIONS } from '../constants/vistoria';
import { ImageLightbox } from './ImageLightbox';

interface VistoriaRFViewProps {
  item: VistoriaRF;
  onClose: () => void;
  onUpdate?: (id: string, data: Partial<VistoriaRF>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onApprove?: (id: string, feedback: string) => Promise<void>;
  onReject?: (id: string, feedback: string) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
}

export default function VistoriaRFView({ 
  item, 
  onClose, 
  onUpdate,
  onDelete,
  onApprove, 
  onReject, 
  canEdit = false, 
  canDelete = false,
  canApprove = false 
}: VistoriaRFViewProps) {
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; alt: string }>({
    isOpen: false,
    src: '',
    alt: ''
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string, fieldId: string, label: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [localRejectedPhotos, setLocalRejectedPhotos] = useState<string[]>(item.rejectedPhotos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPhoto || !onUpdate) return;

    setIsUpdating(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        const updateData: Partial<VistoriaRF> = {};
        
        if (selectedPhoto.fieldId === 'foto_fachada') {
          updateData.foto_fachada = compressed;
        } else if (selectedPhoto.fieldId === 'foto_placa') {
          updateData.foto_placa = compressed;
        } else {
          updateData.photos = { ...(item.photos || {}), [selectedPhoto.fieldId]: compressed };
        }

        await onUpdate(item.id, updateData);
        setSelectedPhoto(prev => prev ? { ...prev, url: compressed } : null);
      } catch (error) {
        console.error('Error updating photo:', error);
      } finally {
        setIsUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !onUpdate) return;
    
    setIsUpdating(true);
    try {
      const updateData: Partial<VistoriaRF> = {};
      
      if (selectedPhoto.fieldId === 'foto_fachada') {
        updateData.foto_fachada = '';
      } else if (selectedPhoto.fieldId === 'foto_placa') {
        updateData.foto_placa = '';
      } else {
        const newPhotos = { ...(item.photos || {}) };
        delete newPhotos[selectedPhoto.fieldId];
        updateData.photos = newPhotos;
      }

      await onUpdate(item.id!, updateData);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusAction = async () => {
    if (!showApprovalForm || !item.id) return;
    setIsUpdating(true);
    try {
      if (showApprovalForm === 'approve' && onApprove) {
        await onApprove(item.id, feedback);
      } else if (showApprovalForm === 'reject' && onReject) {
        await onReject(item.id, feedback);
      }
      onClose();
    } catch (error) {
      console.error('Error during status action:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePhotoRejection = async (fieldId: string) => {
    if (!onUpdate || !item.id) return;
    setIsUpdating(true);
    try {
      const isAlreadyRejected = localRejectedPhotos.includes(fieldId);
      const newRejected = isAlreadyRejected
        ? localRejectedPhotos.filter(id => id !== fieldId)
        : [...localRejectedPhotos, fieldId];
      
      setLocalRejectedPhotos(newRejected);
      
      // Auto-set status to rejected if any photo is rejected
      const newStatus = newRejected.length > 0 ? 'rejected' : item.status;
      
      await onUpdate(item.id, { 
        rejectedPhotos: newRejected,
        status: newStatus as any
      });
    } catch (error) {
      console.error('Error toggling photo rejection:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isRejected = (fieldId: string) => localRejectedPhotos.includes(fieldId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes da Vistoria RF</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Site: {item.site}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Status Alert if Pending and user is approver */}
          {canApprove && (item.status === 'pending' || !item.status) && !showApprovalForm && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Aprovação Necessária</h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">Esta vistoria aguarda sua revisão.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalForm('reject')}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-bold text-sm hover:bg-red-50 transition-all"
                >
                  Reprovar
                </button>
                <button
                  onClick={() => setShowApprovalForm('approve')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  Aprovar Vistoria
                </button>
              </div>
            </div>
          )}

          {showApprovalForm && (
            <div className={`p-6 rounded-3xl border animate-in zoom-in-95 duration-200 ${
              showApprovalForm === 'approve' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {showApprovalForm === 'approve' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {showApprovalForm === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Reprovação'}
                </h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Feedback / Observações</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={showApprovalForm === 'approve' ? 'Opcional: Informe o que achou da vistoria...' : 'Obrigatório: Informe o motivo da reprovação...'}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowApprovalForm(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={isUpdating || (showApprovalForm === 'reject' && !feedback)}
                    onClick={handleStatusAction}
                    className={`px-6 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 ${
                      showApprovalForm === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (showApprovalForm === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
                    {showApprovalForm === 'approve' ? 'Aprovar Agora' : 'Reprovar Vistoria'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Site</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{item.site}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Data da Vistoria</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {item.data ? format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Detentora</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{item.detentora || '-'}</p>
            </div>
          </div>

          {/* Detalhes Técnicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">ID Detentora</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{item.id_detentora || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Regional</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{item.regional || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo de Site</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{item.tipo_site || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Infra</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{item.infra || '-'}</p>
            </div>
          </div>

          {/* Coordenadas */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-4">Coordenadas e Estrutura</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase">Latitude</p>
                <p className="font-mono text-indigo-900 dark:text-indigo-200">{item.latitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase">Longitude</p>
                <p className="font-mono text-indigo-900 dark:text-indigo-200">{item.longitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase">Altitude</p>
                <p className="font-mono text-indigo-900 dark:text-indigo-200">{item.altitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase">Altura Torre</p>
                <p className="font-mono text-indigo-900 dark:text-indigo-200">{item.altura_torre || '-'}</p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Endereço e Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Endereço</p>
                <p className="text-gray-700 dark:text-gray-300">{item.endereco || '-'}, {item.numero || 'S/N'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Bairro</p>
                <p className="text-gray-700 dark:text-gray-300">{item.bairro || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Município</p>
                <p className="text-gray-700 dark:text-gray-300">{item.municipio || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">UF</p>
                <p className="text-gray-700 dark:text-gray-300 font-bold">{item.uf || '-'}</p>
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Registros Fotográficos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Foto Fachada */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Foto 01 - Fachada</h4>
                  {isRejected('foto_fachada') && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full uppercase">
                      <AlertTriangle className="w-3 h-3" /> Reprovada
                    </span>
                  )}
                </div>
                {item.foto_fachada ? (
                  <div 
                    onClick={() => setSelectedPhoto({ url: item.foto_fachada!, fieldId: 'foto_fachada', label: 'Fachada' })}
                    className={`aspect-video rounded-2xl overflow-hidden border-2 shadow-md group relative cursor-pointer transition-all ${
                      isRejected('foto_fachada') ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <img 
                      src={item.foto_fachada} 
                      alt="Fachada" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                      referrerPolicy="no-referrer"
                      onClick={() => setLightbox({ isOpen: true, src: item.foto_fachada!, alt: 'Fachada' })}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-lg flex items-center gap-2">
                        <Maximize2 className="w-3 h-3" /> Visualizar
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ isOpen: true, src: item.foto_fachada!, alt: 'Fachada' });
                        }}
                        className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full text-gray-700 dark:text-gray-200 shadow-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sem foto da fachada</p>
                  </div>
                )}
              </div>

              {/* Foto Placa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Foto 02 - Placa</h4>
                  {isRejected('foto_placa') && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full uppercase">
                      <AlertTriangle className="w-3 h-3" /> Reprovada
                    </span>
                  )}
                </div>
                {item.foto_placa ? (
                  <div 
                    onClick={() => setSelectedPhoto({ url: item.foto_placa!, fieldId: 'foto_placa', label: 'Placa' })}
                    className={`aspect-video rounded-2xl overflow-hidden border-2 shadow-md group relative cursor-pointer transition-all ${
                      isRejected('foto_placa') ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <img 
                      src={item.foto_placa} 
                      alt="Placa" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                      referrerPolicy="no-referrer"
                      onClick={() => setLightbox({ isOpen: true, src: item.foto_placa!, alt: 'Placa' })}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-lg flex items-center gap-2">
                        <Maximize2 className="w-3 h-3" /> Visualizar
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ isOpen: true, src: item.foto_placa!, alt: 'Placa' });
                        }}
                        className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full text-gray-700 dark:text-gray-200 shadow-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sem foto da placa</p>
                  </div>
                )}
              </div>
            </div>

            {/* New Photo Sections */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Fotos Detalhadas
              </h3>
              
              {VISTORIA_PHOTO_SECTIONS.map((section) => {
                const uploadedPhotos = section.fields.filter(f => item.photos?.[f.id]);
                if (uploadedPhotos.length === 0) return null;

                return (
                  <div key={section.title} className="space-y-4 border dark:border-gray-800 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{section.title}</h4>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                          {uploadedPhotos.length} fotos
                        </span>
                      </div>
                      {expandedSections[section.title] ? <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                    </button>

                    <AnimatePresence>
                      {expandedSections[section.title] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-gray-900">
                            {section.fields.map((field) => {
                              const photoData = item.photos?.[field.id];
                              if (!photoData) return null;

                              return (
                                <div key={field.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate" title={field.label}>
                                    {field.label}
                                  </label>
                                  {isRejected(field.id) && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full uppercase">
                                      <AlertTriangle className="w-2 h-2" /> Reprova.
                                    </span>
                                  )}
                                </div>
                                <div 
                                  onClick={() => setSelectedPhoto({ url: photoData, fieldId: field.id, label: field.label })}
                                  className={`relative aspect-video rounded-xl overflow-hidden border-2 shadow-sm group cursor-pointer transition-all ${
                                    isRejected(field.id) ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-100 dark:border-gray-800'
                                  }`}
                                >
                                    <img 
                                      src={photoData} 
                                      alt={field.label} 
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                                      referrerPolicy="no-referrer"
                                      onClick={() => setLightbox({ isOpen: true, src: photoData, alt: field.label })}
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <span className="bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-900 dark:text-white shadow-lg flex items-center gap-2">
                                        <Maximize2 className="w-3 h-3" /> Visualizar
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightbox({ isOpen: true, src: photoData, alt: field.label });
                                        }}
                                        className="bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-full text-gray-700 dark:text-gray-200 shadow-lg"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 shrink-0">
          {canDelete && onDelete && (
            <button 
              onClick={async () => {
                if (confirm('Tem certeza que deseja excluir esta vistoria COMPLETA? Esta ação não pode ser desfeita.')) {
                  await onDelete(item.id!);
                  onClose();
                }
              }}
              className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Vistoria
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>

      {/* Photo Action Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between text-white">
                <h3 className="font-bold text-lg">{selectedPhoto.label}</h3>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.label}
                  className="w-full h-full object-contain cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => setLightbox({ isOpen: true, src: selectedPhoto.url, alt: selectedPhoto.label })}
                />
                {isUpdating && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                {!showDeleteConfirm ? (
                  <>
                    <button 
                      onClick={() => setLightbox({ isOpen: true, src: selectedPhoto.url, alt: selectedPhoto.label })}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Abrir Original
                    </button>

                    {onApprove && onUpdate && (
                      <button 
                        onClick={() => togglePhotoRejection(selectedPhoto.fieldId)}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl disabled:opacity-50 ${
                          isRejected(selectedPhoto.fieldId)
                            ? 'bg-green-600 text-white hover:bg-green-700 animate-in fade-in duration-300'
                            : 'bg-red-600 text-white hover:bg-red-700 animate-in fade-in duration-300'
                        }`}
                      >
                        {isRejected(selectedPhoto.fieldId) ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Aprovar Foto
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Reprovar Foto
                          </>
                        )}
                      </button>
                    )}

                    {canEdit && onUpdate && (
                      <>
                        <button 
                          onClick={handleEditPhoto}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
                        >
                          <Edit2 className="w-5 h-5" />
                          Editar Foto
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                          Excluir Foto
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
                    <p className="text-red-900 dark:text-red-400 font-bold text-sm">Excluir esta foto?</p>
                    <button 
                      onClick={handleDeletePhoto}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all"
                    >
                      Sim, Excluir
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox 
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
        src={lightbox.src}
        alt={lightbox.alt}
      />
    </div>
  );
}
