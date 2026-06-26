import React, { useState, useEffect } from "react";
import { SystemSettings } from "../types";
import { X, MessageCircle, Instagram, Mail, Save, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface AdminSettingsModalProps {
  currentSettings: SystemSettings | null;
  onClose: () => void;
  onSave: (settings: SystemSettings) => Promise<void>;
}

export default function AdminSettingsModal({
  currentSettings,
  onClose,
  onSave,
}: AdminSettingsModalProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkAction, setLinkAction] = useState<"whatsapp" | "instagram">("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setWhatsapp(currentSettings.whatsapp || "");
      setEmail(currentSettings.email || "");
      setInstagram(currentSettings.instagram || "");
      setLinkAction(currentSettings.linkAction || "whatsapp");
    }
  }, [currentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!whatsapp.trim() && !email.trim() && !instagram.trim()) {
      setError("Por favor, preencha pelo menos um canal de atendimento.");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        instagram: instagram.trim(),
        linkAction,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="settings-admin-modal">
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
          id="close-settings-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-display font-bold text-black mb-1">Configurações Globais</h3>
        <p className="text-xs text-gray-500 mb-6">Insira os contatos de atendimento utilizados nos botões e amostras.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="admin-settings-form">
          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="set-whatsapp">
              WhatsApp Comercial
            </label>
            <div className="relative">
              <input
                id="set-whatsapp"
                type="text"
                placeholder="+55 85 9773-5167"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              />
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="set-email">
              E-mail de Contato
            </label>
            <div className="relative">
              <input
                id="set-email"
                type="email"
                placeholder="contato@apexstore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="set-instagram">
              Instagram Link / Username
            </label>
            <div className="relative">
              <input
                id="set-instagram"
                type="text"
                placeholder="https://instagram.com/apex"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              />
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Click action for Sample images */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Ação ao clicar em imagens das Amostras
            </label>
            <div className="grid grid-cols-2 gap-2" id="action-selection-grid">
              <button
                type="button"
                onClick={() => setLinkAction("whatsapp")}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                  linkAction === "whatsapp"
                    ? "border-brand bg-orange-50/20 text-brand font-bold"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chamar WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkAction("instagram")}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                  linkAction === "instagram"
                    ? "border-brand bg-orange-50/20 text-brand font-bold"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Instagram className="w-4 h-4" />
                <span>Abrir Instagram</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl font-medium text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition text-sm cursor-pointer shadow flex items-center gap-1.5"
              id="save-settings-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Informações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
