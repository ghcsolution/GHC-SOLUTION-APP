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
    materiais: true,
    aprovacao: false
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
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Configurado!</h3>
          <p className="text-gray-500 dark:text-gray-400">
            As permissões para <strong>{email}</strong> foram salvas. 
            O usuário terá esse acesso assim que realizar o primeiro login.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Acesso</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail do Usuário (Gmail)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-white"
              placeholder="exemplo@gmail.com"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                      ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-200 dark:hover:border-indigo-800'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : r === 'editor' ? 'Editor' : 'Visitante'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Funcionalidades Permitidas</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Inventário</span>
                <input 
                  type="checkbox" 
                  checked={permissions.inventario} 
                  onChange={() => togglePermission('inventario')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-900"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Vistoria de RF</span>
                <input 
                  type="checkbox" 
                  checked={permissions.vistoria} 
                  onChange={() => togglePermission('vistoria')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-900"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">3. Materiais</span>
                <input 
                  type="checkbox" 
                  checked={permissions.materiais} 
                  onChange={() => togglePermission('materiais')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-900"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">4. Aprovação de Vistorias</span>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400">Permite aprovar/reprovar relatórios RF</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={permissions.aprovacao} 
                  onChange={() => togglePermission('aprovacao')}
                  className="w-5 h-5 rounded border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-900"
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Permissões'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
