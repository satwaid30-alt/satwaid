"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, Eye, EyeOff, Check, AlertTriangle, Lock, LogOut } from "lucide-react";

// ✅ Didefinisikan di LUAR komponen utama agar tidak di-remount setiap render
function PasswordInput({ label, name, value, onChange, showPass, onToggleShow, placeholder, hint, error }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-300">{label}</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                    type={showPass ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete="new-password"
                    className={`w-full bg-zinc-950 border rounded-xl pl-12 pr-12 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all ${
                        error
                            ? "border-red-500/60 focus:ring-red-500/30"
                            : "border-zinc-700 focus:ring-emerald-500 focus:border-transparent"}`}
                />
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <p className="text-red-400 text-xs font-medium flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {error}
                </p>
            )}
            {hint && !error && (
                <p className="text-zinc-500 text-xs">{hint}</p>
            )}
        </div>
    );
}

// Kekuatan password berdasarkan panjang saja
function getPasswordStrength(pwd) {
    if (!pwd) return null;
    const len = pwd.length;
    if (len < 6)  return { label: "Terlalu Pendek", color: "bg-red-500",    width: "w-1/5",  textColor: "text-red-400" };
    if (len < 8)  return { label: "Cukup",          color: "bg-amber-500",  width: "w-2/5",  textColor: "text-amber-400" };
    if (len < 10) return { label: "Sedang",         color: "bg-yellow-400", width: "w-3/5",  textColor: "text-yellow-400" };
    if (len < 14) return { label: "Kuat",           color: "bg-emerald-500",width: "w-4/5",  textColor: "text-emerald-400" };
    return         { label: "Sangat Kuat",           color: "bg-emerald-400",width: "w-full", textColor: "text-emerald-300" };
}

export default function KeamananAkunPage() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [apiError, setApiError] = useState("");

    const [form, setForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [show, setShow] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    setUserId(parsed.id);
                } catch (e) {
                    console.error("Error parsing user", e);
                }
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setApiError("");
    };

    const toggleShow = (key) => {
        setShow((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.current_password) {
            newErrors.current_password = "Password saat ini wajib diisi.";
        }
        if (!form.new_password) {
            newErrors.new_password = "Password baru wajib diisi.";
        } else if (form.new_password.length < 6) {
            newErrors.new_password = "Password baru minimal 6 karakter.";
        } else if (form.new_password === form.current_password) {
            newErrors.new_password = "Password baru tidak boleh sama dengan password lama.";
        }
        if (!form.confirm_password) {
            newErrors.confirm_password = "Konfirmasi password wajib diisi.";
        } else if (form.new_password !== form.confirm_password) {
            newErrors.confirm_password = "Konfirmasi password tidak cocok.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;
        if (!userId) {
            setApiError("Sesi tidak valid, silakan login ulang.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    id: userId,
                    current_password: form.current_password,
                    new_password: form.new_password,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal mengubah password.");

            setForm({ current_password: "", new_password: "", confirm_password: "" });
            setErrors({});
            setShowSuccess(true);

            // Logout otomatis: hapus sesi & redirect ke login
            let count = 3;
            setCountdown(count);
            const timer = setInterval(() => {
                count -= 1;
                setCountdown(count);
                if (count <= 0) {
                    clearInterval(timer);
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.push("/login");
                }
            }, 1000);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const strength = getPasswordStrength(form.new_password);
    const passwordsMatch = form.confirm_password && form.new_password && form.new_password === form.confirm_password;
    const passwordsMismatch = form.confirm_password && form.new_password && form.new_password !== form.confirm_password;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">
                    Keamanan <span className="text-emerald-500">Akun</span>
                </h1>
                <p className="text-zinc-400">Kelola keamanan akun dan ubah password Anda.</p>
            </div>

            {/* Success Banner */}
            {showSuccess && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-4 mb-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="text-zinc-950" size={16} strokeWidth={3} />
                    </div>
                    <div>
                        <p className="text-emerald-400 font-bold text-sm">Password berhasil diubah!</p>
                        <p className="text-emerald-600 text-xs">Gunakan password baru Anda untuk login berikutnya.</p>
                    </div>
                </div>
            )}

            {/* API Error */}
            {apiError && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6">
                    <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                    <p className="text-red-400 font-medium text-sm">{apiError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <KeyRound size={20} className="text-emerald-500" />
                            Ubah Password
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Password Saat Ini */}
                            <PasswordInput
                                label="Password Saat Ini"
                                name="current_password"
                                value={form.current_password}
                                onChange={handleChange}
                                showPass={show.current}
                                onToggleShow={() => toggleShow("current")}
                                placeholder="Masukkan password aktif Anda sekarang"
                                hint=""
                                error={errors.current_password}
                            />

                            <div className="border-t border-zinc-800" />

                            {/* Password Baru */}
                            <PasswordInput
                                label="Password Baru"
                                name="new_password"
                                value={form.new_password}
                                onChange={handleChange}
                                showPass={show.new}
                                onToggleShow={() => toggleShow("new")}
                                placeholder="Minimal 6 karakter, bebas apapun"
                                hint="Bebas menggunakan huruf, angka, atau karakter apapun."
                                error={errors.new_password}
                            />

                            {/* Strength Bar */}
                            {form.new_password && strength && (
                                <div className="space-y-1.5 -mt-2">
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                                    </div>
                                    <p className={`text-xs font-semibold ${strength.textColor}`}>
                                        Kekuatan: {strength.label}
                                    </p>
                                </div>
                            )}

                            {/* Konfirmasi Password */}
                            <PasswordInput
                                label="Konfirmasi Password Baru"
                                name="confirm_password"
                                value={form.confirm_password}
                                onChange={handleChange}
                                showPass={show.confirm}
                                onToggleShow={() => toggleShow("confirm")}
                                placeholder="Ulangi password baru Anda"
                                hint=""
                                error={errors.confirm_password}
                            />

                            {/* Match indicator */}
                            {!errors.confirm_password && (
                                <>
                                    {passwordsMatch && (
                                        <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 -mt-2">
                                            <Check size={12} strokeWidth={3} /> Password cocok
                                        </p>
                                    )}
                                    {passwordsMismatch && (
                                        <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5 -mt-2">
                                            <AlertTriangle size={12} /> Password tidak cocok
                                        </p>
                                    )}
                                </>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 ${
                                        isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <><KeyRound size={18} /> Simpan Password Baru</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Tips Panel */}
                <div className="space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={16} className="text-emerald-500" />
                            Tips Keamanan
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { icon: "✅", text: "Gunakan minimal 6 karakter" },
                                { icon: "✅", text: "Semakin panjang semakin aman" },
                                { icon: "✅", text: "Bisa berupa kata, angka, atau apapun" },
                                { icon: "❌", text: "Jangan bagikan password ke siapapun" },
                                { icon: "❌", text: "Jangan pakai password yang sama di banyak akun" },
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                                    <span className="flex-shrink-0">{tip.icon}</span>
                                    <span>{tip.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Lupa Password?
                        </h3>
                        <p className="text-xs text-zinc-500 mb-3">
                            Jika tidak ingat password saat ini, gunakan fitur lupa password di halaman login untuk mendapat password sementara.
                        </p>
                        <a
                            href="/login"
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2"
                        >
                            Ke halaman login →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

