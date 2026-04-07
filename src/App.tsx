import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User
} from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, UserRole, UserPermissions } from './types/inventory';
import Dashboard from './components/Dashboard';
import { LogIn, Package, Shield, Loader2, Mail, Lock, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          // Check for pending invite
          const inviteRef = doc(db, 'invites', firebaseUser.email?.toLowerCase() || '');
          const inviteSnap = await getDoc(inviteRef);
          
          let role: UserRole = 'viewer';
          let permissions: UserPermissions = {
            inventario: true,
            vistoria: true,
            materiais: true
          };

          if (inviteSnap.exists()) {
            const inviteData = inviteSnap.data();
            role = inviteData.role;
            permissions = inviteData.permissions;
          } else {
            // Default role is viewer, unless it's the admin email
            const isAdmin = firebaseUser.email === 'ghcampos1985@gmail.com' || firebaseUser.email === 'halanarib@gmail.com';
            const isDefault = firebaseUser.email === 'default@ghcsolutions.com';
            role = isAdmin ? 'admin' : (isDefault ? 'editor' : 'viewer');
          }

          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            role,
            permissions
          };
          await setDoc(profileRef, {
            ...newProfile,
            createdAt: serverTimestamp()
          });
          
          // If there was an invite, delete it
          if (inviteSnap.exists()) {
            await deleteDoc(inviteRef);
          }

          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Erro ao fazer login com Google:", error);
      setAuthError("Falha na autenticação com Google.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("Este e-mail já está em uso.");
      } else if (error.code === 'auth/invalid-credential') {
        setAuthError("E-mail ou senha incorretos.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setAuthError("Ocorreu um erro. Verifique os dados e tente novamente.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleDefaultLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    const defaultEmail = 'default@ghcsolutions.com';
    const defaultPass = 'CLARO@TESTE';
    try {
      // Try to login
      await signInWithEmailAndPassword(auth, defaultEmail, defaultPass);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        // If user doesn't exist, try to create it
        try {
          await createUserWithEmailAndPassword(auth, defaultEmail, defaultPass);
        } catch (createError: any) {
          console.error("Erro ao criar usuário default:", createError);
          setAuthError("Erro ao inicializar acesso padrão.");
        }
      } else {
        console.error("Erro no login default:", error);
        setAuthError("Erro ao acessar conta padrão.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-600 font-medium">Carregando sistema...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-10 h-10 text-indigo-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                GHC Solutions
              </h1>
              <p className="text-center text-gray-500 mb-8">
                Sistema de controle de armazenamento e logística.
              </p>
              
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-5 h-5" /> Criar Conta
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" /> Entrar
                    </>
                  )}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-400">ou continue com</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleDefaultLogin}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 bg-indigo-50 border-2 border-indigo-100 py-3 px-4 rounded-xl font-bold text-indigo-700 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm mb-4"
              >
                <Shield className="w-5 h-5" />
                Acesso Rápido (Default)
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-3 px-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-95 shadow-sm mb-6"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Entrar com Google
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-indigo-600 font-medium hover:underline"
              >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
              </button>
              
              <div className="mt-8 flex items-center gap-2 justify-center text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                Acesso restrito a usuários autorizados
              </div>
            </div>
          </motion.div>
        ) : profile ? (
          <Dashboard user={user} profile={profile} onLogout={handleLogout} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
