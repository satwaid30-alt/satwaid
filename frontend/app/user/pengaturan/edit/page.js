"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, Camera, Building, CreditCard, Plus, Trash2, Edit2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "@/app/utils/api";
import ActionModal from "@/components/ActionModal";
import { uploadImageToS3 } from "@/components/HandleUpload";

export default function EditProfilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    bankAccounts: [{ bankName: "", accountNumber: "", accountName: "" }],
    avatar_url: "",
  });

  const [userId, setUserId] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Ya, Simpan",
    cancelText: "Batal",
    isLoading: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setUserId(parsed.id);
          setUser({
            ...user,
            name: parsed.name || "",
            username: parsed.username || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            address: parsed.address || "",
            city: parsed.city || "",
            province: parsed.province || "",
            bankAccounts: (parsed.bank_accounts || parsed.bankAccounts) && (parsed.bank_accounts || parsed.bankAccounts).length > 0 ? parsed.bank_accounts || parsed.bankAccounts : [{ bankName: "", accountNumber: "", accountName: "" }],
            avatar_url: parsed.avatar_url || "",
          });
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...user.bankAccounts];
    newBankAccounts[index][field] = value;
    setUser({ ...user, bankAccounts: newBankAccounts });
  };

  const addBankAccount = () => {
    setUser({
      ...user,
      bankAccounts: [...user.bankAccounts, { bankName: "", accountNumber: "", accountName: "" }],
    });
  };

  const removeBankAccount = (index) => {
    const newBankAccounts = user.bankAccounts.filter((_, i) => i !== index);
    setUser({ ...user, bankAccounts: newBankAccounts });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!userId) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Sesi Berakhir",
        message: "Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan.",
        onConfirm: () => (window.location.href = "/login"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          province: user.province,
          bankAccounts: user.bankAccounts,
          avatar_url: user.avatar_url,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(result.data));
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Profil Diperbarui",
          message: "Data profil Anda telah berhasil disimpan dan diperbarui.",
          onConfirm: null,
          confirmText: "Selesai",
          onClose: () => {
            window.location.href = "/user/pengaturan";
          },
        });
      } else {
        throw new Error(result.message || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Gagal Menyimpan",
        message: error.message || "Terjadi kesalahan saat mencoba menyimpan profil Anda.",
        onConfirm: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validasi File Extension & MIME Type (Keamanan Server)
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));

    // Blokir ekstensi berbahaya: .php, .exe, .svg
    // Serta memblokir PDF dan semua dokumen Office (.doc, .docx, .xls, .xlsx, .ppt, .pptx)
    const blockedExtensions = [".php", ".exe", ".svg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
    const isBlockedExtension = blockedExtensions.some((ext) => fileName.endsWith(ext));

    // Blokir PDF dan Office MIME types
    const isOfficeOrPdfMime = file.type === "application/pdf" || file.type.startsWith("application/msword") || file.type.startsWith("application/vnd.ms-") || file.type.startsWith("application/vnd.openxmlformats-officedocument");

    // Validasi kebolehan MIME tipe dan ekstensi gambar
    const isAllowedMime = allowedMimeTypes.includes(file.type);
    const isAllowedExtension = allowedExtensions.includes(fileExtension);

    if (isBlockedExtension || isOfficeOrPdfMime || !isAllowedMime || !isAllowedExtension) {
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Format File Tidak Didukung",
        message: "Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).",
        onConfirm: null,
      });
      e.target.value = ""; // Reset input file
      return;
    }

    // 2. Validasi ukuran file (maksimal 500 KB)
    const MAX_FILE_SIZE = 500 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Ukuran File Terlalu Besar",
        message: "Ukuran foto profil maksimal adalah 500 KB. Silakan pilih file yang lebih kecil.",
        onConfirm: null,
      });
      e.target.value = "";
      return;
    }

    setIsLoading(true);

    // 3. Rename file secara acak (random) untuk keamanan tambahan
    const randomString = Math.random().toString(36).substring(2, 15);
    const randomFilename = `${Date.now()}_${randomString}${fileExtension}`;
    const renamedFile = new File([file], randomFilename, { type: file.type });

    try {
      const token = localStorage.getItem("token");
      const { objectKey } = await uploadImageToS3(renamedFile, token, "avatars");
      setUser({ ...user, avatar_url: `/${objectKey}` });
    } catch (error) {
      console.error("Error uploading image:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: error.message || "Terjadi kesalahan saat mengunggah foto profil.",
        onConfirm: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Global Action Modal */}
      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={modalConfig.onClose || (() => setModalConfig({ ...modalConfig, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isLoading={modalConfig.isLoading}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Edit <span className="text-emerald-500">Profil</span>
        </h1>
        <p className="text-zinc-400">Perbarui informasi data diri, kontak, dan detail toko Anda.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 ">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-zinc-800">
          <div className="relative group cursor-pointer w-24 h-24">
            {user.avatar_url ? (
              <img src={user.avatar_url.startsWith("http") ? user.avatar_url : `${getApiUrl()}${user.avatar_url}`} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">{user.username ? user.username.charAt(0).toUpperCase() : "U"}</div>
            )}
            <label className="absolute inset-0 bg-zinc-950/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="text-white" size={24} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-1">Foto Profil</h3>
            <p className="text-zinc-400 text-sm mb-4">Format disarankan: JPG, PNG. Maksimal 500 KB.</p>
            <div className="flex justify-center md:justify-start gap-3">
              <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                Ganti Foto
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
              {user.avatar_url && (
                <button type="button" onClick={() => setUser({ ...user, avatar_url: "" })} className="px-4 py-2 text-red-500 hover:bg-red-500/10 text-sm font-semibold rounded-lg transition-colors">
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Data Diri Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-emerald-500" />
              Data Diri Utama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-300">Nama Lengkap</label>
                <input type="text" name="name" value={user.name} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-300">Username</label>
                <input type="text" name="username" value={user.username} disabled className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 cursor-not-allowed" />
                <p className="text-xs text-zinc-500 mt-1">Username tidak dapat diubah.</p>
              </div>
            </div>
          </div>
          {/* Kontak Section */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Mail size={20} className="text-emerald-500" />
              Informasi Kontak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-300">Email Address</label>
                <input type="email" name="email" value={user.email} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-300">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input type="tel" name="phone" value={user.phone} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
              </div>
            </div>
          </div>
          {/* Alamat Section */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-emerald-500" />
              Alamat Pengiriman
            </h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-300">Alamat Lengkap</label>
                <textarea
                  name="address"
                  value={user.address}
                  onChange={handleChange}
                  placeholder="Nama Jalan, Gedung, No. Rumah, RT/RW, Patokan"
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-300">Provinsi</label>
                  <input type="text" name="province" value={user.province} onChange={handleChange} placeholder="Contoh: DKI Jakarta" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-300">Kota / Kabupaten</label>
                  <input type="text" name="city" value={user.city} onChange={handleChange} placeholder="Contoh: Jakarta Selatan" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
              </div>
            </div>
          </div>
          {/* Rekening Bank Section */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-500" />
                Rekening Bank
              </h3>
              <button type="button" onClick={addBankAccount} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-zinc-950 text-sm font-bold rounded-lg transition-colors">
                <Plus size={16} />
                Tambah Rekening
              </button>
            </div>

            <div className="space-y-4">
              {user.bankAccounts.map((account, index) => (
                <div key={index} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 relative group">
                  {user.bankAccounts.length > 1 && (
                    <button type="button" onClick={() => removeBankAccount(index)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <h4 className="text-sm font-bold text-zinc-400 mb-3">Rekening {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Nama Bank</label>
                      <input type="text" value={account.bankName} onChange={(e) => handleBankAccountChange(index, "bankName", e.target.value)} placeholder="Contoh: BCA / Mandiri" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Nomor Rekening</label>
                      <input
                        type="text"
                        value={account.accountNumber}
                        onChange={(e) => handleBankAccountChange(index, "accountNumber", e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Nama Pemilik</label>
                      <input
                        type="text"
                        value={account.accountName}
                        onChange={(e) => handleBankAccountChange(index, "accountName", e.target.value)}
                        placeholder="Sesuai buku tabungan"
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>{" "}
          <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
            <Link href="/user/pengaturan" className="flex items-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">
              <X size={20} />
              Batal
            </Link>
            <button type="submit" disabled={isLoading} className={`flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <Save size={20} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
