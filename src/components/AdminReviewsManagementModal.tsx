import { useState } from "react";
import { Review, Product } from "../types";
import { X, Trash2, Star, MessageSquare, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface AdminReviewsManagementModalProps {
  reviews: Review[];
  products: Product[];
  onClose: () => void;
  onDeleteReview: (id: string) => Promise<void>;
}

export default function AdminReviewsManagementModal({
  reviews,
  products,
  onClose,
  onDeleteReview,
}: AdminReviewsManagementModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to map product ID to product Name
  const getProductName = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    return prod ? prod.name : "Produto Desconhecido";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta avaliação permanentemente?")) return;
    setError(null);
    setLoadingId(id);

    try {
      await onDeleteReview(id);
    } catch (err: any) {
      setError("Erro ao excluir a avaliação.");
    } finally {
      setLoadingId(null);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-brand text-brand" : "text-gray-200"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="reviews-admin-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 border border-gray-100 shadow-2xl relative max-h-[85vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer"
          id="close-reviews-mgmt-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-display font-bold text-black mb-1">Gerenciamento de Avaliações</h3>
        <p className="text-xs text-gray-500 mb-6">Veja, filtre e remova comentários abusivos ou incorretos enviados por visitantes.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4" id="admin-reviews-list">
          {reviews.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-brand bg-orange-100/30 px-2 py-0.5 rounded-md">
                        {getProductName(rev.productId)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 py-1">
                      <span className="font-bold text-sm text-black">{rev.userName}</span>
                      <div className="flex gap-0.5">{renderStars(rev.rating)}</div>
                    </div>

                    <p className="text-gray-600 text-xs leading-relaxed">{rev.comment}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    disabled={loadingId === rev.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Excluir Avaliação"
                    id={`delete-review-btn-${rev.id}`}
                  >
                    {loadingId === rev.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm">Nenhuma avaliação pendente ou enviada no momento.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
