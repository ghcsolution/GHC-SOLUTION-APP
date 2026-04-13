import React from 'react';
import { InventoryItem } from '../types/inventory';
import { X, MapPin, Calendar, User, Package, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { ImageLightbox } from './ImageLightbox';

interface InventoryViewProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function InventoryView({ item, onClose }: InventoryViewProps) {
  const [lightbox, setLightbox] = React.useState<{ isOpen: boolean; src: string; alt: string }>({
    isOpen: false,
    src: '',
    alt: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Registro</h2>
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
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Localização</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{item.site}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.cidade}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 uppercase">{item.local_armazenamento || 'MR'}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Datas</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Entrada:</span> {item.data_entrada ? format(new Date(item.data_entrada), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Saída:</span> {item.data_saida ? format(new Date(item.data_saida), 'dd/MM/yyyy', { locale: ptBR }) : 'Em aberto'}
                </p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                  Tempo em depósito: {(() => {
                    const start = new Date(item.data_entrada);
                    const end = item.data_saida ? new Date(item.data_saida) : new Date();
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return `${diffDays} dias`;
                  })()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Responsáveis</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  <span className="font-medium">Recebimento:</span> {item.responsavel_recebimento || '-'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  <span className="font-medium">Liberação:</span> {item.responsavel_liberacao || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Classificação */}
          {(item.tipo || item.vendor || item.motivo) && (
            <div className="flex flex-wrap gap-4">
              {item.tipo && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.tipo}</span>
                </div>
              )}
              {item.vendor && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vendor</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.vendor}</span>
                </div>
              )}
              {item.motivo && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Motivo</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.motivo}</span>
                </div>
              )}
            </div>
          )}

          {/* Materiais */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Materiais</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.materiais.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{m.modelo}</span>
                    {m.codigoFornecedor && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{m.codigoFornecedor}</span>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg">
                    {m.qtde} un
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          {item.obs && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">Observações</h3>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.obs}
              </div>
            </div>
          )}

          {/* Fotos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Fotos do Romaneio</h3>
            </div>
            {item.fotos_romaneio && item.fotos_romaneio.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {item.fotos_romaneio.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm group relative">
                    <img 
                      src={photo} 
                      alt={`Foto ${i + 1}`} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                      referrerPolicy="no-referrer"
                      onClick={() => setLightbox({ isOpen: true, src: photo, alt: `Foto ${i + 1}` })}
                    />
                    <div 
                      onClick={() => setLightbox({ isOpen: true, src: photo, alt: `Foto ${i + 1}` })}
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <span className="bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full text-[10px] font-bold text-gray-900 dark:text-white">Ver Original</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma foto anexada a este registro.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>

      <ImageLightbox 
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
        src={lightbox.src}
        alt={lightbox.alt}
      />
    </div>
  );
}
