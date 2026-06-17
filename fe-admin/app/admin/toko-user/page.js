"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";
import Link from "next/link";
import { Store, Search, Filter, MoreVertical, Eye, ShieldCheck, ShieldAlert, Trash2, MapPin, Phone, Calendar, ExternalLink, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, ShoppingBag, Ban, UserCheck, X, Info, Fingerprint, CreditCard, PlusCircle } from "lucide-react";

export default function AdminTokoUserPage() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("shops"); // 'shops' or 'quota'

  // Confirm Action State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'active', 'suspended', 'delete'
    shopId: null,
    shopName: "",
  });

  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    shopId: null,
    shopName: "",
    reason: "",
  });

  const [quotaModal, setQuotaModal] = useState({
    isOpen: false,
    shopId: null,
    shopName: "",
    currentLimit: 500,
    actionType: "add", // 'add' or 'reduce'
    amount: 0,
    used: 0,
  });

  const [membershipModal, setMembershipModal] = useState({
    isOpen: false,
    shopId: null,
    shopName: "",
    currentLevel: "Standard Seller",
    newLevel: "Standard Seller",
  });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/shops`);
      const result = await response.json();
      if (response.ok) {
        setShops(result.data);
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = (shop, type) => {
    setConfirmModal({
      isOpen: true,
      type,
      shopId: shop.id,
      shopName: shop.name,
    });
  };

  const processStatusUpdate = async () => {
    const { shopId, type } = confirmModal;
    try {
      const token = localStorage.getItem("admin_token");
      let response;
      if (type === "delete") {
        response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      } else {
        response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ status: type }),
        });
      }

      if (response.ok) {
        fetchShops();
        setConfirmModal({ isOpen: false, type: "", shopId: null, shopName: "" });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error processing shop action:", err);
    }
  };

  const processRejection = async () => {
    const { shopId, reason } = rejectionModal;
    if (!reason.trim()) {
      alert("Harap isi alasan penolakan.");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: reason,
        }),
      });

      if (response.ok) {
        fetchShops();
        setRejectionModal({ isOpen: false, shopId: null, shopName: "", reason: "" });
      }
    } catch (err) {
      console.error("Error rejecting shop:", err);
    }
  };

  const handleManageQuota = (shop) => {
    const limit = shop.listing_limit || 500;
    setQuotaModal({
      isOpen: true,
      shopId: shop.id,
      shopName: shop.name,
      currentLimit: limit,
      actionType: "add",
      amount: 0,
      used: shop.listings ? shop.listings.length : 0,
    });
  };

  const processQuotaUpdate = async (e) => {
    if (e) e.preventDefault();
    const { shopId, currentLimit, actionType, amount } = quotaModal;
    const newLimit = actionType === "add" ? currentLimit + amount : currentLimit - amount;
    if (newLimit < quotaModal.used) {
      alert(`Batas kuota baru tidak boleh kurang dari kuota terpakai (${quotaModal.used} listing).`);
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ listing_limit: newLimit }),
      });

      if (response.ok) {
        fetchShops();
        setQuotaModal({ isOpen: false, shopId: null, shopName: "", currentLimit: 500, actionType: "add", amount: 0, used: 0 });
      } else {
        const resData = await response.json();
        alert(resData.message || "Gagal memperbarui kuota toko");
      }
    } catch (err) {
      console.error("Error updating shop quota limit:", err);
      alert("Terjadi kesalahan saat memproses permintaan.");
    }
  };

  const handleManageMembership = (shop) => {
    setMembershipModal({
      isOpen: true,
      shopId: shop.id,
      shopName: shop.name,
      currentLevel: shop.membership_level || "Standard Seller",
      newLevel: shop.membership_level || "Standard Seller",
    });
  };

  const processMembershipUpdate = async (e) => {
    if (e) e.preventDefault();
    const { shopId, newLevel } = membershipModal;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ membership_level: newLevel }),
      });

      if (response.ok) {
        fetchShops();
        setMembershipModal({ isOpen: false, shopId: null, shopName: "", currentLevel: "Standard Seller", newLevel: "Standard Seller" });
      } else {
        const resData = await response.json();
        alert(resData.message || "Gagal memperbarui level keanggotaan toko");
      }
    } catch (err) {
      console.error("Error updating shop membership level:", err);
      alert("Terjadi kesalahan saat memproses permintaan.");
    }
  };

  // Filter Logic
  const filteredShops = shops.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || (shop.owner?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (shop.shop_code || "").toLowerCase().includes(searchQuery.toLowerCase()) || String(shop.id).toLowerCase().includes(searchQuery.toLowerCase());

    // Match status (handling case sensitivity)
    const currentStatus = shop.status?.toLowerCase();
    const filterStatus = statusFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || currentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "rejected":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  // Helper: hitung tanggal berakhir dari upgrade yang approved
  const getUpgradeExpiryInfo = (upgrade) => {
    if (!upgrade || upgrade.status !== "approved") return null;
    let expDate;
    if (upgrade.expires_at) {
      expDate = new Date(upgrade.expires_at);
    } else if (upgrade.updated_at) {
      expDate = new Date(upgrade.updated_at);
      expDate.setMonth(expDate.getMonth() + 2);
    } else if (upgrade.created_at) {
      expDate = new Date(upgrade.created_at);
      expDate.setMonth(expDate.getMonth() + 2);
    } else {
      return null;
    }
    const now = new Date();
    const diffMs = expDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;
    const formattedDate = expDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return { isExpired, diffDays: Math.abs(diffDays), formattedDate };
  };

  const renderUpgradeStatus = (shop) => {
    if ((shop.membership_level || "Standard Seller") === "Standard Seller") {
      return (
        <div className="flex justify-center">
          <span className="text-zinc-650 font-bold text-xs">Tidak Ada</span>
        </div>
      );
    }

    const latestUpgrade = shop.upgrades && shop.upgrades.length > 0 ? [...shop.upgrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;

    if (!latestUpgrade) {
      return (
        <div className="flex justify-center">
          <span className="text-zinc-650 font-bold text-xs">Tidak Ada</span>
        </div>
      );
    }

    switch (latestUpgrade.status?.toLowerCase()) {
      case "pending_verification":
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Pending</span>
            <span className="text-[9px] text-zinc-500 font-bold">{latestUpgrade.plan_name}</span>
          </div>
        );
      case "approved":
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/25">Disetujui</span>
            <span className="text-[9px] text-zinc-500 font-bold">{latestUpgrade.plan_name}</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/25">Ditolak</span>
            <span className="text-[9px] text-zinc-500 font-bold">{latestUpgrade.plan_name}</span>
          </div>
        );
      default:
        return (
          <div className="flex justify-center">
            <span className="text-zinc-650 font-bold text-xs">-</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 lg:p-10 space-y-8 animate-in fade-in duration-700 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Store className="text-emerald-500" size={32} />
            Manajemen Toko User
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Pantau dan kelola semua toko yang terdaftar di platform.</p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Toko</p>
            <p className="text-xl font-black text-white">{shops.length}</p>
          </div>
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Suspended</p>
            <p className="text-xl font-black text-red-500">{shops.filter((s) => s.status?.toLowerCase() === "suspended").length}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kuota Penuh</p>
            <p className="text-xl font-black text-amber-500">{shops.filter((s) => (s.listings?.length || 0) >= (s.listing_limit || 500)).length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 w-fit">
        <button onClick={() => setActiveTab("shops")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "shops" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}>
          Informasi Toko
        </button>
        <button onClick={() => setActiveTab("quota")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "quota" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}>
          Kuota Produk Toko
        </button>
        <button onClick={() => setActiveTab("membership")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "membership" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}>
          Level Keanggotaan
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input type="text" placeholder="Cari nama toko, pemilik, atau ID toko..." className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all shadow-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <select className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all appearance-none shadow-xl" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Semua Status</option>
            <option value="pending">Menunggu Verifikasi (Pending)</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan (Suspend)</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {activeTab === "shops" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800">
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informasi Toko</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemilik</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Total Produk</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Terdaftar</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Upgrade</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tgl Berakhir Upgrade</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden">{shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={24} />}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">{shop.name}</p>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono text-[9px] font-bold border border-zinc-850">{shop.shop_code || `#${shop.id}`}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {shop.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="font-bold text-zinc-200 leading-tight">{shop.owner?.name || "Unknown"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{shop.owner?.email || "-"}</p>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20">
                        <ShoppingBag size={12} />
                        <span className="text-xs font-black">{shop.listings?.length || 0}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-xs font-bold text-zinc-300">{new Date(shop.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">Terdaftar</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(shop.status)}`}>{shop.status || "active"}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">{renderUpgradeStatus(shop)}</td>
                    <td className="p-6 text-center">
                      {(() => {
                        if ((shop.membership_level || "Standard Seller") === "Standard Seller") {
                          return <span className="text-zinc-600 text-xs font-bold">-</span>;
                        }
                        const latestUpgrade = shop.upgrades && shop.upgrades.length > 0 ? [...shop.upgrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
                        if (!latestUpgrade || latestUpgrade.status !== "approved") {
                          return <span className="text-zinc-600 text-xs font-bold">-</span>;
                        }
                        const expiry = getUpgradeExpiryInfo(latestUpgrade);
                        if (!expiry) return <span className="text-zinc-600 text-xs font-bold">-</span>;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                expiry.isExpired ? "bg-red-500/10 text-red-400 border border-red-500/20" : expiry.diffDays <= 14 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              <Calendar size={9} />
                              {expiry.isExpired ? "Paket Berakhir" : `Aktif · ${expiry.diffDays}h`}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold">s/d {expiry.formattedDate}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/toko-user/detail-toko/${shop.id}`} className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all hover:bg-zinc-700 border border-zinc-700" title="Detail Lengkap">
                          <Eye size={18} />
                        </Link>

                        {shop.status?.toLowerCase() === "active" ? (
                          <button onClick={() => handleConfirmAction(shop, "suspended")} className="w-10 h-10 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all border border-amber-500/20" title="Suspend Toko">
                            <Ban size={18} />
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleConfirmAction(shop, "active")} className="w-10 h-10 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all border border-emerald-500/20" title="Aktifkan Toko">
                              <UserCheck size={18} />
                            </button>
                            {shop.status?.toLowerCase() === "pending" && (
                              <button
                                onClick={() =>
                                  setRejectionModal({
                                    isOpen: true,
                                    shopId: shop.id,
                                    shopName: shop.name,
                                    reason: "",
                                  })
                                }
                                className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/20"
                                title="Tolak Verifikasi"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        )}

                        <button onClick={() => handleConfirmAction(shop, "delete")} className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/20" title="Hapus Toko Permanen">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "quota" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800">
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toko</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemilik</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Kuota Terpakai</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Sisa Kuota</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kapasitas / Progress</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tgl Berakhir Upgrade</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredShops.map((shop) => {
                  const limit = shop.listing_limit || 500;
                  const used = shop.listings ? shop.listings.length : 0;
                  const remaining = Math.max(0, limit - used);
                  const percentage = Math.min(100, Math.round((used / limit) * 100));

                  let capColor = "text-emerald-500";
                  let capBg = "bg-emerald-500/10 border-emerald-500/20";
                  let capLabel = "Aman";
                  let barColor = "bg-emerald-500";

                  if (used >= limit) {
                    capColor = "text-red-500";
                    capBg = "bg-red-500/10 border-red-500/20";
                    capLabel = "Penuh";
                    barColor = "bg-red-500";
                  } else if (used >= limit * 0.8) {
                    capColor = "text-amber-500";
                    capBg = "bg-amber-500/10 border-amber-500/20";
                    capLabel = "Hampir Penuh";
                    barColor = "bg-amber-500";
                  }

                  return (
                    <tr key={shop.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden">{shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={24} />}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">{shop.name}</p>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono text-[9px] font-bold border border-zinc-850">{shop.shop_code || `#${shop.id}`}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                              <MapPin size={10} /> {shop.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div>
                          <p className="font-bold text-zinc-200 leading-tight">{shop.owner?.name || "Unknown"}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{shop.owner?.email || "-"}</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <p className="text-sm font-black text-white">
                            {used} <span className="text-zinc-500 font-bold text-xs">/ {limit}</span>
                          </p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">Listing</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <p className="text-sm font-black text-zinc-300">{remaining}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">Sisa</p>
                        </div>
                      </td>
                      <td className="p-6 min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-bold">{percentage}%</span>
                            <span className="text-zinc-600 font-medium">Kapasitas</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${capBg} ${capColor}`}>{capLabel}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        {(() => {
                          if ((shop.membership_level || "Standard Seller") === "Standard Seller") {
                            return <span className="text-zinc-650 text-xs font-bold">-</span>;
                          }
                          const latestUpgrade = shop.upgrades && shop.upgrades.length > 0 ? [...shop.upgrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
                          const expiry = getUpgradeExpiryInfo(latestUpgrade);
                          if (!latestUpgrade || latestUpgrade.status !== "approved") {
                            return <span className="text-zinc-650 text-xs font-bold">-</span>;
                          }
                          if (!expiry) return <span className="text-zinc-650 text-xs font-bold">-</span>;
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                  expiry.isExpired ? "bg-red-500/10 text-red-400 border border-red-500/15" : expiry.diffDays <= 14 ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                }`}
                              >
                                <Calendar size={9} />
                                {expiry.isExpired ? "Berakhir" : `${expiry.diffDays}h lagi`}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-bold">s/d {expiry.formattedDate}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center">
                          <button onClick={() => handleManageQuota(shop)} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all border border-emerald-500/20 whitespace-nowrap" title="Kelola Kuota">
                            <PlusCircle size={15} />
                            <span>Tambah Kuota</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === "membership" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800">
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informasi Toko</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemilik</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Batas Kuota</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Level Keanggotaan</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Upgrade</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tgl Berakhir Upgrade</th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredShops.map((shop) => {
                  const currentLevel = shop.membership_level || "Standard Seller";
                  let badgeStyle = "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
                  if (currentLevel === "Pro Seller") {
                    badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
                  } else if (currentLevel === "Enterprise Seller") {
                    badgeStyle = "bg-purple-500/10 text-purple-400 border border-purple-500/25";
                  }
                  return (
                    <tr key={shop.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden">{shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={24} />}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">{shop.name}</p>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono text-[9px] font-bold border border-zinc-850">{shop.shop_code || `#${shop.id}`}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                              <MapPin size={10} /> {shop.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div>
                          <p className="font-bold text-zinc-200 leading-tight">{shop.owner?.name || "Unknown"}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{shop.owner?.email || "-"}</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="text-sm font-black text-white">{shop.listing_limit || 500} Listing</span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeStyle}`}>{currentLevel}</span>
                          <span className="text-[9px] text-zinc-500 font-bold">{currentLevel === "Pro Seller" ? "Kecepatan Pencairan Dana: 1-2 Hari Kerja" : currentLevel === "Enterprise Seller" ? "Kecepatan Pencairan Dana: 1 Hari Kerja" : "Kecepatan Pencairan Dana: 3-5 Hari Kerja"}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">{renderUpgradeStatus(shop)}</td>
                      <td className="p-6 text-center">
                        {(() => {
                          if ((shop.membership_level || "Standard Seller") === "Standard Seller") {
                            return <span className="text-zinc-600 text-xs font-bold">-</span>;
                          }
                          const latestUpgrade = shop.upgrades && shop.upgrades.length > 0 ? [...shop.upgrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
                          if (!latestUpgrade || latestUpgrade.status !== "approved") {
                            return <span className="text-zinc-600 text-xs font-bold">-</span>;
                          }
                          const expiry = getUpgradeExpiryInfo(latestUpgrade);
                          if (!expiry) return <span className="text-zinc-600 text-xs font-bold">-</span>;
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                  expiry.isExpired ? "bg-red-500/10 text-red-400 border border-red-500/20" : expiry.diffDays <= 14 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                <Calendar size={9} />
                                {expiry.isExpired ? "Paket Berakhir" : `Aktif · ${expiry.diffDays}h`}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-bold">s/d {expiry.formattedDate}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center">
                          <button onClick={() => handleManageMembership(shop)} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all border border-emerald-500/20 whitespace-nowrap" title="Ubah Level">
                            <UserCheck size={15} />
                            <span>Ubah Level</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirm Action Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${confirmModal.type === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : confirmModal.type === "delete" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}
              >
                {confirmModal.type === "active" ? <UserCheck size={40} /> : confirmModal.type === "delete" ? <Trash2 size={40} /> : <Ban size={40} />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">{confirmModal.type === "active" ? "Aktifkan Toko?" : confirmModal.type === "delete" ? "Hapus Toko Permanen?" : "Suspend Toko?"}</h3>
                <p className="text-zinc-500 text-sm font-medium px-4">
                  Apakah Anda yakin ingin {confirmModal.type === "active" ? "mengaktifkan" : confirmModal.type === "delete" ? "menghapus permanen" : "menonaktifkan (suspend)"} toko
                  <span className="text-white font-bold block mt-1">{confirmModal.shopName}</span>
                </p>
              </div>

              {confirmModal.type === "suspended" && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-left">
                  <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase tracking-tight">Seluruh iklan dari toko ini akan disembunyikan dari publik secara otomatis.</p>
                </div>
              )}

              {confirmModal.type === "delete" && (
                <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase tracking-tight">Tindakan ini tidak dapat dibatalkan. Seluruh data toko dan iklan akan dihapus secara permanen dari database.</p>
                </div>
              )}

              <div className="flex flex-col w-full gap-3">
                <button onClick={processStatusUpdate} className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${confirmModal.type === "active" ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-emerald-500/20" : "bg-red-500 text-white hover:bg-red-400 shadow-red-500/20"}`}>
                  Ya, {confirmModal.type === "active" ? "Aktifkan" : confirmModal.type === "delete" ? "Hapus Permanen" : "Suspend"} Toko
                </button>
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all">
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg p-10 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <XCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Tolak Verifikasi Toko</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{rejectionModal.shopName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Alasan Penolakan & Masukan</label>
                <textarea
                  className="w-full bg-zinc-950 border border-zinc-800 text-white p-6 rounded-3xl focus:outline-none focus:border-red-500 transition-all min-h-[150px] text-sm leading-relaxed placeholder:text-zinc-700"
                  placeholder="Contoh: NIK tidak valid, foto logo melanggar aturan, atau deskripsi kurang jelas..."
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                ></textarea>
                <div className="flex items-start gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                  <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Alasan ini akan ditampilkan kepada penjual di halaman profil toko mereka agar dapat diperbaiki.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={processRejection} className="w-full py-4 bg-red-500 text-white hover:bg-red-400 rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-500/20">
                  Konfirmasi Tolak Verifikasi
                </button>
                <button onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })} className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all">
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Quota Modal */}
      {quotaModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setQuotaModal({ ...quotaModal, isOpen: false })}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-10 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={processQuotaUpdate} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <PlusCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Kelola Kuota Produk</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{quotaModal.shopName}</p>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">Kuota Terpakai:</span>
                  <span className="text-white font-black">{quotaModal.used} Listing</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">Limit Saat Ini:</span>
                  <span className="text-zinc-300 font-black">{quotaModal.currentLimit} Listing</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-zinc-800/50 pt-4">
                  <span className="text-zinc-400 font-bold">Batas Kuota Baru:</span>
                  <span className={`font-black text-sm ${quotaModal.actionType === "add" ? "text-emerald-400" : "text-red-400"}`}>{quotaModal.actionType === "add" ? quotaModal.currentLimit + quotaModal.amount : quotaModal.currentLimit - quotaModal.amount} Listing</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Tindakan Kuota</label>
                <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                  <button type="button" onClick={() => setQuotaModal({ ...quotaModal, actionType: "add" })} className={`py-3 rounded-xl text-xs font-black transition-all ${quotaModal.actionType === "add" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
                    Tambah Kuota (+)
                  </button>
                  <button type="button" onClick={() => setQuotaModal({ ...quotaModal, actionType: "reduce" })} className={`py-3 rounded-xl text-xs font-black transition-all ${quotaModal.actionType === "reduce" ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"}`}>
                    Kurangi Kuota (-)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Nominal / Jumlah Listing</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-black text-lg"
                    value={quotaModal.amount === 0 ? "" : quotaModal.amount}
                    placeholder="0"
                    onChange={(e) => setQuotaModal({ ...quotaModal, amount: Math.abs(parseInt(e.target.value)) || 0 })}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-550">Listing</span>
                </div>
                <p className="text-[10px] text-zinc-600 px-2 leading-relaxed">* Masukkan jumlah nominal kuota yang ingin {quotaModal.actionType === "add" ? "ditambahkan ke" : "dikurangi dari"} limit kuota toko saat ini.</p>
              </div>

              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full py-4 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20">
                  Simpan Perubahan
                </button>
                <button type="button" onClick={() => setQuotaModal({ ...quotaModal, isOpen: false })} className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all">
                  Batalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Membership Modal */}
      {membershipModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setMembershipModal({ ...membershipModal, isOpen: false })}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-10 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={processMembershipUpdate} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Level Keanggotaan</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{membershipModal.shopName}</p>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">Level Saat Ini:</span>
                  <span className="text-white font-black">{membershipModal.currentLevel}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-zinc-800/50 pt-4">
                  <span className="text-zinc-400 font-bold">Level Baru:</span>
                  <span className="font-black text-sm text-emerald-400">{membershipModal.newLevel}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Pilih Level Baru</label>
                <div className="flex flex-col gap-2.5">
                  {["Standard Seller", "Pro Seller", "Enterprise Seller"].map((level) => {
                    let badgeColor = "text-zinc-400 border-zinc-800 bg-zinc-950";
                    if (level === "Pro Seller") {
                      badgeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                    } else if (level === "Enterprise Seller") {
                      badgeColor = "text-purple-400 border-purple-500/20 bg-purple-500/5";
                    }
                    const isSelected = membershipModal.newLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setMembershipModal({ ...membershipModal, newLevel: level })}
                        className={`w-full p-4 rounded-2xl border text-left text-xs font-black transition-all flex items-center justify-between ${badgeColor} ${isSelected ? "ring-2 ring-emerald-500 border-emerald-500" : "hover:border-zinc-700"}`}
                      >
                        <div className="flex flex-col text-left">
                          <span>{level}</span>
                          <span className="text-[10px] opacity-70 font-bold mt-1">{level === "Pro Seller" ? "Kecepatan Pencairan Dana: 1-2 Hari Kerja" : level === "Enterprise Seller" ? "Kecepatan Pencairan Dana: 1 Hari Kerja" : "Kecepatan Pencairan Dana: 3-5 Hari Kerja"}</span>
                        </div>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full py-4 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20">
                  Simpan Perubahan
                </button>
                <button type="button" onClick={() => setMembershipModal({ ...membershipModal, isOpen: false })} className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all">
                  Batalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
