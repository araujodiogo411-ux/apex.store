import { UserProfile, SystemSettings } from "../types";
import { Plus, Settings, LogOut, User, BarChart3, MessageSquare } from "lucide-react";

interface NavbarProps {
  user: UserProfile;
  settings: SystemSettings | null;
  onLogout: () => void;
  onOpenAddProduct: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenManageReviews: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  user,
  settings,
  onLogout,
  onOpenAddProduct,
  onOpenSettings,
  onOpenStats,
  onOpenManageReviews,
  onOpenProfile,
}: NavbarProps) {
  const isAdmin = user.role === "Administrador Oficial APEXCRAFT";

  return (
    <nav className="w-full bg-white border-b border-gray-100 py-3.5 px-6 md:px-8 sticky top-0 z-40 shadow-sm font-sans" id="apex-navbar">
      <div className="max-w-7xl mx-auto flex justify-between items-center" id="navbar-content">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3 cursor-pointer" id="navbar-brand">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xl italic leading-none">A</span>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase font-display text-neutral-900 hidden xs:inline">
            APEX
          </span>
          <img
            src="https://i.ibb.co/zVQKcfm2/APEX-4-removebg-preview.png"
            alt="APEX Logo"
            className="h-10 md:h-11 object-contain select-none ml-1 opacity-90 hover:opacity-100 transition-opacity"
            id="navbar-logo-img"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Right Side: Actions and User Profile */}
        <div className="flex items-center gap-2 md:gap-4" id="navbar-actions">
          {/* Admin specific controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 mr-1 md:mr-3 border-r border-gray-100 pr-3 md:pr-5" id="admin-controls">
              {/* Add Product Button */}
              <button
                onClick={onOpenAddProduct}
                title="Adicionar Produto"
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-full text-xs md:text-sm font-semibold hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-orange-100"
                id="admin-add-product-btn"
              >
                <Plus className="w-4.5 h-4.5" />
                <span className="hidden md:inline">Adicionar Produto</span>
              </button>

              {/* Statistics */}
              <button
                onClick={onOpenStats}
                title="Estatísticas"
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-full transition duration-200 cursor-pointer"
                id="admin-stats-btn"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              {/* Manage Reviews */}
              <button
                onClick={onOpenManageReviews}
                title="Gerenciar Avaliações"
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-full transition duration-200 cursor-pointer"
                id="admin-reviews-btn"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                title="Configurações Globais"
                className="p-2 text-gray-500 hover:text-brand hover:bg-gray-50 rounded-full transition duration-200 cursor-pointer"
                id="admin-settings-btn"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* User Profile / Info Badge */}
          <div className="flex items-center gap-3" id="user-badge-container">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-3 px-3 py-1.5 md:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100/80 rounded-full transition duration-200 text-left cursor-pointer shadow-sm hover:shadow-md"
              id="user-profile-btn"
            >
              <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-sm" id="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block" id="user-info">
                <p className="text-xs font-bold text-black leading-tight max-w-[120px] truncate">{user.name}</p>
                <p className="text-[10px] text-brand uppercase font-black tracking-tight leading-none mt-0.5">
                  {isAdmin ? "APEXCRAFT" : "Visitante"}
                </p>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sair"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition duration-200 cursor-pointer"
              id="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
