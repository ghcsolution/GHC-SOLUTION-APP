import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/inventory';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Shield, User as UserIcon, Mail, CheckCircle2, Trash2 } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  searchTerm: string;
}

export default function UserManagement({ currentUser, searchTerm }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as UserProfile);
      });
      setUsers(usersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users', currentUser));

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (uid === currentUser.uid) {
      alert("Você não pode alterar sua própria permissão.");
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error("Erro ao alterar permissão:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === currentUser.uid) return;
    if (!window.confirm("Tem certeza que deseja excluir este usuário? Todos os dados vinculados a este perfil serão removidos do banco de dados (o acesso via Auth permanecerá até ser removido no console).")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Gestão de Usuários</h3>
          <p className="text-indigo-100 opacity-80">Controle quem pode visualizar, editar ou administrar o sistema.</p>
        </div>
        <Shield className="w-16 h-16 text-indigo-400 opacity-30" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Permissão</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <select 
                      value={user.role}
                      disabled={user.uid === currentUser.uid}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                      className="text-sm font-semibold bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-between gap-4">
                      {user.uid === currentUser.uid ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Você
                        </span>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Ativo
                          </span>
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Visualizador
          </h4>
          <p className="text-sm text-gray-500">Pode apenas visualizar os registros e exportar relatórios.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            Editor
          </h4>
          <p className="text-sm text-gray-500">Pode criar e editar registros de estoque, mas não excluir.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Administrador
          </h4>
          <p className="text-sm text-gray-500">Controle total do sistema, incluindo gestão de usuários e exclusões.</p>
        </div>
      </div>
    </div>
  );
}
