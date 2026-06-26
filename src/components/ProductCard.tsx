import React, { useState } from "react";
import { Product, SystemSettings } from "../types";
import { MessageCircle, Instagram, Mail, Edit2, Trash2, Star, Play, Video } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  settings: SystemSettings | null;
  reviewsCount: number;
  averageRating: number;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onClick: (product: Product) => void;
}

export default function ProductCard({
  product,
  isAdmin,
  settings,
  reviewsCount,
  averageRating,
  onEdit,
  onDelete,
  onClick,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Helper to render star rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.3 && rating % 1 <= 0.7;
    const isCloseToNext = rating % 1 > 0.7;

    const totalFullStars = isCloseToNext ? fullStars + 1 : fullStars;

    for (let i = 1; i <= 5; i++) {
      if (i <= totalFullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-brand text-brand" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-200" />);
      }
    }
    return stars;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!settings || !settings.whatsapp) return;
    const whatsappNum = settings.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá! Tenho interesse no produto *${product.name}* (${product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte Preço"}).\nPoderia me passar mais detalhes?`);
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, "_blank");
  };

  const handleInstagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!settings || !settings.instagram) return;
    window.open(settings.instagram, "_blank");
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!settings || !settings.email) return;
    const subject = encodeURIComponent(`Interesse no produto APEX: ${product.name}`);
    const body = encodeURIComponent(`Olá!\nGostaria de mais informações sobre o produto ${product.name}.\nLink do produto: ${window.location.href}`);
    window.open(`mailto:${settings.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const primaryImage = product.images[0] || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80";
  const hasVideo = product.videos && product.videos.length > 0 && product.videos[0];

  return (
    <div
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full cursor-pointer relative"
      id={`product-card-${product.id}`}
    >
      {/* Image / Video Media Box */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden" id={`product-media-${product.id}`}>
        {hasVideo && isHovered ? (
          <video
            src={product.videos[0]}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Category Tag */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
          {product.category}
        </span>

        {/* Video Indicator Tag */}
        {hasVideo && !isHovered && (
          <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            <span>Vídeo</span>
          </span>
        )}

        {/* Admin floating controls */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex gap-1" id={`product-admin-${product.id}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="p-2 bg-white hover:bg-gray-100 text-gray-700 hover:text-black rounded-xl transition shadow shadow-black/10 cursor-pointer"
              title="Editar Produto"
              id={`product-edit-${product.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Deseja realmente excluir o produto "${product.name}"?`)) {
                  onDelete(product.id);
                }
              }}
              className="p-2 bg-white hover:bg-red-50 text-red-500 rounded-xl transition shadow shadow-black/10 cursor-pointer"
              title="Excluir Produto"
              id={`product-delete-${product.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content details */}
      <div className="p-5 flex-1 flex flex-col justify-between" id={`product-content-${product.id}`}>
        <div>
          {/* Rating overview */}
          <div className="flex items-center gap-1 mb-2" id="product-rating-row">
            <div className="flex gap-0.5">{renderStars(averageRating)}</div>
            <span className="text-xs font-semibold text-gray-800 ml-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "Novo"}
            </span>
            {reviewsCount > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                ({reviewsCount})
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-black text-lg group-hover:text-brand transition-colors duration-200 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50" id="product-footer">
          {/* Pricing */}
          <div className="flex items-baseline justify-between mb-4" id="product-price-row">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Valor</span>
            <span className="text-xl font-display font-bold text-black">
              {product.price ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sob Consulta"}
            </span>
          </div>

          {/* Social Contact actions */}
          <div className="grid grid-cols-3 gap-1.5" id="product-contact-grid">
            <button
              onClick={handleWhatsApp}
              disabled={!settings?.whatsapp}
              className="py-2 px-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer border border-green-100/50 disabled:opacity-50"
              title="Chamar no WhatsApp"
              id={`prod-whatsapp-${product.id}`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Whats</span>
            </button>

            <button
              onClick={handleInstagram}
              disabled={!settings?.instagram}
              className="py-2 px-2.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer border border-pink-100/50 disabled:opacity-50"
              title="Acessar Instagram"
              id={`prod-instagram-${product.id}`}
            >
              <Instagram className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Insta</span>
            </button>

            <button
              onClick={handleEmail}
              disabled={!settings?.email}
              className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer border border-blue-100/50 disabled:opacity-50"
              title="Enviar E-mail"
              id={`prod-email-${product.id}`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
