import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { deleteUser, updateEmail } from "firebase/auth";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { X, User, Mail, Trash2, Save, AlertTriangle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface UserEditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
  onAccountDeleted: () => void;
}

export default function UserEditProfileModal({
  user,
  onClose,
  onProfileUpdated,
  onAccountDeleted,
}: UserEditProfileModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Por favor, preencha seu nome.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Firestore Profile
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        email: email.trim()
      });

      // 2. Update Firebase Auth Email if changed (only if not mock admin)
      if (auth.currentUser && auth.currentUser.email !== email.trim() && user.uid !== "admin-apex-uid") {
        await updateEmail(auth.currentUser, email.trim());
      }

      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim(),
        email: email.trim(),
      };

      localStorage.setItem("apex_user", JSON.stringify(updatedProfile));
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao atualizar dados do perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      // 1. Delete Firestore user document
      await deleteDoc(doc(db, "users", user.uid));

      // 2. Delete Firebase Auth account (if active)
      if (currentUser && user.uid !== "admin-apex-uid") {
        await deleteUser(currentUser);
      }

      localStorage.removeItem("apex_user");
      onAccountDeleted();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setError("Para excluir sua conta, você precisa ter feito login recentemente. Faça logout e login novamente antes de prosseguir.");
      } else {
        setError(err.message || "Erro ao excluir conta. Entre em contato com o suporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="profile-edit-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer"
          id="close-profile-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-display font-bold text-black mb-1">Meu Perfil APEX</h3>
        <p className="text-xs text-gray-500 mb-6">Altere suas credenciais cadastrais ou gerencie seu cadastro.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {!showConfirmDelete ? (
          <form onSubmit={handleUpdate} className="space-y-4" id="edit-profile-form">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="edit-name">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  id="edit-name"
                  type="text"
                  placeholder="Nome de visitante"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="edit-email">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <input
                  id="edit-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  disabled={user.uid === "admin-apex-uid"}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm disabled:opacity-50"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Profile badge info */}
            <div className="bg-orange-50/20 border border-orange-100 rounded-2xl p-4 flex gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-brand font-bold shrink-0">
                {user.role.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-brand text-xs uppercase tracking-widest leading-none mb-1">Permissão</p>
                <p className="text-xs text-neutral-800 font-medium">{user.role}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                id="save-profile-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>

              {user.uid !== "admin-apex-uid" && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full py-3 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                  id="delete-account-trigger"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir minha conta permanentemente</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-6" id="delete-confirmation-box">
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Ação Irreversível!</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  Ao confirmar a exclusão, todos os seus dados cadastrais, preferências e informações serão excluídos permanentemente de nossos servidores.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition text-sm cursor-pointer flex items-center justify-center gap-1.5"
                id="delete-account-confirm-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
