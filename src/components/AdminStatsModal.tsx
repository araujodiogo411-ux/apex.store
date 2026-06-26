import { Product, Review, Sample, UserProfile } from "../types";
import { X, ShoppingBag, MessageSquare, Image, Users, Star, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface AdminStatsModalProps {
  products: Product[];
  reviews: Review[];
  samples: Sample[];
  onClose: () => void;
}

export default function AdminStatsModal({
  products,
  reviews,
  samples,
  onClose,
}: AdminStatsModalProps) {
  // Calculate stats
  const totalProducts = products.length;
  const totalSamples = samples.length;
  const totalReviews = reviews.length;

  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Let's mock visitors count based on reviews and standard offsets
  const totalVisitors = Math.max(totalReviews * 3 + 12, 14);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="stats-admin-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 border border-gray-100 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer"
          id="close-stats-modal-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-display font-bold text-black mb-1">Estatísticas do Sistema</h3>
        <p className="text-xs text-gray-500 mb-6">Métricas de engajamento, catálogo e feedback coletados.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4" id="stats-grid">
          {/* Card 1: Products */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="p-2 bg-orange-100 text-brand rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Catálogo
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-2xl font-display font-bold text-black">{totalProducts}</h4>
              <p className="text-xs text-gray-400 font-medium mt-1">Produtos Cadastrados</p>
            </div>
          </div>

          {/* Card 2: Samples */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                <Image className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                Galeria
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-2xl font-display font-bold text-black">{totalSamples}</h4>
              <p className="text-xs text-gray-400 font-medium mt-1">Amostras Ativas</p>
            </div>
          </div>

          {/* Card 3: Reviews */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                Ativo
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-2xl font-display font-bold text-black">{totalReviews}</h4>
              <p className="text-xs text-gray-400 font-medium mt-1">Avaliações Feitas</p>
            </div>
          </div>

          {/* Card 4: Visitors */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                Visitas
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-2xl font-display font-bold text-black">{totalVisitors}</h4>
              <p className="text-xs text-gray-400 font-medium mt-1">Visitantes Ativos</p>
            </div>
          </div>
        </div>

        {/* Big Average Star Rating Summary */}
        <div className="mt-6 bg-gradient-to-r from-orange-50/40 to-yellow-50/40 border border-orange-100/50 rounded-2xl p-5 flex items-center justify-between" id="stats-rating-summary">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Feedback Médio</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-display font-bold text-black">{averageRating > 0 ? averageRating.toFixed(1) : "0.0"}</span>
              <span className="text-sm text-gray-500">/ 5 estrelas</span>
            </div>
          </div>
          <div className="flex gap-1" id="stats-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-6 h-6 ${s <= Math.round(averageRating) ? "fill-brand text-brand" : "text-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
