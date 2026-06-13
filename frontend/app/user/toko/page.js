"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; // Import Quill styles
import Link from "next/link";
import { Store, ChevronRight, CheckCircle2, X, ScrollText, ShieldCheck, PencilLine, XCircle, Lock, LogOut, ArrowLeft, MapPin, Tag, ChevronDown, ChevronUp, AlertCircle, Star, Image as ImageIcon, Upload, Info } from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

// Import ReactQuill dynamically for shop description
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "code-block"], ["clean"]],
};

const quillFormats = ["header", "bold", "italic", "underline", "strike", "list", "blockquote", "code-block"];

export default function UserTokoPage() {
  const router = useRouter();
  const [hasShop, setHasShop] = useState(false); // Mocked
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showResubmitSuccess, setShowResubmitSuccess] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [redirectShopId, setRedirectShopId] = useState("");

  const [shopData, setShopData] = useState({
    id: "",
    name: "",
    description: "",
    address: "",
    city: "",
    province: "",
    whatsapp: "",
    logo_url: "",
    nik: "",
    shipping_policy: "",
    warranty_policy: "",
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [userBankAccounts, setUserBankAccounts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // 1. Fetch Latest User Profile from DB (for bank accounts, address, etc)
        fetch(`${getApiUrl()}/users/${parsed.id}`)
          .then((res) => res.json())
          .then((res) => {
            if (res.data) {
              setUserBankAccounts(res.data.bank_accounts || []);
              // Update localStorage with latest data if needed
              localStorage.setItem("user", JSON.stringify(res.data));
            }
          })
          .catch((err) => console.error("Error fetching user profile:", err));

        // 2. Check if user already has a shop
        fetch(`${getApiUrl()}/shops/user/${parsed.id}`)
          .then((res) => res.json())
          .then((res) => {
            if (res.data) {
              setShopData(res.data);
              setHasShop(true);
              router.push(`/toko-saya/profil/${res.data.id}`);
            } else {
              // Pre-fill form from latest profile (from step 1 or localStorage)
              setShopData((prev) => ({
                ...prev,
                address: parsed.address || "",
                city: parsed.city || "",
                province: parsed.province || "",
                whatsapp: (parsed.phone || "").replace(/^\+62/, "").replace(/^0/, ""),
              }));
              setProvinceSearch(parsed.province || "");
              setCitySearch(parsed.city || "");
              setIsLoading(false);
            }
          })
          .catch((err) => {
            console.error("Error fetching shop:", err);
            setIsLoading(false);
          });
      } catch (e) {
        console.error("Error parsing user data", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
      const data = await res.json();
      setProvinces(data);
    } catch (err) {
      console.error("Gagal fetch provinsi:", err);
    }
  };

  const fetchCities = async (provinceId) => {
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
      const data = await res.json();
      setCities(data);
    } catch (err) {
      console.error("Gagal fetch kota:", err);
    }
  };

  const handleResubmit = async () => {
    if (!shopData.id) return;

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${getApiUrl()}/shops/${shopData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status: "pending",
          rejection_reason: null, // Clear reason on resubmit
        }),
      });

      if (response.ok) {
        // Refresh shop data
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
      });
      e.target.value = ""; // Reset input file
      return;
    }

    // 2. Validasi ukuran file (maksimal 1 MB)
    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Ukuran File Terlalu Besar",
        message: "Ukuran foto logo toko maksimal adalah 1 MB. Silakan pilih file yang lebih kecil.",
      });
      e.target.value = "";
      return;
    }

    setIsSubmitting(true);

    // 3. Rename file secara acak (random) untuk keamanan tambahan
    const randomString = Math.random().toString(36).substring(2, 15);
    const randomFilename = `${Date.now()}_${randomString}${fileExtension}`;
    const renamedFile = new File([file], randomFilename, { type: file.type });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const { objectKey } = await uploadImageToS3(renamedFile, token, "logos");
      setShopData({ ...shopData, logo_url: `/${objectKey}` });
    } catch (error) {
      console.error("Error uploading image:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Gagal Mengunggah",
        message: error.message || "Gagal mengunggah logo toko.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fetch cities when province changes
  useEffect(() => {
    if (shopData.province && provinces.length > 0) {
      const province = provinces.find((p) => p.name.toLowerCase() === shopData.province.toLowerCase());
      if (province) {
        fetchCities(province.id);
      }
    }
  }, [shopData.province, provinces]);

  const handleCreateShop = async (e) => {
    if (e) e.preventDefault();

    // VALIDATION: Check if all fields are filled
    if (
      !shopData.name ||
      !shopData.nik ||
      !shopData.whatsapp ||
      !shopData.province ||
      !shopData.city ||
      !shopData.address ||
      !shopData.logo_url ||
      !shopData.description ||
      shopData.description === "<p><br></p>" ||
      !shopData.shipping_policy ||
      shopData.shipping_policy === "<p><br></p>" ||
      !shopData.warranty_policy ||
      shopData.warranty_policy === "<p><br></p>"
    ) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Data Belum Lengkap",
        message: "Seluruh informasi toko wajib diisi (Nama, NIK, WhatsApp, Provinsi, Kota, Alamat, Logo, Deskripsi, Kebijakan Pengiriman, dan Garansi). Mohon lengkapi data Anda sebelum melanjutkan.",
      });
      return;
    }

    // VALIDATION: NIK must be 16 digits
    if (shopData.nik.length !== 16 || !/^\d+$/.test(shopData.nik)) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "NIK Tidak Valid",
        message: "Nomor Induk Kependudukan (NIK) harus berjumlah 16 digit angka sesuai KTP.",
      });
      return;
    }

    // VALIDATION: Bank account check (mandatory)
    if (!userBankAccounts || userBankAccounts.length === 0) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Rekening Bank Belum Ada",
        message: "Anda wajib menautkan minimal satu rekening bank di halaman profil sebelum dapat membuka toko.",
      });
      return;
    }

    // If not agreed yet, show the terms modal
    if (!agreedToTerms) {
      setShowTermsModal(true);
      return;
    }

    setIsSubmitting(true);

    const userData = JSON.parse(localStorage.getItem("user"));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${getApiUrl()}/shops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...shopData,
          user_id: userData.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        window.dispatchEvent(new CustomEvent("shop_status_changed"));
        setHasShop(true);
        setShopData(result.data);
        setRedirectShopId(result.data.id);
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Pendaftaran Berhasil!",
          message: "Toko Anda telah berhasil didaftarkan dan saat ini sedang menunggu verifikasi oleh Admin. Kami akan mengaktifkan toko Anda dalam 1x24 jam.",
        });
        setShowTermsModal(false);
      } else {
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Gagal Mendaftar",
          message: result.message || "Terjadi kesalahan saat mencoba mendaftarkan toko Anda.",
        });
      }
    } catch (err) {
      console.error("Error creating shop:", err);
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-zinc-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
          <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
        </div>
      </div>
    );
  }

  if (!showCreateForm) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        {/* Hero Section */}
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Buka Toko dan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600"> Jangkau Ribuan</span> <br className="hidden sm:block" /> Pecinta Satwa
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-500 text-base sm:text-xl font-medium leading-relaxed">Bangun toko profesional Anda di SatwaiD dan jual satwa, perlengkapan, serta kebutuhan hobi dengan aman dan terpercaya.</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-10">
            {[
              { icon: <ShieldCheck className="text-emerald-500" />, title: "Transaksi Aman", desc: "Sistem Rekber Admin menjamin keamanan dana & produk Anda." },
              { icon: <Tag className="text-blue-500" />, title: "Pasar Luas", desc: "Produk Anda terlihat oleh ribuan pecinta satwa setiap hari." },
              { icon: <CheckCircle2 className="text-amber-500" />, title: "Terverifikasi", desc: "Meningkatkan kepercayaan pembeli dengan badge toko resmi." },
            ].map((feature, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl text-left hover:border-zinc-700 transition-all group hover:bg-zinc-900">
                <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 group-hover:border-emerald-500/50 transition-all">{feature.icon}</div>
                <h3 className="text-white font-black text-lg mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-3 group active:scale-95">
              <Store size={24} />
              Mulai Buka Toko
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href="/" className="w-full sm:w-auto px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg rounded-2xl transition-all border border-zinc-800 flex items-center justify-center">
              Kembali ke Beranda
            </Link>
          </div>

          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest pt-8 flex items-center justify-center gap-2">
            <i className="fa-solid fa-lock text-emerald-500/50"></i>
            Proses pendaftaran gratis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <button onClick={() => setShowCreateForm(false)} className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all mb-3 sm:mb-4 group font-bold text-sm">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Kembali
            </button>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20 shrink-0">
                <i className="fa-solid fa-store text-lg sm:text-3xl"></i>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">Buka Toko Baru</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:bg-zinc-900/40 sm:border sm:border-zinc-800/50 sm:rounded-[2.5rem] sm:p-1 sm:shadow-2xl sm:backdrop-blur-3xl overflow-hidden">
          <form onSubmit={handleCreateShop} className="sm:p-8 md:p-10 space-y-8">
            {/* Notifikasi Peringatan Edit Profil Toko */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-5 rounded-2xl flex items-start gap-3.5 mb-6 shadow-lg shadow-amber-500/5">
              <AlertCircle size={24} className="shrink-0 mt-0.5 text-amber-500 animate-pulse" />
              <div>
                <p className="font-bold text-white text-sm md:text-base mb-1 uppercase tracking-wider">Penting: Validasi Profil Toko</p>
                <p className="text-xs md:text-sm text-zinc-400 font-semibold leading-relaxed">Mohon isi data profil toko Anda dengan benar dan teliti. Demi menjaga keamanan transaksi, Anda tidak dapat mengubah informasi utama toko secara mandiri setelah toko diverifikasi dan disetujui oleh Admin.</p>
              </div>
            </div>

            {/* Section 1: Identitas Toko */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                  <i className="fa-solid fa-store text-xs"></i>
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest text-sm">Identitas Toko</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Nama Toko</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl px-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 text-sm sm:text-base"
                      placeholder="Contoh: Reptile Zone Jakarta"
                      value={shopData.name || ""}
                      onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">NIK (Verifikasi)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="16 digit NIK sesuai KTP"
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl px-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 tracking-widest text-sm sm:text-base"
                      value={shopData.nik || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // Enforce numbers only
                        setShopData({ ...shopData, nik: val });
                      }}
                      maxLength={16}
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-zinc-800/80" />

            {/* Section 2: Kontak & Lokasi Toko */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                  <i className="fa-solid fa-map-location-dot text-xs"></i>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">Kontak & Lokasi Toko</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">No. WhatsApp</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-zinc-800 pr-3">
                      <i className="fa-brands fa-whatsapp text-emerald-500 text-base sm:text-lg"></i>
                      <span className="text-zinc-500 font-bold text-xs sm:text-sm">+62</span>
                    </div>
                    <input
                      type="tel"
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl pl-20 sm:pl-24 pr-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 text-sm sm:text-base"
                      placeholder="8123456789"
                      value={shopData.whatsapp || ""}
                      onChange={(e) => setShopData({ ...shopData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3 group relative">
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Provinsi</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl px-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 text-sm sm:text-base"
                      placeholder="Ketik untuk mencari provinsi..."
                      value={provinceSearch || shopData.province || ""}
                      onChange={(e) => {
                        setProvinceSearch(e.target.value);
                        setShowProvinceDropdown(true);
                        if (e.target.value !== shopData.province) {
                          setShopData((prev) => ({ ...prev, province: e.target.value, city: "" }));
                          setCitySearch("");
                        }
                      }}
                      onFocus={() => setShowProvinceDropdown(true)}
                      autoComplete="off"
                    />
                    {showProvinceDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl max-h-60 overflow-y-auto custom-scrollbar">
                        {provinces
                          .filter((p) => p.name.toLowerCase().includes((provinceSearch || "").toLowerCase()))
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-emerald-500 hover:text-zinc-950 text-white transition-colors border-b border-zinc-800 last:border-0 font-bold text-sm uppercase tracking-wide"
                              onClick={() => {
                                setShopData({ ...shopData, province: p.name, city: "" });
                                setProvinceSearch(p.name);
                                setCitySearch("");
                                setShowProvinceDropdown(false);
                                fetchCities(p.id);
                              }}
                            >
                              {p.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {showProvinceDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowProvinceDropdown(false)}></div>}
                  </div>
                </div>
                <div className="space-y-3 group relative">
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Kota / Kabupaten</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl px-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 text-sm sm:text-base"
                      placeholder={shopData.province ? "Ketik untuk mencari kota..." : "Pilih provinsi terlebih dahulu"}
                      value={citySearch || shopData.city || ""}
                      disabled={!shopData.province}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCityDropdown(true);
                        setShopData((prev) => ({ ...prev, city: e.target.value }));
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      autoComplete="off"
                    />
                    {showCityDropdown && cities.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl max-h-60 overflow-y-auto custom-scrollbar">
                        {cities
                          .filter((c) => c.name.toLowerCase().includes((citySearch || "").toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-emerald-500 hover:text-zinc-950 text-white transition-colors border-b border-zinc-800 last:border-0 font-bold text-sm uppercase tracking-wide"
                              onClick={() => {
                                setShopData({ ...shopData, city: c.name });
                                setCitySearch(c.name);
                                setShowCityDropdown(false);
                              }}
                            >
                              {c.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {showCityDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)}></div>}
                  </div>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Alamat Lengkap</label>
                <div className="relative">
                  <textarea
                    rows="2"
                    className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl px-4 py-3.5 sm:py-4 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-zinc-700 resize-none text-sm sm:text-base"
                    placeholder="Tuliskan alamat lengkap toko fisik atau rumah Anda..."
                    value={shopData.address || ""}
                    onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                  ></textarea>
                </div>
              </div>
            </section>

            <hr className="border-zinc-800/80" />

            {/* Section 2.5: Rekening Bank (Dari Profil) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                  <i className="fa-solid fa-building-columns text-xs"></i>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-lg font-black text-white uppercase tracking-widest text-sm">Informasi Rekening Bank</h2>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded uppercase">Dari Profil</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userBankAccounts.length > 0 ? (
                  userBankAccounts.map((bank, idx) => (
                    <div key={idx} className="bg-zinc-950/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-xs uppercase">{(bank.bank_name || bank.bankName || "").substring(0, 3)}</div>
                      <div className="flex-1">
                        <p className="text-white font-black tracking-widest text-sm">{bank.account_number || bank.accountNumber}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">an. {bank.account_name || bank.accountName}</p>
                      </div>
                      <i className="fa-solid fa-check-circle text-emerald-500 text-xs"></i>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-6 px-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <p className="text-xs text-zinc-600 font-bold italic">Belum ada rekening bank yang tertaut.</p>
                    <Link href="/user/profil" className="text-[10px] text-emerald-500 hover:underline uppercase font-black mt-2 inline-block tracking-widest">
                      Lengkapi di Profil Dahulu
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <hr className="border-zinc-800/80" />

            {/* Section 3: Visual & Deskripsi */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-white tracking-tight">Visual & Branding Toko</h2>
                  <p className="text-zinc-500 text-xs font-medium">Tentukan identitas visual unik untuk toko Anda.</p>
                </div>
              </div>

              {/* Logo Upload — compact horizontal on mobile */}
              <div className="space-y-3">
                <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Logo Toko</label>
                <div className="flex items-center gap-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 sm:p-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative">
                      {shopData.logo_url ? (
                        <img src={getLogoUrl(shopData.logo_url)} className="w-full h-full object-cover" alt="Logo Toko" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-700">
                          <ImageIcon size={22} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Logo</span>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                    </div>
                    {shopData.logo_url && (
                      <button type="button" onClick={() => setShopData({ ...shopData, logo_url: "" })} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-400 z-20">
                        <XCircle size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-black text-white mb-1">{shopData.logo_url ? "Logo terpasang ✓" : "Belum ada logo"}</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
                      Format JPG, PNG, atau WEBP. Maks <span className="text-emerald-500">1MB</span>.
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 text-[11px] font-black rounded-xl cursor-pointer transition-all border border-zinc-700 hover:border-emerald-500 uppercase tracking-wider">
                      <Upload size={12} />
                      {shopData.logo_url ? "Ganti Logo" : "Pilih Logo"}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center border border-blue-500/20">
                    <Info size={12} />
                  </div>
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Deskripsi Toko</label>
                </div>
                <ReactQuill theme="snow" value={shopData.description || ""} onChange={(val) => setShopData({ ...shopData, description: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Tuliskan cerita menarik tentang toko Anda..." />
              </div>

              {/* Shipping Policy */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded flex items-center justify-center border border-emerald-500/20">
                    <i className="fa-solid fa-truck-fast text-[9px]"></i>
                  </div>
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Kebijakan Pengiriman</label>
                </div>
                <ReactQuill theme="snow" value={shopData.shipping_policy || ""} onChange={(val) => setShopData({ ...shopData, shipping_policy: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Contoh: Pengiriman hanya dilakukan Senin-Kamis..." />
              </div>

              {/* Warranty Policy */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-5 h-5 bg-amber-500/10 text-amber-500 rounded flex items-center justify-center border border-amber-500/20">
                    <i className="fa-solid fa-shield-heart text-[9px]"></i>
                  </div>
                  <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Kebijakan Garansi (DOA)</label>
                </div>
                <ReactQuill theme="snow" value={shopData.warranty_policy || ""} onChange={(val) => setShopData({ ...shopData, warranty_policy: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Contoh: Garansi DOA berlaku 100% dengan syarat video unboxing..." />
              </div>
            </section>

            <div className="pt-6 sm:pt-10 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-3 sm:gap-5">
              <Link href="/" className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl text-center transition-all border border-zinc-800 flex items-center justify-center gap-2 group text-sm">
                <i className="fa-solid fa-circle-xmark group-hover:scale-110 transition-transform"></i>
                Batalkan
              </Link>
              <button type="submit" disabled={isSubmitting} className="flex-[1.5] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : <>Buka Toko Sekarang</>}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center pb-10">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <i className="fa-solid fa-shield-halved text-emerald-500/50"></i>
            Data Anda dienkripsi secara aman & diproses oleh sistem
          </p>
        </div>

        <ActionModal
          isOpen={modalConfig.isOpen}
          onClose={() => {
            setModalConfig({ ...modalConfig, isOpen: false });
            if (modalConfig.type === "success" && redirectShopId) {
              setIsLoading(true);
              router.push(`/toko-saya/profil/${redirectShopId}`);
            }
          }}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
        />
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowTermsModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <i className="fa-solid fa-file-contract text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Terms & Conditions</h3>
                  <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-widest font-bold">Pembukaan Toko Baru</p>
                </div>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="prose prose-invert max-w-none">
                <div className="space-y-6">
                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">1</span>
                      Persetujuan Umum
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Dengan melanjutkan proses pembuatan toko, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang berlaku.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">2</span>
                      Keakuratan Data
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Anda wajib mengisi seluruh informasi toko dan data diri dengan benar, lengkap, dan dapat dipertanggungjawabkan.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">3</span>
                      Kepatuhan terhadap Peraturan
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Anda wajib mematuhi seluruh peraturan jual beli yang berlaku, termasuk larangan menjual hewan ilegal atau dilindungi.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">4</span>
                      Sistem Transaksi
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Seluruh transaksi wajib dilakukan melalui Admin Platform sebagai pihak ketiga (rekening bersama). Segala bentuk transaksi di luar platform bukan menjadi tanggung jawab Admin.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">5</span>
                      Tanggung Jawab Penjual
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Anda bertanggung jawab penuh atas produk yang dijual, termasuk keaslian, kondisi, dan pengiriman.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-black flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px]">6</span>
                      Sanksi
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed ml-8">Pelanggaran terhadap ketentuan ini dapat mengakibatkan pembatasan hingga penghapusan akun/toko secara permanen.</p>
                  </section>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
              <label className="flex items-start gap-4 mb-6 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="peer sr-only" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                  <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-check text-zinc-950 text-xs scale-0 peer-checked:scale-100 transition-transform"></i>
                  </div>
                </div>
                <span className="text-sm text-zinc-400 font-medium leading-snug group-hover:text-zinc-200 transition-colors">Dengan mencentang persetujuan, Anda setuju untuk terikat secara hukum dengan ketentuan yang berlaku di Reptile Haven.</span>
              </label>

              <div className="flex gap-4">
                <button onClick={() => setShowTermsModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all">
                  Batalkan
                </button>
                <button disabled={!agreedToTerms || isSubmitting} onClick={() => handleCreateShop()} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
                  ) : (
                    <>
                      Konfirmasi & Buka Toko Sekarang
                      <i className="fa-solid fa-rocket"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .description-content ul,
        .ql-editor ul {
          list-style-type: disc !important;
          list-style-position: inside !important;
          padding-left: 0.5rem !important;
          margin-left: 0 !important;
          margin-bottom: 1rem !important;
        }
        .description-content ol,
        .ql-editor ol {
          list-style-type: decimal !important;
          list-style-position: inside !important;
          padding-left: 0.5rem !important;
          margin-left: 0 !important;
          margin-bottom: 1rem !important;
        }
        .description-content li,
        .ql-editor li {
          display: list-item !important;
          margin-bottom: 0.5rem !important;
          color: inherit !important;
        }
        /* Ensure nested p tags don't break list markers */
        .description-content li p,
        .ql-editor li p {
          display: inline !important;
        }
      `}</style>
    </div>
  );
}
