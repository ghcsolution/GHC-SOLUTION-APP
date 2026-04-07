import React from 'react';
import { VistoriaRF } from '../types/inventory';
import { X, MapPin, Calendar, Camera, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { VISTORIA_PHOTO_SECTIONS } from '../constants/vistoria';

interface VistoriaRFViewProps {
  item: VistoriaRF;
  onClose: () => void;
}

export default function VistoriaRFView({ item, onClose }: VistoriaRFViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalhes da Vistoria RF</h2>
            <p className="text-sm text-gray-500">Site: {item.site}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Site</span>
              </div>
              <p className="font-bold text-gray-900 text-lg">{item.site}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Data da Vistoria</span>
              </div>
              <p className="font-bold text-gray-900 text-lg">
                {item.data ? format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Detentora</span>
              </div>
              <p className="font-bold text-gray-900 text-lg">{item.detentora || '-'}</p>
            </div>
          </div>

          {/* Detalhes Técnicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Detentora</p>
              <p className="font-semibold text-gray-700">{item.id_detentora || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Regional</p>
              <p className="font-semibold text-gray-700">{item.regional || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Site</p>
              <p className="font-semibold text-gray-700">{item.tipo_site || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Infra</p>
              <p className="font-semibold text-gray-700">{item.infra || '-'}</p>
            </div>
          </div>

          {/* Coordenadas */}
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-4">Coordenadas e Estrutura</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Latitude</p>
                <p className="font-mono text-indigo-900">{item.latitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Longitude</p>
                <p className="font-mono text-indigo-900">{item.longitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Altitude</p>
                <p className="font-mono text-indigo-900">{item.altitude || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Altura Torre</p>
                <p className="font-mono text-indigo-900">{item.altura_torre || '-'}</p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Endereço e Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">Endereço</p>
                <p className="text-gray-700">{item.endereco || '-'}, {item.numero || 'S/N'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">Bairro</p>
                <p className="text-gray-700">{item.bairro || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">Município</p>
                <p className="text-gray-700">{item.municipio || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">UF</p>
                <p className="text-gray-700 font-bold">{item.uf || '-'}</p>
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Registros Fotográficos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Foto Fachada */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Foto 01 - Fachada</h4>
                {item.foto_fachada ? (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-md group relative">
                    <img 
                      src={item.foto_fachada} 
                      alt="Fachada" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={item.foto_fachada} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold text-gray-900 shadow-lg">Ver Original</span>
                    </a>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <p className="text-xs text-gray-400">Sem foto da fachada</p>
                  </div>
                )}
              </div>

              {/* Foto Placa */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Foto 02 - Placa</h4>
                {item.foto_placa ? (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-md group relative">
                    <img 
                      src={item.foto_placa} 
                      alt="Placa" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={item.foto_placa} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold text-gray-900 shadow-lg">Ver Original</span>
                    </a>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <p className="text-xs text-gray-400">Sem foto da placa</p>
                  </div>
                )}
              </div>
            </div>

            {/* New Photo Sections */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                Fotos Detalhadas
              </h3>
              
              {VISTORIA_PHOTO_SECTIONS.map((section) => {
                const uploadedPhotos = section.fields.filter(f => item.photos?.[f.id]);
                if (uploadedPhotos.length === 0) return null;

                return (
                  <div key={section.title} className="space-y-4 border rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-gray-800">{section.title}</h4>
                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {uploadedPhotos.length} fotos
                        </span>
                      </div>
                      {expandedSections[section.title] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {expandedSections[section.title] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white">
                            {section.fields.map((field) => {
                              const photoData = item.photos?.[field.id];
                              if (!photoData) return null;

                              return (
                                <div key={field.id} className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block truncate" title={field.label}>
                                    {field.label}
                                  </label>
                                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
                                    <img 
                                      src={photoData} 
                                      alt={field.label} 
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    <a 
                                      href={photoData} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <span className="bg-white/90 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-900 shadow-lg">Ver Original</span>
                                    </a>
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

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
