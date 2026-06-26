import React, { useState, useEffect, useRef } from "react";
import { Product } from "../types";
import { X, Plus, Trash2, Link, FileVideo, FileImage, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../utils/image";

interface AdminAddProductModalProps {
  editingProduct: Product | null;
  onClose: () => void;
  onSave: (productData: Omit<Product, "id" | "createdAt"> & { id?: string }) => Promise<void>;
}

export default function AdminAddProductModal({
  editingProduct,
  onClose,
  onSave,
}: AdminAddProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Identidade Visual");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate fields if editing
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setPrice(editingProduct.price ? editingProduct.price.toString() : "");
      setCategory(editingProduct.category);
      setImages(editingProduct.images || []);
      setVideos(editingProduct.videos || []);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Identidade Visual");
      setImages([]);
      setVideos([]);
    }
  }, [editingProduct]);

  // Convert File to Base64
  const handleFile = async (file: File, type: "image" | "video") => {
    setError(null);
    if (type === "image" && !file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      setError("Por favor, selecione apenas arquivos de vídeo.");
      return;
    }

    if (type === "video" && file.size > 5 * 1024 * 1024) {
      setError("O arquivo de vídeo é muito grande. Limite: 5MB.");
      return;
    }

    setLoading(true);
    try {
      if (type === "image") {
        const base64Str = await compressImage(file, 1000, 0.7);
        setImages((prev) => [...prev, base64Str]);
        setLoading(false);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Str = reader.result as string;
          setVideos((prev) => [...prev, base64Str]);
          setLoading(false);
        };
        reader.onerror = () => {
          setError("Erro ao processar arquivo.");
          setLoading(false);
        };
      }
    } catch (err) {
      setError("Falha no upload.");
      setLoading(false);
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
      const file = e.dataTransfer.files[0];
      const isVideo = file.type.startsWith("video/");
      await handleFile(file, isVideo ? "video" : "image");
    }
  };

  const handleAddImageFromUrl = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleAddVideoFromUrl = () => {
    if (newVideoUrl.trim()) {
      setVideos((prev) => [...prev, newVideoUrl.trim()]);
      setNewVideoUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome do produto é obrigatório.");
      return;
    }
    if (images.length === 0) {
      setError("O produto precisa ter pelo menos uma imagem.");
      return;
    }

    setLoading(true);
    try {
      const parsedPrice = price.trim() ? parseFloat(price.replace(",", ".")) : undefined;

      await onSave({
        id: editingProduct?.id,
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        images,
        videos,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Identidade Visual", "Logomarca", "Sites", "Designs", "Premium"];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="product-admin-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 border border-gray-100 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer"
          id="close-admin-modal-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-display font-bold text-black mb-6">
          {editingProduct ? `Editar Produto: ${editingProduct.name}` : "Publicar Novo Produto APEX"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="add-product-form">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="prod-name">
                Nome do Produto
              </label>
              <input
                id="prod-name"
                type="text"
                placeholder="Ex: Tênis Air Apex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="prod-category">
                Categoria
              </label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="prod-price">
                Preço (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">R$</span>
                <input
                  id="prod-price"
                  type="text"
                  placeholder="0,00 ou deixe em branco"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="prod-desc">
              Descrição Detalhada
            </label>
            <textarea
              id="prod-desc"
              rows={4}
              placeholder="Descreva as especificações, materiais e destaques do produto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm"
              required
            />
          </div>

          {/* Media Upload Area */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Mídias & Arquivos</h3>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive ? "border-brand bg-orange-50/20" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach((f: any) => handleFile(f as File, "image"));
                  }
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <FileImage className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-black">Arraste fotos ou vídeos aqui</span>
                <span className="text-xs text-gray-400 mt-1">Fotos até 2.5MB, vídeos até 5MB</span>
              </div>
            </div>

            {/* Image Link Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1" htmlFor="new-img-url">
                  Inserir Imagem por URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="new-img-url"
                      type="text"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none text-xs"
                    />
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageFromUrl}
                    className="px-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Video Link Input */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1" htmlFor="new-vid-url">
                  Inserir Vídeo por URL (opcional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="new-vid-url"
                      type="text"
                      placeholder="https://exemplo.com/video.mp4"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black focus:outline-none text-xs"
                    />
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVideoFromUrl}
                    className="px-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Video File Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <FileVideo className="w-4 h-4 text-gray-500" />
                <span>Carregar arquivo de vídeo (.mp4)</span>
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0], "video");
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Preview loaded images */}
            {images.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Imagens Atuais ({images.length})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2" id="admin-images-preview">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0 group/img">
                      <img src={img} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview loaded videos */}
            {videos.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Vídeos Atuais ({videos.length})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2" id="admin-videos-preview">
                  {videos.map((vid, idx) => (
                    <div key={idx} className="relative w-36 h-20 bg-black rounded-xl overflow-hidden shrink-0 group/vid flex items-center justify-center">
                      <video src={vid} className="w-full h-full object-cover" muted playsInline />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl font-medium text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition text-sm cursor-pointer shadow-md flex items-center gap-2"
              id="admin-publish-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{editingProduct ? "Atualizar" : "Publicar"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
