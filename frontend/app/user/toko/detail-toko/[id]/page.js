"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ChevronRight, CheckCircle2, X, ScrollText, ShieldCheck, PencilLine, XCircle, Lock, LogOut, ArrowLeft, MapPin, Tag, ChevronDown, ChevronUp, AlertCircle, Star, Image as ImageIcon, Upload, Info, LayoutGrid, Clock } from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getLogoUrl, getSocketUrl } from "@/app/utils/api";
import { useShopQuota } from "@/hooks/useShopQuota";
import { io } from "socket.io-client";

export default function UserTokoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showResubmitSuccess, setShowResubmitSuccess] = useState(false);

  const [shopData, setShopData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { quota, loading: quotaLoading } = useShopQuota(params.id);

  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isUpgradeLocked, setIsUpgradeLocked] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);

        const token = localStorage.getItem("token");
        socket = io(getSocketUrl(), {
          auth: { token: token ? `Bearer ${token}` : "" },
        });

        socket.on("connect", () => {
          socket.emit("join_user", parsed.id);
        });

        const handleRefresh = () => {
          fetchShopDetail();
          fetchShopReviews();
        };

        socket.on("new_notification", handleRefresh);
        socket.on("shop_quota_updated", handleRefresh);
        socket.on("shop_membership_updated", handleRefresh);
        socket.on("shop_upgrade_status_updated", handleRefresh);
        socket.on("menu_controls_updated", fetchMenuControls);
      } catch (e) {
        console.error("[Detail Toko Socket] Error:", e);
      }
    }
    if (params.id) {
      fetchShopDetail();
      fetchShopReviews();
    }
    fetchMenuControls();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [params.id]);

  const fetchShopReviews = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/orders/shop/${params.id}`);
      const result = await response.json();
      if (response.ok && result.data) {
        // Filter only orders that have a rating or a review
        const filtered = result.data.filter((order) => order.rating !== null || order.review);
        setReviews(filtered);
      }
    } catch (err) {
      console.error("Error fetching shop reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

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

  const renderStars = (rating) => {
    const stars = [];
    const r = Math.round(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} size={14} className={i <= r ? "text-amber-500 fill-amber-500" : "text-zinc-700"} />);
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const fetchShopDetail = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/shops/${params.id}`);
      const result = await response.json();
      if (response.ok && result.data) {
        setShopData(result.data);

        // Fetch pending upgrade request if current logged-in user is the owner
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            if (userData && userData.id === result.data.user_id) {
              const token = localStorage.getItem("token");
              const pendingRes = await fetch(`${getApiUrl()}/shop-upgrades/pending`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              const pendingResult = await pendingRes.json();
              if (pendingRes.ok && pendingResult.data) {
                setPendingRequest(pendingResult.data);
              }
            }
          } catch (e) {
            console.error("Error parsing user data or fetching pending upgrades", e);
          }
        }
      } else {
        router.push("/user/toko");
      }
    } catch (err) {
      console.error("Error fetching shop detail:", err);
      router.push("/user/toko");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuControls = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/menu-controls`);
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        const upgradeCtrl = result.data.find((m) => m.menu_key === "upgrade_toko");
        if (upgradeCtrl && upgradeCtrl.status !== "active") {
          setIsUpgradeLocked(true);
        } else {
          setIsUpgradeLocked(false);
        }
      }
    } catch (e) {
      console.error("Error fetching menu controls:", e);
    }
  };

  const handleResubmit = async () => {
    if (!shopData?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getApiUrl()}/shops/${shopData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "pending",
          rejection_reason: null, // Clear reason on resubmit
        }),
      });

      if (response.ok) {
        const res = await response.json();
        setShopData(res.data);
        setShowResubmitSuccess(true);
      }
    } catch (err) {
      console.error("Error resubmitting shop:", err);
      alert("Gagal mengajukan kembali. Silakan coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
          <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
        </div>
      </div>
    );
  }

  if (!shopData) return null;

  const userBankAccounts = shopData.owner?.bank_accounts || [];

  // Pagination for Reviews
  const reviewsPerPage = 4;
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
        
        {/* Active Pending Request Banner */}
        {pendingRequest && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-amber-500/15 transition-all">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                <Clock size={24} className="animate-spin duration-10000" />
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 inline-block mb-1">Menunggu Verifikasi Admin</span>
                <h3 className="text-base font-black text-white">
                  Pengajuan Upgrade Toko: <span className="text-amber-400">{pendingRequest.plan_name || pendingRequest.planName}</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Diajukan pada {pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt ? new Date(pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} pukul {pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt ? new Date(pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") : "-"} WIB. Atas nama rekening:{" "}
                  <span className="font-bold text-zinc-200">{pendingRequest.account_name || pendingRequest.accountName}</span> ({(pendingRequest.bank_origin || pendingRequest.bankOrigin || "").toUpperCase()}) dengan <span className="font-mono font-bold text-amber-500">Kode Transaksi #UPG-{pendingRequest.unique_code}</span>.
                </p>
              </div>
            </div>
            <Link href="/user/toko/upgrade-toko" className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 no-underline">
              Lihat Detail
            </Link>
          </div>
        )}

        {/* Shop Details Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full -mr-16 -mt-16"></div>
          <div className="flex flex-col xs:flex-row items-center gap-4 sm:gap-8 relative z-10">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-zinc-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800 shrink-0 relative group">
              {shopData.logo_url ? (
                <img src={getLogoUrl(shopData.logo_url)} alt={shopData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                  <Store size={28} className="sm:hidden" />
                  <Store size={40} className="hidden sm:block" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center min-w-0">
              <div className="flex flex-col items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-xl sm:text-4xl font-black text-white truncate w-full">{shopData.name}</h1>
                <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit mx-auto border border-amber-500/20">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs sm:text-sm font-black text-amber-500">{shopData.avgRating || "5.0"}</span>
                  <span className="text-[10px] sm:text-xs text-amber-500/50 font-bold ml-1 tracking-tight">({shopData.totalReviews || 0} Ulasan)</span>
                </div>
              </div>
              {/* Shop Code & Quota Badge Container */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-3 mb-4 sm:mb-6">
                {shopData.shop_code && (
                  <div className="group/code flex items-center gap-3 bg-zinc-950/50 border border-zinc-800/80 hover:border-emerald-500/40 px-4 py-2 rounded-2xl transition-all duration-500 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 border-r border-zinc-800/80 pr-2.5">
                      <i className="fa-solid fa-id-badge text-[10px] text-emerald-500/70"></i>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">ID Toko</span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-mono font-black text-emerald-400 tracking-[0.15em]">{shopData.shop_code}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(shopData.shop_code);
                        const btn = e.currentTarget;
                        const icon = btn.querySelector("i");
                        icon.className = "fa-solid fa-check text-emerald-500";
                        setTimeout(() => {
                          icon.className = "fa-regular fa-copy";
                        }, 2000);
                      }}
                      className="text-zinc-600 hover:text-white transition-all transform active:scale-90"
                      title="Salin ID Toko"
                    >
                      <i className="fa-regular fa-copy text-[11px]"></i>
                    </button>
                  </div>
                )}

                {/* Quota Badge (Button-like) */}
                <Link
                  href="/user/toko/daftar-produk"
                  className="group/quota flex items-center gap-3 bg-zinc-950/50 border border-zinc-800/80 hover:border-emerald-500/40 px-4 py-2 rounded-2xl transition-all duration-500 backdrop-blur-md hover:no-underline"
                >
                  <div className="flex items-center gap-1.5 border-r border-zinc-800/80 pr-2.5">
                    <i className="fa-solid fa-layer-group text-[10px] text-emerald-500/70"></i>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Kuota</span>
                  </div>
                  <span className={`text-[11px] sm:text-xs font-black ${quotaLoading ? "text-zinc-600 animate-pulse" : quota?.remaining === 0 ? "text-red-400" : quota?.remaining <= 50 ? "text-amber-400" : "text-emerald-400"}`}>
                    {quotaLoading ? "..." : `${quota?.remaining?.toLocaleString("id-ID")} Sisa`}
                  </span>
                  <div className="text-zinc-600 group-hover/quota:text-white transition-all transform group-hover/quota:translate-x-0.5" title="Kelola Produk">
                    <i className="fa-solid fa-chevron-right text-[11px]"></i>
                  </div>
                </Link>

                {/* Level Keanggotaan Badge */}
                <Link
                  href="/user/toko/upgrade-toko"
                  className="group/membership flex items-center gap-3 bg-zinc-950/50 border border-zinc-800/80 hover:border-emerald-500/40 px-4 py-2 rounded-2xl transition-all duration-500 backdrop-blur-md hover:no-underline"
                >
                  <div className="flex items-center gap-1.5 border-r border-zinc-800/80 pr-2.5">
                    <ShieldCheck size={12} className="text-emerald-500/70" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Level</span>
                  </div>
                  <span className={`text-[11px] sm:text-xs font-black ${
                    shopData.membership_level === 'Pro Seller' ? 'text-emerald-400' :
                    shopData.membership_level === 'Enterprise Seller' ? 'text-purple-400' :
                    'text-zinc-400'
                  }`}>
                    {shopData.membership_level || 'Standard Seller'}
                  </span>
                  <div className="text-zinc-600 group-hover/membership:text-white transition-all transform group-hover/membership:translate-x-0.5" title="Upgrade Toko">
                    <i className="fa-solid fa-chevron-right text-[11px]"></i>
                  </div>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-base text-zinc-400 mt-2">
                <div className="flex items-center gap-2 min-w-0 bg-zinc-950/30 px-3 py-1.5 rounded-full border border-zinc-800/50">
                  <MapPin size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate font-medium">{shopData.province ? `${shopData.city}, ${shopData.province}` : shopData.city}</span>
                </div>
                {shopData.status?.toLowerCase() === "pending" && (
                  <div className="flex items-center gap-2 font-bold text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 text-[10px] sm:text-xs">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    Menunggu Verifikasi
                  </div>
                )}
                {shopData.status?.toLowerCase() === "rejected" && (
                  <div className="flex items-center gap-2 font-bold text-orange-500 bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20 text-[10px] sm:text-xs">
                    <XCircle size={12} />
                    Ditolak
                  </div>
                )}
                {shopData.status?.toLowerCase() === "suspended" && (
                  <div className="flex items-center gap-2 font-bold text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 text-[10px] sm:text-xs">
                    <AlertCircle size={12} />
                    Ditangguhkan
                  </div>
                )}
                {shopData.status?.toLowerCase() === "active" && (
                  <div className="flex items-center gap-2 font-bold text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 text-[10px] sm:text-xs">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Toko Aktif
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 justify-center">
              {currentUser && currentUser.id === shopData.user_id && (
                isUpgradeLocked ? (
                  <button
                    disabled
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-zinc-800 text-zinc-500 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-50 text-center"
                    title="Fitur Upgrade Toko dinonaktifkan sementara oleh Admin"
                  >
                    <Lock size={14} className="shrink-0" />
                    Upgrade Toko (Terkunci)
                  </button>
                ) : (
                  <Link href="/toko-saya/upgrade" className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:no-underline text-center">
                    <ShieldCheck size={14} className="shrink-0" />
                    Upgrade Toko
                  </Link>
                )
              )}
              <Link href="/user/toko/edit-toko" className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-center">
                Edit Toko
              </Link>
              <Link href="/user/toko/dashboard" className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 text-center">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Policies Display */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                <i className="fa-solid fa-truck-fast text-emerald-500"></i> Kebijakan Pengiriman
              </p>
              <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed description-content break-words" dangerouslySetInnerHTML={{ __html: shopData.shipping_policy || '<span class="italic opacity-50">Belum diatur</span>' }} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                <i className="fa-solid fa-shield-heart text-amber-500"></i> Kebijakan Garansi
              </p>
              <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed description-content break-words" dangerouslySetInnerHTML={{ __html: shopData.warranty_policy || '<span class="italic opacity-50">Belum diatur</span>' }} />
            </div>
          </div>

          {/* Bank Accounts Display */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag size={12} className="text-emerald-500" /> Informasi Rekening Bank
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {userBankAccounts && userBankAccounts.length > 0 ? (
                  userBankAccounts.map((bank, idx) => (
                    <div key={idx} className="bg-zinc-950/50 border border-zinc-800 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase shrink-0">{(bank.bank_name || bank.bankName || "").substring(0, 3)}</div>
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-black text-white leading-tight truncate">{bank.account_number || bank.accountNumber}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter truncate">an. {bank.account_name || bank.accountName}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">Belum ada data rekening bank. Silakan lengkapi di profil.</p>
                )}
              </div>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shrink-0 w-full sm:w-auto text-left">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">NIK Terdaftar</p>
              <p className="text-xs sm:text-sm font-black text-white tracking-wider">{shopData.nik ? `***${shopData.nik.substring(shopData.nik.length - 4)}` : "-"}</p>
            </div>
          </div>
        </div>

        {/* Suspension Warning */}
        {shopData.status?.toLowerCase() === "suspended" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-white">Toko Anda Sedang Ditangguhkan</h3>
              <p className="text-zinc-400 mt-1 text-sm leading-relaxed">Mohon maaf, saat ini toko Anda sedang dalam status penangguhan oleh Admin. Anda tidak dapat melakukan aktivitas berjualan atau memasang iklan baru hingga status diaktifkan kembali. Silakan hubungi Admin untuk informasi lebih lanjut.</p>
            </div>
            <button onClick={() => window.open("https://wa.me/628123456789", "_blank")} className="w-full md:w-auto px-6 py-3 bg-white text-zinc-950 font-black rounded-xl hover:bg-zinc-200 transition-all active:scale-95 text-sm text-center">
              Hubungi Admin
            </button>
          </div>
        )}

        {/* Rejection Warning */}
        {shopData.status?.toLowerCase() === "rejected" && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0">
              <XCircle size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-white">Verifikasi Toko Ditolak</h3>
              <div className="mt-2 p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Alasan dari Admin:</p>
                <p className="text-zinc-300 text-sm leading-relaxed italic">{shopData.rejection_reason || "Tidak ada alasan spesifik yang diberikan."}</p>
              </div>
              <p className="text-zinc-500 mt-3 text-xs leading-relaxed">Silakan perbaiki data profil toko Anda sesuai dengan masukan di atas, lalu hubungi Admin atau ajukan ulang jika tersedia fitur pembaruan otomatis.</p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
              <Link href="/user/toko/edit-toko" className="w-full md:w-auto px-6 py-3 bg-white text-zinc-950 font-black rounded-xl hover:bg-zinc-200 transition-all active:scale-95 text-sm text-center whitespace-nowrap font-bold">
                Perbaiki Profil
              </Link>
              <button onClick={handleResubmit} disabled={isSubmitting} className="w-full md:w-auto px-6 py-3 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-400 transition-all active:scale-95 text-sm text-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Memproses..." : "Ajukan Kembali"}
              </button>
            </div>
          </div>
        )}

        {/* Regulations Section */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl overflow-hidden">
          <button onClick={() => setShowRules(!showRules)} className="w-full p-6 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-zinc-950 rounded-2xl flex items-center justify-center">
                <ScrollText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-amber-500 uppercase tracking-tight">📜 Peraturan Jualan</h2>
                <p className="text-amber-500/60 text-sm">Wajib dibaca dan dipatuhi oleh semua penjual</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500">{showRules ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
          </button>

          {showRules && (
            <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
              <div className="h-px bg-amber-500/20 mb-8"></div>

              <p className="text-amber-500/80 text-sm mb-8 font-medium italic">Untuk menjaga kenyamanan dan keamanan bersama, setiap penjual wajib mengikuti peraturan berikut:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm text-zinc-300">
                {/* Kolom 1 */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">1</span>
                      Keaslian & Kejujuran Produk
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Semua hewan yang dijual harus sesuai dengan deskripsi, termasuk spesies, morph/genetik, umur, dan kondisi.</li>
                      <li>Dilarang memberikan informasi palsu atau menyesatkan.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">2</span>
                      Kondisi Hewan
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Hewan yang dijual harus dalam kondisi sehat, aktif, dan layak jual.</li>
                      <li>Wajib mencantumkan kondisi terkini, riwayat makan, dan jika ada kekurangan (cacat/penyakit) harus dijelaskan secara jujur.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">3</span>
                      Foto Produk
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Gunakan foto asli (real picture), bukan hasil ambil dari internet.</li>
                      <li>Foto harus jelas, tidak blur, dan menampilkan kondisi sebenarnya dari hewan.</li>
                      <li>Hindari penggunaan filter berlebihan yang dapat menyesatkan pembeli.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">4</span>
                      Penetapan Harga
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Harga harus jelas dan sesuai dengan produk yang ditawarkan.</li>
                      <li>Dilarang melakukan perubahan harga sepihak setelah terjadi kesepakatan.</li>
                    </ul>
                  </div>
                </div>

                {/* Kolom 2 */}
                <div className="space-y-8">
                  <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                    <h3 className="font-black text-amber-500 flex items-center gap-2 text-base">
                      <AlertCircle size={20} />
                      5. Metode Transaksi (Wajib Admin)
                    </h3>
                    <ul className="list-disc list-outside ml-5 text-zinc-300 space-y-2 text-xs leading-relaxed">
                      <li>
                        Seluruh transaksi <strong>wajib dilakukan melalui pihak ketiga (Admin Platform)</strong> sebagai perantara.
                      </li>
                      <li>Pembeli melakukan pembayaran terlebih dahulu kepada Admin.</li>
                      <li>Dana akan diteruskan kepada penjual setelah barang/hewan diterima oleh pembeli.</li>
                      <li className="text-amber-500 font-bold">Dilarang melakukan transaksi di luar platform.</li>
                      <li>
                        Apabila transaksi dilakukan di luar Admin, maka <strong>segala risiko dan kerugian bukan menjadi tanggung jawab Admin Platform</strong>.
                      </li>
                      <li>
                        Penjual <strong>wajib mengirimkan nomor resi atau bukti pengiriman kepada Admin dan pembeli</strong> sebagai bentuk validasi transaksi.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">6</span>
                      Pengiriman & Penyerahan
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Penjual bertanggung jawab atas keamanan hewan selama proses pengiriman.</li>
                      <li>Pengiriman dilakukan setelah pembayaran dikonfirmasi oleh Admin.</li>
                      <li>Penjual wajib menggunakan metode pengiriman yang aman dan sesuai untuk hewan hidup.</li>
                      <li>Nomor resi atau bukti pengiriman wajib diberikan melalui platform.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">7</span>
                      Larangan Penjualan
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Dilarang menjual hewan yang dilindungi atau ilegal.</li>
                      <li>Dilarang menjual hewan dalam kondisi sakit parah atau tidak layak jual.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">8</span>
                      Tanggung Jawab Penjual
                    </h3>
                    <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                      <li>Penjual wajib merespon pertanyaan pembeli dengan baik dan sopan.</li>
                      <li>Penjual bertanggung jawab penuh atas produk yang dijual.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-black text-white flex items-center gap-2 text-base">
                      <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs">9</span>
                      Sanksi
                    </h3>
                    <div className="ml-9 space-y-2">
                      <p className="text-zinc-400 leading-relaxed">Pelanggaran terhadap peraturan dapat mengakibatkan:</p>
                      <ul className="list-disc list-outside ml-4 text-zinc-400 space-y-1 leading-relaxed">
                        <li>Penghapusan iklan</li>
                        <li>Pembatasan akun</li>
                        <li>Pemblokiran akun secara permanen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-amber-500/20 text-center">
                <p className="text-sm text-amber-500 font-bold italic">💡 Dengan menggunakan platform ini, penjual dianggap telah membaca, memahami, dan menyetujui seluruh peraturan yang berlaku.</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Management Navigation */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative">
          {shopData.status?.toLowerCase() !== "active" && (
            <div className="absolute inset-0 z-20 bg-zinc-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center text-amber-500 mb-6 ring-4 ring-amber-500/10">
                <Lock size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Fitur Terkunci</h3>
              <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
                Mohon maaf, fitur pengelolaan produk dan lelang hanya tersedia untuk toko yang sudah <span className="text-emerald-500 font-bold uppercase">Terverifikasi</span> oleh Admin.
              </p>
              <div className="mt-8 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Status: {shopData.status?.toUpperCase() || "PENDING"}</span>
              </div>
            </div>
          )}

          <div className={`p-8 md:p-12 text-center space-y-8 ${shopData.status?.toLowerCase() !== "active" ? "grayscale opacity-50" : ""}`}>
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white">Kelola Produk & Lelang</h2>
              <p className="text-zinc-500">Pilih jenis penawaran yang ingin Anda buat. Kini tersedia halaman khusus untuk memudahkan Anda mengelola stok dan detail produk secara lebih profesional.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {shopData.status?.toLowerCase() === "active" ? (
                <>
                  <Link href="/user/toko/jual-produk" className="group relative bg-zinc-950 border border-zinc-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all text-left overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Store size={28} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Jual Langsung</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">Pasang iklan jualan produk atau reptil Anda dengan harga tetap ke marketplace.</p>
                    <div className="mt-6 flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Buka Halaman <ChevronRight size={14} />
                    </div>
                  </Link>

                  <Link href="/user/toko/lelang-produk" className="group relative bg-zinc-950 border border-zinc-800 p-8 rounded-3xl hover:border-amber-500/50 transition-all text-left overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
                      <Store size={28} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Lelang Produk</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">Buka lelang untuk produk koleksi terbaik Anda dan dapatkan penawaran tertinggi.</p>
                    <div className="mt-6 flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Buka Halaman <ChevronRight size={14} />
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <div className="relative bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-left overflow-hidden cursor-not-allowed">
                    <div className="w-14 h-14 bg-zinc-900 text-zinc-700 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
                      <Store size={28} />
                    </div>
                    <h3 className="text-xl font-black text-zinc-400 mb-2">Jual Langsung</h3>
                    <p className="text-sm text-zinc-700 leading-relaxed">Pasang iklan jualan produk atau reptil Anda dengan harga tetap ke marketplace.</p>
                  </div>

                  <div className="relative bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-left overflow-hidden cursor-not-allowed">
                    <div className="w-14 h-14 bg-zinc-900 text-zinc-700 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
                      <Store size={28} />
                    </div>
                    <h3 className="text-xl font-black text-zinc-400 mb-2">Lelang Produk</h3>
                    <p className="text-sm text-zinc-700 leading-relaxed">Buka lelang untuk produk koleksi terbaik Anda dan dapatkan penawaran tertinggi.</p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/user/toko/daftar-produk" className="text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                <ScrollText size={18} /> Lihat Daftar Iklan Saya
              </Link>
              <span className="hidden sm:block w-1 h-1 bg-zinc-800 rounded-full"></span>
              <Link href="/user/toko/dashboard" className="text-sm font-bold text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                <ShieldCheck size={18} /> Dashboard Penjual
              </Link>
            </div>
          </div>
        </div>

        {/* Ulasan & Komentar Penjualan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500" size={24} /> Ulasan & Komentar Pembeli
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium">Ulasan dari hasil penjualan sukses toko Anda.</p>
            </div>
            <div className="flex items-center gap-4 bg-zinc-950/50 border border-zinc-850 px-4 py-3 rounded-2xl shrink-0">
              <div className="text-center border-r border-zinc-800 pr-4">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">{shopData.avgRating || "5.0"}</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mt-1">Skor Toko</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">{renderStars(parseFloat(shopData.avgRating || 5))}</div>
                <p className="text-[10px] text-zinc-400 font-bold tracking-tight">{reviews.length} Ulasan Terverifikasi</p>
              </div>
            </div>
          </div>

          {loadingReviews ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-zinc-500 font-medium animate-pulse">Memuat Ulasan...</p>
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {currentReviews.map((rev) => (
                  <div key={rev.id} className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-sm shrink-0 uppercase">{(rev.user?.name || rev.user?.username || "B").substring(0, 2)}</div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-white truncate leading-none mb-1">{maskName(rev.user?.name || rev.user?.username)}</h4>
                            <p className="text-[9px] text-zinc-500 font-bold">{new Date(rev.created_at || rev.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800/60 shrink-0">{renderStars(rev.rating)}</div>
                      </div>

                      <div className="bg-zinc-900/30 border border-zinc-850 p-3.5 rounded-xl text-xs text-zinc-400 font-medium leading-relaxed italic break-words">&ldquo;{rev.review || "Pembeli memberikan rating bintang 5 otomatis tanpa komentar tertulis."}&rdquo;</div>
                    </div>

                    {rev.product && (
                      <div className="pt-3 border-t border-zinc-900 flex items-center gap-3 bg-zinc-900/10 p-2.5 rounded-xl border border-zinc-850 mt-2 shrink-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <img src={rev.product.images?.[0]} alt={rev.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Membeli Produk</p>
                          <p className="text-[10px] sm:text-xs font-black text-zinc-300 truncate leading-tight group-hover:text-emerald-400 transition-colors">{rev.product.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 mt-6">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Menampilkan {indexOfFirstReview + 1} - {Math.min(indexOfLastReview, reviews.length)} dari {reviews.length} Ulasan
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${currentPage === 1 ? "border-zinc-850 bg-zinc-900/10 text-zinc-600 cursor-not-allowed" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white"}`}
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all active:scale-95 flex items-center justify-center border ${currentPage === pageNumber ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"}`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${currentPage === totalPages ? "border-zinc-850 bg-zinc-900/10 text-zinc-600 cursor-not-allowed" : "border-zinc-850 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white"}`}
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center space-y-4 bg-zinc-950/20 border border-zinc-800 rounded-3xl border-dashed">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-700 mx-auto">
                <Star size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Belum Ada Ulasan</h3>
                <p className="text-zinc-500 text-xs max-w-xs mx-auto">Ulasan dan rating dari pembeli tokomu akan ditampilkan secara berkala di sini.</p>
              </div>
            </div>
          )}
        </div>

        {/* Resubmit Success Modal */}
        <ActionModal isOpen={showResubmitSuccess} onClose={() => setShowResubmitSuccess(false)} type="success" title="Pengajuan Terkirim" message="Berhasil mengajukan kembali verifikasi toko. Silakan tunggu peninjauan Admin (1x24 jam)." confirmText="Oke, Siap" />
      </div>

      <style jsx global>{`
        .description-content ul,
        .ql-editor ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin-left: 0 !important;
          margin-bottom: 1rem !important;
        }
        .description-content ol,
        .ql-editor ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin-left: 0 !important;
          margin-bottom: 1rem !important;
        }
        .description-content li,
        .ql-editor li {
          display: list-item !important;
          margin-bottom: 0.5rem !important;
          color: inherit !important;
        }
        .description-content li p,
        .ql-editor li p {
          display: inline !important;
        }
      `}</style>
    </div>
  );
}
