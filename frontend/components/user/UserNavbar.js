"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Bell, 
    Home, 
    Store, 
    ChevronDown, 
    User, 
    LogOut, 
    Settings, 
    MessageSquare, 
    ShoppingBag,
    Trash2,
    Package,
    CreditCard,
    Users
} from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function UserNavbar() {
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Notifications State matching Navbar.js
    const [notifCount, setNotifCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [socket, setSocket] = useState(null);
    const [localReadIds, setLocalReadIds] = useState([]);

    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Get current page title based on path
    const getPageTitle = () => {
        if (pathname.includes("/user/pengaturan/keamanan")) return "Keamanan Akun";
        if (pathname.includes("/user/pengaturan")) return "Pengaturan Profil";
        if (pathname.includes("/user/komunitas")) return "Komunitas Saya";
        if (pathname.includes("/user/pesanan")) return "Pesanan Saya";
        if (pathname.includes("/user/toko/dashboard")) return "Dashboard Seller";
        if (pathname.includes("/user/toko/jual-produk")) return "Jual Produk";
        if (pathname.includes("/user/toko/lelang-produk")) return "Lelang Produk";
        if (pathname.includes("/user/toko/daftar-produk")) return "Daftar Produk";
        if (pathname.includes("/user/toko/pesanan-masuk")) return "Pesanan Masuk";
        if (pathname.includes("/user/toko/pengajuan-keuangan")) return "Pengajuan Keuangan";
        if (pathname.includes("/user/toko")) return "Profil Toko";
        return "Dashboard Pengguna";
    };

    // Load user data on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (e) {
                    console.error("Error parsing user data", e);
                }
            }
            setIsLoaded(true);
        }
    }, []);

    // Sync notification list and socket.io triggers (Matching Navbar.js)
    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchCounts();
        }
    }, [user]);

    const fetchCounts = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${getApiUrl()}/notifications/${user.id}`);
            const result = await res.json();
            if (res.ok) {
                setNotifCount(
                    (result.data.incoming_orders || 0) + 
                    (result.data.my_orders || 0) + 
                    (result.data.community || 0) + 
                    (result.data.chats || 0) + 
                    (result.data.system || 0)
                );
            }
        } catch (e) {
            console.error("Error fetching counts from", getApiUrl(), e);
        }
    };

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        const newSocket = io(getSocketUrl(), {
            auth: {
                token: token ? `Bearer ${token}` : null
            }
        });
        setSocket(newSocket);
        newSocket.emit("join_user", user.id);

        const handleSyncNotifs = () => {
            fetchCounts();
            fetchNotifications();
        };

        newSocket.on("new_notification", (data) => {
            handleSyncNotifs();
        });

        window.addEventListener("sync_notifications", handleSyncNotifs);

        return () => {
            newSocket.disconnect();
            window.removeEventListener("sync_notifications", handleSyncNotifs);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setIsLoadingNotifs(true);
        try {
            const res = await fetch(`${getApiUrl()}/notifications/list/${user.id}`);
            const result = await res.json();
            if (res.ok) setNotifications(result.data || []);
        } catch (e) {
            console.error("Error fetching notifications from", getApiUrl(), e);
        } finally {
            setIsLoadingNotifs(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <header className="hidden md:flex sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 items-center justify-between">
            {/* Left: Breadcrumbs & Current Page Title */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">
                    <span>User Portal</span>
                    <span>/</span>
                    <span className="text-zinc-400">{getPageTitle()}</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">{getPageTitle()}</h1>
            </div>

            {/* Right: Quick Actions & Profile */}
            <div className="flex items-center gap-4">
                {/* Home link */}
                <Link
                    href="/"
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800/80 transition-all hover:scale-105"
                    title="Kembali ke Beranda Utama"
                >
                    <Home size={18} />
                </Link>

                {/* Notifications Bell (Matches Navbar.js flow) */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowNotifDropdown(!showNotifDropdown);
                            setShowProfileDropdown(false);
                            if (!showNotifDropdown) {
                                setNotifCount(0);
                                if (user) {
                                    fetch(`${getApiUrl()}/notifications/${user.id}/read-all`, { method: 'PUT' })
                                        .then(() => fetchNotifications())
                                        .catch(console.error);
                                } else {
                                    fetchNotifications();
                                }
                            }
                        }}
                        className={`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800/80 transition-all relative ${showNotifDropdown ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : ""}`}
                    >
                        <Bell size={18} className={notifCount > 0 ? "animate-pulse" : ""} />
                        {notifCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                                {notifCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown (Matches Navbar.js dropdown logic in sleek CMS aesthetics) */}
                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-3 duration-200 z-50 overflow-hidden">
                            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-sm sm:text-base text-white">Notifikasi</h3>
                                    {notifications.length > 0 && (
                                        <span className="bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            {notifications.length}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                    onClick={async () => {
                                        if (user) {
                                            try {
                                                await fetch(`${getApiUrl()}/notifications/${user.id}`, { method: 'DELETE' });
                                                setNotifications([]);
                                                setNotifCount(0);
                                                fetchNotifications();
                                            } catch (e) {
                                                console.error("Error deleting notifications", e);
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 size={12} />
                                    Hapus Semua
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {isLoadingNotifs ? (
                                    <div className="py-12 flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    <div className="divide-y divide-zinc-800/60">
                                        {notifications.map((notif) => {
                                            let Icon = Bell;
                                            let iconColor = "bg-zinc-800/80 text-zinc-400";

                                            if (notif.type === 'chat') {
                                                Icon = MessageSquare;
                                                iconColor = "bg-emerald-500/10 text-emerald-400";
                                            } else if (notif.type === 'disbursement') {
                                                Icon = CreditCard;
                                                iconColor = "bg-emerald-500/10 text-emerald-400";
                                            } else if (notif.type.includes('order')) {
                                                Icon = Package;
                                                iconColor = "bg-blue-500/10 text-blue-400";
                                            } else if (notif.type === 'community') {
                                                Icon = Users;
                                                iconColor = "bg-purple-500/10 text-purple-400";
                                            } else if (notif.type === 'moderation_product') {
                                                Icon = Package;
                                                iconColor = notif.title.includes('Setuju') ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400";
                                            } else if (notif.type === 'moderation_shop') {
                                                Icon = Store;
                                                iconColor = notif.title.includes('Verifikasi') ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400";
                                            }

                                            return (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => {
                                                        if (notif.link === 'chat_modal') {
                                                            const event = new CustomEvent('openInbox', { detail: notif.data });
                                                            window.dispatchEvent(event);
                                                        } else {
                                                            window.location.href = notif.link;
                                                        }
                                                        setLocalReadIds(prev => [...prev, notif.id]);
                                                        setShowNotifDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-3.5 transition-all flex items-start gap-3.5 group text-left relative rounded-xl my-1 ${(!notif.is_read && !localReadIds.includes(notif.id)) ? 'bg-emerald-500/5 border-l-4 border-emerald-500' : 'hover:bg-zinc-800/40'}`}
                                                >
                                                    <div className={`shrink-0 w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-sm`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate pr-2">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-zinc-500 shrink-0">
                                                                {new Date(notif.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs font-semibold text-zinc-400 leading-normal mb-1 line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                                            {new Date(notif.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                            <Bell size={28} />
                                        </div>
                                        <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Hening Sekali...</p>
                                        <p className="text-[10px] font-bold text-zinc-600 mt-1">Belum ada notifikasi baru untuk Anda</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 mt-3 border-t border-zinc-800">
                                <Link
                                    href="/user/pesanan"
                                    onClick={() => setShowNotifDropdown(false)}
                                    className="flex items-center justify-center w-full py-3 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
                                >
                                    Lihat Semua Aktivitas
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-zinc-800" />

                {/* Profile User Dropdown */}
                <div className="relative">
                    {!isLoaded ? (
                        <div className="w-24 h-10 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"></div>
                    ) : (
                        <button
                            onClick={() => {
                                setShowProfileDropdown(!showProfileDropdown);
                                setShowNotifDropdown(false);
                            }}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 transition-all hover:border-zinc-700 active:scale-95"
                        >
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-950 font-black text-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-none">
                                <span className="text-xs font-bold text-white max-w-[80px] truncate">{user?.name || user?.username || "User"}</span>
                                <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest mt-0.5">Verified</span>
                            </div>
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${showProfileDropdown ? "rotate-180" : ""}`} />
                        </button>
                    )}

                    {/* Profile Dropdown Menu */}
                    {showProfileDropdown && (
                        <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-3 duration-200 z-50">
                            <div className="px-4 py-3 border-b border-zinc-800/80 mb-2">
                                <p className="text-xs font-black text-white truncate">{user?.name || user?.username}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                            </div>

                            <Link
                                href="/user/pengaturan"
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <User size={14} className="text-emerald-500" />
                                <span>Profil Saya</span>
                            </Link>

                            <Link
                                href="/user/pengaturan/keamanan"
                                onClick={() => setShowProfileDropdown(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <Settings size={14} className="text-emerald-500" />
                                <span>Keamanan Akun</span>
                            </Link>

                            <div className="border-t border-zinc-800/80 my-2" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                            >
                                <LogOut size={14} />
                                <span>Keluar Sesi</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
