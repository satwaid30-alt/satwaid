"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductCard from "../../../components/ProductCard";
import {
  MapPin,
  Star,
  Store,
  Calendar,
  MessageCircle,
  Share2,
  Info,
  ChevronLeft,
} from "lucide-react";
import ActionModal from "../../../components/ActionModal";
import ChatModal from "../../../components/ChatModal";
import Link from "next/link";
import { copyToClipboard } from "../../utils/clipboard";
import { getApiUrl, getLogoUrl, getImageUrl } from "@/app/utils/api";

const CATEGORIES = [
  { id: "Semua", name: "Semua Kategori" },
  { id: "Reptil", name: "Reptil" },
  { id: "Mamalia", name: "Mamalia" },
  { id: "Burung", name: "Burung" },
  { id: "Ikan", name: "Ikan" },
  { id: "Amfibi", name: "Amfibi" },
  { id: "Serangga", name: "Serangga" },
  { id: "Invertebrata Lainnya", name: "Invertebrata Lainnya" },
  { id: "Unggas", name: "Unggas" },
  { id: "Hewan Lainnya", name: "Hewan Lainnya" },
  { id: "Pakan Hewan", name: "Pakan Hewan" },
  { id: "Perlengkapan & Aksesoris", name: "Perlengkapan & Aksesoris" },
];

