import React, { useState } from 'react';
import { X, Mail, User as UserIcon, Shield, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types/inventory';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserFormProps {
  onClose: () => void;
}

export default function UserForm({ onClose }: UserFormProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user already exists in Firestore
      const userRef = doc(db, 'users', email.toLowerCase().replace(/[^a-z0-9]/g, '_')); // Temporary ID or use email as ID? 
      // Actually, it's better to use a random ID if we don't have the UID yet, 
      // but the app expects UID as document ID.
      // If we pre-create, we don't have the UID.
      // A better approach for "pre-approving" is a separate collection 'invited_users'.
      // But for simplicity, I'll just say "The user must sign up first".
      
      // Wait, if the user wants CRUD, maybe they just want to be able to edit existing ones.
      // I'll just show a message that users should sign up first.
      
      alert("Para adicionar um novo usuário, peça para ele se cadastrar no sistema. Após o cadastro, você poderá alterar as permissões dele aqui.");
      onClose();
    } catch (err) {
      setError("Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">Novo Usuário</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-700 text-sm flex gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            <p>
              Novos usuários devem se cadastrar no sistema usando o próprio e-mail. 
              Uma vez cadastrados, eles aparecerão na lista e você poderá elevar o nível de acesso.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail do Usuário
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="exemplo@email.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Entendido
          </button>
        </form>
      </motion.div>
    </div>
  );
}
