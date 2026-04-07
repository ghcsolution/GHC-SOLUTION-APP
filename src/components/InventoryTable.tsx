import React from 'react';
import { InventoryItem } from '../types/inventory';
import { Edit2, Trash2, MapPin, Calendar, User, Info, Eye, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onView: (item: InventoryItem) => void;
  canDelete: boolean;
  canEdit: boolean;
}

export default function InventoryTable({ items, onEdit, onDelete, onView, canDelete, canEdit }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Nenhum registro encontrado</h3>
        <p className="text-gray-500">Comece adicionando um novo item ao estoque.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Localização</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Materiais (Modelo / Código)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Logística</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Romaneio</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.site}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                        {item.local_armazenamento || 'MR'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {item.cidade}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-6">
                  <div className="space-y-2 max-w-xs">
                    {item.materiais.slice(0, 2).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-indigo-600">{m.qtde}x</span>
                        <span className="text-xs text-gray-700 truncate font-medium">
                          {m.modelo} {m.codigoFornecedor ? `/ ${m.codigoFornecedor}` : ''}
                        </span>
                      </div>
                    ))}
                    {item.materiais.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-bold pl-1">
                        + {item.materiais.length - 2} outros itens
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{item.responsavel_recebimento || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {item.data_entrada ? format(new Date(item.data_entrada), 'dd MMM yyyy', { locale: ptBR }) : '-'}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-6">
                  {item.fotos_romaneio && item.fotos_romaneio.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {item.fotos_romaneio.slice(0, 3).map((photo, i) => (
                          <img
                            key={i}
                            className="inline-block h-6 w-6 rounded-md ring-2 ring-white object-cover"
                            src={photo}
                            alt=""
                          />
                        ))}
                      </div>
                      {item.fotos_romaneio.length > 3 && (
                        <span className="text-[10px] font-bold text-gray-400">+{item.fotos_romaneio.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-300 italic">Sem fotos</span>
                  )}
                </td>

                <td className="px-6 py-6">
                  {item.data_saida ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                      Finalizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                      Em Aberto
                    </span>
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
                          if (confirm('Tem certeza que deseja excluir este registro?')) {
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
  );
}
