"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    User,
    Settings,
    ShoppingBag,
    Store,
    Heart,
    LogOut,
    MapPin,
    Home,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Users,
    Lock,
    Bell,
    Trash2,
    Package,
    CreditCard
} from "lucide-react";
import { io } from "socket.io-client";

const MENU_ITEMS = [
    { name: "Beranda Website", href: "/", icon: Home },
    { name: "Pengaturan Profil", href: "/user/pengaturan", icon: User },
    { name: "Komunitas Saya", href: "/user/komunitas", icon: MessageSquare },
    {
        name: "Pesanan Saya",
        icon: ShoppingBag,
        submenu: [
            { name: "Pesanan Aktif", href: "/user/pesanan" },
            { name: "Riwayat Pesanan", href: "/user/pesanan/riwayat-pembelian" },
        ]
    },
    {
        name: "Dashboard Seller",
        icon: Store,
        submenu: [
            { name: "Dashboard Utama", href: "/user/toko/dashboard" },
            { name: "Profil Toko", href: "/user/toko" },
            { name: "Jual Langsung", href: "/user/toko/jual-produk" },
            { name: "Lelang Produk", href: "/user/toko/lelang-produk" },
            { name: "Daftar Produk", href: "/user/toko/daftar-produk" },
            { name: "Pesanan Masuk", href: "/user/toko/pesanan-masuk" },
            { name: "Pengajuan Keuangan", href: "/user/toko/pengajuan-keuangan" },
        ]
    },
    { name: "Keamanan Akun", href: "/user/pengaturan/keamanan", icon: Settings },
];