export default function DetailTokoPage() {
  const params = useParams();
  const id = params.id;

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsPerPage = 5;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Filter products based on selectedCategory
  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "Semua") return true;
    return product.species?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Reset page to 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Calculate pagination values based on filteredProducts
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Modal States
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "",
    isLoading: false,
  });

  const [chatConfig, setChatConfig] = useState({
    isOpen: false,
    sellerId: null,
    buyerId: null,
    sellerName: "",
    buyerName: "",
    productId: null,
  });

  useEffect(() => {
    // Load current user
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    if (id) {
      fetchShopDetails();
      fetchShopReviews();
    }
  }, [id]);

  const maskName = (name) => {
    if (!name) return "Pembeli Anonim";
    const parts = name.trim().split(/\s+/);
    return parts
      .map((part) => {
        if (part.length <= 2) {
          return part[0] + "*".repeat(part.length - 1);
        }
        return part[0] + "*".repeat(part.length - 2) + part[part.length - 1];
      })
      .join(" ");
  };

  const renderStars = (rating, size = 14) => {
    const stars = [];
    const r = Math.round(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          className={i <= r ? "text-amber-500 fill-amber-500" : "text-zinc-200"}
        />,
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const fetchShopReviews = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/orders/shop/${id}`,
      );
      const result = await response.json();
      if (response.ok && result.data) {
        // Filter only orders that have a rating or a review
        const filtered = result.data.filter(
          (order) => order.rating !== null || order.review,
        );
        setReviews(filtered);
      }
    } catch (err) {
      console.error("Error fetching shop reviews:", err);
    }
  };

  const fetchShopDetails = async () => {
    try {
      // Fetch shop info
      const shopRes = await fetch(
        `${getApiUrl()}/shops/${id}`,
      );
      const shopData = await shopRes.json();

      if (shopRes.ok) {
        setShop(shopData.data);

        // Fetch products for this shop
        const productsRes = await fetch(
          `${getApiUrl()}/listings/shop/${id}`,
        );
        const productsData = await productsRes.json();
        if (productsRes.ok) {
          setProducts(productsData.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching shop details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSeller = () => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    if (shop.user_id === currentUser.id) {
      setActionModal({
        isOpen: true,
        type: "info",
        title: "Info",
        message: "Ini adalah toko Anda sendiri.",
        onConfirm: null,
      });
      return;
    }

    setChatConfig({
      isOpen: true,
      sellerId: shop.user_id,
      buyerId: currentUser.id,
      sellerName: shop.name || "Seller",
      buyerName: currentUser.name || currentUser.username,
      productId: null, // No specific product when chatting from profile
    });
  };

  const handleShare = async () => {
    const url = window.location.href;

    // Try Web Share API first (mostly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop?.name || "Toko",
          text: `Lihat toko ${shop?.name || ""} di REPTILEHAVEN!`,
          url: url,
        });
        return;
      } catch (err) {
        // If it's an AbortError, the user just closed the share sheet
        if (err.name === "AbortError") return;
        console.error("Error sharing:", err);
        // Fallback to clipboard if share fails
      }
    }

    // Fallback to clipboard
    const success = await copyToClipboard(url);

    if (success) {
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Link Berhasil Disalin",
        message: "Tautan profil toko telah disalin ke clipboard Anda.",
        onConfirm: null,
      });
    } else {
      setActionModal({
        isOpen: true,
        type: "info",
        title: "Gagal Menyalin Otomatis",
        message: "Silakan salin link di browser Anda secara manual.",
        onConfirm: null,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
        <Store size={64} className="text-zinc-300 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900">
          Toko tidak ditemukan
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100">
      <Navbar theme="light" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        {/* Shop Profile Header - Premium Redesign */}
        <div className="relative mb-16">
          {/* Banner Section */}
          <div className="h-40 sm:h-72 rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            {/* Decorative Elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
          </div>

          {/* Shop Info Container */}
          <div className="max-w-6xl mx-auto px-2 sm:px-12 -mt-16 sm:-mt-24 relative z-10">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-12 border border-white/50 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
              {/* Shop Logo Overlay */}
              <div className="relative group/logo">
                <div className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] blur-xl opacity-40 group-hover/logo:opacity-60 transition-opacity"></div>
                <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-3xl sm:rounded-[2.5rem] bg-white p-1 relative overflow-hidden ring-2 sm:ring-4 ring-white">
                  <div className="w-full h-full rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden bg-zinc-50 border border-zinc-100">
                    {shop.logo_url ? (
                      <img
                        src={getLogoUrl(shop.logo_url)}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <Store
                          size={40}
                          className="sm:w-[64px] sm:h-[64px]"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {shop.status === "Verified" && (
                  <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1.5 sm:p-2 rounded-2xl ring-2 sm:ring-4 ring-white animate-bounce-subtle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.597 9.181-6.5 11.5a11.954 11.954 0 01-11.5-11.5c0-.68.056-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4 w-full">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2">
                    <h1 className="text-xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                      {shop.name}
                    </h1>
                    <span className="inline-flex px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-600 text-[8px] sm:text-xs font-black uppercase rounded-lg tracking-widest border border-emerald-100">
                      Official Store
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 mt-2 sm:mt-3">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] sm:text-sm font-medium">
                      <div className="p-1 sm:p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                        <MapPin size={12} className="sm:w-[14px] sm:h-[14px]" />
                      </div>
                      {shop.city || "Lokasi tidak diset"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="flex items-center gap-1.5 text-zinc-500 text-[10px] sm:text-sm font-bold hover:text-emerald-600 transition-colors text-left"
                    >
                      <div className="p-1 sm:p-1.5 bg-amber-50 rounded-lg text-amber-500">
                        <Star
                          size={12}
                          className="fill-amber-500 sm:w-[14px] sm:h-[14px]"
                        />
                      </div>
                      {shop.avgRating || "0.0"}{" "}
                      <span className="text-zinc-300 font-medium">
                        Rating Toko
                      </span>
                      {reviews.length > 0 && (
                        <span className="text-[8px] sm:text-xs text-zinc-400 font-medium ml-0.5 sm:ml-1">
                          ({reviews.length} Penilaian)
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats Bar - Premium Responsive Cards */}
                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap justify-center md:justify-start sm:gap-6 pt-1 sm:pt-2 w-full max-w-md sm:max-w-none mx-auto">
                  <div className="text-center md:text-left bg-zinc-50 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-zinc-100/40 sm:border-0">
                    <p className="text-xs sm:text-xl font-black text-zinc-900">
                      {products.length}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                      Produk
                    </p>
                  </div>
                  <div className="text-center md:text-left bg-zinc-50 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-zinc-100/40 sm:border-0">
                    <p className="text-xs sm:text-xl font-black text-zinc-900">
                      {shop.totalSales || 0}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                      Terjual
                    </p>
                  </div>
                  <div className="text-center md:text-left bg-zinc-50 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-zinc-100/40 sm:border-0 min-w-0">
                    <p className="text-xs sm:text-xl font-black text-zinc-900 truncate px-1">
                      {new Date(shop.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                      Gabung
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col gap-3 w-full sm:w-auto md:self-center">
                {shop.whatsapp && (
                  <a
                    href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}?text=Halo ${shop.name}, saya tertarik dengan produk Anda di REPTILEHAVEN.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-56 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-6 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-base transition-all active:scale-95 group"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 h-5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.448.265c1.485.881 3.192 1.347 4.933 1.348 5.456 0 9.897-4.44 9.899-9.898.001-2.646-1.03-5.133-2.903-7.006-1.874-1.874-4.359-2.907-7.004-2.907-5.457 0-9.898 4.44-9.9 9.898-.001 2.107.549 4.159 1.59 5.968l.301.517-1.103 4.029 4.125-1.082zM17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.677.15-.2.299-.777.979-.951 1.178-.174.2-.349.226-.65.075-.301-.15-1.272-.469-2.422-1.494-.894-.797-1.498-1.783-1.674-2.083-.176-.3-.019-.462.132-.611.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.1-.2.05-.375-.025-.525-.075-.15-.677-1.633-.927-2.235-.243-.587-.491-.507-.677-.517-.175-.008-.376-.01-.577-.01s-.526.075-.802.375c-.276.3-1.052 1.026-1.052 2.503s1.077 2.903 1.227 3.103c.15.2 2.119 3.235 5.132 4.532.716.308 1.276.492 1.711.631.719.228 1.373.196 1.89.119.576-.086 1.78-.727 2.031-1.428.25-.701.25-1.302.175-1.428-.075-.126-.276-.226-.577-.376z" />
                    </svg>
                    Chat WhatsApp
                  </a>
                )}
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/20 text-zinc-600 hover:text-emerald-600 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all active:scale-95"
                  >
                    <Star size={14} className="text-amber-500 fill-amber-500" />{" "}
                    Ulasan ({reviews.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/20 text-zinc-600 hover:text-emerald-600 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all active:scale-95"
                  >
                    <Share2 size={14} /> Bagikan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section Grid */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/60 pb-6 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3 justify-center sm:justify-start">
                Semua Produk
                <span className="inline-flex items-center px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-black rounded-xl tracking-wider">
                  {filteredProducts.length} Item
                </span>
              </h2>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1 text-center sm:text-left">
                Jelajahi berbagai koleksi satwa dan perlengkapan dari toko ini.
              </p>
            </div>

            {/* Species Category Filter Select */}
            <div className="relative w-full md:w-72 group shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-3.5 pl-5 pr-10 rounded-2xl appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer text-xs sm:text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400 group-hover:text-emerald-500 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-12">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 px-4 py-8 sm:px-6 mt-12 gap-4">
                  {/* Mobile/Small Screens Pagination Info */}
                  <div className="sm:hidden text-center">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Halaman{" "}
                      <span className="text-emerald-600">{currentPage}</span>{" "}
                      dari {totalPages}
                    </p>
                  </div>

                  <div className="flex w-full justify-between items-center sm:hidden">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="w-[48%] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="w-[48%] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                      <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>

                  {/* Desktop Pagination Info */}
                  <div className="hidden sm:block">
                    <p className="text-sm text-zinc-500 font-medium">
                      Showing{" "}
                      <span className="font-black text-zinc-900">
                        {indexOfFirstItem + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-black text-zinc-900">
                        {Math.min(indexOfLastItem, totalItems)}
                      </span>{" "}
                      of{" "}
                      <span className="font-black text-zinc-900">
                        {totalItems}
                      </span>{" "}
                      results
                    </p>
                  </div>

                  {/* Desktop Page Numbers */}
                  <div className="hidden sm:block">
                    <nav
                      className="isolate inline-flex gap-1 rounded-xl"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft size={20} />
                      </button>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center rounded-xl px-4 py-2 text-sm font-black transition-all ${
                                currentPage === pageNum
                                  ? "z-10 bg-emerald-500 text-white scale-110"
                                  : "text-zinc-500 hover:bg-zinc-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === currentPage - 2 && pageNum > 1) ||
                          (pageNum === currentPage + 2 && pageNum < totalPages)
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-zinc-400"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronLeft size={20} className="rotate-180" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center border border-zinc-100">
              <Store size={48} className="text-zinc-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900">
                Belum ada produk
              </h3>
              <p className="text-zinc-500 mt-1">
                Tidak ada produk aktif dalam kategori ini.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Global Modals */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={actionModal.onConfirm}
        type={actionModal.type}
        title={actionModal.title}
        message={actionModal.message}
        confirmText={actionModal.confirmText}
        isLoading={actionModal.isLoading}
      />

      <ChatModal
        isOpen={chatConfig.isOpen}
        onClose={() => setChatConfig((prev) => ({ ...prev, isOpen: false }))}
        sellerId={chatConfig.sellerId}
        buyerId={chatConfig.buyerId}
        sellerName={chatConfig.sellerName}
        buyerName={chatConfig.buyerName}
        productId={chatConfig.productId}
      />

      {/* Ulasan & Komentar Pembeli Modal */}
      {isReviewModalOpen &&
        (() => {
          const indexOfLastModalReview = reviewPage * reviewsPerPage;
          const indexOfFirstModalReview =
            indexOfLastModalReview - reviewsPerPage;
          const currentModalReviews = reviews.slice(
            indexOfFirstModalReview,
            indexOfLastModalReview,
          );
          const totalReviewPages = Math.ceil(reviews.length / reviewsPerPage);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300"
                onClick={() => setIsReviewModalOpen(false)}
              ></div>

              {/* Modal Content */}
              <div className="bg-white rounded-[2.5rem] border border-zinc-100 w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-zinc-100 flex items-center justify-between shrink-0">
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2">
                      <Star
                        className="text-amber-500 fill-amber-500"
                        size={20}
                      />{" "}
                      Ulasan & Rating Toko
                    </h3>
                    <p className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      Hasil transaksi sukses dari pembeli terverifikasi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Store Statistics in Modal */}
                <div className="bg-zinc-50/50 px-6 py-4 sm:px-8 border-b border-zinc-100 flex items-center gap-4 shrink-0">
                  <div className="text-center border-r border-zinc-200 pr-5">
                    <p className="text-3xl font-black text-zinc-900 leading-none">
                      {shop.avgRating || "0.0"}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-wider mt-1.5">
                      Skor Toko
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {renderStars(parseFloat(shop.avgRating || 0), 16)}
                    </div>
                    <p className="text-[11px] text-zinc-500 font-bold tracking-tight">
                      {reviews.length} Ulasan Terverifikasi
                    </p>
                  </div>
                </div>

                {/* Body / Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-4">
                  {currentModalReviews.length > 0 ? (
                    currentModalReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white border border-zinc-100 hover:border-zinc-200 p-5 rounded-2xl space-y-3.5 transition-all group text-left"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm shrink-0 uppercase">
                              {(
                                rev.user?.name ||
                                rev.user?.username ||
                                "B"
                              ).substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-zinc-900 truncate leading-none mb-1">
                                {maskName(rev.user?.name || rev.user?.username)}
                              </h4>
                              <p className="text-[9px] text-zinc-400 font-bold">
                                {new Date(
                                  rev.created_at || rev.updated_at,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="bg-zinc-50 px-2.5 py-1.5 rounded-xl border border-zinc-100/60 shrink-0">
                            {renderStars(rev.rating, 12)}
                          </div>
                        </div>

                        <div className="bg-zinc-50/50 border border-zinc-100/60 p-3.5 rounded-xl text-xs text-zinc-600 font-medium leading-relaxed italic break-words">
                          &ldquo;
                          {rev.review ||
                            "Pembeli memberikan rating bintang 5 otomatis tanpa komentar tertulis."}
                          &rdquo;
                        </div>

                        {rev.product && (
                          <div className="pt-3 border-t border-zinc-100/80 flex items-center gap-3 bg-zinc-50/30 p-2.5 rounded-xl border border-zinc-100 mt-2 shrink-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                              <img
                                src={getImageUrl(rev.product.images)}
                                alt={rev.product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                Membeli Produk
                              </p>
                              <p className="text-[10px] sm:text-xs font-black text-zinc-700 truncate leading-tight group-hover:text-emerald-600 transition-colors">
                                {rev.product.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 mx-auto">
                        <Star size={28} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-zinc-950 uppercase tracking-wider">
                          Belum Ada Ulasan
                        </h3>
                        <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                          Toko ini belum memiliki ulasan dari pembeli.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer / Pagination */}
                {totalReviewPages > 1 && (
                  <div className="px-6 py-4 sm:px-8 border-t border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {reviewPage} / {totalReviewPages} Halaman
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setReviewPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={reviewPage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                          reviewPage === 1
                            ? "border-zinc-100 bg-white text-zinc-300 cursor-not-allowed"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewPage((prev) =>
                            Math.min(prev + 1, totalReviewPages),
                          )
                        }
                        disabled={reviewPage === totalReviewPages}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                          reviewPage === totalReviewPages
                            ? "border-zinc-100 bg-white text-zinc-300 cursor-not-allowed"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
