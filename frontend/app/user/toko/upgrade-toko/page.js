"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ShieldCheck, Clock, Plus, Check, ArrowRight, Upload, Info, AlertTriangle, CheckCircle, Copy, ChevronLeft, FileText, Store, RefreshCw, X, QrCode, CreditCard, Eye } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getSocketUrl, getLogoUrl } from "@/app/utils/api";
import { io } from "socket.io-client";

export default function UpgradeTokoPage() {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [quota, setQuota] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Checkout & Modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedText, setCopiedText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("qris"); // qris | bca
  const [previewImage, setPreviewImage] = useState(null);
  const [currentUniqueCode, setCurrentUniqueCode] = useState(null);

  // Form submission state
  const [accountName, setAccountName] = useState("");
  const [bankOrigin, setBankOrigin] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active pending upgrade request stored locally
  const [pendingRequest, setPendingRequest] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError("");
    try {
      // Fetch dynamic upgrade plans first
      try {
        const plansRes = await fetch(`${getApiUrl()}/shop-upgrades/plans`);
        const plansResult = await plansRes.json();
        if (plansRes.ok && plansResult.data) {
          setPlans(plansResult.data);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Error fetching upgrade plans:", err);
        setPlans([]);
      }

      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setError("Anda belum masuk. Silakan login terlebih dahulu.");
        setIsLoading(false);
        return;
      }
      const userData = JSON.parse(userStr);
      setUser(userData);

      // Fetch shop details
      const shopRes = await fetch(`${getApiUrl()}/shops/user/${userData.id}`);
      const shopResult = await shopRes.json();

      if (shopRes.ok && shopResult.data) {
        const shopData = shopResult.data;
        setShop(shopData);

        // Fetch shop quota
        const quotaRes = await fetch(`${getApiUrl()}/listings/quota/${shopData.id}`);
        const quotaResult = await quotaRes.json();
        if (quotaRes.ok && quotaResult.data) {
          setQuota(quotaResult.data);
        }

        // Fetch pending upgrade request from backend
        const token = localStorage.getItem("token");
        const pendingRes = await fetch(`${getApiUrl()}/shop-upgrades/pending`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const pendingResult = await pendingRes.json();
        if (pendingRes.ok && pendingResult.data) {
          setPendingRequest(pendingResult.data);
        } else {
          setPendingRequest(null);
        }
      } else {
        setShop(null); // No shop created yet
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data toko. Silakan coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.io for Real-time Updates
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let socket;
    try {
      socket = io(getSocketUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });

      socket.on("connect", () => {
        console.log("[Socket] UpgradeTokoPage connected successfully");
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            if (userData && userData.id) {
              socket.emit("join_user", userData.id);
              console.log(`[Socket] Joined user room user_${userData.id}`);
            }
          } catch (e) {
            console.error("Error parsing user data for socket room", e);
          }
        }
      });

      socket.on("upgrade_plans_updated", () => {
        console.log("[Socket] Upgrade plans updated, reloading...");

        // Reload plans from backend
        fetch(`${getApiUrl()}/shop-upgrades/plans`)
          .then((res) => res.json())
          .then((result) => {
            if (result.data) {
              setPlans(result.data);
            } else {
              setPlans([]);
            }
          })
          .catch((err) => {
            console.error("Error reloading plans via socket:", err);
          });
      });

      socket.on("shop_quota_updated", (data) => {
        console.log("[Socket] Shop quota updated:", data);
        loadData(true);
      });

      socket.on("shop_upgrade_status_updated", (data) => {
        console.log("[Socket] Shop upgrade status updated:", data);
        loadData(true);
      });

      socket.on("shop_membership_updated", (data) => {
        console.log("[Socket] Shop membership updated:", data);
        loadData(true);
      });
    } catch (e) {
      console.error("[Socket] Error establishing connection in UpgradeTokoPage", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert("Ukuran file tidak boleh melebihi 1MB");
      return;
    }

    setPaymentProof(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setCurrentStep(1);
    const code = Math.floor(100 + Math.random() * 900);
    setCurrentUniqueCode(code);
    // Reset Form
    setAccountName("");
    setBankOrigin("");
    setPaymentProof(null);
    setPaymentProofPreview("");
  };

  const handleCancelPending = async () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan pengajuan upgrade ini?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${getApiUrl()}/shop-upgrades/pending`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setPendingRequest(null);
          showToastNotification("Pengajuan upgrade berhasil dibatalkan.");
        } else {
          alert("Gagal membatalkan pengajuan upgrade.");
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan koneksi.");
      }
    }
  };

  const showToastNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim() || !bankOrigin.trim() || !paymentProof) {
      alert("Harap lengkapi semua kolom dan unggah bukti transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      // 1. Upload payment proof
      const uploadData = new FormData();
      uploadData.append("image", paymentProof);

      const uploadRes = await fetch(`${getApiUrl()}/upload`, {
        method: "POST",
        body: uploadData,
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah bukti transfer.");
      }

      const uploadResult = await uploadRes.json();
      const imageUrl = uploadResult.url;

      // 2. Submit upgrade request
      const upgradeRes = await fetch(`${getApiUrl()}/shop-upgrades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          price: selectedPlan.price,
          account_name: accountName,
          bank_origin: bankOrigin,
          payment_proof: imageUrl,
          unique_code: currentUniqueCode || Math.floor(100 + Math.random() * 900),
        }),
      });

      const upgradeResult = await upgradeRes.json();
      if (upgradeRes.ok) {
        setPendingRequest(upgradeResult.data);
        setIsModalOpen(false);
        showToastNotification(`Upgrade toko ke ${selectedPlan.name} berhasil diajukan! Menunggu verifikasi admin.`);
      } else {
        alert(upgradeResult.message || "Gagal mengajukan upgrade toko.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat memproses pengajuan upgrade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanButtonState = (plan) => {
    if (!shop) return { text: "Upgrade Sekarang", disabled: false };

    const currentLevel = (shop.membership_level || "Standard Seller").toLowerCase();
    const planName = (plan.name || "").toLowerCase();

    // Check if this plan is currently active for the shop
    const isOwned =
      currentLevel === planName ||
      (currentLevel.includes("pro") && planName.includes("pro")) ||
      (currentLevel.includes("enterprise") && planName.includes("enterprise"));

    if (isOwned) {
      return { text: "Sudah Membeli", disabled: true, isOwned: true };
    }

    // Check if there is a pending request for this specific plan
    if (pendingRequest) {
      const pendingPlanName = (pendingRequest.plan_name || pendingRequest.planName || "").toLowerCase();
      const isPendingThis =
        pendingRequest.plan_id === plan.id ||
        pendingPlanName === planName ||
        (pendingPlanName.includes("pro") && planName.includes("pro")) ||
        (pendingPlanName.includes("enterprise") && planName.includes("enterprise"));

      if (isPendingThis) {
        return { text: "Menunggu Verifikasi", disabled: true, isPending: true };
      } else {
        // If there's any pending request, disable other plans to prevent double/multiple requests
        return { text: "Upgrade Sekarang", disabled: true };
      }
    }

    // If the shop is already Enterprise, they shouldn't downgrade to Pro
    if (currentLevel.includes("enterprise") && planName.includes("pro")) {
      return { text: "Upgrade Sekarang", disabled: true };
    }

    return { text: "Upgrade Sekarang", disabled: false };
  };

  // Sleek Skeleton Loader
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse max-w-6xl mx-auto">
        <div className="space-y-3">
          <div className="h-8 bg-zinc-900 rounded-lg w-1/3"></div>
          <div className="h-4 bg-zinc-900 rounded-lg w-1/2"></div>
        </div>
        <div className="h-44 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]"></div>
          ))}
        </div>
      </div>
    );
  }

  // Handle Error
  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] text-center space-y-6">
        <AlertTriangle size={48} className="text-amber-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Kesalahan Koneksi</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl mx-auto transition-transform active:scale-[0.98]">
          <RefreshCw size={16} />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Handle No Shop State
  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-10 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-center space-y-6">
        <div className="w-16 h-16 bg-zinc-800 border border-zinc-700/50 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto">
          <Store size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider italic">Buka Toko Dahulu</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">Anda harus mendaftarkan toko seller terlebih dahulu sebelum dapat mengakses menu Upgrade Toko.</p>
        </div>
        <div className="pt-2">
          <Link href="/user/toko" className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl transition-all">
            Buka Toko Sekarang
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-zinc-950 font-bold px-6 py-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-400/20">
          <CheckCircle size={20} />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/60 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
            <Sparkles className="text-emerald-500" size={28} />
            Upgrade Status Toko
          </h1>
        </div>
      </div>

      {/* Active Pending Request Banner */}
      {pendingRequest && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-amber-500/15 transition-all">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 inline-block mb-1">Menunggu Verifikasi Admin</span>
              <h3 className="text-base font-black text-white">
                Pengajuan Upgrade: <span className="text-amber-400">{pendingRequest.plan_name || pendingRequest.planName}</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Diajukan pada {pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt ? new Date(pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} pukul {pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt ? new Date(pendingRequest.created_at || pendingRequest.submitted_at || pendingRequest.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") : "-"} WIB. Atas nama rekening transfer:{" "}
                <span className="font-bold text-zinc-200">{pendingRequest.account_name || pendingRequest.accountName}</span> ({(pendingRequest.bank_origin || pendingRequest.bankOrigin || "").toUpperCase()}) dengan <span className="font-mono font-bold text-amber-500">Kode Transaksi #UPG-{pendingRequest.unique_code}</span>.
              </p>
            </div>
          </div>
          <button onClick={handleCancelPending} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0">
            Batalkan Pengajuan
          </button>
        </div>
      )}

      {/* Shop Info & Current Quota Overview */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Col 1: Shop Identity */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-500 overflow-hidden shrink-0">{shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" alt={shop.name} /> : <Store size={32} className="text-zinc-550" />}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{shop.name}</h2>
              {shop.listing_limit > 500 && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase tracking-wider border border-emerald-500/20">Pro Seller</span>}
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Kode Toko: <span className="font-mono text-zinc-400">{shop.shop_code || "-"}</span>
            </p>
            <p className="text-[10px] text-zinc-400 bg-zinc-800/40 border border-zinc-800 px-2.5 py-0.5 rounded-lg inline-block mt-2">
              Level Keanggotaan: <strong className="text-zinc-200">{shop.membership_level || "Standard Seller"}</strong>
            </p>
          </div>
        </div>

        {/* Col 2: Product Quota Progress */}
        <div className="space-y-2 lg:border-x lg:border-zinc-800/50 lg:px-8 py-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Kuota Produk Aktif</span>
            <span className="text-white font-black">
              {quota ? quota.used : 0} <span className="text-zinc-500">/</span> {quota ? quota.limit : 500}
            </span>
          </div>
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-3 overflow-hidden p-0.5">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000" style={{ width: `${quota ? quota.percentage : 0}%` }}></div>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Tersisa {quota ? quota.remaining : 500} slot produk lagi untuk diiklankan.</p>
        </div>

        {/* Col 3: Disbursement speed status */}
        <div className="flex gap-4 items-start lg:pl-4">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
            <Clock size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kecepatan Pencairan Dana</p>
            <h4 className="text-sm font-black text-white">
              {shop?.membership_level === 'Pro Seller' ? 'Prioritas (1-2 Hari Kerja)' : 
               shop?.membership_level === 'Enterprise Seller' ? 'Prioritas (1 Hari Kerja)' : 
               'Standar (3-5 Hari Kerja)'}
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
              {shop?.membership_level === 'Pro Seller' ? 'Pro Seller menikmati prioritas pencairan dana hasil penjualan selesai dalam 1-2 hari kerja.' :
               shop?.membership_level === 'Enterprise Seller' ? 'Enterprise Seller menikmati prioritas instan pencairan dana hasil penjualan selesai dalam 1 hari kerja.' :
               'Upgrade untuk prioritas pencairan dana hasil penjualan selesai dalam 1-2 hari kerja.'}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Comparison Overview */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider italic">Mengapa Harus Upgrade Toko?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Plus size={24} />
            </div>
            <h4 className="font-bold text-white text-sm">Katalog Tanpa Batas</h4>
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">Tambah kuota 500 produk lagi, memungkinkan Anda mengunggah varian hewan, aksesoris, pakan, dan kelengkapannya.</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
              <Clock size={24} />
            </div>
            <h4 className="font-bold text-white text-sm">Pencairan Dana Lebih Cepat</h4>
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">Kecepatan review dan transfer pencairan dalam 1-2 hari kerja membantu Anda memutar modal jauh lebih cepat.</p>
          </div>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider italic">Pilih Paket Upgrade Toko</h3>
          <p className="text-zinc-500 text-xs mt-1">Dapatkan penawaran paket upgrade terbaik sesuai kebutuhan transaksi harian Anda.</p>
        </div>

        <div className="flex justify-center w-full">
          {plans.length === 0 ? (
            <div className="text-center py-12 px-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] max-w-md w-full text-zinc-550 text-sm font-semibold space-y-3">
              <Info size={36} className="text-zinc-600 mx-auto" />
              <p>Belum ada paket upgrade yang tersedia saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center w-full">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-zinc-900 border ${plan.popular ? "border-emerald-500/40 relative" : "border-zinc-800"} rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 bg-gradient-to-b ${plan.gradient || "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40"} w-full`}
                >
                  {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">Rekomendasi Utama</div>}

                  <div className="space-y-6">
                    {/* Plan Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg ${plan.badgeColor || plan.badge_color || "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"}`}>{plan.badge}</span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1 leading-none">{plan.name}</h3>
                      <p className="text-sm font-bold text-emerald-400">{plan.subName || plan.sub_name}</p>
                    </div>

                    {/* Plan Pricing */}
                    <div className="border-y border-zinc-800/60 py-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{formatPrice(plan.price)}</span>
                      <span className="text-zinc-500 text-xs font-bold font-mono">{plan.duration}</span>
                    </div>

                    {/* Description */}
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">{plan.description}</p>

                    {/* Features List */}
                    <ul className="space-y-3.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-medium">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                            <Check size={10} className="stroke-[3]" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8">
                    {(() => {
                      const btnState = getPlanButtonState(plan);
                      if (btnState.disabled) {
                        return (
                          <button
                            disabled
                            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border cursor-not-allowed transition-all opacity-60 ${
                              btnState.isOwned
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : btnState.isPending
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-zinc-900 text-zinc-650 border-zinc-800"
                            }`}
                          >
                            {btnState.isOwned ? (
                              <CheckCircle size={14} className="stroke-[2.5]" />
                            ) : btnState.isPending ? (
                              <Clock size={14} className="stroke-[2.5]" />
                            ) : null}
                            {btnState.text}
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => handleOpenCheckout(plan)}
                          className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            plan.popular
                              ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/10"
                              : "bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700/50"
                          }`}
                        >
                          {btnState.text}
                          <ArrowRight size={14} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Checkout Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          {/* Content Wrapper */}
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] relative overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider italic flex items-center gap-2">
                  <Sparkles className="text-emerald-500" size={20} />
                  Checkout Upgrade Toko
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">{selectedPlan.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Steps Indicator */}
            <div className="px-6 py-4 bg-zinc-950/40 border-b border-zinc-800 shrink-0 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className={currentStep >= 1 ? "text-emerald-500" : ""}>1. Rincian Paket</span>
              <div className="flex-1 h-0.5 bg-zinc-800 mx-3"></div>
              <span className={currentStep >= 2 ? "text-emerald-500" : ""}>2. Pembayaran</span>
              <div className="flex-1 h-0.5 bg-zinc-800 mx-3"></div>
              <span className={currentStep === 3 ? "text-emerald-500" : ""}>3. Konfirmasi</span>
            </div>

            {/* Modal Content - Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Package Review */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="p-5 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-white">{selectedPlan.name}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{selectedPlan.subName || selectedPlan.sub_name}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-500">{formatPrice(selectedPlan.price)}</span>
                    </div>
                    <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Durasi Aktif</span>
                      <span className="text-zinc-300 font-bold">{selectedPlan.duration}</span>
                    </div>
                    <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Kode Transaksi</span>
                      <span className="text-zinc-300 font-mono font-bold">#UPG-{currentUniqueCode}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detail Keuntungan Paket:</h4>
                    <ul className="space-y-3 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/50">
                      {selectedPlan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check size={12} className="text-emerald-500 stroke-[3]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 items-start">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Pengajuan upgrade Anda akan langsung diverifikasi oleh Tim Admin SatwaID setelah bukti transfer pembayaran diunggah.</p>
                  </div>

                  <button onClick={() => setCurrentStep(2)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2">
                    Lanjutkan Pembayaran
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Step 2: Transfer Bank Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-zinc-950 border border-zinc-800/50 p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Total Pembayaran</span>
                      <span className="text-lg font-black text-emerald-500">{formatPrice(selectedPlan.price)}</span>
                    </div>
                    <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Kode Transaksi</span>
                      <span className="text-zinc-300 font-mono font-bold">#UPG-{currentUniqueCode}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qris")}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${paymentMethod === "qris" ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10" : "bg-transparent text-zinc-500 hover:text-white"}`}
                    >
                      <QrCode size={14} />
                      QRIS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bca")}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${paymentMethod === "bca" ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10" : "bg-transparent text-zinc-500 hover:text-white"}`}
                    >
                      <CreditCard size={14} />
                      Transfer BCA
                    </button>
                  </div>

                  {paymentMethod === "qris" ? (
                    /* QRIS Content */
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                      {/* QR Container */}
                      <div className="w-full flex flex-col items-center gap-3">
                        <div className="relative w-full max-w-[200px] aspect-square overflow-hidden rounded-2xl bg-black border-2 border-zinc-800 p-2.5 group/qr shadow-lg shadow-black/40">
                          {/* Scanner Target corners */}
                          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm"></div>
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm"></div>
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm"></div>
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br-sm"></div>

                          <img src="/images/Pembayaran.jpeg" alt="QRIS Payment Details" className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover/qr:scale-105" />
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full max-w-[200px]">
                          <button type="button" onClick={() => setPreviewImage("/images/Pembayaran.jpeg")} className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all">
                            <Eye size={10} /> Perbesar Kode QR
                          </button>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="w-full space-y-2">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Petunjuk Pembayaran QRIS</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">1</span>
                            <p className="text-zinc-400 text-[10px] leading-relaxed">Pindai kode QRIS dengan aplikasi pembayaran pilihan Anda.</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">2</span>
                            <p className="text-zinc-400 text-[10px] leading-relaxed">
                              Masukkan nominal transfer persis sesuai tagihan: <span className="text-emerald-400 font-black">{formatPrice(selectedPlan.price)}</span>.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">3</span>
                            <p className="text-zinc-400 text-[10px] leading-relaxed">Simpan bukti pembayaran, lalu unggah di bawah.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BCA Bank Transfer Content */
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                      {/* BCA Details Container */}
                      <div className="w-full flex flex-col items-center gap-3">
                        <div className="w-full max-w-[240px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-lg shadow-black/40 relative">
                          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-black tracking-wider uppercase">BCA</div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nomor Rekening</p>
                            <p className="text-sm font-black text-white tracking-widest font-mono">8480483953</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy("8480483953", "bca_account")}
                            className="relative w-full py-2.5 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                          >
                            <Copy size={13} />
                            <span>{copiedText === "bca_account" ? "Rekening Disalin!" : "Salin Rekening"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="w-full space-y-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Nama Pemilik Rekening</p>
                            <p className="text-xs font-black text-white">Oky Hari Anfianto</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Nominal Transfer</p>
                            <p className="text-sm font-black text-emerald-400 font-mono">{formatPrice(selectedPlan.price)}</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Petunjuk Pembayaran Transfer</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">1</span>
                              <p className="text-zinc-400 text-[10px] leading-relaxed">Lakukan transfer ke rekening BCA Oky Hari Anfianto di atas.</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">2</span>
                              <p className="text-zinc-400 text-[10px] leading-relaxed">
                                Pastikan nominal persis sesuai tagihan: <span className="text-emerald-400 font-black">{formatPrice(selectedPlan.price)}</span>.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">3</span>
                              <p className="text-zinc-400 text-[10px] leading-relaxed">Simpan struk/bukti transfer Anda, lalu unggah di bawah.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Harap lakukan pembayaran sesuai nilai nominal di atas. Setelah transfer, pastikan Anda menyimpan struk atau screenshot bukti pembayaran untuk diunggah di tahap berikutnya.</p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setCurrentStep(1)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50">
                      Kembali
                    </button>
                    <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2">
                      Konfirmasi Transfer
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Form submission */}
              {currentStep === 3 && (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Shop Details Info */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold">Nama Toko:</span>
                      <span className="text-white font-black">{shop?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold">ID Toko:</span>
                      <span className="text-zinc-300 font-mono font-black">{shop?.shop_code || shop?.id || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-zinc-800/50 pt-2.5">
                      <span className="text-zinc-500 font-bold">Kode Transaksi:</span>
                      <span className="text-zinc-300 font-mono font-bold">#UPG-{currentUniqueCode}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block">Atas Nama Pengirim</label>
                    <input type="text" placeholder="Contoh: Rian Hidayat" value={accountName} onChange={(e) => setAccountName(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block">Bank Asal / Pengirim</label>
                    <input type="text" placeholder="Contoh: BCA / Mandiri / CIMB Niaga" value={bankOrigin} onChange={(e) => setBankOrigin(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block">Unggah Bukti Transfer</label>

                    {!paymentProofPreview ? (
                      <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-2xl p-6 text-center cursor-pointer transition-colors relative group">
                        <input type="file" accept="image/*" onChange={handleFileChange} required className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        <Upload size={28} className="text-zinc-600 group-hover:text-zinc-500 mx-auto mb-2" />
                        <span className="text-[10px] font-bold text-zinc-400 block">Klik atau Seret file Gambar</span>
                        <span className="text-[9px] text-zinc-600 block mt-1">Format JPG, PNG (Maks 1MB)</span>
                      </div>
                    ) : (
                      <div className="relative border border-zinc-800 rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-950 flex items-center justify-center p-2 group">
                        <img src={paymentProofPreview} className="max-h-full max-w-full object-contain rounded-lg" alt="" />
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProof(null);
                            setPaymentProofPreview("");
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                          title="Hapus Bukti"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-3">
                    <button type="button" disabled={isSubmitting} onClick={() => setCurrentStep(2)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50 disabled:opacity-50">
                      Kembali
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                          Mengirim...
                        </>
                      ) : (
                        <>
                          Kirim Pengajuan
                          <CheckCircle size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* QRIS Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-350">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPreviewImage(null)}></div>
          <div className="relative z-10 max-w-lg w-full max-h-[85vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
              <X size={20} />
            </button>
            <img src={previewImage} className="max-h-[75vh] max-w-full object-contain rounded-3xl border-2 border-zinc-800 shadow-2xl" alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
