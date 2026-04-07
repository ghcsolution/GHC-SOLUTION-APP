import React, { useState } from 'react';
import { InventoryItem, InventoryMaterial, MasterMaterial } from '../types/inventory';
import { X, Plus, Trash2, Save, Package, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryFormProps {
  item: InventoryItem | null;
  materials: MasterMaterial[];
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export default function InventoryForm({ item, materials, onClose, onSave, isSaving = false, saveError = null }: InventoryFormProps) {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(
    item ? { ...item } : {
      site: '',
      cidade: '',
      obs: '',
      local_armazenamento: '',
      responsavel_entrega: '',
      responsavel_recebimento: '',
      data_entrada: new Date().toISOString().split('T')[0],
      responsavel_coleta: '',
      responsavel_liberacao: '',
      data_saida: '',
      materiais: [],
      fotos_romaneio: []
    }
  );

  const [isUploading, setIsUploading] = useState(false);

  const [newMaterial, setNewMaterial] = useState<InventoryMaterial>({
    qtde: 1,
    modelo: '',
    codigoFornecedor: ''
  });

  const handleAddMaterial = () => {
    if (!newMaterial.modelo) return;
    setFormData(prev => ({
      ...prev,
      materiais: [...prev.materiais, newMaterial]
    }));
    setNewMaterial({ qtde: 1, modelo: '', codigoFornecedor: '' });
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materiais: prev.materiais.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentPhotos = formData.fotos_romaneio || [];
    if (currentPhotos.length + files.length > 12) {
      alert("Você pode enviar no máximo 12 fotos.");
      return;
    }

    setIsUploading(true);
    const newPhotos: string[] = [];
    let processed = 0;

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

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        newPhotos.push(compressed);
        processed++;
        if (processed === files.length) {
          setFormData(prev => ({
            ...prev,
            fotos_romaneio: [...(prev.fotos_romaneio || []), ...newPhotos]
          }));
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos_romaneio: (prev.fotos_romaneio || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site || !formData.cidade || formData.materiais.length === 0) {
      alert("Por favor, preencha os campos obrigatórios e adicione ao menos um material.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
      >
        <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {item ? 'Editar Registro' : 'Novo Registro de Estoque'}
              </h3>
              <p className="text-xs text-gray-500">Preencha as informações do site e materiais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Informações do Site */}
          <section>
            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Informações do Local
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Site *</label>
                <input 
                  required
                  value={formData.site}
                  onChange={e => setFormData({...formData, site: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Ex: SIIPS03"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Cidade *</label>
                <input 
                  required
                  value={formData.cidade}
                  onChange={e => setFormData({...formData, cidade: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Ex: Iracemápolis"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Data Entrada *</label>
                <input 
                  type="date"
                  required
                  value={formData.data_entrada}
                  onChange={e => setFormData({...formData, data_entrada: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Data Saída (Finaliza Site)</label>
                <input 
                  type="date"
                  value={formData.data_saida}
                  onChange={e => setFormData({...formData, data_saida: e.target.value})}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all ${
                    formData.data_saida 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>
            </div>
          </section>

          {/* Responsáveis */}
          <section>
            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Responsáveis e Logística
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Entrega</label>
                <input 
                  value={formData.responsavel_entrega}
                  onChange={e => setFormData({...formData, responsavel_entrega: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Recebimento</label>
                <input 
                  value={formData.responsavel_recebimento}
                  onChange={e => setFormData({...formData, responsavel_recebimento: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Coleta</label>
                <input 
                  value={formData.responsavel_coleta}
                  onChange={e => setFormData({...formData, responsavel_coleta: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Liberação</label>
                <input 
                  value={formData.responsavel_liberacao}
                  onChange={e => setFormData({...formData, responsavel_liberacao: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Materiais */}
          <section>
            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Materiais
            </h4>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Qtde</label>
                  <input 
                    type="number"
                    min="1"
                    value={newMaterial.qtde}
                    onChange={e => setNewMaterial({...newMaterial, qtde: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Modelo do Equipamento</label>
                  <select 
                    value={newMaterial.modelo}
                    onChange={e => {
                      const equip = materials.find(eq => eq.modelo === e.target.value);
                      setNewMaterial({
                        ...newMaterial,
                        modelo: e.target.value,
                        codigoFornecedor: equip?.codigoFornecedor || ''
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Selecione um modelo...</option>
                    {materials.map((eq, i) => (
                      <option key={eq.id || i} value={eq.modelo}>
                        {eq.modelo} / {eq.codigoFornecedor}
                      </option>
                    ))}
                  </select>
                  {materials.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                      Nenhum material cadastrado. Vá em "Materiais" e clique em "Importar Base".
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="button"
                    onClick={handleAddMaterial}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {formData.materiais.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.materiais.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                          {m.qtde}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{m.modelo}</p>
                          <p className="text-xs text-gray-400">{m.codigoFornecedor}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeMaterial(i)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Fotos do Romaneio */}
          <section>
            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Fotos do Romaneio de Transporte (1 a 12 fotos)
            </h4>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(formData.fotos_romaneio || []).map((photo, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img 
                      src={photo} 
                      alt={`Romaneio ${index + 1}`} 
                      className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {(formData.fotos_romaneio || []).length < 12 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              <p className="mt-4 text-xs text-gray-400 italic">
                * As fotos são armazenadas localmente no registro. Recomendamos fotos leves para melhor performance.
              </p>
            </div>
          </section>

          {/* Observações */}
          <section>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Observações</label>
              <textarea 
                value={formData.obs}
                onChange={e => setFormData({...formData, obs: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]"
                placeholder="Notas adicionais sobre o armazenamento..."
              />
            </div>
          </section>

          {saveError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
              {saveError}
            </div>
          )}
        </form>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {item ? 'Salvar Alterações' : 'Criar Registro'}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
