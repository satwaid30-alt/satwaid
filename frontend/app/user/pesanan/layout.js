"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import { AlertCircle, X, ChevronLeft, ChevronRight, ShieldAlert, PackageX, ArrowRight, Clock } from "lucide-react";
import UserSidebar from "../../../components/user/UserSidebar";
import UserNavbar from "../../../components/user/UserNavbar";

const REMINDER_INTERVAL = 60; // detik

export default function PesananLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [showAdminAlertModal, setShowAdminAlertModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [countdown, setCountdown] = useState(0);

    const userIdRef = useRef(null);
    const reminderTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const rejectedIdsRef = useRef("");

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const clearAllTimers = useCallback(() => {
        if (reminderTimerRef.current) {
            clearTimeout(reminderTimerRef.current);
            reminderTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(0);
    }, []);

    const startReminderCountdown = useCallback(() => {
        clearAllTimers();
        setCountdown(REMINDER_INTERVAL);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        reminderTimerRef.current = setTimeout(() => {
            if (rejectedIdsRef.current) {
                setCurrentIndex(0);
                setShowAdminAlertModal(true);
            }
        }, REMINDER_INTERVAL * 1000);
    }, [clearAllTimers]);

    // ─── Fetch helpers ────────────────────────────────────────────────────────
    const fetchBuyerOrders = async (userId) => {
        try {
            const response = await fetch(`${getApiUrl()}/orders/user/${userId}`);
            const result = await response.json();
            if (response.ok) setOrders(result.data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    // ─── Socket & initial fetch ───────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const userData = localStorage.getItem("user");
        let socket;
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                userIdRef.current = parsed.id;
                fetchBuyerOrders(parsed.id);

                socket = io(getSocketUrl(), {
                    auth: { token: `Bearer ${token}` },
                });

                socket.on("connect", () => {
                    console.log("[Buyer Layout Socket] Connected:", parsed.id);
                    socket.emit("join_user", parsed.id);
                });

                socket.on("new_notification", () => {
                    if (userIdRef.current) fetchBuyerOrders(userIdRef.current);
                });

                socket.on("order_updated", () => {
                    if (userIdRef.current) fetchBuyerOrders(userIdRef.current);
                });
            } catch (e) {
                console.error("[Buyer Layout Socket] Error:", e);
            }
        }
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 0);
        return () => {
            if (socket) socket.disconnect();
            clearAllTimers();
            clearTimeout(timer);
        };
    }, [clearAllTimers, router]);

    // ─── Derived: pesanan yang ditolak admin ──────────────────────────────────
    const adminRejectedOrders = orders.filter((order) => {
        const isPaymentRejected = order.status === "waiting_payment" && order.payment_rejection_reason;
        const isAdminCancelled = order.status === "cancelled" && order.rejection_reason && (order.rejection_reason.includes("Admin") || order.rejection_reason.includes("admin"));
        return isPaymentRejected || isAdminCancelled;
    });

    const paymentRejectedCount = adminRejectedOrders.filter((o) => o.status === "waiting_payment").length;
    const adminCancelledCount = adminRejectedOrders.filter((o) => o.status === "cancelled").length;

    // ─── Reactive: tampilkan / sembunyikan modal berdasarkan orders ───────────
    useEffect(() => {
        const currentIds = adminRejectedOrders.map((o) => o.id).join(",");

        if (adminRejectedOrders.length > 0) {
            rejectedIdsRef.current = currentIds;

            if (!showAdminAlertModal) {
                clearAllTimers();
                setCurrentIndex(0);
                setShowAdminAlertModal(true);
            }
        } else {
            rejectedIdsRef.current = "";
            clearAllTimers();
            setShowAdminAlertModal(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders]);

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleCloseModal = () => {
        setShowAdminAlertModal(false);
        if (rejectedIdsRef.current) {
            startReminderCountdown();
        }
    };

    const handlePrev = () => setCurrentIndex((i) => (i === 0 ? adminRejectedOrders.length - 1 : i - 1));
    const handleNext = () => setCurrentIndex((i) => (i === adminRejectedOrders.length - 1 ? 0 : i + 1));

    const total = adminRejectedOrders.length;
    const currentOrder = adminRejectedOrders[currentIndex] || null;
    const isPaymentRejected = currentOrder?.status === "waiting_payment";

    const handleGoToOrders = () => {
        handleCloseModal();
        if (currentOrder) {
            if (currentOrder.status === "waiting_payment") {
                router.push(`/user/pesanan/bayar/${currentOrder.id}`);
            } else {
                router.push(`/user/pesanan/transaksi/${currentOrder.id}`);
            }
        } else {
            router.push("/user/pesanan");
        }
    };

    // Progress countdown ring (SVG)
    const ringRadius = 14;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringProgress = countdown > 0 ? ringCircumference - (countdown / REMINDER_INTERVAL) * ringCircumference : ringCircumference;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 font-medium animate-pulse">Memuat Pesanan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
            {/* Sidebar */}
            <UserSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Navbar */}
                <UserNavbar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-12 pt-6 md:pt-12 custom-scrollbar">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* ─── Floating Reminder Badge (saat modal tertutup, countdown berjalan) ─── */}
            {!showAdminAlertModal && countdown > 0 && (
                <button
                    onClick={() => {
                        clearAllTimers();
                        setCurrentIndex(0);
                        setShowAdminAlertModal(true);
                    }}
                    className="fixed bottom-6 right-6 z-[190] flex items-center gap-3 bg-zinc-900 border border-red-500/30 text-white rounded-2xl px-4 py-3 hover:border-red-500/60 transition-all active:scale-95"
                    style={{ animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1) both" }}
                >
                    <div className="relative w-9 h-9 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="#27272a" strokeWidth="3" />
                            <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringProgress} style={{ transition: "stroke-dashoffset 1s linear" }} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-red-400 tabular-nums">{countdown}</span>
                    </div>

                    <div className="text-left">
                        <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{total} Pesanan Perlu Perhatian</p>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Pengingat dalam {countdown}d</p>
                    </div>

                    <ShieldAlert size={16} className="text-red-400 shrink-0" />
                </button>
            )}

            {/* ─── Global Admin Alert Modal ─── */}
            {showAdminAlertModal && total > 0 && currentOrder && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm" onClick={handleCloseModal} />

                    {/* Modal Card */}
                    <div className="relative z-10 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden" style={{ animation: "modalIn 0.28s cubic-bezier(.22,1,.36,1) both" }}>
                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-400 to-orange-400" />

                        {/* ── Header ── */}
                        <div className="flex items-start justify-between px-7 pt-7 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <ShieldAlert size={22} className="text-red-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-white tracking-tight">Tindakan Admin</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-500 text-white tabular-nums">{total}</span>
                                    </div>
                                    <p className="text-zinc-500 text-[11px] font-semibold mt-0.5">{total === 1 ? "1 transaksi memerlukan perhatianmu" : `${total} transaksi memerlukan perhatianmu`}</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="text-zinc-500 hover:text-white transition-colors mt-0.5">
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Summary Chips ── */}
                        {total > 1 && (
                            <div className="flex gap-2 px-7 pb-4">
                                {paymentRejectedCount > 0 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black">
                                        <PackageX size={11} />
                                        {paymentRejectedCount} Bayar Ditolak
                                    </span>
                                )}
                                {adminCancelledCount > 0 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-black">
                                        <AlertCircle size={11} />
                                        {adminCancelledCount} Dibatalkan Admin
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="h-px bg-zinc-800 mx-7" />

                        {/* ── Order Card ── */}
                        <div className="px-7 py-5 space-y-4">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-black text-emerald-400 font-mono tracking-wide">
                                    {currentOrder.order_id}
                                </span>
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isPaymentRejected ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>{isPaymentRejected ? "Pembayaran Ditolak" : "Dibatalkan Admin"}</span>
                            </div>

                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 space-y-1">
                                <p className="text-sm font-black text-white">{currentOrder.product?.name || "-"}</p>
                                <p className="text-[11px] text-zinc-500 font-semibold">
                                    Penjual: <span className="text-zinc-400">{currentOrder.shop?.name || "-"}</span>
                                </p>
                            </div>

                            <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                                <p className="text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-widest">Alasan Admin</p>
                                <p className="text-sm text-zinc-200 leading-relaxed font-semibold">{isPaymentRejected ? currentOrder.payment_rejection_reason : currentOrder.rejection_reason}</p>
                            </div>
                        </div>

                        {/* ── Progress + Dot Navigation ── */}
                        {total > 1 && (
                            <div className="px-7 pb-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${((currentIndex + 1) / total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-black text-zinc-500 tabular-nums whitespace-nowrap">
                                        {currentIndex + 1} / {total}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                    {adminRejectedOrders.map((_, idx) => (
                                        <button key={idx} onClick={() => setCurrentIndex(idx)} className={`rounded-full transition-all duration-200 ${idx === currentIndex ? "w-5 h-2 bg-red-400" : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Reminder info strip ── */}
                        <div className="mx-7 mb-4 flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-2.5">
                            <Clock size={13} className="text-amber-400 shrink-0" />
                            <p className="text-[11px] text-zinc-400 font-semibold">
                                Pengingat ini akan muncul kembali tiap <span className="text-amber-400 font-black">1 menit</span> hingga semua pesanan diselesaikan.
                            </p>
                        </div>

                        {/* ── Footer Buttons ── */}
                        <div className="px-7 pb-7 space-y-3">
                            {total > 1 && (
                                <div className="flex gap-2">
                                    <button onClick={handlePrev} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-zinc-700 active:scale-95">
                                        <ChevronLeft size={14} />
                                        Sebelumnya
                                    </button>
                                    <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-zinc-700 active:scale-95">
                                        Berikutnya
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={handleCloseModal} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-zinc-700 active:scale-95">
                                    Tutup
                                </button>
                                <button onClick={handleGoToOrders} className="flex-[2] flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95">
                                    Proses Pesanan
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <style jsx global>{`
                        @keyframes modalIn {
                            from {
                                opacity: 0;
                                transform: scale(0.93) translateY(12px);
                            }
                            to {
                                opacity: 1;
                                transform: scale(1) translateY(0);
                            }
                        }
                        @keyframes slideUp {
                            from {
                                opacity: 0;
                                transform: translateY(16px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
