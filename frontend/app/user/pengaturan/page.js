"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, CreditCard, Edit2, Save, Plus, Trash2, Camera, X, Check } from "lucide-react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";

export default function PengaturanProfilPage() {
    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        province: "",
        bankAccounts: [],
        avatar_url: ""
    });
    const [userId, setUserId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [provinceSearch, setProvinceSearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Ya, Simpan',
        cancelText: 'Batal',
        isLoading: false
    });

    useEffect(() => {
        const loadUserData = async () => {
            if (typeof window === "undefined") return;

            const userData = localStorage.getItem("user");
            if (!userData) return;

            let parsed = {};
            try {
                parsed = JSON.parse(userData);
            } catch (e) {
                console.error("Error parsing user data", e);
                return;
            }

            setUserId(parsed.id);

            // Fetch data terbaru dari API jika ada ID
            if (parsed.id) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsed.id}`);
                    if (res.ok) {
                        const result = await res.json();
                        const fresh = result.data;
                        localStorage.setItem("user", JSON.stringify(fresh));
                        parsed = fresh;
                    }
                } catch (err) {
                    console.error("Gagal fetch data profil terbaru:", err);
                }
            }

            const bankData = (parsed.bank_accounts || parsed.bankAccounts) || [];
            const profileData = {
                name: parsed.name || "",
                username: parsed.username || "",
                email: parsed.email || "",
                phone: parsed.phone || "",
                address: parsed.address || "",
                city: parsed.city || "",
                province: parsed.province || "",
                bankAccounts: bankData.length > 0 ? bankData : [],
                avatar_url: parsed.avatar_url || ""
            };

            setUser(profileData);

            // Pengecekan Kelengkapan Profil (Sinkronisasi Database)
            // Profil dianggap tidak lengkap jika salah satu data wajib ini kosong
            const isIncomplete = !parsed.name || !parsed.phone || !parsed.address || !parsed.city || !parsed.province;

            if (isIncomplete) {
                setIsNewUser(true);
                setIsEditMode(true); // Langsung masuk mode edit

                // Tampilkan modal pemberitahuan otomatis untuk melengkapi data
                setTimeout(() => {
                    setShowSettingsModal(true);
                }, 500);
            }
        };

        loadUserData();
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

    // Auto-fetch cities when province changes
    useEffect(() => {
        if (user.province && provinces.length > 0) {
            const province = provinces.find(p => p.name.toLowerCase() === user.province.toLowerCase());
            if (province) {
                fetchCities(province.id);
            }
        }
    }, [user.province, provinces]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleBankAccountChange = (field, value) => {
        const newBankAccounts = [...user.bankAccounts];
        if (newBankAccounts.length === 0) {
            newBankAccounts.push({ bankName: "", accountNumber: "", accountName: "" });
        }
        newBankAccounts[0][field] = value;
        setUser({ ...user, bankAccounts: newBankAccounts });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                setUser({ ...user, avatar_url: result.url });
            }
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (e) => {
        if (e) e.preventDefault();

        if (!userId) {
            setModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Sesi Berakhir',
                message: 'Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan.',
                onConfirm: () => window.location.href = '/login'
            });
            return;
        }

        setModalConfig({
            isOpen: true,
            type: 'save',
            title: 'Konfirmasi Perubahan',
            message: 'Apakah Anda sudah yakin dengan data profil yang Anda masukkan? Perubahan akan langsung disimpan ke sistem.',
            confirmText: 'Ya, Simpan Profil',
            cancelText: 'Cek Kembali',
            onConfirm: executeSave
        });
    };

    const executeSave = async () => {
        setModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    name: user.name,
                    phone: user.phone,
                    address: user.address,
                    city: user.city,
                    province: user.province,
                    bankAccounts: user.bankAccounts,
                    avatar_url: user.avatar_url
                })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(result.data));
                setIsEditMode(false);
                setIsNewUser(false);
                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Profil Diperbarui',
                    message: 'Data profil Anda telah berhasil disimpan dan diperbarui.',
                    onConfirm: null
                });
            } else {
                throw new Error(result.message || "Gagal memperbarui profil");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            setModalConfig({
                isOpen: true,
                type: 'danger',
                title: 'Gagal Menyimpan',
                message: error.message || 'Terjadi kesalahan saat mencoba menyimpan profil Anda.',
                onConfirm: null
            });
        } finally {
            setModalConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        // Reload data dari localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser({
                name: parsed.name || "",
                username: parsed.username || "",
                email: parsed.email || "",
                phone: parsed.phone || "",
                address: parsed.address || "",
                city: parsed.city || "",
                province: parsed.province || "",
                bankAccounts: (parsed.bank_accounts || parsed.bankAccounts || []),
                avatar_url: parsed.avatar_url || ""
            });
        }
    };

    // Helper: class input berdasarkan mode
    const inputClass = (extra = "") =>
        isEditMode
            ? `w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${extra}`
            : `w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 opacity-70 cursor-not-allowed ${extra}`;

    const addressTextareaClass = isEditMode
        ? "bg-zinc-950 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        : "bg-zinc-950 border border-zinc-800 opacity-70 cursor-not-allowed";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Global Action Modal */}
            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                isLoading={modalConfig.isLoading}
            />

            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">
                        Pengaturan <span className="text-emerald-500">Profil</span>
                    </h1>
                    <p className="text-zinc-400">
                        {isNewUser
                            ? "Selamat datang! Lengkapi profil Anda untuk memulai."
                            : "Kelola informasi data diri, kontak, dan detail toko Anda."}
                    </p>
                </div>
                {/* Badge status user baru */}
                {isNewUser && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Profil Baru
                    </span>
                )}
            </div>

            <form onSubmit={handleSave}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-zinc-800">
                        <div className="relative group w-24 h-24">
                            {user.avatar_url ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar_url}`}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                                </div>
                            )}
                            {isEditMode && (
                                <label className="absolute inset-0 bg-zinc-950/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white" size={22} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Foto Profil</h3>
                            <p className="text-zinc-400 text-sm mb-3">Ditampilkan pada halaman profil dan postingan Anda.</p>
                            {isEditMode && (
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                                    <Camera size={16} />
                                    Ganti Foto
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Data Diri */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <User size={20} className="text-emerald-500" />
                                Data Diri Utama
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-300">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={user.name}
                                        onChange={handleChange}
                                        disabled={!isEditMode}
                                        placeholder={isEditMode ? "Nama lengkap Anda" : ""}
                                        className={inputClass()}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-300">Username</label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        disabled
                                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 cursor-not-allowed opacity-70"
                                    />
                                    {isEditMode && <p className="text-xs text-zinc-500 mt-1">Username tidak dapat diubah.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Kontak */}
                        <div className="pt-6 border-t border-zinc-800">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Mail size={20} className="text-emerald-500" />
                                Informasi Kontak
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-300">Email Address</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 opacity-70 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-300">Nomor Telepon / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={user.phone}
                                            onChange={handleChange}
                                            disabled={true}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 pl-12 cursor-not-allowed opacity-70"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alamat */}
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
                                        disabled={true}
                                        rows={3}
                                        placeholder=""
                                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 resize-none transition-all opacity-70 cursor-not-allowed"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-zinc-300">Provinsi</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="province"
                                                value={user.province}
                                                disabled={true}
                                                placeholder=""
                                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 opacity-70 cursor-not-allowed"
                                                autoComplete="off"
                                            />
                                            {isEditMode && showProvinceDropdown && (
                                                <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                                    {provinces
                                                        .filter(p => p.name.toLowerCase().includes((provinceSearch || "").toLowerCase()))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-3 hover:bg-emerald-500 hover:text-zinc-950 text-white transition-colors border-b border-zinc-800 last:border-0 font-bold text-sm uppercase tracking-wide"
                                                                onClick={() => {
                                                                    setUser({ ...user, province: p.name, city: "" });
                                                                    setProvinceSearch(p.name);
                                                                    setCitySearch("");
                                                                    setShowProvinceDropdown(false);
                                                                    fetchCities(p.id);
                                                                }}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    {provinces.filter(p => p.name.toLowerCase().includes((provinceSearch || "").toLowerCase())).length === 0 && (
                                                        <div className="px-4 py-3 text-zinc-500 text-sm italic font-bold">Tidak ditemukan</div>
                                                    )}
                                                </div>
                                            )}
                                            {isEditMode && showProvinceDropdown && (
                                                <div className="fixed inset-0 z-40" onClick={() => setShowProvinceDropdown(false)}></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-sm font-semibold text-zinc-300">Kota / Kabupaten</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="city"
                                                value={user.city}
                                                disabled={true}
                                                placeholder=""
                                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 opacity-70 cursor-not-allowed"
                                                autoComplete="off"
                                            />
                                            {isEditMode && showCityDropdown && cities.length > 0 && (
                                                <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                                    {cities
                                                        .filter(c => c.name.toLowerCase().includes((citySearch || "").toLowerCase()))
                                                        .map(c => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-3 hover:bg-emerald-500 hover:text-zinc-950 text-white transition-colors border-b border-zinc-800 last:border-0 font-bold text-sm uppercase tracking-wide"
                                                                onClick={() => {
                                                                    setUser({ ...user, city: c.name });
                                                                    setCitySearch(c.name);
                                                                    setShowCityDropdown(false);
                                                                }}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        ))}
                                                    {cities.filter(c => c.name.toLowerCase().includes((citySearch || "").toLowerCase())).length === 0 && (
                                                        <div className="px-4 py-3 text-zinc-500 text-sm italic font-bold">Tidak ditemukan</div>
                                                    )}
                                                </div>
                                            )}
                                            {isEditMode && showCityDropdown && (
                                                <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)}></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-800">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                    <CreditCard size={20} className="text-emerald-500" />
                                    Rekening Bank
                                </h3>
                                {/* Alert Informasi */}
                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    MASUKKAN NOMOR REKENING AKTIF
                                </div>
                            </div>

                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Nama Bank (Select Dropdown) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nama Bank</label>
                                        <select
                                            value={user.bankAccounts[0]?.bankName || ""}
                                            onChange={(e) => handleBankAccountChange("bankName", e.target.value)}
                                            disabled={true}
                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-sm transition-all font-medium appearance-none opacity-70 cursor-not-allowed"
                                        >
                                            <option value="" disabled>Pilih Bank</option>
                                            <option value="BCA">BCA (Bank Central Asia)</option>
                                            <option value="BNI">BNI (Bank Negara Indonesia)</option>
                                            <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                                            <option value="Mandiri">Mandiri</option>
                                        </select>
                                    </div>

                                    {/* Nomor Rekening (Text Input) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nomor Rekening</label>
                                        <input
                                            type="text"
                                            value={user.bankAccounts[0]?.accountNumber || ""}
                                            onChange={(e) => handleBankAccountChange("accountNumber", e.target.value)}
                                            disabled={true}
                                            placeholder="-"
                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-sm transition-all font-medium opacity-70 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Nama Pemilik (Text Input) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nama Pemilik</label>
                                        <input
                                            type="text"
                                            value={user.bankAccounts[0]?.accountName || ""}
                                            onChange={(e) => handleBankAccountChange("accountName", e.target.value)}
                                            disabled={true}
                                            placeholder="-"
                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-sm transition-all font-medium opacity-70 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
                            {isEditMode ? (
                                <>
                                    {/* Tombol Batal — tidak tampil untuk user baru */}
                                    {!isNewUser && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                                        >
                                            <X size={18} />
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Simpan Profil
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditMode(true)}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Edit2 size={18} />
                                    Edit Profil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>

            {/* Modal Pengaturan Otomatis (Entry Modal) */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-700"
                        onClick={() => setShowSettingsModal(false)}
                    ></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[3rem] relative z-10 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        <div className="p-10 lg:p-12 space-y-8 text-center relative">
                            {/* Decorative element */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-emerald-500 rounded-full blur-sm opacity-50" />

                            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner group">
                                <User size={48} className="group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                                    Menu <span className="text-emerald-500">Profil</span>
                                </h3>
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                    {isNewUser
                                        ? "Selamat datang! Silakan lengkapi data profil Anda untuk mempermudah proses transaksi di Satwa iD."
                                        : "Kelola data diri, alamat pengiriman, dan informasi rekening bank Anda di sini."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setIsEditMode(true);
                                        setShowSettingsModal(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-3 text-lg"
                                >
                                    <Edit2 size={20} /> Mulai Edit Profil
                                </button>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all active:scale-95"
                                >
                                    Lihat Data Saja
                                </button>
                            </div>

                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-50">
                                Satwa iD - Professional Marketplace
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
