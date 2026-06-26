import React, { useState, useEffect, useRef } from "react";
import { Sample, SystemSettings } from "../types";
import { Plus, Trash2, Edit2, Link, FileImage, AlertCircle, ChevronLeft, ChevronRight, MessageCircle, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../utils/image";

interface SamplesSectionProps {
  samples: Sample[];
  isAdmin: boolean;
  settings: SystemSettings | null;
  onAddSample: (url: string) => Promise<void>;
  onDeleteSample: (id: string) => Promise<void>;
  onUpdateSample: (id: string, url: string) => Promise<void>;
}

export default function SamplesSection({
  samples,
  isAdmin,
  settings,
  onAddSample,
  onDeleteSample,
  onUpdateSample,
}: SamplesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [sampleUrl, setSampleUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto carousel effect using first 3 samples
  const carouselSamples = samples.slice(0, 3);

  useEffect(() => {
    if (carouselSamples.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselSamples.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(interval);
  }, [carouselSamples.length]);

  const handleNext = () => {
    if (carouselSamples.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % carouselSamples.length);
    }
  };

  const handlePrev = () => {
    if (carouselSamples.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + carouselSamples.length) % carouselSamples.length);
    }
  };

  // Convert uploaded file to Base64
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const base64Str = await compressImage(file, 1000, 0.7);
      setSampleUrl(base64Str);
      setUploading(false);
    } catch (err) {
      setError("Falha no upload e compressão da imagem.");
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleUrl.trim()) {
      setError("Por favor, insira um URL ou carregue uma imagem.");
      return;
    }

    try {
      if (editingSample) {
        await onUpdateSample(editingSample.id, sampleUrl);
      } else {
        await onAddSample(sampleUrl);
      }
      setSampleUrl("");
      setEditingSample(null);
      setModalOpen(false);
    } catch (err) {
      setError("Erro ao salvar amostra.");
    }
  };

  const handleImageClick = (imageUrl: string) => {
    if (!settings) return;

    const action = settings.linkAction;
    const whatsappNum = settings.whatsapp.replace(/\D/g, "");

    if (action === "whatsapp" && whatsappNum) {
      const text = encodeURIComponent(`Olá, gostaria de mais informações sobre esta amostra APEX:\n${imageUrl}`);
      window.open(`https://wa.me/${whatsappNum}?text=${text}`, "_blank");
    } else if (action === "instagram" && settings.instagram) {
      window.open(settings.instagram, "_blank");
    } else {
      // Fallback
      if (settings.email) {
        window.open(`mailto:${settings.email}?subject=Interesse em Amostra APEX&body=Amostra: ${imageUrl}`, "_blank");
      }
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto py-12 px-4 md:px-8 font-sans border-t border-gray-100" id="amostras-section">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8" id="amostras-header-container">
        <div id="amostras-header">
          <span className="text-xs font-bold text-brand tracking-widest uppercase block mb-1">Portfólio Exclusivo</span>
          <h2 className="text-3xl font-display font-bold text-black tracking-tight uppercase">Amostras APEX</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingSample(null);
              setSampleUrl("");
              setError(null);
              setModalOpen(true);
            }}
            className="mt-4 md:mt-0 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs md:text-sm font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            id="admin-add-sample-btn"
          >
            <Plus className="w-4 h-4" />
            Adicionar Amostra
          </button>
        )}
      </div>

      {/* Auto Carousel (Top 3 items) */}
      {carouselSamples.length > 0 ? (
        <div className="relative w-full h-[320px] sm:h-[450px] md:h-[550px] bg-neutral-900 rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group" id="amostras-carousel">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={() => handleImageClick(carouselSamples[currentIndex].imageUrl)}
              id="carousel-image-container"
            >
              <img
                src={carouselSamples[currentIndex].imageUrl}
                alt={`Amostra APEX ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Badge indicating click action */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end" id="carousel-info">
                <div>
                  <span className="bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mb-2 inline-block">
                    Amostra Principal
                  </span>
                  <h3 className="text-white font-display text-xl sm:text-2xl font-bold">
                    Inspirando Elegância & Performance
                  </h3>
                </div>
                <div className="bg-white/95 text-black p-3 rounded-full hover:bg-brand hover:text-white transition-all duration-300 hidden sm:flex items-center justify-center shadow-lg" id="carousel-action-indicator">
                  {settings?.linkAction === "whatsapp" ? <MessageCircle className="w-5 h-5" /> : <Instagram className="w-5 h-5" />}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          {carouselSamples.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-full transition duration-200 cursor-pointer"
                id="carousel-prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-full transition duration-200 cursor-pointer"
                id="carousel-next-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Indicator dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" id="carousel-dots">
                {carouselSamples.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-brand" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl mb-12 flex flex-col items-center justify-center text-gray-400" id="empty-samples">
          <FileImage className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-sm font-medium">Nenhuma amostra cadastrada no carrossel.</p>
        </div>
      )}

      {/* Gallery of ALL samples */}
      <div id="amostras-gallery">
        <h3 className="text-lg font-display font-semibold text-black mb-6 uppercase tracking-wider">
          Galeria de Amostras ({samples.length})
        </h3>

        {samples.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="samples-grid">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="group relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm cursor-pointer"
                id={`sample-card-${sample.id}`}
              >
                {/* Clicking on image redirects to WhatsApp or Instagram */}
                <div
                  onClick={() => handleImageClick(sample.imageUrl)}
                  className="w-full h-full overflow-hidden"
                  id={`sample-click-${sample.id}`}
                >
                  <img
                    src={sample.imageUrl}
                    alt="Amostra"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white font-medium text-sm gap-2">
                    {settings?.linkAction === "whatsapp" ? (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        <span>Chamar no WhatsApp</span>
                      </>
                    ) : (
                      <>
                        <Instagram className="w-5 h-5" />
                        <span>Acessar Instagram</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Admin controls inside gallery */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10" id={`sample-admin-${sample.id}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSample(sample);
                        setSampleUrl(sample.imageUrl);
                        setError(null);
                        setModalOpen(true);
                      }}
                      className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 hover:text-black rounded-lg transition shadow"
                      title="Editar Amostra"
                      id={`sample-edit-${sample.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Deseja realmente excluir esta amostra?")) {
                          onDeleteSample(sample.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-red-50 text-red-500 rounded-lg transition shadow"
                      title="Excluir Amostra"
                      id={`sample-delete-${sample.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Nenhuma amostra disponível.</p>
        )}
      </div>

      {/* Add / Edit Sample Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="sample-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative"
            >
              <h3 className="text-xl font-display font-bold text-black mb-4">
                {editingSample ? "Editar Amostra" : "Adicionar Amostra"}
              </h3>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload Zone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Carregar Imagem (Arraste ou Selecione)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      dragActive ? "border-brand bg-orange-50/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-500">Lendo arquivo...</span>
                      </div>
                    ) : sampleUrl.startsWith("data:") ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={sampleUrl}
                          alt="Previsualização"
                          className="w-20 h-20 object-cover rounded-lg mb-2 border border-gray-100"
                        />
                        <span className="text-xs text-green-600 font-semibold">Arquivo carregado!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileImage className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 font-medium">Clique para escolher ou arraste a imagem</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="sample-url-input">
                    Ou insira o URL da Imagem
                  </label>
                  <div className="relative">
                    <input
                      id="sample-url-input"
                      type="text"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={sampleUrl}
                      onChange={(e) => setSampleUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm"
                    />
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl transition font-medium text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition text-sm cursor-pointer shadow"
                  >
                    {editingSample ? "Atualizar" : "Salvar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
