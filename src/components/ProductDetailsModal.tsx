import React, { useState } from "react";
import { Product, Review, SystemSettings, UserProfile } from "../types";
import { X, Star, MessageCircle, Instagram, Mail, Send, AlertCircle, FileText, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailsModalProps {
  product: Product;
  user: UserProfile;
  settings: SystemSettings | null;
  reviews: Review[];
  onClose: () => void;
  onAddReview: (rating: number, comment: string) => Promise<void>;
}

export default function ProductDetailsModal({
  product,
  user,
  settings,
  reviews,
  onClose,
  onAddReview,
}: ProductDetailsModalProps) {
  const [activeImage, setActiveImage] = useState(product.images[0] || "");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate average rating
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
    : 0;

  const renderStars = (score: number, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = interactive
        ? i <= (hoverRating ?? rating)
        : i <= Math.round(score);

      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(null)}
          className={`focus:outline-none ${interactive ? "cursor-pointer transform hover:scale-110 transition-transform duration-100" : ""}`}
        >
          <Star
            className={`w-5 h-5 ${
              isFilled
                ? "fill-brand text-brand"
                : "text-gray-200"
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  const handleWhatsApp = () => {
    if (!settings || !settings.whatsapp) return;
    const whatsappNum = settings.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá! Gostaria de falar sobre o produto *${product.name}* (${product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte Preço"}).`);
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, "_blank");
  };

  const handleInstagram = () => {
    if (!settings || !settings.instagram) return;
    window.open(settings.instagram, "_blank");
  };

  const handleEmail = () => {
    if (!settings || !settings.email) return;
    const subject = encodeURIComponent(`Interesse no produto APEX: ${product.name}`);
    const body = encodeURIComponent(`Olá!\nGostaria de mais detalhes sobre ${product.name}.`);
    window.open(`mailto:${settings.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Por favor, digite um comentário para sua avaliação.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAddReview(rating, comment.trim());
      setComment("");
      setRating(5);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar sua avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasVideo = product.videos && product.videos.length > 0 && product.videos[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="product-details-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-4xl p-6 md:p-8 border border-gray-100 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        id="product-details-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer"
          id="close-details-btn"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="modal-grid">
          {/* Left Column: Visual Media Box */}
          <div className="flex flex-col gap-4" id="modal-visual-media">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100" id="modal-active-media-box">
              {activeImage.endsWith(".mp4") || activeImage.includes("video") ? (
                <video
                  src={activeImage}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeImage || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Thumbnail Gallery (Images and Videos) */}
            <div className="flex gap-2 overflow-x-auto pb-1" id="modal-thumbnail-gallery">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImage === img ? "border-brand" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
              {hasVideo && (
                <button
                  onClick={() => setActiveImage(product.videos[0])}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-neutral-900 flex flex-col items-center justify-center text-white transition ${
                    activeImage === product.videos[0] ? "border-brand" : "border-gray-100 hover:border-neutral-700"
                  }`}
                >
                  <Play className="w-5 h-5 text-white fill-white" />
                  <span className="text-[9px] uppercase tracking-wider font-bold">Vídeo</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Information & Interactions */}
          <div className="flex flex-col justify-between" id="modal-info-column">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-widest block mb-1">
                {product.category}
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-black leading-tight">
                {product.name}
              </h2>

              {/* Price Tag */}
              <div className="mt-4 mb-4 flex items-baseline gap-2" id="modal-price-display">
                <span className="text-2xl md:text-3xl font-display font-bold text-black">
                  {product.price ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Preço sob consulta"}
                </span>
              </div>

              {/* Aggregated Reviews Summary */}
              <div className="flex items-center gap-2 mb-6" id="modal-rating-summary">
                <div className="flex gap-0.5">{renderStars(averageRating)}</div>
                <span className="text-sm font-semibold text-gray-800">
                  {averageRating > 0 ? averageRating.toFixed(1) : "Sem avaliações"}
                </span>
                <span className="text-xs text-gray-400">
                  • Baseado em {reviewsCount} {reviewsCount === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>

              <div className="prose prose-sm text-gray-600 max-h-[160px] overflow-y-auto mb-6 pr-2">
                <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            </div>

            {/* CTA Contact and Channels */}
            <div className="space-y-3" id="modal-cta-box">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Falar com Consultor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" id="modal-contact-grid">
                <button
                  onClick={handleWhatsApp}
                  disabled={!settings?.whatsapp}
                  className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 border border-green-100/50 rounded-full transition duration-200 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleInstagram}
                  disabled={!settings?.instagram}
                  className="w-full py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100/50 rounded-full transition duration-200 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <span>Instagram</span>
                </button>

                <button
                  onClick={handleEmail}
                  disabled={!settings?.email}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100/50 rounded-full transition duration-200 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>E-mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 my-8" />

        {/* Reviews/Comments Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="reviews-full-row">
          {/* Write a review (5 Cols) */}
          <div className="md:col-span-5" id="write-review-col">
            <h3 className="text-lg font-display font-bold text-black mb-4">Deixe sua Avaliação</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4" id="review-form">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Sua Nota
                </label>
                <div className="flex gap-1 bg-gray-50 p-2.5 rounded-full justify-center border border-gray-100" id="form-stars">
                  {renderStars(rating, true)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1" htmlFor="review-comment">
                  Comentário
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  placeholder="Escreva sua experiência detalhada com este produto..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold uppercase tracking-widest text-xs rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                id="submit-review-btn"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Avaliação</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List reviews (7 Cols) */}
          <div className="md:col-span-7" id="reviews-list-col">
            <h3 className="text-lg font-display font-bold text-black mb-4">
              Avaliações Públicas ({reviewsCount})
            </h3>

            {reviewsCount > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" id="reviews-scroller">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-black">{rev.userName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(rev.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex gap-0.5">{renderStars(rev.rating)}</div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-sm">Nenhum comentário enviado ainda. Seja o primeiro a avaliar!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
