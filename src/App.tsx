import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { UserProfile, Product, Review, Sample, SystemSettings } from "./types";
import { seedDatabaseIfNeeded } from "./dbSeed";

import Navbar from "./components/Navbar";
import AuthScreen from "./components/AuthScreen";
import ProductCard from "./components/ProductCard";
import ProductDetailsModal from "./components/ProductDetailsModal";
import AdminAddProductModal from "./components/AdminAddProductModal";
import AdminSettingsModal from "./components/AdminSettingsModal";
import AdminStatsModal from "./components/AdminStatsModal";
import AdminReviewsManagementModal from "./components/AdminReviewsManagementModal";
import UserEditProfileModal from "./components/UserEditProfileModal";
import SamplesSection from "./components/SamplesSection";

import { Search, Sparkles, ShoppingBag, Mail, Phone, Heart, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("apex_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal Triggers
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isManageReviewsOpen, setIsManageReviewsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. Initial Seeding and live subscriptions
  useEffect(() => {
    // Seed initial data if DB is completely fresh
    seedDatabaseIfNeeded();

    // Subscribe to live products
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push(doc.data() as Product);
      });
      // Sort newest first
      prods.sort((a, b) => b.createdAt - a.createdAt);
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    // Subscribe to live reviews
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push(doc.data() as Review);
      });
      setReviews(revs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "reviews");
    });

    // Subscribe to live samples
    const unsubSamples = onSnapshot(collection(db, "samples"), (snapshot) => {
      const samps: Sample[] = [];
      snapshot.forEach((doc) => {
        samps.push(doc.data() as Sample);
      });
      samps.sort((a, b) => b.createdAt - a.createdAt);
      setSamples(samps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "samples");
    });

    // Subscribe to global settings
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SystemSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/global");
    });

    // Firebase Auth State listener
    let unsubUserProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserProfile) {
        unsubUserProfile();
        unsubUserProfile = null;
      }
      if (firebaseUser) {
        // If logged in via standard Firebase but no local profile, listen for user profiles
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubUserProfile = onSnapshot(userRef, (profileSnap) => {
          if (profileSnap.exists()) {
            const profileData = profileSnap.data() as UserProfile;
            setUser(profileData);
            localStorage.setItem("apex_user", JSON.stringify(profileData));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        // Only clear if not mock admin session
        const saved = localStorage.getItem("apex_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.uid !== "admin-apex-uid") {
            setUser(null);
            localStorage.removeItem("apex_user");
          }
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      unsubProducts();
      unsubReviews();
      unsubSamples();
      unsubSettings();
      unsubAuth();
      if (unsubUserProfile) {
        unsubUserProfile();
      }
    };
  }, []);

  // 2. Auth handlers
  const handleAuthSuccess = (profile: UserProfile | null) => {
    setUser(profile);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error signing out from firebase:", e);
    }
    setUser(null);
    localStorage.removeItem("apex_user");
    setSelectedProduct(null);
  };

  // 3. Product handlers (Admin)
  const handleSaveProduct = async (productData: Omit<Product, "id" | "createdAt"> & { id?: string }) => {
    const isEditing = !!productData.id;
    const docId = isEditing ? productData.id! : doc(collection(db, "products")).id;

    const finalProduct: Product = {
      id: docId,
      name: productData.name,
      description: productData.description,
      images: productData.images,
      videos: productData.videos || [],
      category: productData.category,
      price: productData.price,
      createdAt: isEditing ? (products.find((p) => p.id === docId)?.createdAt || Date.now()) : Date.now(),
    };

    try {
      await setDoc(doc(db, "products", docId), finalProduct);
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, `products/${docId}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      // Also delete product's reviews
      const productReviews = reviews.filter((r) => r.productId === id);
      for (const rev of productReviews) {
        await deleteDoc(doc(db, "reviews", rev.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
  };

  // 4. Review handlers
  const handleAddReview = async (rating: number, comment: string) => {
    if (!user || !selectedProduct) return;

    const reviewId = doc(collection(db, "reviews")).id;
    const newReview: Review = {
      id: reviewId,
      productId: selectedProduct.id,
      userId: user.uid,
      userName: user.name,
      rating,
      comment,
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "reviews", reviewId), newReview);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
    }
  };

  // 5. Sample handlers (Admin)
  const handleAddSample = async (url: string) => {
    const docId = doc(collection(db, "samples")).id;
    const newSample: Sample = {
      id: docId,
      imageUrl: url,
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db, "samples", docId), newSample);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `samples/${docId}`);
    }
  };

  const handleUpdateSample = async (id: string, url: string) => {
    try {
      await updateDoc(doc(db, "samples", id), { imageUrl: url });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `samples/${id}`);
    }
  };

  const handleDeleteSample = async (id: string) => {
    try {
      await deleteDoc(doc(db, "samples", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `samples/${id}`);
    }
  };

  // 6. Settings handler (Admin)
  const handleSaveSettings = async (newSettings: SystemSettings) => {
    try {
      await setDoc(doc(db, "settings", "global"), newSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings/global");
    }
    setSettings(newSettings);
  };

  // 7. Profile handler (Visitor)
  const handleProfileUpdated = (updated: UserProfile) => {
    setUser(updated);
  };

  // 8. Filters computation
  const categories = ["Todos", "Identidade Visual", "Logomarca", "Sites", "Designs", "Premium"];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "Todos" || prod.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate rating summary for cards
  const getProductRatingStats = (productId: string) => {
    const prodReviews = reviews.filter((r) => r.productId === productId);
    const count = prodReviews.length;
    const avg = count > 0 ? prodReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    return { count, avg };
  };

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const isAdmin = user.role === "Administrador Oficial APEXCRAFT";

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-between" id="app-viewport">
      {/* Navbar wrapper */}
      <Navbar
        user={user}
        settings={settings}
        onLogout={handleLogout}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsAddProductOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenManageReviews={() => setIsManageReviewsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16" id="app-main-content">
        {/* Hero Section */}
        <div className="bg-neutral-50 border-b border-gray-100 py-12 px-4 md:px-8 text-center" id="hero-banner">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <span className="text-xs font-bold text-brand tracking-widest uppercase mb-2 inline-flex items-center gap-1">
              <Sparkles className="w-4.5 h-4.5 text-brand" />
              Bem-vindo ao Elite Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-black tracking-tight uppercase leading-none">
              APEX PREMIUM STORE
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-4 leading-relaxed max-w-xl">
              Descubra mídias e curadorias de altíssimo nível, avalie designs e encomende amostras exclusivas diretamente com nossos consultores oficiais.
            </p>
          </div>
        </div>

        {/* Categories Bar & Search */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8" id="filters-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6" id="filters-row">
            {/* Search Input */}
            <div className="relative max-w-md w-full" id="search-input-box">
              <input
                type="text"
                placeholder="Pesquise por tênis, smartwatch, mochilas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm transition shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {/* Pill Selectors */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none" id="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-brand text-white shadow-md shadow-orange-100 font-bold"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-16" id="products-section">
          <div className="flex items-center justify-between mb-8" id="products-header">
            <div>
              <h2 className="text-2xl font-display font-bold text-black tracking-tight uppercase">Catálogo APEX ({filteredProducts.length})</h2>
              <p className="text-xs text-gray-400 mt-0.5">Produtos disponíveis para encomenda imediata</p>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="products-grid">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod) => {
                  const stats = getProductRatingStats(prod.id);
                  return (
                    <motion.div
                      key={prod.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <ProductCard
                        product={prod}
                        isAdmin={isAdmin}
                        settings={settings}
                        reviewsCount={stats.count}
                        averageRating={stats.avg}
                        onClick={(p) => setSelectedProduct(p)}
                        onEdit={(p) => {
                          setEditingProduct(p);
                          setIsAddProductOpen(true);
                        }}
                        onDelete={handleDeleteProduct}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 border border-gray-100 rounded-3xl max-w-md mx-auto flex flex-col items-center" id="empty-products">
              <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="font-display font-semibold text-black">Nenhum produto encontrado</h3>
              <p className="text-xs text-gray-400 mt-1">Experimente mudar o termo de pesquisa ou a categoria.</p>
            </div>
          )}
        </section>

        {/* Amostras / Carousel & Gallery Section */}
        <SamplesSection
          samples={samples}
          isAdmin={isAdmin}
          settings={settings}
          onAddSample={handleAddSample}
          onDeleteSample={handleDeleteSample}
          onUpdateSample={handleUpdateSample}
        />
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-neutral-900 text-neutral-400 py-12 px-4 md:px-8 border-t border-neutral-800 font-sans" id="apex-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" id="footer-content">
          {/* Logo & Slogan */}
          <div className="flex flex-col items-start" id="footer-branding">
            <img
              src="https://i.ibb.co/zVQKcfm2/APEX-4-removebg-preview.png"
              alt="APEX Logo Light"
              className="h-12 object-contain select-none mb-4 brightness-0 invert"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              APEX Store - Curadoria, design e amostras de alta performance criados para inspirar elegância e sofisticação cotidianas.
            </p>
          </div>

          {/* Quick Channels */}
          <div id="footer-contacts">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Central de Encomendas</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand shrink-0" />
                <span>WhatsApp: {settings?.whatsapp || "+55 85 9773-5167"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <span>E-mail: {settings?.email || "contato@apexstore.com"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand shrink-0" />
                <span>Instagram: {settings?.instagram || "@apex"}</span>
              </li>
            </ul>
          </div>

          {/* Copyright details */}
          <div className="flex flex-col justify-between items-start md:items-end" id="footer-copyright">
            <div className="text-left md:text-right">
              <span className="bg-neutral-800 text-brand text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                OFICIAL APEX STORE
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-6 md:mt-0">
              © {new Date().getFullYear()} APEX. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ALL MODAL CONTEXTS */}
      <AnimatePresence>
        {/* Product Details Modal */}
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            user={user}
            settings={settings}
            reviews={reviews.filter((r) => r.productId === selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
            onAddReview={handleAddReview}
          />
        )}

        {/* Add/Edit Product Modal */}
        {isAddProductOpen && (
          <AdminAddProductModal
            editingProduct={editingProduct}
            onClose={() => {
              setIsAddProductOpen(false);
              setEditingProduct(null);
            }}
            onSave={handleSaveProduct}
          />
        )}

        {/* Global Settings Modal */}
        {isSettingsOpen && (
          <AdminSettingsModal
            currentSettings={settings}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
          />
        )}

        {/* Statistics Modal */}
        {isStatsOpen && (
          <AdminStatsModal
            products={products}
            reviews={reviews}
            samples={samples}
            onClose={() => setIsStatsOpen(false)}
          />
        )}

        {/* Manage Reviews Modal */}
        {isManageReviewsOpen && (
          <AdminReviewsManagementModal
            reviews={reviews}
            products={products}
            onClose={() => setIsManageReviewsOpen(false)}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {/* Edit Profile Modal */}
        {isProfileOpen && (
          <UserEditProfileModal
            user={user}
            onClose={() => setIsProfileOpen(false)}
            onProfileUpdated={handleProfileUpdated}
            onAccountDeleted={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
