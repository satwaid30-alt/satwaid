"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import {
    Image as ImageIcon,
    Upload,
    Info,
    Store,
    CheckCircle2,
    ChevronLeft,
    CloudUpload,
    XCircle,
    Star,
    ArrowLeft,
    AlertCircle
} from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote', 'code-block'
];

export default function EditTokoPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: "warning",
        title: "",
        message: "",
        onConfirm: null
    });

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
        warranty_policy: ""
    });

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [provinceSearch, setProvinceSearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                // 1. Fetch User Profile for bank accounts
                fetch(`${getApiUrl()}/users/${parsed.id}`)
                    .then(res => res.json())
                    .then(res => {
                        if (res.data && res.data.bank_accounts) {
                            setBankAccounts(res.data.bank_accounts);
                        }
                    })
                    .catch(err => console.error("Error fetching user profile:", err));

                // 2. Fetch Shop Data
                fetch(`${getApiUrl()}/shops/user/${parsed.id}`)
                    .then(res => res.json())
                    .then(res => {
                        if (res.data) {
                            setShopData(res.data);
                            setProvinceSearch(res.data.province || "");
                            setCitySearch(res.data.city || "");
                        } else {
                            router.push("/user/toko");
                        }
                        setIsLoading(false);
                    })
                    .catch(err => {
                        console.error("Error fetching shop:", err);
                        setIsLoading(false);
                    });
            } catch (e) {
                console.error("Error parsing user data", e);
                router.push("/login");
            }
        }
        fetchProvinces();
    }, [router]);

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

    // Auto-fetch cities when province changes
    useEffect(() => {
        if (shopData.province && provinces.length > 0) {
            const province = provinces.find(p => p.name.toLowerCase() === shopData.province.toLowerCase());
            if (province) {
                fetchCities(province.id);
            }
        }
    }, [shopData.province, provinces]);

    const handleUpdateShop = async (e) => {
        if (e) e.preventDefault();

        // VALIDATION: Check if all fields are filled
        if (!shopData.name || !shopData.nik || !shopData.whatsapp || !shopData.province || !shopData.city || !shopData.address || !shopData.description || shopData.description === "<p><br></p>" || !shopData.shipping_policy || shopData.shipping_policy === "<p><br></p>" || !shopData.warranty_policy || shopData.warranty_policy === "<p><br></p>") {
            setModalConfig({
                isOpen: true,
                type: "warning",
                title: "Data Belum Lengkap",
                message: "Seluruh informasi toko wajib diisi (Nama, NIK, WhatsApp, Provinsi, Kota, Deskripsi, Kebijakan Pengiriman, dan Garansi). Mohon lengkapi data Anda sebelum menyimpan perubahan."
            });
            return;
        }

        // VALIDATION: NIK must be 16 digits
        if (shopData.nik.length !== 16 || !/^\d+$/.test(shopData.nik)) {
            setModalConfig({
                isOpen: true,
                type: "warning",
                title: "NIK Tidak Valid",
                message: "Nomor Induk Kependudukan (NIK) harus berjumlah 16 digit angka sesuai KTP."
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/shops/${shopData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(shopData)
            });

            const result = await response.json();

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    type: "success",
                    title: "Berhasil Diperbarui!",
                    message: "Profil toko Anda telah berhasil diperbarui dan sudah tayang secara publik.",
                    onConfirm: () => router.push("/user/toko")
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    type: "error",
                    title: "Gagal Menyimpan",
                    message: result.message || "Terjadi kesalahan saat mencoba memperbarui profil toko Anda."
                });
            }
        } catch (err) {
            console.error("Error updating shop:", err);
            setModalConfig({
                isOpen: true,
                type: "error",
                title: "Kesalahan Koneksi",
                message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
                    <i className="fa-solid fa-store absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-xl"></i>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <Link
                            href="/user/toko"
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all mb-3 sm:mb-4 group font-bold text-sm"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Detail Toko
                        </Link>
                        <div className="flex items-center gap-3 sm:gap-5">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <Store size={20} className="sm:hidden" />
                                <Store size={32} className="hidden sm:block" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">Pengaturan Profil Toko</h1>
                                <p className="text-zinc-500 text-xs mt-0.5 sm:mt-1">Perbarui identitas toko Anda.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sm:bg-zinc-900/40 sm:border sm:border-zinc-800/50 sm:rounded-[2.5rem] sm:p-1 sm:shadow-2xl sm:backdrop-blur-3xl overflow-hidden">
                    <form onSubmit={handleUpdateShop} className="sm:p-8 md:p-10 space-y-8">
                        {/* Section 1: Identitas Toko */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                                    <i className="fa-solid fa-fingerprint text-xs"></i>
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">Identitas Toko</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Nama Toko</label>
                                    <div className="relative">
                                        <i className="fa-solid fa-store absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 text-sm sm:text-base cursor-not-allowed"
                                            placeholder="Contoh: Reptile Zone Jakarta"
                                            value={shopData.name || ""}
                                            onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 group">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">NIK (Verifikasi)</label>
                                    <div className="relative">
                                        <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                                        <input
                                            type="text"
                                            placeholder="16 digit NIK sesuai KTP"
                                            className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 tracking-widest text-sm sm:text-base cursor-not-allowed"
                                            value={shopData.nik || ""}
                                            onChange={(e) => setShopData({ ...shopData, nik: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

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
                                            className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-20 sm:pl-24 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 text-sm sm:text-base cursor-not-allowed"
                                            placeholder="8123456789"
                                            value={shopData.whatsapp || ""}
                                            onChange={(e) => setShopData({ ...shopData, whatsapp: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 group relative">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-500 transition-colors">Provinsi</label>
                                    <div className="relative">
                                        <i className="fa-solid fa-map absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 text-sm sm:text-base cursor-not-allowed"
                                            placeholder="Ketik untuk mencari provinsi..."
                                            value={provinceSearch || shopData.province || ""}
                                            onChange={(e) => {
                                                setProvinceSearch(e.target.value);
                                                setShowProvinceDropdown(true);
                                                if (e.target.value !== shopData.province) {
                                                    setShopData(prev => ({ ...prev, province: e.target.value, city: "" }));
                                                    setCitySearch("");
                                                }
                                            }}
                                            onFocus={() => setShowProvinceDropdown(true)}
                                            autoComplete="off"
                                            disabled
                                        />
                                        {showProvinceDropdown && (
                                            <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                                {provinces
                                                    .filter(p => p.name.toLowerCase().includes((provinceSearch || "").toLowerCase()))
                                                    .map(p => (
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
                                        <i className="fa-solid fa-city absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"></i>
                                        <input
                                            type="text"
                                            className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 text-sm sm:text-base cursor-not-allowed"
                                            placeholder={shopData.province ? "Ketik untuk mencari kota..." : "Pilih provinsi terlebih dahulu"}
                                            value={citySearch || shopData.city || ""}
                                            disabled={true}
                                            onChange={(e) => {
                                                setCitySearch(e.target.value);
                                                setShowCityDropdown(true);
                                                setShopData(prev => ({ ...prev, city: e.target.value }));
                                            }}
                                            onFocus={() => setShowCityDropdown(true)}
                                            autoComplete="off"
                                        />
                                        {showCityDropdown && cities.length > 0 && (
                                            <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                                {cities
                                                    .filter(c => c.name.toLowerCase().includes((citySearch || "").toLowerCase()))
                                                    .map(c => (
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
                                    <i className="fa-solid fa-location-dot absolute left-4 top-4 text-zinc-600"></i>
                                    <textarea
                                        rows="2"
                                        className="w-full bg-zinc-950/30 border border-zinc-800/50 text-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 focus:outline-none transition-all font-bold placeholder:text-zinc-800 resize-none text-sm sm:text-base cursor-not-allowed"
                                        placeholder="Tuliskan alamat lengkap toko fisik atau rumah Anda..."
                                        value={shopData.address || ""}
                                        onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                                        disabled
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        {/* Section 2.5: Rekening Bank */}
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
                                {bankAccounts.length > 0 ? (
                                    bankAccounts.map((bank, idx) => (
                                        <div key={idx} className="bg-zinc-950/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-xs uppercase">
                                                {(bank.bank_name || bank.bankName || "").substring(0, 3)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-black tracking-widest text-sm">{bank.account_number || bank.accountNumber}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">an. {bank.account_name || bank.accountName}</p>
                                            </div>
                                            <i className="fa-solid fa-lock text-zinc-800 text-xs"></i>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-6 px-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-2xl text-center">
                                        <p className="text-xs text-zinc-600 font-bold italic">Belum ada rekening bank yang tertaut.</p>
                                        <Link href="/user/pengaturan" className="text-[10px] text-emerald-500 hover:underline uppercase font-black mt-2 inline-block tracking-widest">Lengkapi di Profil Dahulu</Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 3: Visual & Branding */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-xl font-black text-white tracking-tight">Visual & Branding Toko</h2>
                                    <p className="text-zinc-500 text-xs font-medium">Perbarui identitas visual unik untuk toko Anda.</p>
                                </div>
                            </div>

                            {/* Logo Upload — compact horizontal */}
                            <div className="space-y-3">
                                <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Logo Toko</label>
                                <div className="flex items-center gap-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 sm:p-4">
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative">
                                            {shopData.logo_url ? (
                                                <img src={getLogoUrl(shopData.logo_url)} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" alt="Logo Toko" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-zinc-700">
                                                    <ImageIcon size={22} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Logo</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        if (file.size > 500 * 1024) {
                                                            setModalConfig({ isOpen: true, type: "warning", title: "File Terlalu Besar", message: "Ukuran foto toko tidak boleh lebih dari 500KB." });
                                                            e.target.value = null; return;
                                                        }
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setShopData({ ...shopData, logo_url: ev.target.result });
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {shopData.logo_url && (
                                            <button type="button" onClick={() => setShopData({ ...shopData, logo_url: "" })} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-400 z-20">
                                                <XCircle size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-black text-white mb-1">{shopData.logo_url ? 'Logo terpasang ✓' : 'Belum ada logo'}</p>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">Format JPG, PNG, atau WEBP. Maks <span className="text-emerald-500">500KB</span>.</p>
                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 text-[11px] font-black rounded-xl cursor-pointer transition-all border border-zinc-700 hover:border-emerald-500 uppercase tracking-wider">
                                            <Upload size={12} />
                                            {shopData.logo_url ? 'Ganti Logo' : 'Pilih Logo'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    if (file.size > 500 * 1024) {
                                                        setModalConfig({ isOpen: true, type: "warning", title: "File Terlalu Besar", message: "Ukuran foto toko tidak boleh lebih dari 500KB." });
                                                        e.target.value = null; return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setShopData({ ...shopData, logo_url: ev.target.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-5 h-5 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center border border-blue-500/20"><Info size={12} /></div>
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Deskripsi Toko</label>
                                </div>
                                <ReactQuill theme="snow" value={shopData.description || ""} onChange={(val) => setShopData({ ...shopData, description: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Tuliskan cerita menarik tentang toko Anda..." />
                            </div>

                            {/* Shipping Policy */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded flex items-center justify-center border border-emerald-500/20"><i className="fa-solid fa-truck-fast text-[9px]"></i></div>
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Kebijakan Pengiriman</label>
                                </div>
                                <ReactQuill theme="snow" value={shopData.shipping_policy || ""} onChange={(val) => setShopData({ ...shopData, shipping_policy: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Contoh: Pengiriman hanya dilakukan Senin-Kamis..." />
                            </div>

                            {/* Warranty Policy */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-5 h-5 bg-amber-500/10 text-amber-500 rounded flex items-center justify-center border border-amber-500/20"><i className="fa-solid fa-shield-heart text-[9px]"></i></div>
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Kebijakan Garansi (DOA)</label>
                                </div>
                                <ReactQuill theme="snow" value={shopData.warranty_policy || ""} onChange={(val) => setShopData({ ...shopData, warranty_policy: val })} modules={quillModules} formats={quillFormats} className="shop-quill-editor" placeholder="Contoh: Garansi DOA berlaku 100% dengan syarat video unboxing..." />
                            </div>
                        </section>

                        <div className="pt-6 sm:pt-10 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-3 sm:gap-5">
                            <Link
                                href="/user/toko"
                                className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl text-center transition-all border border-zinc-800 flex items-center justify-center gap-2 group text-sm"
                            >
                                <i className="fa-solid fa-circle-xmark group-hover:scale-110 transition-transform"></i>
                                Batalkan Edit
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[1.5] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                {isSubmitting ? (
                                    <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
                                ) : (
                                    <>
                                        <CloudUpload size={18} className="group-hover:scale-110 transition-transform" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center pb-10">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="fa-solid fa-shield-halved text-emerald-500/50"></i>
                        Data Anda dienkripsi secara aman & diproses oleh sistem moderasi Reptile Haven
                    </p>
                </div>

                <ActionModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    onConfirm={modalConfig.onConfirm}
                    type={modalConfig.type}
                    title={modalConfig.title}
                    message={modalConfig.message}
                />
            </div>
            <style jsx global>{`
                .description-content ul, .ql-editor ul {
                    list-style-type: disc !important;
                    list-style-position: inside !important;
                    padding-left: 0.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content ol, .ql-editor ol {
                    list-style-type: decimal !important;
                    list-style-position: inside !important;
                    padding-left: 0.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content li, .ql-editor li {
                    display: list-item !important;
                    margin-bottom: 0.5rem !important;
                    color: inherit !important;
                }
                .description-content li p, .ql-editor li p {
                    display: inline !important;
                }
                .shop-quill-editor .ql-editor {
                    min-height: 150px;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}

