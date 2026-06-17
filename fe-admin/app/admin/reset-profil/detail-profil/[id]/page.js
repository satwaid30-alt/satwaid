"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, CreditCard, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert, Check, X, ShieldCheck } from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function AdminResetProfilDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "success" });

  // Selected checkboxes for selective reset
  const [selectedFields, setSelectedFields] = useState({
    name: false,
    avatar: false,
    phone: false,
    address: false,
    bank: false,
  });

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'selective' or 'all'
    title: "",
    message: "",
  });

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/users/${userId}`);
      const result = await response.json();
      if (response.ok) {
        setUser(result.data);
      } else {
        showAlert(result.message || "Gagal memuat profil user.", "error");
      }
    } catch (err) {
      console.error("Error fetching user detail:", err);
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

  const isProfileComplete = (u) => {
    if (!u) return false;
    return !!(
      u.name &&
      u.name.trim() !== "" &&
      u.phone &&
      u.phone.trim() !== "" &&
      u.address &&
      u.address.trim() !== "" &&
      u.city &&
      u.city.trim() !== "" &&
      u.province &&
      u.province.trim() !== "" &&
      Array.isArray(u.bank_accounts) &&
      u.bank_accounts.length > 0
    );
  };

  const toggleCheckbox = (field) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleOpenConfirmModal = (type) => {
    const adminUser = JSON.parse(localStorage.getItem("admin_user") || "{}");
    if (adminUser.id === user.id) {
      showAlert("Anda tidak dapat mereset profil Anda sendiri.", "error");
      return;
    }

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
        message: `Apakah Anda yakin ingin mengosongkan ${checkedCount} field yang dicentang untuk user @${user.username}?`,
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "all",
        title: "Reset Semua Data Profil?",
        message: `Apakah Anda yakin ingin mereset seluruh data profil user @${user.username}? Semua data alamat, kontak, dan rekening bank akan terhapus.`,
      });
    }
  };

  const handleResetProfile = async () => {
    const { type } = confirmModal;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      
      // Map body payload. Note that GET returns snake_case bank_accounts, but PUT API expects camelCase bankAccounts!
      const payload = {
        name: (type === "all" || selectedFields.name) ? "" : (user.name || ""),
        phone: (type === "all" || selectedFields.phone) ? "" : (user.phone || ""),
        avatar_url: (type === "all" || selectedFields.avatar) ? "" : (user.avatar_url || ""),
        address: (type === "all" || selectedFields.address) ? "" : (user.address || ""),
        city: (type === "all" || selectedFields.address) ? "" : (user.city || ""),
        province: (type === "all" || selectedFields.address) ? "" : (user.province || ""),
        bankAccounts: (type === "all" || selectedFields.bank) ? [] : (user.bank_accounts || []),
      };

      const response = await fetch(`${getApiUrl()}/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        showAlert(
          type === "all"
            ? "Seluruh profil berhasil direset."
            : "Field terpilih berhasil direset.",
          "success"
        );
        
        // Reset selected checkboxes on success
        setSelectedFields({
          name: false,
          avatar: false,
          phone: false,
          address: false,
          bank: false,
        });
        setConfirmModal({ isOpen: false, type: "", title: "", message: "" });
        
        // Reload detail data
        fetchUserDetail();
      } else {
        showAlert(result.message || "Gagal mereset profil.", "error");
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
          <p className="text-zinc-400 font-medium">Memuat rincian profil pengguna...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Pengguna Tidak Ditemukan</h2>
        <Link href="/admin/reset-profil" className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 text-sm font-bold">
          <ArrowLeft size={16} /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const complete = isProfileComplete(user);
  const isUserAdmin = user.role === "admin";
  const checkedCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Alert Banner */}
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

      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/reset-profil"
          className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-5 py-3 rounded-2xl text-xs font-black transition-all mb-6 active:scale-95"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Detail & Reset Profil
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">Reset bagian tertentu dari informasi profil pengguna.</p>
          </div>
          <div>
            {complete ? (
              <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20 inline-flex items-center gap-1.5 shadow-inner">
                <CheckCircle2 size={14} />
                Profil Lengkap
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest border border-amber-500/20 inline-flex items-center gap-1.5 shadow-inner">
                <AlertCircle size={14} />
                Profil Belum Lengkap
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
            {/* Background highlights */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

            {/* Avatar block */}
            <div className="w-28 h-28 bg-zinc-850 rounded-[2rem] flex items-center justify-center border border-zinc-800 overflow-hidden mx-auto shadow-2xl">
              {user.avatar_url ? (
                <img
                  src={getImageUrl(user.avatar_url)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-zinc-500" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white leading-tight">
                {user.name || "Belum Mengisi Nama"}
              </h2>
              <p className="text-emerald-500 font-bold text-sm">@{user.username}</p>
              <p className="text-zinc-500 text-xs font-medium">{user.email}</p>
            </div>

            <hr className="border-zinc-800" />

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Role Akun</p>
                <p className="text-xs font-bold text-zinc-300 capitalize mt-1 flex items-center gap-1">
                  {isUserAdmin ? (
                    <>
                      <ShieldCheck size={14} className="text-purple-400" />
                      Admin
                    </>
                  ) : (
                    <>
                      <User size={14} className="text-zinc-400" />
                      User
                    </>
                  )}
                </p>
              </div>
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Rekening Bank</p>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  {user.bank_accounts?.length || 0} Terhubung
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Cards: Information & Selective Reset */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Detailed profile data */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              Informasi Data Profil Saat Ini
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Nama Lengkap</label>
                <p className={`text-sm font-semibold ${user.name ? "text-zinc-200" : "text-zinc-650 italic"}`}>
                  {user.name || "Belum diisi"}
                </p>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Foto Profil (Avatar URL)</label>
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <span className="text-xs font-semibold text-zinc-300 truncate max-w-[200px] block font-mono">
                      {user.avatar_url}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-zinc-650 italic">Belum diisi</span>
                  )}
                </div>
              </div>

              {/* Kontak */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">No. WhatsApp / Kontak</label>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-zinc-500" />
                  <p className={`text-sm font-semibold font-mono ${user.phone ? "text-zinc-200" : "text-zinc-650 italic"}`}>
                    {user.phone || "Belum diisi"}
                  </p>
                </div>
              </div>

              {/* Wilayah */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Wilayah (Provinsi & Kota)</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-zinc-500" />
                  <p className={`text-sm font-semibold ${user.province || user.city ? "text-zinc-200" : "text-zinc-650 italic"}`}>
                    {user.province || user.city ? `${user.province || "-"}, ${user.city || "-"}` : "Belum diisi"}
                  </p>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Alamat Lengkap</label>
                <p className={`text-sm font-semibold leading-relaxed ${user.address ? "text-zinc-200" : "text-zinc-650 italic"}`}>
                  {user.address || "Belum diisi"}
                </p>
              </div>

              {/* Rekening Bank */}
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Informasi Rekening Bank</label>
                
                {user.bank_accounts && user.bank_accounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.bank_accounts.map((account, index) => (
                      <div key={index} className="bg-zinc-950/50 border border-zinc-850 p-5 rounded-2xl flex items-start gap-4">
                        <CreditCard className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white">{account.bankName || "BANK"}</p>
                          <p className="text-sm font-black text-emerald-400 font-mono tracking-wider">{account.accountNumber}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">a.n. {account.accountName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-950/30 border border-zinc-850 rounded-2xl p-6 text-center">
                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest italic">Belum ada rekening bank tertaut</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Selective Reset Control */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Panel Reset Selektif
              </h3>
              <p className="text-zinc-500 text-xs font-semibold mt-1">
                Pilih field mana saja yang ingin dikosongkan. Field yang tidak dipilih akan tetap dipertahankan.
              </p>
            </div>

            {/* Checkbox Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Nama Lengkap */}
              <div
                onClick={() => toggleCheckbox("name")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedFields.name
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Nama Lengkap</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Dikosongkan menjadi username</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  selectedFields.name ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"
                }`}>
                  {selectedFields.name && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>

              {/* Box 2: Foto Profil */}
              <div
                onClick={() => toggleCheckbox("avatar")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedFields.avatar
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Foto Profil (Avatar)</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Hapus foto & url dari profil</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  selectedFields.avatar ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"
                }`}>
                  {selectedFields.avatar && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>

              {/* Box 3: WhatsApp */}
              <div
                onClick={() => toggleCheckbox("phone")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedFields.phone
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Kontak WhatsApp</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Kosongkan nomor telepon</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  selectedFields.phone ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"
                }`}>
                  {selectedFields.phone && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>

              {/* Box 4: Alamat & Wilayah */}
              <div
                onClick={() => toggleCheckbox("address")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedFields.address
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Alamat & Wilayah</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Hapus alamat, kota & provinsi</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  selectedFields.address ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"
                }`}>
                  {selectedFields.address && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>

              {/* Box 5: Rekening Bank */}
              <div
                onClick={() => toggleCheckbox("bank")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group md:col-span-2 ${
                  selectedFields.bank
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Rekening Bank</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Kosongkan seluruh data daftar rekening bank terkait</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  selectedFields.bank ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 group-hover:border-zinc-500"
                }`}>
                  {selectedFields.bank && <Check size={14} className="stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Warnings and Notes */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
                Mereset data profil akan mengakibatkan status kelayakan pembukaan toko milik user ditinjau ulang (Toko memerlukan setidaknya 1 rekening bank aktif).
              </p>
            </div>

            {/* Submitting Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Reset Selected Fields */}
              <button
                type="button"
                onClick={() => handleOpenConfirmModal("selective")}
                disabled={checkedCount === 0}
                className="flex-1 py-4 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white hover:border-red-500 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500/5 disabled:hover:text-red-500 disabled:hover:border-red-500/20"
              >
                <RefreshCw size={16} />
                Reset Field Terpilih ({checkedCount})
              </button>

              {/* Reset All Fields */}
              <button
                type="button"
                onClick={() => handleOpenConfirmModal("all")}
                className="flex-1 py-4 bg-zinc-800 text-zinc-400 hover:bg-red-650 hover:text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <X size={16} />
                Reset Semua Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", title: "", message: "" })}
        onConfirm={handleResetProfile}
        type="danger"
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Ya, Reset Sekarang"
        cancelText="Batalkan"
        isLoading={isSubmitting}
      >
        <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
          <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
            Tindakan ini permanen dan akan segera diperbarui di database. Pengguna mungkin harus mengisi kembali data yang direset.
          </p>
        </div>
      </ActionModal>
    </div>
  );
}
