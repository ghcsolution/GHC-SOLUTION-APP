import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check,
  Loader2,
  Package,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { MasterMaterial } from '../types/inventory';
import { equipmentBase } from '../constants/equipment';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

interface MaterialManagementProps {
  materials: MasterMaterial[];
  onAdd: (material: Omit<MasterMaterial, 'id'>) => Promise<void>;
  onUpdate: (id: string, material: Partial<MasterMaterial>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImportBase: (materials: Omit<MasterMaterial, 'id'>[]) => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
}

export default function MaterialManagement({ 
  materials, 
  onAdd, 
  onUpdate, 
  onDelete,
  onImportBase,
  canEdit,
  canDelete
}: MaterialManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState({ modelo: '', codigoFornecedor: '' });
  const [editMaterial, setEditMaterial] = useState({ modelo: '', codigoFornecedor: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMaterials = materials.filter(m => 
    m.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigoFornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = async () => {
    if (!newMaterial.modelo) return;
    setIsSaving(true);
    try {
      await onAdd(newMaterial);
      setNewMaterial({ modelo: '', codigoFornecedor: '' });
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editMaterial.modelo) return;
    setIsSaving(true);
    try {
      await onUpdate(id, editMaterial);
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async () => {
    if (!confirm(`Deseja importar ${equipmentBase.length} equipamentos da base padrão?`)) return;
    setIsImporting(true);
    try {
      await onImportBase(equipmentBase);
      alert('Importação concluída com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao importar base.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      complete: async (results) => {
        try {
          // Filter out header and empty rows
          const data = results.data as string[][];
          const materialsToImport: Omit<MasterMaterial, 'id'>[] = data
            .filter((row, index) => {
              if (index === 0) return false; // Skip header
              return row.length >= 2 && row[0] && row[1];
            })
            .map(row => ({
              codigoFornecedor: row[0].trim(),
              modelo: row[1].trim()
            }));

          if (materialsToImport.length === 0) {
            alert('Nenhum dado válido encontrado no arquivo.');
            return;
          }

          if (confirm(`Deseja importar ${materialsToImport.length} materiais do arquivo CSV?`)) {
            await onImportBase(materialsToImport);
            alert('Importação concluída com sucesso!');
          }
        } catch (error) {
          console.error(error);
          alert('Erro ao processar arquivo CSV.');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error(error);
        alert('Erro ao ler arquivo CSV.');
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar materiais..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCsvUpload}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Importar CSV
              </button>
            </>
          )}
          {canEdit && materials.length === 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Importar Base
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Material
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Modelo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Código Fornecedor</th>
                {canEdit && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {isAdding && (
                  <motion.tr
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-indigo-50/30"
                  >
                    <td className="px-6 py-4">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Modelo do equipamento"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newMaterial.modelo}
                        onChange={e => setNewMaterial({ ...newMaterial, modelo: e.target.value })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Código do fornecedor"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newMaterial.codigoFornecedor}
                        onChange={e => setNewMaterial({ ...newMaterial, codigoFornecedor: e.target.value })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleAdd}
                          disabled={isSaving || !newMaterial.modelo}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setIsAdding(false)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>

              {paginatedMaterials.map((material) => (
                <tr key={material.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === material.id ? (
                      <input
                        autoFocus
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editMaterial.modelo}
                        onChange={e => setEditMaterial({ ...editMaterial, modelo: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Package className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">{material.modelo}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === material.id ? (
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editMaterial.codigoFornecedor}
                        onChange={e => setEditMaterial({ ...editMaterial, codigoFornecedor: e.target.value })}
                      />
                    ) : (
                      <span className="text-gray-500 font-mono text-sm">{material.codigoFornecedor}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === material.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(material.id!)}
                              disabled={isSaving || !editMaterial.modelo}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(material.id!);
                                setEditMaterial({ 
                                  modelo: material.modelo, 
                                  codigoFornecedor: material.codigoFornecedor 
                                });
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este material?')) {
                                    onDelete(material.id!);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMaterials.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhum material encontrado</h3>
            <p className="text-gray-500 mt-1">Tente ajustar sua busca ou adicione um novo material.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-gray-500 font-medium">
            Mostrando <span className="text-gray-900">{startIndex + 1}</span> a <span className="text-gray-900">{Math.min(startIndex + itemsPerPage, filteredMaterials.length)}</span> de <span className="text-gray-900">{filteredMaterials.length}</span> materiais
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, and pages around current
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${
                        currentPage === pageNum 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
