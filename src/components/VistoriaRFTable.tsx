import React from 'react';
import { VistoriaRF } from '../types/inventory';
import { Edit2, Trash2, MapPin, Calendar, Info, Camera, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VistoriaRFTableProps {
  items: VistoriaRF[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onEdit: (item: VistoriaRF) => void;
  onDelete: (id: string) => void;
  onView: (item: VistoriaRF) => void;
  canDelete: boolean;
  canEdit: boolean;
}

export default function VistoriaRFTable({ 
  items, 
  selectedIds, 
  onSelect, 
  onSelectAll, 
  onEdit, 
  onDelete, 
  onView, 
  canDelete, 
  canEdit 
}: VistoriaRFTableProps) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Nenhuma vistoria encontrada</h3>
        <p className="text-gray-500">Comece registrando uma nova vistoria RF.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => {
                      if (allSelected) {
                        onSelectAll([]);
                      } else {
                        onSelectAll(items.map(i => i.id!));
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Site / Data</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Foto 01 - Fachada</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Foto 02 - Placa</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className={`group hover:bg-indigo-50/30 transition-colors ${selectedIds.includes(item.id!) ? 'bg-indigo-50/20' : ''}`}>
                  <td className="px-6 py-6">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedIds.includes(item.id!)}
                      onChange={() => onSelect(item.id!)}
                    />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.site}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {item.data ? format(new Date(item.data), 'dd MMM yyyy', { locale: ptBR }) : '-'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{item.municipio || '-'}</span>
                      <span className="text-xs text-gray-400 font-bold">{item.uf || '-'}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    {item.foto_fachada ? (
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm group/img">
                        <img src={item.foto_fachada} alt="Fachada" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-24 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-6">
                    {item.foto_placa ? (
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm group/img">
                        <img src={item.foto_placa} alt="Placa" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-24 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onView(item)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => onEdit(item)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta vistoria?')) {
                              onDelete(item.id!);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {items.length > 0 && (
          <div className="flex items-center justify-between px-2 pb-2">
            <button 
              onClick={() => {
                if (allSelected) {
                  onSelectAll([]);
                } else {
                  onSelectAll(items.map(i => i.id!));
                }
              }}
              className="text-xs font-bold text-indigo-600 flex items-center gap-2"
            >
              <input 
                type="checkbox" 
                readOnly
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
              />
              {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {selectedIds.length} selecionados
            </span>
          </div>
        )}
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`bg-white p-4 rounded-2xl border transition-all ${selectedIds.includes(item.id!) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'} shadow-sm space-y-4`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedIds.includes(item.id!)}
                  onChange={() => onSelect(item.id!)}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-gray-900">{item.site}</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {item.data ? format(new Date(item.data), 'dd/MM/yy') : '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onView(item)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {canEdit && (
                  <button 
                    onClick={() => onEdit(item)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fachada</p>
                {item.foto_fachada ? (
                  <img src={item.foto_fachada} className="w-full aspect-video object-cover rounded-lg border border-gray-100" />
                ) : (
                  <div className="w-full aspect-video bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Placa</p>
                {item.foto_placa ? (
                  <img src={item.foto_placa} className="w-full aspect-video object-cover rounded-lg border border-gray-100" />
                ) : (
                  <div className="w-full aspect-video bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
                <MapPin className="w-3 h-3" />
                {item.municipio || '-'} / {item.uf || '-'}
              </div>
              {canDelete && (
                <button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta vistoria?')) {
                      onDelete(item.id!);
                    }
                  }}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
