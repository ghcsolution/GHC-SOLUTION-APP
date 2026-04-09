import React, { useState } from 'react';
import { VistoriaRF } from '../types/inventory';
import { X, Save, Camera, Loader2, MapPin, Calendar, ChevronDown, ChevronUp, Maximize2, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VISTORIA_PHOTO_SECTIONS } from '../constants/vistoria';
import { useRef } from 'react';

interface VistoriaRFFormProps {
  item: VistoriaRF | null;
  onClose: () => void;
  onSave: (item: Omit<VistoriaRF, 'id' | 'createdBy' | 'createdAt'>) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export default function VistoriaRFForm({ item, onClose, onSave, isSaving = false, saveError = null }: VistoriaRFFormProps) {
  const [formData, setFormData] = useState<Omit<VistoriaRF, 'id' | 'createdBy' | 'createdAt'>>(
    item ? { 
      site: item.site,
      data: item.data,
      detentora: item.detentora || '',
      id_detentora: item.id_detentora || '',
      regional: item.regional || '',
      tipo_site: item.tipo_site || '',
      infra: item.infra || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      altitude: item.altitude || '',
      altura_torre: item.altura_torre || '',
      uf: item.uf || '',
      municipio: item.municipio || '',
      endereco: item.endereco || '',
      numero: item.numero || '',
      bairro: item.bairro || '',
      foto_fachada: item.foto_fachada,
      foto_placa: item.foto_placa,
      photos: item.photos || {},
      updatedBy: item.updatedBy,
      updatedAt: item.updatedAt
    } : {
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
      bairro: '',
      foto_fachada: '',
      foto_placa: '',
      photos: {}
    }
  );

  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string, fieldId: string, label: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [fieldId]: true }));
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      
      if (fieldId === 'fachada') {
        setFormData(prev => ({ ...prev, foto_fachada: compressed }));
      } else if (fieldId === 'placa') {
        setFormData(prev => ({ ...prev, foto_placa: compressed }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          photos: { ...(prev.photos || {}), [fieldId]: compressed } 
        }));
      }
      
      setIsUploading(prev => ({ ...prev, [fieldId]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site || !formData.data) {
      alert('Por favor, preencha o Site e a Data.');
      return;
    }
    onSave(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item ? 'Editar Vistoria RF' : 'Nova Vistoria RF'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registre as fotos de fachada e placa do site.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400 dark:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Informações Gerais */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Site
                </label>
                <input 
                  required
                  type="text"
                  value={formData.site}
                  onChange={e => setFormData({...formData, site: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ex: SICAS67"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Data da Vistoria
                </label>
                <input 
                  required
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData({...formData, data: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detentora</label>
                <input 
                  type="text"
                  value={formData.detentora}
                  onChange={e => setFormData({...formData, detentora: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ID da Detentora</label>
                <input 
                  type="text"
                  value={formData.id_detentora}
                  onChange={e => setFormData({...formData, id_detentora: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Regional</label>
                <input 
                  type="text"
                  value={formData.regional}
                  onChange={e => setFormData({...formData, regional: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Site</label>
                <input 
                  type="text"
                  value={formData.tipo_site}
                  onChange={e => setFormData({...formData, tipo_site: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Infra</label>
                <input 
                  type="text"
                  value={formData.infra}
                  onChange={e => setFormData({...formData, infra: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Coordenadas e Altura */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Coordenadas e Altura</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Latitude</label>
                <input 
                  type="text"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Longitude</label>
                <input 
                  type="text"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Altitude</label>
                <input 
                  type="text"
                  value={formData.altitude}
                  onChange={e => setFormData({...formData, altitude: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Altura da Torre</label>
                <input 
                  type="text"
                  value={formData.altura_torre}
                  onChange={e => setFormData({...formData, altura_torre: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">UF</label>
                <input 
                  type="text"
                  value={formData.uf}
                  onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Município</label>
                <input 
                  type="text"
                  value={formData.municipio}
                  onChange={e => setFormData({...formData, municipio: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Endereço</label>
                <input 
                  type="text"
                  value={formData.endereco}
                  onChange={e => setFormData({...formData, endereco: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Número</label>
                <input 
                  type="text"
                  value={formData.numero}
                  onChange={e => setFormData({...formData, numero: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bairro</label>
                <input 
                  type="text"
                  value={formData.bairro}
                  onChange={e => setFormData({...formData, bairro: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Registros Fotográficos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Foto Fachada */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Foto 01 - Fachada</label>
              <div className="relative aspect-video bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center overflow-hidden group transition-all hover:border-indigo-300 dark:hover:border-indigo-500">
                {formData.foto_fachada ? (
                  <>
                    <img src={formData.foto_fachada} alt="Fachada" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedPhoto({ url: formData.foto_fachada!, fieldId: 'fachada', label: 'Fachada' })}
                        className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
                      >
                        <Maximize2 className="w-6 h-6" />
                      </button>
                      <label className="cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'fachada')} />
                      </label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, foto_fachada: ''})}
                        className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform text-red-600 dark:text-red-400"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 p-8 text-center">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isUploading.fachada ? <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" /> : <Camera className="w-6 h-6 text-gray-400 dark:text-gray-500" />}
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tirar foto ou selecionar</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'fachada')} />
                  </label>
                )}
              </div>
            </div>

            {/* Foto Placa */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Foto 02 - Placa</label>
              <div className="relative aspect-video bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center overflow-hidden group transition-all hover:border-indigo-300 dark:hover:border-indigo-500">
                {formData.foto_placa ? (
                  <>
                    <img src={formData.foto_placa} alt="Placa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedPhoto({ url: formData.foto_placa!, fieldId: 'placa', label: 'Placa' })}
                        className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
                      >
                        <Maximize2 className="w-6 h-6" />
                      </button>
                      <label className="cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'placa')} />
                      </label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, foto_placa: ''})}
                        className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-transform text-red-600 dark:text-red-400"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 p-8 text-center">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isUploading.placa ? <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" /> : <Camera className="w-6 h-6 text-gray-400 dark:text-gray-500" />}
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tirar foto ou selecionar</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'placa')} />
                  </label>
                )}
              </div>
            </div>
            </div>

            {/* New Photo Sections */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-gray-800 pb-2">Fotos Detalhadas (Solo, Energia, Torre, Antenas)</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                Atenção: O armazenamento é limitado. Evite carregar muitas fotos de alta resolução simultaneamente.
              </p>
              
              {VISTORIA_PHOTO_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-4 border dark:border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                        <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{section.title}</h4>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        ({Object.keys(formData.photos || {}).filter(k => section.fields.some(f => f.id === k)).length} / {section.fields.length})
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
                          {section.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate" title={field.label}>
                                {field.label}
                              </label>
                              <div className="relative aspect-video bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center overflow-hidden group transition-all hover:border-indigo-300 dark:hover:border-indigo-500">
                                {formData.photos?.[field.id] ? (
                                  <>
                                    <img src={formData.photos[field.id]} alt={field.label} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button 
                                        type="button"
                                        onClick={() => setSelectedPhoto({ url: formData.photos![field.id], fieldId: field.id, label: field.label })}
                                        className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
                                      >
                                        <Maximize2 className="w-4 h-4" />
                                      </button>
                                      <label className="cursor-pointer p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:scale-110 transition-transform">
                                        <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, field.id)} />
                                      </label>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newPhotos = { ...formData.photos };
                                          delete newPhotos[field.id];
                                          setFormData({ ...formData, photos: newPhotos });
                                        }}
                                        className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:scale-110 transition-transform text-red-600 dark:text-red-400"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center w-full h-full justify-center">
                                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                      {isUploading[field.id] ? <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" /> : <Camera className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Adicionar Foto</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, field.id)} />
                                  </label>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
              {saveError}
            </div>
          )}
        </form>

        <footer className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving || isUploading.fachada || isUploading.placa}
            className="px-8 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {item ? 'Salvar Alterações' : 'Registrar Vistoria'}
          </button>
        </footer>
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
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                {isUploading[selectedPhoto.fieldId] && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                {!showDeleteConfirm ? (
                  <>
                    <a 
                      href={selectedPhoto.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Abrir Original
                    </a>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading[selectedPhoto.fieldId]}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5" />
                      Editar Foto
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isUploading[selectedPhoto.fieldId]}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                      Excluir Foto
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
                    <p className="text-red-900 dark:text-red-400 font-bold text-sm">Excluir esta foto?</p>
                    <button 
                      onClick={() => {
                        if (selectedPhoto.fieldId === 'fachada') {
                          setFormData({...formData, foto_fachada: ''});
                        } else if (selectedPhoto.fieldId === 'placa') {
                          setFormData({...formData, foto_placa: ''});
                        } else {
                          const newPhotos = { ...formData.photos };
                          delete newPhotos[selectedPhoto.fieldId];
                          setFormData({ ...formData, photos: newPhotos });
                        }
                        setSelectedPhoto(null);
                        setShowDeleteConfirm(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all"
                    >
                      Sim, Excluir
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
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
                onChange={(e) => {
                  handlePhotoUpload(e, selectedPhoto.fieldId);
                  // We need to update the selectedPhoto URL after upload, but handlePhotoUpload is async
                  // For simplicity in the form, we'll just close the modal or let the user see the change in the form
                  setSelectedPhoto(null);
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
