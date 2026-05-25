"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, Eye, EyeOff, Check, X, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Tautan reset tidak valid atau tidak memiliki token.");
        }
    }, [token]);

    const handleReset = async (e) => {
        e.preventDefault();
        if (!token) {
            setError("Tautan reset tidak valid atau tidak memiliki token.");
            return;
        }

        if (password.length < 4) {
            setError("Password minimal 4 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`${getApiUrl()}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Terjadi kesalahan saat mereset password.");
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[480px] bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
                <Link href="/" className="relative w-40 h-12 block">
                    <Image
                        src="/images/Logo-Bg-1-2.png"
                        alt="Satwa iD Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </Link>
            </div>

            {success ? (
                <div className="text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
                        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/40">
                            <Check size={28} strokeWidth={3} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Password Diperbarui!</h3>
                    <p className="text-zinc-400 leading-relaxed text-sm">
                        Password Anda berhasil diubah. Silakan gunakan password baru ini untuk masuk ke akun Anda.
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20"
                    >
                        Masuk Sekarang
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <KeyRound size={12} />
                            Reset Password
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Buat Password Baru</h2>
                        <p className="text-zinc-500 text-sm">Masukkan password baru yang kuat untuk akun Anda.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <X size={16} />
                            </div>
                            <span className="flex-1 font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">
                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password Baru</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                                    <ShieldCheck size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    placeholder="Password baru"
                                    required
                                    disabled={!token}
                                    className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={!token}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                                    <ShieldCheck size={20} />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                    placeholder="Ulangi password baru"
                                    required
                                    disabled={!token}
                                    className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={!token}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !token || !password || !confirmPassword}
                            className="w-full relative group overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000" />
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    "Simpan Password Baru"
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <Link href="/login" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-bold transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Halaman Login
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/login-bg.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/90 to-emerald-950/20" />

                {/* Animated Glows */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Suspense wrapper to handle useSearchParams safely */}
            <Suspense fallback={
                <div className="w-full max-w-[480px] bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-12 text-center relative z-10 text-white font-bold flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memuat halaman...
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
