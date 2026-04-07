import React, { useState } from 'react';
import { X, Mail, User as UserIcon, Shield, Loader2, Check, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole, UserPermissions } from '../types/inventory';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserFormProps {
  onClose: () => void;
}

export default function UserForm({ onClose }: UserFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [permissions, setPermissions] = useState<UserPermissions>({
    inventario: true,
    vistoria: true,
    materiais: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const inviteEmail = email.toLowerCase().trim();
      // Save to a special 'invites' collection
      const inviteRef = doc(db, 'invites', inviteEmail);
      await setDoc(inviteRef, {
        email: inviteEmail,
        role,
        permissions,
        invitedAt: serverTimestamp(),
        status: 'pending'
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao criar convite:", err);
      setError("Erro ao salvar convite. Verifique sua conexão e permissões.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl w-full max-w-md p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Acesso Configurado!</h3>
          <p className="text-gray-500">
            As permissões para <strong>{email}</strong> foram salvas. 
            O usuário terá esse acesso assim que realizar o primeiro login.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Novo Acesso</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail do Usuário (Gmail)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="exemplo@gmail.com"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Nível de Acesso
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['viewer', 'editor', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border-2 ${
                    role === r 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : r === 'editor' ? 'Editor' : 'Visitante'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Funcionalidades Permitidas</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">1. Inventário</span>
                <input 
                  type="checkbox" 
                  checked={permissions.inventario} 
                  onChange={() => togglePermission('inventario')}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">2. Vistoria de RF</span>
                <input 
                  type="checkbox" 
                  checked={permissions.vistoria} 
                  onChange={() => togglePermission('vistoria')}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">3. Materiais</span>
                <input 
                  type="checkbox" 
                  checked={permissions.materiais} 
                  onChange={() => togglePermission('materiais')}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Permissões'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
