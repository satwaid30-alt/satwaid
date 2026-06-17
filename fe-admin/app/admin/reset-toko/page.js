"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";
import Link from "next/link";
import { Store, Search, Filter, RefreshCw, Eye, AlertCircle, CheckCircle2, Trash2, MapPin, Phone, User, X, Info, ShieldAlert } from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function AdminResetTokoPage() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Alert banner state
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "success" });

  // Reset modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    shopId: null,
    shopName: "",
    shopCode: "",
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/shops`);
      const result = await response.json();
      if (response.ok) {
        setShops(result.data || []);
      } else {
        showAlert(result.message || "Gagal memuat daftar toko.", "error");
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
      showAlert("Terjadi kesalahan saat menghubungi server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setAlertInfo({ show: true, message, type });
    setTimeout(() => {
      setAlertInfo((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleOpenResetModal = (shop) => {
    setConfirmModal({
      isOpen: true,
      shopId: shop.id,
      shopName: shop.name || `Toko #${shop.id}`,
      shopCode: shop.shop_code || "-",
    });
  };

  const handleConfirmReset = async () => {
    const { shopId } = confirmModal;
    setIsResetting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: `Toko Reset #${shopId.substring(0, 5)}`, // Fallback dummy name
          description: "",
          address: "",
          city: "",
          province: "",
          whatsapp: "",
          logo_url: "",
          banner_url: "",
          nik: "",
          status: "pending", // Revert verification back to pending
          shipping_policy: "",
          warranty_policy: "",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        showAlert(`Toko "${confirmModal.shopName}" berhasil direset secara keseluruhan.`, "success");
        setConfirmModal({ isOpen: false, shopId: null, shopName: "", shopCode: "" });
        fetchShops();
      } else {
        showAlert(result.message || "Gagal mereset toko.", "error");
      }
    } catch (err) {
      console.error("Error resetting shop:", err);
      showAlert("Terjadi kesalahan koneksi saat memproses reset.", "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Filtering Logic
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      (shop.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.shop_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.owner?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (shop.status || "active").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "rejected":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Memuat data toko...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Alert Alert */}
      {alertInfo.show && (
        <div
          className={`fixed top-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 ${
            alertInfo.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {alertInfo.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold">{alertInfo.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Store className="text-emerald-500 animate-pulse" size={32} />
            Reset Profil Toko
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Reset informasi, legalitas (NIK), serta foto/logo toko yang terdaftar.</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Toko</p>
            <p className="text-xl font-black text-white">{shops.length}</p>
          </div>
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Aktif</p>
            <p className="text-xl font-black text-emerald-400">{shops.filter((s) => (s.status || "active") === "active").length}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
            <p className="text-xl font-black text-amber-400">{shops.filter((s) => s.status === "pending").length}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari nama toko, kode toko, atau pemilik..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <select
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all appearance-none shadow-xl cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Semua Status Verifikasi</option>
            <option value="active">Aktif</option>
            <option value="pending">Menunggu Verifikasi (Pending)</option>
            <option value="suspended">Ditangguhkan (Suspended)</option>
            <option value="rejected">Ditolak (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Shop Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-12 text-center">No</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toko</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemilik</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kontak & Lokasi</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop, index) => {
                  return (
                    <tr key={shop.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-6 text-center text-xs font-bold text-zinc-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Shop Column */}
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-850 rounded-2xl flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0">
                            {shop.logo_url ? (
                              <img
                                src={getLogoUrl(shop.logo_url)}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store size={20} className="text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">
                              {shop.name || "Toko Belum Dinamai"}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono font-bold mt-1">
                              {shop.shop_code || `#${shop.id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Column */}
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-zinc-500" />
                          <div>
                            <p className="text-xs font-bold text-zinc-350 leading-none">
                              {shop.owner?.name || "Unknown Owner"}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">{shop.owner?.email || "-"}</p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp / Location */}
                      <td className="p-6">
                        <div className="space-y-1">
                          {shop.whatsapp ? (
                            <p className="text-xs font-semibold text-zinc-300 font-mono flex items-center gap-1.5">
                              <Phone size={10} className="text-zinc-500" />
                              {shop.whatsapp}
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-650 font-bold italic uppercase">No WhatsApp</p>
                          )}
                          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider flex items-center gap-1">
                            <MapPin size={10} className="text-zinc-500" />
                            {shop.city || "-"}, {shop.province || "-"}
                          </p>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="p-6">
                        <div className="flex justify-center">
                          <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(shop.status)}`}>
                            {shop.status || "active"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Detail / Edit Shop */}
                          <Link
                            href={`/admin/reset-toko/detail/${shop.id}`}
                            className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750 rounded-xl flex items-center justify-center transition-all border border-zinc-700 active:scale-90"
                            title="Detail & Reset Selektif"
                          >
                            <Eye size={18} />
                          </Link>

                          {/* Quick Reset */}
                          <button
                            onClick={() => handleOpenResetModal(shop)}
                            className="w-10 h-10 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10 active:scale-90"
                            title="Reset Toko Lengkap"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Store size={48} className="text-zinc-750" />
                      <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Toko Tidak Ditemukan</p>
                      <p className="text-zinc-650 text-xs">Coba ubah kata kunci pencarian atau filter status Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Reset Modal */}
      <ActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, shopId: null, shopName: "", shopCode: "" })}
        onConfirm={handleConfirmReset}
        type="danger"
        title="Reset Semua Data Toko?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh informasi toko "${confirmModal.shopName}" (${confirmModal.shopCode})?`}
        confirmText="Ya, Reset Toko"
        cancelText="Batal"
        isLoading={isResetting}
      >
        <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
          <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
            Tindakan ini akan mengosongkan seluruh deskripsi toko, NIK legalitas, logo, banner, no. WhatsApp, serta mengubah status toko kembali menjadi pending (Menunggu Verifikasi) agar penjual mendaftar ulang.
          </p>
        </div>
      </ActionModal>
    </div>
  );
}

