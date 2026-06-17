"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";
import Link from "next/link";
import { ArrowLeft, Store, Phone, MapPin, CreditCard, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert, Shield, Check, X, User, Tag, Info, FileText, Truck } from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function AdminResetTokoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params?.id;

  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "success" });

  // Selected checkboxes for selective reset
  const [selectedFields, setSelectedFields] = useState({
    name: false,
    description: false,
    nik: false,
    phone: false,
    address: false,
    visual: false,
  });

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'selective' or 'all'
    title: "",
    message: "",
  });

  useEffect(() => {
    if (shopId) {
      fetchShopDetail();
    }
  }, [shopId]);

  const fetchShopDetail = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/shops/${shopId}`);
      const result = await response.json();
      if (response.ok) {
        setShop(result.data);
      } else {
        showAlert(result.message || "Gagal memuat detail toko.", "error");
      }
    } catch (err) {
      console.error("Error fetching shop detail:", err);
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

  const toggleCheckbox = (field) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleOpenConfirmModal = (type) => {
    if (type === "selective") {
      const checkedCount = Object.values(selectedFields).filter(Boolean).length;
      if (checkedCount === 0) {
        showAlert("Pilih minimal satu field untuk direset.", "error");
        return;
      }
      setConfirmModal({
        isOpen: true,
        type: "selective",
        title: "Reset Field Terpilih?",
        message: `Apakah Anda yakin ingin mengosongkan ${checkedCount} bagian data terpilih untuk toko "${shop.name}"?`,
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "all",
        title: "Reset Semua Data Toko?",
        message: `Apakah Anda yakin ingin mengosongkan seluruh profil toko "${shop.name}"? Status toko akan dikembalikan ke pending (Menunggu Verifikasi).`,
      });
    }
  };

  const handleResetShop = async () => {
    const { type } = confirmModal;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");

      // Calculate reset payload values
      const payload = {
        name: type === "all" || selectedFields.name ? `Toko Reset #${shopId.substring(0, 5)}` : shop.name || "",
        description: type === "all" || selectedFields.description ? "" : shop.description || "",
        shipping_policy: type === "all" || selectedFields.description ? "" : shop.shipping_policy || "",
        warranty_policy: type === "all" || selectedFields.description ? "" : shop.warranty_policy || "",
        nik: type === "all" || selectedFields.nik ? "" : shop.nik || "",
        whatsapp: type === "all" || selectedFields.phone ? "" : shop.whatsapp || "",
        address: type === "all" || selectedFields.address ? "" : shop.address || "",
        city: type === "all" || selectedFields.address ? "" : shop.city || "",
        province: type === "all" || selectedFields.address ? "" : shop.province || "",
        logo_url: type === "all" || selectedFields.visual ? "" : shop.logo_url || "",
        banner_url: type === "all" || selectedFields.visual ? "" : shop.banner_url || "",

        // If any data is reset, revert status to pending
        status: "pending",
      };

      const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        showAlert(type === "all" ? "Seluruh profil toko berhasil direset." : "Field terpilih berhasil direset.", "success");

        // Clear selected checkboxes
        setSelectedFields({
          name: false,
          description: false,
          nik: false,
          phone: false,
          address: false,
          visual: false,
        });
        setConfirmModal({ isOpen: false, type: "", title: "", message: "" });

        // Reload detail data
        fetchShopDetail();
      } else {
        showAlert(result.message || "Gagal mereset profil toko.", "error");
      }
    } catch (err) {
      console.error("Error executing reset:", err);
      showAlert("Terjadi kesalahan saat memproses reset.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Memuat rincian profil toko...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Toko Tidak Ditemukan</h2>
        <Link href="/admin/reset-toko" className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 text-sm font-bold">
          <ArrowLeft size={16} /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const checkedCount = Object.values(selectedFields).filter(Boolean).length;
  const isShopActive = shop.status === "active";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Alert Banner */}
      {alertInfo.show && (
        <div className={`fixed top-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 ${alertInfo.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {alertInfo.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold">{alertInfo.message}</span>
        </div>
      )}

      {/* Navigation */}
      <div>
        <Link href="/admin/reset-toko" className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-5 py-3 rounded-2xl text-xs font-black transition-all mb-6 active:scale-95">
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">Detail & Reset Toko</h1>
            <p className="text-zinc-500 mt-1 font-medium">Reset rincian atau legalitas toko pengguna secara selektif.</p>
          </div>
          <div>
            <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border inline-flex items-center gap-1.5 shadow-inner ${isShopActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
              {isShopActive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              Status: {shop.status || "active"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Shop Visual Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
            {/* Store Banner Preview */}
            <div className="w-full h-28 bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden relative">
              {shop.banner_url ? <img src={getLogoUrl(shop.banner_url)} alt="Banner Toko" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold uppercase text-[9px] tracking-widest">No Banner</div>}
            </div>

            {/* Logo Shop circled */}
            <div className="w-24 h-24 bg-zinc-850 rounded-[2rem] flex items-center justify-center border-2 border-zinc-800 overflow-hidden mx-auto shadow-2xl -mt-16 relative z-10">
              {shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} alt={shop.name} className="w-full h-full object-cover" /> : <Store size={36} className="text-zinc-500" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white leading-tight">{shop.name || "Toko Belum Dinamai"}</h2>
              <p className="text-emerald-500 font-mono font-bold text-xs">{shop.shop_code || "-"}</p>
            </div>

            <hr className="border-zinc-800" />

            {/* Owner details */}
            <div className="text-left space-y-3">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Informasi Pemilik</p>
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850 space-y-1">
                <p className="text-xs font-bold text-zinc-300">{shop.owner?.name || "Unknown"}</p>
                <p className="text-[10px] text-zinc-500">{shop.owner?.email || "-"}</p>
                {shop.owner?.phone && <p className="text-[10px] text-zinc-500 font-mono mt-1">WA: {shop.owner?.phone}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Current details & Reset Controls */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Shop details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Informasi Rincian Toko Saat Ini</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Nama Toko */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Nama Toko</label>
                <p className={`text-sm font-semibold ${shop.name ? "text-zinc-200" : "text-zinc-650 italic"}`}>{shop.name || "Belum diisi"}</p>
              </div>

              {/* NIK */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">NIK Pemilik (KTP)</label>
                <p className={`text-sm font-semibold font-mono ${shop.nik ? "text-zinc-200" : "text-zinc-650 italic"}`}>{shop.nik || "Belum diisi"}</p>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">No. WhatsApp Toko</label>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-zinc-500" />
                  <p className={`text-sm font-semibold font-mono ${shop.whatsapp ? "text-zinc-200" : "text-zinc-650 italic"}`}>{shop.whatsapp || "Belum diisi"}</p>
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Wilayah (Provinsi & Kota)</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-zinc-500" />
                  <p className={`text-sm font-semibold ${shop.province || shop.city ? "text-zinc-200" : "text-zinc-650 italic"}`}>{shop.province || shop.city ? `${shop.province || "-"}, ${shop.city || "-"}` : "Belum diisi"}</p>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Alamat Toko</label>
                <p className={`text-sm font-semibold leading-relaxed ${shop.address ? "text-zinc-200" : "text-zinc-650 italic"}`}>{shop.address || "Belum diisi"}</p>
              </div>

              {/* Deskripsi Toko */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-emerald-500 shadow-md">
                    <Store size={15} />
                  </div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Deskripsi Toko</label>
                </div>
                <div 
                  className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-3xl text-sm leading-relaxed description-content break-words text-zinc-300"
                  dangerouslySetInnerHTML={{ 
                    __html: shop.description || '<p class="italic text-zinc-600">Tidak ada deskripsi toko.</p>' 
                  }}
                />
              </div>

              {/* Kebijakan Pengiriman */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-emerald-500 shadow-md">
                    <Truck size={15} />
                  </div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Kebijakan Pengiriman</label>
                </div>
                <div 
                  className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-3xl text-sm leading-relaxed description-content break-words text-zinc-300"
                  dangerouslySetInnerHTML={{ 
                    __html: shop.shipping_policy || '<p class="italic text-zinc-600">Tidak ada kebijakan pengiriman.</p>' 
                  }}
                />
              </div>

              {/* Kebijakan Garansi */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-emerald-500 shadow-md">
                    <Shield size={15} />
                  </div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Kebijakan Garansi</label>
                </div>
                <div 
                  className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-3xl text-sm leading-relaxed description-content break-words text-zinc-300"
                  dangerouslySetInnerHTML={{ 
                    __html: shop.warranty_policy || '<p class="italic text-zinc-600">Tidak ada kebijakan garansi.</p>' 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Selective reset panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Panel Reset Selektif</h3>
              <p className="text-zinc-500 text-xs font-semibold mt-1">Pilih bagian data toko mana saja yang ingin dikosongkan. Menyetujui reset juga akan mengembalikan status toko menjadi pending.</p>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Nama Toko */}
              <div onClick={() => toggleCheckbox("name")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.name ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Nama Toko</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Direset ke nama reset standar</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.name ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.name && <Check size={14} className="stroke-[3]" />}</div>
              </div>

              {/* Box 2: Deskripsi & Kebijakan */}
              <div onClick={() => toggleCheckbox("description")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.description ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Deskripsi & Kebijakan</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Hapus deskripsi, kebijakan kirim & garansi</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.description ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.description && <Check size={14} className="stroke-[3]" />}</div>
              </div>

              {/* Box 3: NIK Toko */}
              <div onClick={() => toggleCheckbox("nik")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.nik ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">NIK KTP Toko</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Kosongkan NIK verifikasi toko</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.nik ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.nik && <Check size={14} className="stroke-[3]" />}</div>
              </div>

              {/* Box 4: WhatsApp */}
              <div onClick={() => toggleCheckbox("phone")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.phone ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Kontak WhatsApp</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Kosongkan nomor WhatsApp toko</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.phone ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.phone && <Check size={14} className="stroke-[3]" />}</div>
              </div>

              {/* Box 5: Alamat & Wilayah */}
              <div onClick={() => toggleCheckbox("address")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.address ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Alamat & Wilayah</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Hapus alamat, kota & provinsi toko</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.address ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.address && <Check size={14} className="stroke-[3]" />}</div>
              </div>

              {/* Box 6: Logo & Banner */}
              <div onClick={() => toggleCheckbox("visual")} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedFields.visual ? "bg-red-500/10 border-red-500/30 text-white" : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Visual Logo & Banner</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Kosongkan logo dan sampul toko</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedFields.visual ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"}`}>{selectedFields.visual && <Check size={14} className="stroke-[3]" />}</div>
              </div>
            </div>

            {/* Warning info */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">Mereset informasi legalitas (seperti NIK atau Alamat) akan menuntut pihak toko untuk mengulang proses verifikasi manual dari dashboard admin.</p>
            </div>

            {/* Actions buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleOpenConfirmModal("selective")}
                disabled={checkedCount === 0}
                className="flex-1 py-4 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white hover:border-red-500 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500/5 disabled:hover:text-red-500"
              >
                <RefreshCw size={16} />
                Reset Field Terpilih ({checkedCount})
              </button>

              <button type="button" onClick={() => handleOpenConfirmModal("all")} className="flex-1 py-4 bg-zinc-800 text-zinc-400 hover:bg-red-650 hover:text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95">
                <X size={16} />
                Reset Semua Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <ActionModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, type: "", title: "", message: "" })} onConfirm={handleResetShop} type="danger" title={confirmModal.title} message={confirmModal.message} confirmText="Ya, Reset Toko" cancelText="Batalkan" isLoading={isSubmitting}>
        <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
          <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">Tindakan ini akan langsung diaplikasikan pada database. Toko akan didegradasi statusnya menjadi pending.</p>
        </div>
      </ActionModal>
    </div>
  );
}
