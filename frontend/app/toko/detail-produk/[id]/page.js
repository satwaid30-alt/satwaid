"use client";

import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, AlertCircle, MapPin, XCircle, Info, Store, ShoppingBag, Star, Truck, Plus, Minus, ShoppingCart, CheckCircle2, ArrowRight, MessageCircle, Share2, Tag, Package, Edit3, Save, Globe, VenusAndMars, Clock } from "lucide-react";
import Link from "next/link";
import ActionModal from "../../../../components/ActionModal";
import ChatModal from "../../../../components/ChatModal";
import { copyToClipboard } from "../../../utils/clipboard";
import { getApiUrl, getLogoUrl, getSocketUrl } from "@/app/utils/api";
import { io } from "socket.io-client";

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".3gp")
  );
};

function DetailContent() {
  const params = useParams();
  const productId = params.id;

  const getParsedImages = (imagesData) => {
    if (!imagesData) return [];

    let rawImages = [];
    try {
      if (typeof imagesData === "string") {
        if (imagesData.startsWith("[") || imagesData.startsWith("{")) {
          rawImages = JSON.parse(imagesData);
        } else {
          rawImages = [imagesData];
        }
      } else if (Array.isArray(imagesData)) {
        rawImages = imagesData;
      } else {
        rawImages = [imagesData];
      }
    } catch (e) {
      console.error("Error parsing imagesData:", e);
      return [];
    }

    const arr = Array.isArray(rawImages) ? rawImages : [rawImages];
    return arr
      .filter((img) => img && typeof img === "string")
      .map((img) => {
        if (img.startsWith("http") || img.startsWith("data:")) {
          return img;
        }
        const baseUrl = getApiUrl();
        const path = img.startsWith("/") ? img : `/${img}`;
        return `${baseUrl}${path}`;
      });
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const parsedImages = getParsedImages(selectedProduct?.images);

  // Action Modal State
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
    // Load current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    if (productId) {
      fetchProductDetail(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    // Socket.IO Setup
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const socket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });

    console.log("[Detail Socket] Connecting for product:", productId);

    socket.on("connect", () => {
      console.log("[Detail Socket] Connected:", socket.id);
    });

    // Listen to real-time stock updates
    socket.on("listing_stock_updated", (data) => {
      console.log("[Detail Socket] listing_stock_updated received:", data);
      if (String(data.listing_id) === String(productId)) {
        setSelectedProduct((prev) => {
          if (!prev) return prev;
          return { ...prev, stock: data.stock };
        });
      }
    });

    // Listen to listing status updates (like when status becomes 'sold' or edited)
    socket.on("listing_status_updated", (data) => {
      console.log("[Detail Socket] listing_status_updated received:", data);
      const dataId = data.id || data.listing_id;
      if (String(dataId) === String(productId)) {
        setSelectedProduct((prev) => {
          if (!prev) return prev;
          if (data.listing) {
            return {
              ...prev,
              stock: data.listing.stock !== undefined ? data.listing.stock : prev.stock,
              status: data.listing.status || prev.status,
            };
          }
          return { ...prev, status: data.status || prev.status };
        });
      }
    });

    return () => {
      console.log("[Detail Socket] Disconnecting...");
      socket.disconnect();
    };
  }, [productId]);

  const fetchProductDetail = async (id) => {
    try {
      const response = await fetch(`${getApiUrl()}/listings/${id}`);
      const result = await response.json();
      if (response.ok) {
        setSelectedProduct(result.data);
      }
    } catch (err) {
      console.error("Error fetching product detail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    // Validation Check: Profile completeness
    try {
      const response = await fetch(`${getApiUrl()}/users/${currentUser.id}`);
      if (response.ok) {
        const result = await response.json();
        const freshUser = result.data;
        localStorage.setItem("user", JSON.stringify(freshUser));

        const isFieldFilled = (val) => {
          if (val === undefined || val === null) return false;
          const str = String(val).trim();
          return str !== "" && str.toLowerCase() !== "null" && str.toLowerCase() !== "undefined";
        };

        const isIncomplete = !isFieldFilled(freshUser.name) || 
                             !isFieldFilled(freshUser.phone) || 
                             !isFieldFilled(freshUser.address) || 
                             !isFieldFilled(freshUser.city) || 
                             !isFieldFilled(freshUser.province);

        if (isIncomplete) {
          setActionModal({
            isOpen: true,
            type: "danger",
            title: "Profil Belum Lengkap",
            message: "Anda wajib melengkapi data profil terlebih dahulu (Nama, No. WhatsApp, Alamat, Kota, Provinsi) di halaman pengaturan sebelum dapat melakukan pembelian.",
            confirmText: "Lengkapi Profil",
            cancelText: "Batal",
            onConfirm: () => {
              window.location.href = "/user/pengaturan";
            },
          });
          return;
        }
      }
    } catch (err) {
      console.error("Error verifying profile completeness:", err);
    }

    setActionModal({
      isOpen: true,
      type: "checkout",
      title: "Konfirmasi Pembelian",
      message: `Apakah Anda yakin ingin membeli langsung ${selectedProduct.name} sebanyak ${buyQuantity} ekor? (Pilih YA berarti Anda setuju untuk membelinya)`,
      confirmText: "Ya, Beli Sekarang",
      cancelText: "Batal",
      onConfirm: executePurchase,
    });
  };
  const executePurchase = async () => {
    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          listing_id: selectedProduct.id,
          quantity: buyQuantity,
        }),
      });
      if (response.ok) {
        // Tampilkan sukses dulu sebentar sebelum redirect
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Pesanan Berhasil!",
          message: "Pesanan Anda telah dibuat. Silakan lengkapi data pengiriman untuk melanjutkan.",
          onConfirm: () => {
            window.location.href = "/user/pesanan?tab=pending_shipping_info";
          },
          confirmText: "Lengkapi Data Sekarang",
        });
      } else {
        const data = await response.json();
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Gagal Memesan",
          message: data.message || "Terjadi kesalahan saat memproses pesanan Anda.",
          onConfirm: null,
        });
      }
    } catch (err) {
      console.error("Buy error:", err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
        onConfirm: null,
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    // Validation Check: Profile completeness
    try {
      const response = await fetch(`${getApiUrl()}/users/${currentUser.id}`);
      if (response.ok) {
        const result = await response.json();
        const freshUser = result.data;
        localStorage.setItem("user", JSON.stringify(freshUser));

        const isFieldFilled = (val) => {
          if (val === undefined || val === null) return false;
          const str = String(val).trim();
          return str !== "" && str.toLowerCase() !== "null" && str.toLowerCase() !== "undefined";
        };

        const isIncomplete = !isFieldFilled(freshUser.name) || 
                             !isFieldFilled(freshUser.phone) || 
                             !isFieldFilled(freshUser.address) || 
                             !isFieldFilled(freshUser.city) || 
                             !isFieldFilled(freshUser.province);

        if (isIncomplete) {
          setActionModal({
            isOpen: true,
            type: "danger",
            title: "Profil Belum Lengkap",
            message: "Anda wajib melengkapi data profil terlebih dahulu (Nama, No. WhatsApp, Alamat, Kota, Provinsi) di halaman pengaturan sebelum dapat menambahkan produk ke keranjang.",
            confirmText: "Lengkapi Profil",
            cancelText: "Batal",
            onConfirm: () => {
              window.location.href = "/user/pengaturan";
            },
          });
          return;
        }
      }
    } catch (err) {
      console.error("Error verifying profile completeness:", err);
    }

    setIsAddingToCart(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          listing_id: selectedProduct.id,
          quantity: buyQuantity,
        }),
      });

      if (response.ok) {
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Berhasil Masuk Keranjang!",
          message: `Produk "${selectedProduct.name}" telah ditambahkan ke daftar belanja Anda.`,
          onConfirm: () => {
            window.location.href = "/user/pesanan?tab=keranjang";
          },
          confirmText: "Lihat Keranjang",
          cancelText: "Lanjut Belanja",
        });
      } else {
        const err = await response.json();
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Gagal Menambah Keranjang",
          message: err.message || "Terjadi kesalahan saat menyimpan ke keranjang.",
          onConfirm: null,
        });
      }
    } catch (err) {
      console.error("Cart error:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleChatSeller = () => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    // If I am the seller, do nothing or show info
    if (selectedProduct.shop?.user_id === currentUser.id) {
      return;
    }

    setChatConfig({
      isOpen: true,
      sellerId: selectedProduct.shop?.user_id,
      buyerId: currentUser.id,
      sellerName: selectedProduct.shop?.name || "Seller",
      buyerName: currentUser.name || currentUser.username,
      productId: selectedProduct.id,
    });
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedProduct.name,
          text: `Lihat produk ${selectedProduct.name} di REPTILEHAVEN!`,
          url: url,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error sharing:", err);
      }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Link Berhasil Disalin",
        message: "Tautan produk telah disalin ke clipboard Anda. Silakan bagikan ke teman Anda!",
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-zinc-500 animate-pulse uppercase tracking-widest text-xs">Memuat Produk...</p>
        </div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-400">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-2">Produk Tidak Ditemukan</h2>
          <p className="text-zinc-500 mb-8">Maaf, produk yang Anda cari mungkin sudah tidak tersedia atau dihapus.</p>
          <Link href="/toko" className="bg-emerald-500 text-white font-black px-8 py-3 rounded-2xl hover:bg-emerald-600 transition-all">
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 lg:pt-28 pb-6 flex flex-col">
      <div className="max-w-[1440px] mx-auto px-4 w-full flex-1 flex flex-col">
        {/* Back Link */}
        <Link href="/toko" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-600 font-bold mb-4 transition-colors group text-sm">
          <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all">
            <ChevronLeft size={14} />
          </div>
          Kembali
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 mb-4 items-start">
          {/* Left Side: Image Gallery Card */}
          <div className="w-full lg:w-[45%] sticky-image-card bg-white border border-zinc-200 rounded-[2rem] p-4 lg:p-6 shadow-sm flex flex-col gap-4">
            <div className="bg-zinc-50 rounded-[1.5rem] relative group overflow-hidden border border-zinc-100 flex items-center justify-center aspect-square w-full">
              {parsedImages.length > 0 && parsedImages[activeImageIndex] ? (
                isVideoUrl(parsedImages[activeImageIndex]) ? (
                  <video
                    src={parsedImages[activeImageIndex]}
                    controls
                    className="w-full h-full object-contain p-6 lg:p-12"
                  />
                ) : (
                  <img
                    src={parsedImages[activeImageIndex]}
                    className="w-full h-full object-contain p-6 lg:p-12 transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                    alt={selectedProduct.name}
                    onClick={() => setIsImageZoomed(true)}
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-100">
                  <Tag size={64} strokeWidth={1} />
                  <p className="mt-4 font-bold text-xs uppercase tracking-widest">Tidak ada gambar</p>
                </div>
              )}

              {/* Image Navigation Arrows */}
              {parsedImages.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? parsedImages.length - 1 : prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-800 hover:bg-emerald-500 hover:text-white transition-all pointer-events-auto active:scale-90"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === parsedImages.length - 1 ? 0 : prev + 1))}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-800 hover:bg-emerald-500 hover:text-white transition-all pointer-events-auto active:scale-90"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {parsedImages.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                {parsedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${
                      activeImageIndex === idx ? "border-emerald-500 scale-105" : "border-zinc-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isVideoUrl(img) ? (
                      <video src={img} className="w-full h-full object-cover" preload="metadata" />
                    ) : (
                      <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Product Details Card */}
          <div className="w-full lg:w-[55%] bg-white border border-zinc-200 rounded-[2rem] p-6 lg:p-10 xl:p-12 shadow-sm">
            <div className="space-y-6 lg:space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-emerald-200">{selectedProduct.species || "Reptil"}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${selectedProduct.type === "sell" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>{selectedProduct.type === "sell" ? "Penjualan Langsung" : "Lelang"}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${selectedProduct.type === "sell" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                    {new Date(selectedProduct.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h2 className="text-2xl lg:text-3xl xl:text-3xl font-black text-zinc-900 leading-tight">{selectedProduct.name}</h2>
              </div>

              {/* Price and Action Row */}
              <div className="bg-zinc-50 rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-8 border border-zinc-100 space-y-6">
                {/* Seller Info Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex-shrink-0">
                      {selectedProduct.shop?.logo_url ? (
                        <img src={getLogoUrl(selectedProduct.shop.logo_url)} className="w-full h-full object-cover" alt={selectedProduct.shop.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Store size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-black text-blue-600 hover:underline cursor-pointer truncate">{selectedProduct.shop?.name || "Seller"}</p>
                        <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 flex-shrink-0">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span className="text-[10px] font-black text-zinc-900">{selectedProduct.shop?.avgRating || "5.0"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 font-bold truncate">
                        <MapPin size={12} className="text-zinc-400" /> {selectedProduct.shop?.city || "Lokasi tidak diset"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100">
                    {selectedProduct.shop?.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedProduct.shop.whatsapp.replace(/\D/g, "")}?text=Halo ${selectedProduct.shop.name}, saya tertarik dengan produk ${selectedProduct.name} di REPTILEHAVEN.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-[11px] font-black text-white bg-[#25D366] hover:bg-[#128C7E] transition-all py-2.5 px-4 rounded-xl"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                           <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.448.265c1.485.881 3.192 1.347 4.933 1.348 5.456 0 9.897-4.44 9.899-9.898.001-2.646-1.03-5.133-2.903-7.006-1.874-1.874-4.359-2.907-7.004-2.907-5.457 0-9.898 4.44-9.9 9.898-.001 2.107.549 4.159 1.59 5.968l.301.517-1.103 4.029 4.125-1.082zM17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.677.15-.2.299-.777.979-.951 1.178-.174.2-.349.226-.65.075-.301-.15-1.272-.469-2.422-1.494-.894-.797-1.498-1.783-1.674-2.083-.176-.3-.019-.462.132-.611.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.1-.2.05-.375-.025-.525-.075-.15-.677-1.633-.927-2.235-.243-.587-.491-.507-.677-.517-.175-.008-.376-.01-.577-.01s-.526.075-.802.375c-.276.3-1.052 1.026-1.052 2.503s1.077 2.903 1.227 3.103c.15.2 2.119 3.235 5.132 4.532.716.308 1.276.492 1.711.631.719.228 1.373.196 1.89.119.576-.086 1.78-.727 2.031-1.428.25-.701.25-1.302.175-1.428-.075-.126-.276-.226-.577-.376z" />
                        </svg>
                        Hubungi WA
                      </a>
                    )}

                    <button onClick={handleShare} className="flex items-center justify-center gap-2 text-[11px] font-black text-zinc-600 hover:text-emerald-600 transition-colors py-2.5 px-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300">
                      <Share2 size={16} /> Bagikan
                    </button>
                  </div>
                </div>
                <div className="h-px bg-zinc-200/50"></div>

                <div className="flex flex-wrap items-center justify-between gap-8">
                  <div>
                    <p className="text-3xl lg:text-3xl font-black text-emerald-600">{formatPrice((selectedProduct.type === "sell" ? selectedProduct.price : selectedProduct.current_bid || selectedProduct.start_bid) * buyQuantity)}</p>
                  </div>

                  {!(currentUser && selectedProduct.user_id === currentUser.id) && selectedProduct.stock > 0 && selectedProduct.status !== "sold" && (
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <div className="flex items-center bg-white border border-zinc-200 rounded-lg overflow-hidden h-12 w-full">
                          <button onClick={() => setBuyQuantity((prev) => Math.max(1, prev - 1))} className="px-4 hover:bg-zinc-50 text-zinc-400 font-bold transition-colors">
                            -
                          </button>
                          <div className="flex-1 sm:w-20 text-center text-base font-black border-x border-zinc-200 flex items-center justify-center h-full text-zinc-800">{buyQuantity}</div>
                          <button onClick={() => setBuyQuantity((prev) => Math.min(selectedProduct.stock, prev + 1))} className="px-4 hover:bg-zinc-50 text-zinc-400 font-bold transition-colors">
                            +
                          </button>
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter text-center">Stok Tersedia: {selectedProduct.stock} Ekor</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 h-12 w-full">
                        <button onClick={handleAddToCart} disabled={isAddingToCart} className="flex-1 bg-white hover:bg-zinc-50 border-2 border-emerald-500 text-emerald-600 font-black px-4 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 h-full flex items-center justify-center">
                          {isAddingToCart ? "..." : `+ Keranjang`}
                        </button>
                        <button onClick={handleBuyNow} disabled={isBuying} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 h-full flex items-center justify-center">
                          {isBuying ? "..." : "Beli Sekarang"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Free Shipping & Packing Badges */}
                {(selectedProduct.is_free_shipping || selectedProduct.is_free_packing) && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {selectedProduct.is_free_shipping && (
                      <div className="flex-1 min-w-[130px] p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <Truck size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase leading-none mb-1">Gratis Ongkir</p>
                          <p className="text-[11px] opacity-70 font-bold leading-none">Termasuk</p>
                        </div>
                      </div>
                    )}
                    {selectedProduct.is_free_packing && (
                      <div className="flex-1 min-w-[130px] p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Info size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase leading-none mb-1">Gratis Packing</p>
                          <p className="text-[11px] opacity-70 font-bold leading-none">Termasuk</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Specifications Grid - Minimalist Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group/spec">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Jenis Kelamin</p>
                  <p className="text-[12px] font-black text-zinc-900">{selectedProduct.sex || "Unsex"}</p>
                </div>

                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group/spec">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Jangkauan</p>
                  <p className="text-[12px] font-black text-zinc-900 leading-snug">{selectedProduct.shipping_type || "-"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Info size={16} />
                  </div>
                  Deskripsi Produk
                </h4>
                <div
                  className="text-sm text-zinc-600 leading-relaxed description-content bg-zinc-50 p-6 rounded-2xl border border-zinc-100"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct.description || "Tidak ada deskripsi.",
                  }}
                ></div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <MapPin size={16} />
                  </div>
                  Info Pengiriman & Garansi
                </h4>
                <div
                  className="text-sm text-zinc-600 leading-relaxed description-content bg-zinc-50 p-6 rounded-2xl border border-zinc-100"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct.shipping_description || "Tidak ada informasi pengiriman.",
                  }}
                ></div>
              </div>

              {/* Final Status Indicator */}
              <div className="pt-10 border-t border-zinc-100">
                {currentUser && selectedProduct.user_id === currentUser.id ? (
                  <div className="w-full bg-zinc-100 text-zinc-400 font-black py-6 rounded-[2rem] border border-zinc-200 flex items-center justify-center gap-3 cursor-not-allowed uppercase tracking-widest text-xs">
                    <XCircle size={24} /> Ini Adalah Produk Anda
                  </div>
                ) : selectedProduct.stock <= 0 || selectedProduct.status === "sold" ? (
                  <div className="w-full bg-red-50 text-red-500 font-black py-6 rounded-[2rem] border border-red-100 flex items-center justify-center gap-3 cursor-not-allowed uppercase tracking-widest text-xs">
                    <AlertCircle size={24} /> Stok Habis
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Action Modal */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={actionModal.onConfirm}
        type={actionModal.type}
        title={actionModal.title}
        message={actionModal.message}
        confirmText={actionModal.confirmText}
        cancelText={actionModal.cancelText}
        isLoading={actionModal.isLoading}
      />

      <ChatModal isOpen={chatConfig.isOpen} onClose={() => setChatConfig((prev) => ({ ...prev, isOpen: false }))} sellerId={chatConfig.sellerId} buyerId={chatConfig.buyerId} sellerName={chatConfig.sellerName} buyerName={chatConfig.buyerName} productId={chatConfig.productId} />

      {isImageZoomed && parsedImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md cursor-zoom-out select-none" onClick={() => setIsImageZoomed(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {isVideoUrl(parsedImages[activeImageIndex]) ? (
              <video src={parsedImages[activeImageIndex]} controls className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={parsedImages[activeImageIndex]} className="max-w-full max-h-[90vh] object-contain rounded-xl" alt={selectedProduct.name} />
            )}
            <button className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full" onClick={() => setIsImageZoomed(false)}>
              <XCircle size={24} />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .description-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
          line-break: auto;
          white-space: normal;
        }
        .description-content p {
          margin-bottom: 1rem;
        }
        .description-content ul,
        .description-content ol {
          list-style-position: outside;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .description-content ul {
          list-style-type: disc;
        }
        .description-content ol {
          list-style-type: decimal;
        }
        .description-content li {
          display: list-item;
          margin-bottom: 0.5rem;
        }
        .description-content li p {
          display: inline;
          margin: 0;
        }
        .description-content li::before {
          content: none;
        }
        @media (min-width: 1024px) {
          .sticky-image-card {
            position: -webkit-sticky !important;
            position: sticky !important;
            top: 112px !important;
            z-index: 10;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar theme="light" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-zinc-500 animate-pulse uppercase tracking-widest text-xs">Memuat Produk...</p>
            </div>
          </div>
        }
      >
        <DetailContent />
      </Suspense>
    </main>
  );
}