export default function UserSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState({});
    const [notifications, setNotifications] = useState({
        incoming_orders: 0,
        my_orders: 0,
        community: 0
    });
    const [shopStatus, setShopStatus] = useState("active"); // default to active to prevent flash

    // Socket & detailed notifications state for mobile bell
    const [notifCount, setNotifCount] = useState(0);
    const [notifList, setNotifList] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [socket, setSocket] = useState(null);
    const [localReadIds, setLocalReadIds] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Load user data on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    fetchShopStatus(parsedUser.id);
                } catch (e) {
                    console.error("Error parsing user data", e);
                }
            }
        }
    }, []);

    const fetchShopStatus = async (userId) => {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.warn("NEXT_PUBLIC_API_URL is not defined");
            setShopStatus("active");
            return;
        }
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/user/${userId}`;
            const res = await fetch(url);
            const result = await res.json();
            if (res.ok && result.data) {
                setShopStatus(result.data.status?.toLowerCase() || "active");
            } else {
                setShopStatus("none");
            }
        } catch (err) {
            console.error("Error fetching shop status from", process.env.NEXT_PUBLIC_API_URL, err);
            setShopStatus("active");
        }
    };

    // Auto-open submenu if active child exists
    useEffect(() => {
        if (typeof window !== "undefined") {
            const initialOpenStates = {};
            MENU_ITEMS.forEach(item => {
                if (item.submenu && item.submenu.some(sub => pathname === sub.href)) {
                    initialOpenStates[item.name] = true;
                    initialOpenStates[`mobile_${item.name}`] = true;
                }
            });
            if (Object.keys(initialOpenStates).length > 0) {
                setOpenSubmenus(prev => ({ ...prev, ...initialOpenStates }));
            }
        }
    }, [pathname]);

    const fetchNotifications = async () => {
        if (!user?.id || !process.env.NEXT_PUBLIC_API_URL) return;
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/notifications/${user.id}`;
            const res = await fetch(url);
            const result = await res.json();
            if (res.ok) {
                setNotifications(result.data);
            }
        } catch (err) {
            console.error("Error fetching notifications from", process.env.NEXT_PUBLIC_API_URL, err);
        }
    };

    const fetchDetailedCounts = async () => {
        if (!user?.id || !process.env.NEXT_PUBLIC_API_URL) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${user.id}`);
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
            console.error("Error fetching detailed counts", e);
        }
    };

    const fetchDetailedNotifications = async () => {
        if (!user?.id || !process.env.NEXT_PUBLIC_API_URL) return;
        setIsLoadingNotifs(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/list/${user.id}`);
            const result = await res.json();
            if (res.ok) setNotifList(result.data || []);
        } catch (e) {
            console.error("Error fetching notifications list", e);
        } finally {
            setIsLoadingNotifs(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            fetchDetailedCounts();
            fetchDetailedNotifications();
            const interval = setInterval(() => {
                fetchNotifications();
                fetchDetailedCounts();
            }, 60000); // 1 minute
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || !process.env.NEXT_PUBLIC_API_URL) return;

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL);
        setSocket(newSocket);
        newSocket.emit("join_user", user.id);

        newSocket.on("new_notification", (data) => {
            fetchNotifications();
            fetchDetailedCounts(); // Fetch accurate counts from backend
            fetchDetailedNotifications(); // Refresh list
        });

        return () => newSocket.disconnect();
    }, [user?.id]);

    // Mark as read when entering community
    useEffect(() => {
        if (pathname === "/user/komunitas" && user?.id) {
            const markAsRead = async () => {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${user.id}/read`, { method: 'PUT' });
                    setNotifications(prev => ({ ...prev, community: 0 }));
                } catch (e) {
                    console.error(e);
                }
            };
            markAsRead();
        }
    }, [pathname, user?.id]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const toggleSubmenu = (name) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    return (
        <>
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className={`${isCollapsed ? "w-24" : "w-72"} bg-zinc-900 border-r border-zinc-800 flex-col h-screen sticky top-0 hidden md:flex z-40 transition-all duration-300 relative`}>

                {/* Toggle Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3.5 top-12 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 z-50 hover:bg-zinc-700 shadow-md transition-all"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                {/* User Profile Header */}
                <div className={`p-8 border-b border-zinc-800 pt-12 ${isCollapsed ? "px-4 flex flex-col items-center" : ""}`}>
                    <div className={`flex items-center gap-4 ${isCollapsed ? "" : "mb-2"}`}>
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
                            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-white truncate">{user?.name || user?.username || "Pengguna"}</p>
                                <p className="text-sm text-zinc-400 truncate">{user?.email || "email@example.com"}</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mt-2 truncate">
                            Member Terverifikasi
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden`}>
                    {!isCollapsed ? (
                        <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 truncate">Menu Akun</p>
                    ) : (
                        <div className="h-4"></div>
                    )}
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const hasSubmenu = item.submenu && item.submenu.length > 0;
                        const isSubmenuOpen = openSubmenus[item.name];
                        const isActive = item.submenu
                            ? item.submenu.some(sub => pathname === sub.href)
                            : (item.href === "/user/pengaturan"
                                ? pathname === item.href
                                : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));

                        return (
                            <div key={item.name} className="space-y-1">
                                {hasSubmenu ? (
                                    <button
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`w-full flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isActive
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-left truncate">{item.name}</span>
                                                {item.name === "Pesanan Saya" && notifications.my_orders > 0 && (
                                                    <span className="mr-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                        {notifications.my_orders}
                                                    </span>
                                                )}
                                                {item.name === "Dashboard Seller" && notifications.incoming_orders > 0 && (
                                                    <span className="mr-2 bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                        {notifications.incoming_orders}
                                                    </span>
                                                )}
                                                <ChevronRight size={16} className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-90" : ""}`} />
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        title={isCollapsed ? item.name : ""}
                                        className={`flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isActive
                                            ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} className={`shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                                        {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                                        {!isCollapsed && item.name === "Komunitas Saya" && notifications.community > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                                                {notifications.community}
                                            </span>
                                        )}
                                        {!isCollapsed && item.name === "Pesanan Saya" && notifications.my_orders > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                {notifications.my_orders}
                                            </span>
                                        )}
                                        {isCollapsed && (
                                            (item.name === "Komunitas Saya" && notifications.community > 0) ||
                                            (item.name === "Pesanan Saya" && notifications.my_orders > 0) ||
                                            (item.name === "Dashboard Seller" && notifications.incoming_orders > 0)
                                        ) && (
                                                <div className="absolute top-2 right-4 w-2.5 h-2.5 bg-red-500 border-2 border-zinc-900 rounded-full"></div>
                                            )}
                                    </Link>
                                )}

                                {/* Submenu Rendering */}
                                {hasSubmenu && isSubmenuOpen && !isCollapsed && (
                                    <div className="ml-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {item.submenu.map((sub) => {
                                            const isLocked = (sub.name === "Jual Langsung" || sub.name === "Lelang Produk") && shopStatus !== "active";

                                            if (isLocked) {
                                                return (
                                                    <div
                                                        key={sub.name}
                                                        className="flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 cursor-not-allowed group relative"
                                                        title="Fitur ini terkunci hingga toko Anda diverifikasi admin"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {sub.name}
                                                            <Lock size={12} className="text-zinc-700" />
                                                        </span>
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50 border border-zinc-700">
                                                            Tunggu Verifikasi Admin
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={sub.name}
                                                    href={sub.href}
                                                    className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === sub.href
                                                        ? "text-emerald-500"
                                                        : "text-zinc-500 hover:text-zinc-300"}`}
                                                >
                                                    <span>{sub.name}</span>
                                                    {sub.name === "Pesanan Masuk" && notifications.incoming_orders > 0 && (
                                                        <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                                            {notifications.incoming_orders}
                                                        </span>
                                                    )}
                                                    {item.name === "Pesanan Saya" && sub.name === "Pesanan Aktif" && notifications.my_orders > 0 && (
                                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                                                            {notifications.my_orders}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className={`p-6 mt-auto border-t border-zinc-800 ${isCollapsed ? "px-2" : ""}`}>
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? "Keluar Sesi" : ""}
                        className={`w-full flex items-center justify-center gap-3 ${isCollapsed ? "px-0" : "px-4"} py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all group`}
                    >
                        <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="truncate">Keluar Sesi</span>}
                    </button>
                </div>
            </aside>

            {/* --- MOBILE NAVBAR (Hamburger) --- */}
            <div className="md:hidden bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40 w-full flex flex-col">
                {/* Mobile User Header */}
                <div className="p-4 flex items-center justify-between relative z-50 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">{user?.name || user?.username || "Pengguna"}</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Member Terverifikasi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Bell Icon for mobile notifications */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowNotifDropdown(!showNotifDropdown);
                                    setIsMobileMenuOpen(false); // Close sidebar menu if open
                                    if (!showNotifDropdown) {
                                        setNotifCount(0);
                                        if (user) {
                                            fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${user.id}/read-all`, { method: 'PUT' })
                                                .then(() => fetchDetailedNotifications())
                                                .catch(console.error);
                                        } else {
                                            fetchDetailedNotifications();
                                        }
                                    }
                                }}
                                className={`p-2 rounded-lg transition-colors relative flex items-center justify-center ${showNotifDropdown ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800/50 text-zinc-400"}`}
                            >
                                <Bell size={20} className={notifCount > 0 ? "animate-pulse" : ""} />
                                {notifCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 animate-bounce">
                                        {notifCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Hamburger menu button */}
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                                setShowNotifDropdown(false); // Close bell dropdown if open
                            }}
                            className={`p-2 rounded-lg transition-colors ${isMobileMenuOpen ? "bg-zinc-800 text-white" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Notification Dropdown */}
                {showNotifDropdown && (
                    <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-2xl p-4 animate-in fade-in slide-in-from-top-3 duration-200 z-50 flex flex-col max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-white">Notifikasi</h3>
                                {notifList.length > 0 && (
                                    <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {notifList.length}
                                    </span>
                                )}
                            </div>
                            <button
                                className="text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                onClick={async () => {
                                    if (user) {
                                        try {
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${user.id}`, { method: 'DELETE' });
                                            setNotifList([]);
                                            setNotifCount(0);
                                            fetchDetailedNotifications();
                                        } catch (e) {
                                            console.error("Error deleting notifications", e);
                                        }
                                    }
                                }}
                            >
                                <Trash2 size={10} />
                                Hapus Semua
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar space-y-1.5 flex-1 pr-1">
                            {isLoadingNotifs ? (
                                <div className="py-12 flex flex-col items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi...</p>
                                </div>
                            ) : notifList.length > 0 ? (
                                <div className="divide-y divide-zinc-800/40">
                                    {notifList.map((notif) => {
                                        let IconComponent = Bell;
                                        let iconColor = "bg-zinc-800/80 text-zinc-400";

                                        if (notif.type === 'chat') {
                                            IconComponent = MessageSquare;
                                            iconColor = "bg-emerald-500/10 text-emerald-400";
                                        } else if (notif.type === 'disbursement') {
                                            IconComponent = CreditCard;
                                            iconColor = "bg-emerald-500/10 text-emerald-400";
                                        } else if (notif.type.includes('order')) {
                                            IconComponent = Package;
                                            iconColor = "bg-blue-500/10 text-blue-400";
                                        } else if (notif.type === 'community') {
                                            IconComponent = Users;
                                            iconColor = "bg-purple-500/10 text-purple-400";
                                        } else if (notif.type === 'moderation_product') {
                                            IconComponent = Package;
                                            iconColor = notif.title.includes('Setuju') ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400";
                                        } else if (notif.type === 'moderation_shop') {
                                            IconComponent = Store;
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
                                                className={`w-full px-2.5 py-3 transition-all flex items-start gap-3 group text-left relative rounded-lg my-1 ${(!notif.is_read && !localReadIds.includes(notif.id)) ? 'bg-emerald-500/5 border-l-3 border-emerald-500' : 'hover:bg-zinc-800/30'}`}
                                            >
                                                <div className={`shrink-0 w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center transition-transform`}>
                                                    <IconComponent size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className="text-xs font-black text-white truncate pr-1">
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-zinc-500 shrink-0">
                                                            {new Date(notif.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <p className="text-[11px] font-semibold text-zinc-400 leading-normal mb-0.5 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                                        {new Date(notif.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-3 text-zinc-600">
                                        <Bell size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Hening Sekali...</p>
                                    <p className="text-[9px] font-bold text-zinc-600 mt-1">Belum ada notifikasi baru</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-zinc-800 shrink-0">
                            <Link
                                href="/user/pesanan"
                                onClick={() => setShowNotifDropdown(false)}
                                className="flex items-center justify-center w-full py-2.5 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-[0.98]"
                            >
                                Lihat Semua Aktivitas
                            </Link>
                        </div>
                    </div>
                )}

                {/* Mobile Dropdown Menu */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-2xl max-h-[80vh] overflow-y-auto flex flex-col">
                        <nav className="p-4 space-y-2 flex-1">
                            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Menu Akun</p>
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const hasSubmenu = item.submenu && item.submenu.length > 0;
                                const isSubmenuOpen = openSubmenus[`mobile_${item.name}`];
                                const isActive = item.submenu
                                    ? item.submenu.some(sub => pathname === sub.href)
                                    : (item.href === "/user/pengaturan"
                                        ? pathname === item.href
                                        : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));

                                return (
                                    <div key={item.name} className="space-y-1">
                                        {hasSubmenu ? (
                                            <>
                                                <button
                                                    onClick={() => setOpenSubmenus(prev => ({ ...prev, [`mobile_${item.name}`]: !prev[`mobile_${item.name}`] }))}
                                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                                                        ? "bg-zinc-800 text-white"
                                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                                                >
                                                    <Icon size={20} />
                                                    <span className="flex-1 text-left">{item.name}</span>
                                                    {item.name === "Pesanan Saya" && notifications.my_orders > 0 && (
                                                        <span className="mr-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                            {notifications.my_orders}
                                                        </span>
                                                    )}
                                                    {item.name === "Dashboard Seller" && notifications.incoming_orders > 0 && (
                                                        <span className="mr-2 bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                            {notifications.incoming_orders}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={16} className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-90" : ""}`} />
                                                </button>
                                                {isSubmenuOpen && (
                                                    <div className="ml-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                        {item.submenu.map((sub) => {
                                                            const isLocked = (sub.name === "Jual Langsung" || sub.name === "Lelang Produk") && shopStatus !== "active";

                                                            if (isLocked) {
                                                                return (
                                                                    <div
                                                                        key={sub.name}
                                                                        className="flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 cursor-not-allowed group relative"
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {sub.name}
                                                                            <Lock size={12} className="text-zinc-700" />
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <Link
                                                                    key={sub.name}
                                                                    href={sub.href}
                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                    className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === sub.href
                                                                        ? "text-emerald-500"
                                                                        : "text-zinc-500 hover:text-zinc-300"}`}
                                                                >
                                                                    <span>{sub.name}</span>
                                                                    {sub.name === "Pesanan Masuk" && notifications.incoming_orders > 0 && (
                                                                        <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                                                            {notifications.incoming_orders}
                                                                        </span>
                                                                    )}
                                                                    {item.name === "Pesanan Saya" && sub.name === "Pesanan Aktif" && notifications.my_orders > 0 && (
                                                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                                                                            {notifications.my_orders}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                                                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                                            >
                                                <Icon size={20} />
                                                <span className="flex-1 truncate">{item.name}</span>
                                                {item.name === "Komunitas Saya" && notifications.community > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                                                        {notifications.community}
                                                    </span>
                                                )}
                                                {item.name === "Pesanan Saya" && notifications.my_orders > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                        {notifications.my_orders}
                                                    </span>
                                                )}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-zinc-800">
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <LogOut size={20} />
                                Keluar Sesi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
