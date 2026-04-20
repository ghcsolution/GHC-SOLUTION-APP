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
import { UserProfile, UserRole, UserPermissions } from '../types/inventory';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Shield, User as UserIcon, Mail, CheckCircle2, Trash2, Clock } from 'lucide-react';

interface Invite {
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  status: string;
}

interface UserManagementProps {
  currentUser: User;
  searchTerm: string;
}

export default function UserManagement({ currentUser, searchTerm }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as UserProfile);
      });
      setUsers(usersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users', currentUser));

    const qInvites = query(collection(db, 'invites'), orderBy('email'));
    const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
      const invitesData: Invite[] = [];
      snapshot.forEach((doc) => {
        invitesData.push(doc.data() as Invite);
      });
      setInvites(invitesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'invites', currentUser));

    return () => {
      unsubscribe();
      unsubscribeInvites();
    };
  }, []);

  const handleDeleteInvite = async (email: string) => {
    if (!window.confirm("Remover este convite?")) return;
    try {
      await deleteDoc(doc(db, 'invites', email));
    } catch (error) {
      console.error("Erro ao excluir convite:", error);
    }
  };

  const handlePermissionChange = async (uid: string, feature: keyof UserPermissions, value: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      const user = users.find(u => u.uid === uid);
      if (!user) return;
      
      const newPermissions = {
        inventario: user.permissions?.inventario ?? true,
        vistoria: user.permissions?.vistoria ?? true,
        materiais: user.permissions?.materiais ?? true,
        aprovacao: user.permissions?.aprovacao ?? false,
        ...user.permissions,
        [feature]: value
      };
      
      await updateDoc(userRef, { permissions: newPermissions });
    } catch (error) {
      console.error("Erro ao alterar permissão:", error);
    }
  };
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
      <div className="bg-indigo-600 dark:bg-indigo-500 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Gestão de Usuários</h3>
          <p className="text-indigo-100 dark:text-indigo-50 opacity-80">Controle quem pode visualizar, editar ou administrar o sistema.</p>
        </div>
        <Shield className="w-16 h-16 text-indigo-400 dark:text-indigo-300 opacity-30" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Permissão</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Inventário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Vistoria RF</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Materiais</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center text-indigo-600">Aprovação</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {/* Active Users */}
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
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
                      className="text-sm font-semibold bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:text-white disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <input 
                      type="checkbox"
                      checked={user.role === 'admin' || (user.permissions?.inventario ?? true)}
                      disabled={user.uid === currentUser.uid || user.role === 'admin'}
                      onChange={(e) => handlePermissionChange(user.uid, 'inventario', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-6 py-6 text-center">
                    <input 
                      type="checkbox"
                      checked={user.role === 'admin' || (user.permissions?.vistoria ?? true)}
                      disabled={user.uid === currentUser.uid || user.role === 'admin'}
                      onChange={(e) => handlePermissionChange(user.uid, 'vistoria', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-6 py-6 text-center">
                    <input 
                      type="checkbox"
                      checked={user.role === 'admin' || (user.permissions?.materiais ?? true)}
                      disabled={user.uid === currentUser.uid || user.role === 'admin'}
                      onChange={(e) => handlePermissionChange(user.uid, 'materiais', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-6 py-6 text-center border-l border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/10">
                    <input 
                      type="checkbox" 
                      checked={user.role === 'admin' || (user.permissions?.aprovacao ?? false)}
                      disabled={user.uid === currentUser.uid || user.role === 'admin'}
                      onChange={(e) => handlePermissionChange(user.uid, 'aprovacao', e.target.checked)}
                      className="w-5 h-5 rounded border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-between gap-4">
                      {user.uid === currentUser.uid ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Você
                        </span>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Ativo
                          </span>
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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

              {/* Pending Invites */}
              {invites.filter(inv => !users.some(u => u.email === inv.email)).map((invite) => (
                <tr key={invite.email} className="bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Aguardando Login</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                          <Mail className="w-3 h-3" />
                          {invite.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full uppercase">
                      {invite.role === 'admin' ? 'Admin' : invite.role === 'editor' ? 'Editor' : 'Visitante'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${invite.permissions.inventario ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${invite.permissions.vistoria ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${invite.permissions.materiais ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  </td>
                  <td className="px-6 py-6 text-center bg-indigo-50/10">
                    <div className={`w-3 h-3 rounded-full mx-auto ${invite.permissions.aprovacao ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                        Pendente
                      </span>
                      <button 
                        onClick={() => handleDeleteInvite(invite.email)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remover Convite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Visualizador
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pode apenas visualizar os registros e exportar relatórios.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            Editor
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pode criar e editar registros de estoque, mas não excluir.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Administrador
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Controle total do sistema, incluindo gestão de usuários e exclusões.</p>
        </div>
      </div>
    </div>
  );
}
