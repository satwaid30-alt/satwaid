"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, Check, X, AlertTriangle, RefreshCw, FileText, CheckCircle2, AlertCircle, Info, Store, User, Mail, Phone, Calendar, CreditCard, ChevronLeft, Search, Eye, Plus, Trash2, Edit, ArrowRight } from "lucide-react";
import { getApiUrl, getSocketUrl, getLogoUrl } from "@/app/utils/api";
import { io } from "socket.io-client";

const DEFAULT_GRADIENTS = [
  { name: "Emerald & Teal (Default)", value: "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40" },
  { name: "Blue & Violet", value: "from-blue-500/10 via-indigo-500/5 to-zinc-900 hover:border-blue-500/40" },
  { name: "Amber & Orange", value: "from-amber-500/10 via-orange-500/5 to-zinc-900 hover:border-amber-500/40" },
  { name: "Rose & Red", value: "from-rose-500/10 via-red-500/5 to-zinc-900 hover:border-rose-500/40" },
];

const DEFAULT_BADGE_COLORS = [
  { name: "Emerald (Default)", value: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" },
  { name: "Blue", value: "bg-blue-500/10 text-blue-400 border border-blue-500/25" },
  { name: "Amber", value: "bg-amber-500/10 text-amber-400 border border-amber-500/25" },
  { name: "Rose", value: "bg-rose-500/10 text-rose-400 border border-rose-500/25" },
];

export default function AdminUpgradeTokoPage() {
  const [upgrades, setUpgrades] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("pending"); // pending | history | plans
  const [searchQuery, setSearchQuery] = useState("");

  // Upgrade Verification actions state
  const [processingId, setProcessingId] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [zoomImage, setZoomImage] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveUpgradeData, setApproveUpgradeData] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, upgradeId: null, shopName: "", planName: "" });

  // Plans Management state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    sub_name: "",
    price: "",
    duration: "/ 2 Bulan",
    description: "",
    features: [""],
    badge: "",
    badge_color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    popular: false,
    gradient: "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40",
  });
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Helper: hitung info tanggal berakhir paket upgrade (2 bulan dari disetujui)
  const getExpiryInfo = (item) => {
    if (!item || item.status !== 'approved') return null;
    if ((item.shop?.membership_level || "Standard Seller") === "Standard Seller") return null;
    let expDate;
    if (item.expires_at) {
      expDate = new Date(item.expires_at);
    } else if (item.updated_at) {
      expDate = new Date(item.updated_at);
      expDate.setMonth(expDate.getMonth() + 2);
    } else if (item.created_at) {
      expDate = new Date(item.created_at);
      expDate.setMonth(expDate.getMonth() + 2);
    } else {
      return null;
    }
    const now = new Date();
    const diffMs = expDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;
    const formattedDate = expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return { isExpired, diffDays: Math.abs(diffDays), formattedDate, expDate };
  };


  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("admin_token");

      // Fetch Upgrades
      const upgradesRes = await fetch(`${getApiUrl()}/shop-upgrades`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const upgradesResult = await upgradesRes.json();
      if (upgradesRes.ok) {
        setUpgrades(upgradesResult.data || []);
      }

      // Fetch Plans
      const plansRes = await fetch(`${getApiUrl()}/shop-upgrades/plans`);
      const plansResult = await plansRes.json();
      if (plansRes.ok) {
        setPlans(plansResult.data || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Terjadi kesalahan koneksi ke server.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.IO connection for real-time updates
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    let socket;
    try {
      socket = io(getSocketUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });

      socket.on("connect", () => {
        console.log("[Socket] AdminUpgradeTokoPage connected successfully");
        socket.emit("join_admin");
      });

      socket.on("new_upgrade_request", (data) => {
        console.log("[Socket] New upgrade request received:", data);
        loadData(true);
      });

      socket.on("upgrade_request_cancelled", (data) => {
        console.log("[Socket] Upgrade request cancelled:", data);
        loadData(true);
      });

      socket.on("upgrade_plans_updated", () => {
        console.log("[Socket] Upgrade plans updated, reloading plans...");
        loadData(true);
      });
    } catch (e) {
      console.error("[Socket] Error establishing admin socket connection", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleOpenApproveModal = (upgrade) => {
    setApproveUpgradeData(upgrade);
    setShowApproveModal(true);
  };

  const processApprove = async () => {
    if (!approveUpgradeData) return;

    const upgradeId = approveUpgradeData.id;
    setProcessingId(upgradeId);
    setShowApproveModal(false);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/shop-upgrades/${upgradeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({ text: "Pembayaran upgrade berhasil diverifikasi dan disetujui!", type: "success" });
        loadData();
      } else {
        alert(result.message || "Gagal menyetujui pengajuan upgrade.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setProcessingId("");
      setApproveUpgradeData(null);
    }
  };

  const handleOpenRejectModal = (upgrade) => {
    setSelectedUpgrade(upgrade);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan.");
      return;
    }

    setProcessingId(selectedUpgrade.id);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/shop-upgrades/${selectedUpgrade.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectionReason,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({ text: "Pengajuan upgrade berhasil ditolak.", type: "success" });
        setShowRejectModal(false);
        loadData();
      } else {
        alert(result.message || "Gagal menolak pengajuan upgrade.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setProcessingId("");
      setSelectedUpgrade(null);
    }
  };

  // Plan Form handlers
  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        name: plan.name || "",
        sub_name: plan.sub_name || "",
        price: plan.price || "",
        duration: plan.duration || "/ 2 Bulan",
        description: plan.description || "",
        features: Array.isArray(plan.features) && plan.features.length > 0 ? plan.features : [""],
        badge: plan.badge || "",
        badge_color: plan.badge_color || "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
        popular: !!plan.popular,
        gradient: plan.gradient || "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40",
      });
    } else {
      setEditingPlanId(null);
      setPlanForm({
        name: "",
        sub_name: "",
        price: "",
        duration: "/ 2 Bulan",
        description: "",
        features: [""],
        badge: "",
        badge_color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
        popular: false,
        gradient: "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40",
      });
    }
    setShowPlanModal(true);
  };

  const handleAddFeatureInput = () => {
    setPlanForm({ ...planForm, features: [...planForm.features, ""] });
  };

  const handleFeatureInputChange = (index, value) => {
    const updatedFeatures = [...planForm.features];
    updatedFeatures[index] = value;
    setPlanForm({ ...planForm, features: updatedFeatures });
  };

  const handleRemoveFeatureInput = (index) => {
    const updatedFeatures = planForm.features.filter((_, i) => i !== index);
    setPlanForm({ ...planForm, features: updatedFeatures.length > 0 ? updatedFeatures : [""] });
  };

  const handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim() || planForm.price === "") {
      alert("Nama paket dan Harga wajib diisi.");
      return;
    }

    const filteredFeatures = planForm.features.filter((f) => f.trim() !== "");

    setIsSubmittingPlan(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = editingPlanId ? `${getApiUrl()}/shop-upgrades/plans/${editingPlanId}` : `${getApiUrl()}/shop-upgrades/plans`;
      const method = editingPlanId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...planForm,
          features: filteredFeatures,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({
          text: editingPlanId ? "Paket upgrade berhasil diperbarui!" : "Paket upgrade baru berhasil ditambahkan!",
          type: "success",
        });
        setShowPlanModal(false);
        loadData();
      } else {
        alert(result.message || "Gagal menyimpan paket upgrade.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus paket upgrade ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/shop-upgrades/plans/${planId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMessage({ text: "Paket upgrade berhasil dihapus.", type: "success" });
        loadData();
      } else {
        const result = await res.json();
        alert(result.message || "Gagal menghapus paket upgrade.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleOpenDeleteModal = (item) => {
    setDeleteModal({
      isOpen: true,
      upgradeId: item.id,
      shopName: item.shop?.name || "Toko Tanpa Nama",
      planName: item.plan_name || "",
    });
  };

  const confirmDeleteUpgrade = async () => {
    const { upgradeId } = deleteModal;
    if (!upgradeId) return;

    setProcessingId(upgradeId);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/shop-upgrades/${upgradeId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMessage({ text: "Data pemesanan paket berhasil dihapus.", type: "success" });
        setDeleteModal({ isOpen: false, upgradeId: null, shopName: "", planName: "" });
        loadData();
      } else {
        const result = await res.json();
        alert(result.message || "Gagal menghapus data pemesanan paket.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setProcessingId("");
    }
  };

  // Filter lists based on tab and search query
  const filteredUpgrades = upgrades.filter((item) => {
    const isTabMatch = activeTab === "pending" ? item.status === "pending_verification" : item.status !== "pending_verification";

    const shopName = item.shop?.name || "";
    const ownerName = item.shop?.owner?.name || "";
    const ownerEmail = item.shop?.owner?.email || "";
    const searchString = `${shopName} ${ownerName} ${ownerEmail} ${item.account_name}`.toLowerCase();
    const isSearchMatch = searchString.includes(searchQuery.toLowerCase());

    return isTabMatch && isSearchMatch;
  });

  return (
    <div className="space-y-8 w-full max-w-full px-4 sm:px-6 lg:px-8 pb-16 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic uppercase text-white">
            <Sparkles className="text-emerald-500 animate-pulse" size={32} />
            Kelola Upgrade Toko
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Verifikasi pengajuan upgrade status toko, kelola paket upgrade dinamis, dan atur kuota limit seller.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={loadData} disabled={loading} className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-50" title="Refresh Data">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          {activeTab === "plans" && (
            <button onClick={() => handleOpenPlanModal()} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all">
              <Plus size={16} /> Tambah Paket
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`flex items-start gap-4 p-4 rounded-2xl border ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"} animate-in fade-in slide-in-from-top-2 duration-200`}>
          {message.type === "success" ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
          <div className="flex-1 text-sm font-semibold">{message.text}</div>
          <button onClick={() => setMessage({ text: "", type: "" })} className="text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Control Panel: Tabs and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-2xl">
        {/* Tabs */}
        <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("pending")} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "pending" ? "bg-emerald-500 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}>
            Menunggu Verifikasi ({upgrades.filter((u) => u.status === "pending_verification").length})
          </button>
          <button onClick={() => setActiveTab("history")} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "history" ? "bg-emerald-500 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}>
            Riwayat Proses ({upgrades.filter((u) => u.status !== "pending_verification").length})
          </button>
          <button onClick={() => setActiveTab("plans")} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "plans" ? "bg-emerald-500 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}>
            Kelola Paket Upgrade ({plans.length})
          </button>
        </div>

        {/* Search Input (Hidden on plans tab) */}
        {activeTab !== "plans" && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3 text-zinc-550" size={16} />
            <input type="text" placeholder="Cari Toko, Seller, Atas Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all font-bold" />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] animate-pulse"></div>
          ))}
        </div>
      ) : activeTab === "plans" ? (
        /* TAB 3: Upgrade Plans Management */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-zinc-900 border ${plan.popular ? "border-emerald-500/40 relative" : "border-zinc-800"} rounded-[2.5rem] p-8 flex flex-col justify-between bg-gradient-to-b ${plan.gradient || "from-emerald-500/10 via-teal-500/5 to-zinc-900 hover:border-emerald-500/40"} w-full group transition-all duration-300 hover:scale-[1.01]`}
            >
              {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Rekomendasi Utama</div>}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {plan.badge && <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg ${plan.badge_color || "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"}`}>{plan.badge}</span>}
                    <div className="flex gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenPlanModal(plan)} className="p-2 bg-zinc-950/80 hover:bg-zinc-950 text-zinc-300 hover:text-white rounded-lg border border-zinc-800" title="Edit Paket">
                        <Edit size={12} />
                      </button>
                      <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20" title="Hapus Paket">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 leading-none">{plan.name}</h3>
                  {plan.sub_name && <p className="text-sm font-bold text-emerald-400">{plan.sub_name}</p>}
                </div>

                {/* Plan Pricing */}
                <div className="border-y border-zinc-800/60 py-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{formatPrice(plan.price)}</span>
                  <span className="text-zinc-500 text-xs font-bold font-mono">{plan.duration}</span>
                </div>

                {/* Description */}
                {plan.description && <p className="text-zinc-400 text-xs leading-relaxed font-medium">{plan.description}</p>}

                {/* Features List */}
                {Array.isArray(plan.features) && plan.features.length > 0 && (
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
                )}
              </div>

              {/* Preview Button */}
              <div className="mt-8 pt-4 border-t border-zinc-800/40">
                <div className="w-full py-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 text-center text-[10px] font-black uppercase tracking-widest text-zinc-550 flex items-center justify-center gap-1.5">
                  Tampilan Aktif <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>
          ))}

          {/* Add New Plan Blank Card */}
          <div onClick={() => handleOpenPlanModal()} className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/30 bg-zinc-900/10 hover:bg-zinc-900/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[400px] gap-4 group">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all">
              <Plus size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Tambah Paket Baru</h3>
              <p className="text-zinc-600 text-xs max-w-[200px] mx-auto leading-relaxed">Buat dan sesuaikan penawaran paket upgrade limit kuota toko dinamis baru.</p>
            </div>
          </div>
        </div>
      ) : filteredUpgrades.length === 0 ? (
        /* EMPTY STATE: Pending / History */
        <div className="py-16 text-center space-y-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2.5rem]">
          <Store size={44} className="mx-auto text-zinc-750" />
          <div className="space-y-1">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">{activeTab === "pending" ? "Tidak Ada Pengajuan Pending" : "Belum Ada Riwayat Upgrade"}</h3>
            <p className="text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed">{activeTab === "pending" ? "Seluruh pengajuan upgrade toko saat ini telah selesai diproses oleh admin." : "Belum ada pengajuan upgrade yang disetujui atau ditolak sebelumnya."}</p>
          </div>
        </div>
      ) : (
        /* TAB 1 & 2: Upgrades Request Table List */
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toko / Seller</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Paket & Tagihan</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detail Transfer</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Bukti</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status / Durasi</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredUpgrades.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Toko / Seller */}
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-500 border border-zinc-700 shrink-0 overflow-hidden">
                          {item.shop?.logo_url ? <img src={getLogoUrl(item.shop.logo_url)} className="w-full h-full object-cover" alt="" /> : <Store size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-white text-xs leading-tight">{item.shop?.name || "Toko Tanpa Nama"}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Seller: {item.shop?.owner?.name || "-"}</p>
                          <p className="text-[9px] text-zinc-600 font-mono mt-0.5">{item.shop?.owner?.email || "-"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Paket & Tagihan */}
                    <td className="p-6">
                      <div>
                        <p className="font-bold text-white text-xs leading-tight">{item.plan_name}</p>
                        <p className="text-xs text-emerald-400 font-black mt-0.5">{formatPrice(item.price)}</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Kode: <span className="font-mono text-zinc-300 font-bold">#UPG-{item.unique_code}</span></p>
                      </div>
                    </td>

                    {/* Detail Transfer */}
                    <td className="p-6">
                      <div className="text-xs space-y-0.5">
                        <p className="text-zinc-300 font-bold leading-tight">an. {item.account_name}</p>
                        <p className="text-zinc-500 text-[10px]">Bank: <span className="font-bold uppercase text-zinc-400">{item.bank_origin}</span></p>
                        <p className="text-zinc-650 text-[9px]">Diajukan: {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </td>

                    {/* Bukti */}
                    <td className="p-6">
                      <div className="flex justify-center">
                        <div onClick={() => setZoomImage(item.payment_proof)} className="w-16 h-12 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden relative group cursor-pointer shrink-0">
                          <img src={item.payment_proof.startsWith("http") ? item.payment_proof : getApiUrl() + item.payment_proof} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status / Durasi */}
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-1.5 justify-center">
                        {item.status === "pending_verification" ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">Pending</span>
                        ) : (
                          <>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                              item.status === "approved" && (item.shop?.membership_level || "Standard Seller") !== "Standard Seller"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : item.status === "expired" || (item.status === "approved" && (item.shop?.membership_level || "Standard Seller") === "Standard Seller")
                                ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {item.status === "approved" && (item.shop?.membership_level || "Standard Seller") !== "Standard Seller" ? "Disetujui" : item.status === "expired" || (item.status === "approved" && (item.shop?.membership_level || "Standard Seller") === "Standard Seller") ? "Expired" : "Ditolak"}
                            </span>
                            {item.status === "rejected" && item.rejection_reason && <p className="text-[9px] text-zinc-500 max-w-[120px] italic leading-tight text-center">{item.rejection_reason}</p>}
                            {item.status === "approved" && (item.shop?.membership_level || "Standard Seller") !== "Standard Seller" && (() => {
                              const expiry = getExpiryInfo(item);
                              if (!expiry) return null;
                              return (
                                <div className="space-y-0.5 flex flex-col items-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${expiry.isExpired ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                    {expiry.isExpired ? 'Expired' : `${expiry.diffDays}h lagi`}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 font-bold">s/d {expiry.formattedDate}</span>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        {item.status === "pending_verification" && (
                          <>
                            <button onClick={() => handleOpenApproveModal(item)} disabled={processingId === item.id} className="w-8 h-8 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 rounded-lg flex items-center justify-center transition-all border border-emerald-500/25 disabled:opacity-50" title="Setujui">
                              <Check size={14} className="stroke-[3]" />
                            </button>
                            <button onClick={() => handleOpenRejectModal(item)} disabled={processingId === item.id} className="w-8 h-8 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all border border-red-500/25 disabled:opacity-50" title="Tolak">
                              <X size={14} className="stroke-[2.5]" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleOpenDeleteModal(item)} className="w-8 h-8 bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-all border border-zinc-700 hover:border-red-500/20" title="Hapus Data">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans Form Modal: Create & Edit Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSubmittingPlan && setShowPlanModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] relative overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider italic flex items-center gap-2">
                  <Sparkles className="text-emerald-500" size={20} />
                  {editingPlanId ? "Edit Paket Upgrade" : "Tambah Paket Upgrade Baru"}
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">Konfigurasi detail isi dan visual benefit card paket.</p>
              </div>
              <button onClick={() => !isSubmittingPlan && setShowPlanModal(false)} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handlePlanFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Plan Name & Tagline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Nama Paket</label>
                  <input
                    type="text"
                    placeholder="Contoh: Paket Pro Upgrade"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Sub Nama / Tagline</label>
                  <input
                    type="text"
                    placeholder="Contoh: Upgrade Kuota + Payout Cepat"
                    value={planForm.sub_name}
                    onChange={(e) => setPlanForm({ ...planForm, sub_name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors"
                  />
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Harga (Nominal Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors font-bold text-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Masa Aktif / Durasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: / 2 Bulan"
                    value={planForm.duration}
                    onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors"
                  />
                </div>
              </div>

              {/* Badge Text & Badge Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Label Badge</label>
                  <input
                    type="text"
                    placeholder="Contoh: Paket Upgrade Pilihan"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Warna Badge</label>
                  <select value={planForm.badge_color} onChange={(e) => setPlanForm({ ...planForm, badge_color: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white transition-colors">
                    {DEFAULT_BADGE_COLORS.map((bc) => (
                      <option key={bc.value} value={bc.value}>
                        {bc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gradient Theme & Popular ribbon */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-455 uppercase tracking-widest block ml-1">Tema Visual Gradient</label>
                  <select value={planForm.gradient} onChange={(e) => setPlanForm({ ...planForm, gradient: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white transition-colors">
                    {DEFAULT_GRADIENTS.map((gr) => (
                      <option key={gr.value} value={gr.value}>
                        {gr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6 pl-2">
                  <input type="checkbox" id="popular" checked={planForm.popular} onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })} className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20" />
                  <label htmlFor="popular" className="text-xs font-black text-zinc-300 uppercase tracking-wider cursor-pointer">
                    Rekomendasi Utama (Popular)
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Deskripsi Paket</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan keterangan detail keuntungan/kegunaan paket ini..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors resize-none"
                />
              </div>

              {/* Features List Inputs */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block ml-1">Fitur & Keuntungan Utama</label>
                  <button type="button" onClick={handleAddFeatureInput} className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Plus size={12} /> Tambah Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {planForm.features.map((feature, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder={`Contoh: Tambahan 500 Kuota Produk`}
                        value={feature}
                        onChange={(e) => handleFeatureInputChange(index, e.target.value)}
                        required
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 transition-colors"
                      />
                      <button type="button" onClick={() => handleRemoveFeatureInput(index)} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all shrink-0" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-zinc-800">
                <button type="button" disabled={isSubmittingPlan} onClick={() => setShowPlanModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingPlan} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2">
                  {isSubmittingPlan ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {editingPlanId ? "Simpan Perubahan" : "Buat Paket"}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {showRejectModal && selectedUpgrade && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !processingId && setShowRejectModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative overflow-hidden z-10 p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Tolak Pengajuan Upgrade?</h3>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                Anda akan menolak pengajuan upgrade dari toko <span className="text-white font-bold">{selectedUpgrade.shop?.name}</span>. Berikan alasan penolakan agar seller dapat memperbaikinya.
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest block">Alasan Penolakan</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Bukti transfer tidak terbaca / Nominal transfer tidak sesuai."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-red-500/50 transition-all resize-none font-bold placeholder-zinc-700"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" disabled={processingId} onClick={() => setShowRejectModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50">
                  Batal
                </button>
                <button type="submit" disabled={processingId} className="flex-1 py-4 bg-red-500 hover:bg-red-655 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2">
                  {processingId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Tolak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setZoomImage("")}></div>
          <div className="relative z-10 w-full max-w-4xl h-[80vh] flex items-center justify-center">
            <button onClick={() => setZoomImage("")} className="absolute -top-12 right-0 w-10 h-10 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-full flex items-center justify-center">
              <X size={20} />
            </button>
            <img src={zoomImage.startsWith("http") ? zoomImage : getApiUrl() + zoomImage} className="max-w-full max-h-full object-contain rounded-2xl border border-zinc-850 shadow-2xl" alt="Bukti Transfer Zoom" />
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && approveUpgradeData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowApproveModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-750 flex items-center justify-center text-zinc-500 overflow-hidden shrink-0">
                {approveUpgradeData.shop?.logo_url ? <img src={getLogoUrl(approveUpgradeData.shop.logo_url)} className="w-full h-full object-cover" alt="" /> : <Store size={32} className="text-zinc-550" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Verifikasi Pembayaran</h3>
                <p className="text-zinc-400 text-xs leading-relaxed px-4">
                  Apakah Anda yakin ingin memverifikasi dan menyetujui bukti pembayaran upgrade toko <span className="text-white font-bold">{approveUpgradeData.shop?.name}</span>?
                </p>
              </div>

              <div className="w-full bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-550 font-bold">Paket Pilihan:</span>
                  <span className="text-white font-black">{approveUpgradeData.plan_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-550 font-bold">Kode Transaksi:</span>
                  <span className="text-zinc-300 font-mono font-bold">#UPG-{approveUpgradeData.unique_code}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-zinc-800/50 pt-3">
                  <span className="text-zinc-450 font-bold">Total Pembayaran:</span>
                  <span className="text-emerald-400 font-black">{formatPrice(approveUpgradeData.price)}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-left">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase tracking-tight">Tindakan ini hanya memverifikasi pembayaran. Penambahan kuota listing dikelola terpisah di menu Manajemen Toko User.</p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button onClick={processApprove} className="w-full py-4 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-98">
                  Ya, Setujui Pembayaran
                </button>
                <button onClick={() => setShowApproveModal(false)} className="w-full py-4 bg-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-750 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-98">
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !processingId && setDeleteModal({ isOpen: false, upgradeId: null, shopName: "", planName: "" })}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Hapus Data Pemesanan</h3>
                <p className="text-zinc-400 text-xs leading-relaxed px-4">
                  Apakah Anda yakin ingin menghapus data pemesanan paket ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              {deleteModal.shopName && (
                <div className="w-full bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 text-left space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-550 font-bold">Toko:</span>
                    <span className="text-white font-black">{deleteModal.shopName}</span>
                  </div>
                  {deleteModal.planName && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-550 font-bold">Paket:</span>
                      <span className="text-white font-black">{deleteModal.planName}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col w-full gap-3">
                <button onClick={confirmDeleteUpgrade} disabled={processingId} className="w-full py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 active:scale-98 flex items-center justify-center gap-2">
                  {processingId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Hapus Data"}
                </button>
                <button onClick={() => setDeleteModal({ isOpen: false, upgradeId: null, shopName: "", planName: "" })} disabled={processingId} className="w-full py-4 bg-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-750 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-98">
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
