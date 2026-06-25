"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { User, Settings, ShoppingBag, Store, Heart, LogOut, MapPin, Home, Menu, X, ChevronLeft, XCircle, ChevronRight, MessageSquare, Users, Lock, Bell, Trash2, Package, CreditCard, Gavel, Wrench, Code, AlertTriangle, AlertCircle, ArrowRight, ShieldAlert, PackageX, Clock } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getImageUrl, getLogoUrl } from "@/app/utils/api";

const MENU_ITEMS = [
  { key: "beranda", name: "Beranda Website", href: "/", icon: Home },
  { key: "profil", name: "Pengaturan Profil", href: "/akun/pengaturan", icon: User },
  { key: "komunitas", name: "Komunitas Saya", href: "/akun/komunitas", icon: MessageSquare },
  {
    key: "pesanan",
    name: "Pesanan Saya",
    icon: ShoppingBag,
    submenu: [
      { key: "pesanan_aktif", name: "Pesanan Aktif", href: "/akun/pesanan" },
      { key: "lelang_aktif", name: "Lelang Aktif", href: "/akun/pesanan/lelang" },
      { key: "riwayat_pesanan", name: "Riwayat Pesanan", href: "/akun/pesanan/riwayat-pembelian" },
      { key: "pengembalian_dana", name: "Pengembalian Dana", href: "/akun/pesanan/pengembalian-dana" },
    ],
  },
  {
    key: "toko",
    name: "Dashboard Seller",
    icon: Store,
    submenu: [
      { key: "toko_dashboard", name: "Dashboard Utama", href: "/toko-saya/dashboard" },
      { key: "toko_profil", name: "Profil Toko", href: "/toko-saya/profil" },
      { key: "toko_jual", name: "Produk Reguler", href: "/toko-saya/jual" },
      { key: "toko_lelang", name: "Lelang Produk", href: "/toko-saya/lelang" },
      { key: "toko_produk", name: "Daftar Produk", href: "/toko-saya/produk" },
      { key: "toko_pesanan", name: "Pesanan Masuk", href: "/toko-saya/pesanan-masuk" },
      { key: "toko_keuangan", name: "Pengajuan Keuangan", href: "/toko-saya/keuangan" },
      { key: "upgrade_toko", name: "Upgrade Toko", href: "/toko-saya/upgrade" },
    ],
  },
  { key: "keamanan", name: "Keamanan Akun", href: "/akun/pengaturan/keamanan", icon: Settings },
  { key: "pengaduan", name: "Pengaduan Saya", href: "/akun/pengaduan", icon: AlertTriangle },
];

const isSubmenuActive = (subHref, pathname) => {
  if (pathname === subHref) return true;

  if (subHref === "/toko-saya/profil") {
    const siblingSubmenus = ["/toko-saya/dashboard", "/toko-saya/jual", "/toko-saya/lelang", "/toko-saya/produk", "/toko-saya/pesanan-masuk", "/toko-saya/keuangan", "/toko-saya/upgrade"];
    return pathname.startsWith("/toko-saya/profil") && !siblingSubmenus.some((sib) => pathname.startsWith(sib));
  }

  if (subHref === "/akun/pesanan") {
    return pathname.startsWith("/akun/pesanan") && !pathname.startsWith("/akun/pesanan/riwayat-pembelian") && !pathname.startsWith("/akun/pesanan/lelang") && !pathname.startsWith("/akun/pesanan/pengembalian-dana");
  }

  return pathname.startsWith(subHref + "/");
};

const normalizePathname = (path) => {
  if (!path) return "";
  let p = path;

  // Toko-Saya mappings
  if (p.startsWith("/user/toko/daftar-produk")) {
    p = p.replace("/user/toko/daftar-produk", "/toko-saya/produk");
  } else if (p.startsWith("/user/toko/jual-produk")) {
    p = p.replace("/user/toko/jual-produk", "/toko-saya/jual");
  } else if (p.startsWith("/user/toko/lelang-produk")) {
    p = p.replace("/user/toko/lelang-produk", "/toko-saya/lelang");
  } else if (p.startsWith("/user/toko/pesanan-masuk")) {
    p = p.replace("/user/toko/pesanan-masuk", "/toko-saya/pesanan-masuk");
  } else if (p.startsWith("/user/toko/upgrade-toko")) {
    p = p.replace("/user/toko/upgrade-toko", "/toko-saya/upgrade");
  } else if (p.startsWith("/user/toko/detail-toko")) {
    p = p.replace("/user/toko/detail-toko", "/toko-saya/profil");
  } else if (p.startsWith("/user/toko/pengajuan-keuangan")) {
    p = p.replace("/user/toko/pengajuan-keuangan", "/toko-saya/keuangan");
  } else if (p.startsWith("/user/toko/dashboard")) {
    p = p.replace("/user/toko/dashboard", "/toko-saya/dashboard");
  } else if (p === "/user/toko" || p.startsWith("/user/toko/")) {
    p = p.replace("/user/toko", "/toko-saya/profil");
  }

  // User/Akun mappings
  if (p.startsWith("/user/pengaturan")) {
    p = p.replace("/user/pengaturan", "/akun/pengaturan");
  } else if (p.startsWith("/user/pesanan/riwayat-pembelian")) {
    p = p.replace("/user/pesanan/riwayat-pembelian", "/akun/pesanan/riwayat-pembelian");
  } else if (p.startsWith("/user/pesanan/lelang")) {
    p = p.replace("/user/pesanan/lelang", "/akun/pesanan/lelang");
  } else if (p.startsWith("/user/pesanan/pengembalian-dana")) {
    p = p.replace("/user/pesanan/pengembalian-dana", "/akun/pesanan/pengembalian-dana");
  } else if (p.startsWith("/user/pesanan")) {
    p = p.replace("/user/pesanan", "/akun/pesanan");
  } else if (p.startsWith("/user/komunitas")) {
    p = p.replace("/user/komunitas", "/akun/komunitas");
  } else if (p.startsWith("/user/pengaduan")) {
    p = p.replace("/user/pengaduan", "/akun/pengaduan");
  }

  return p;
};

export default function UserSidebar() {
  const rawPathname = usePathname();
  const pathname = normalizePathname(rawPathname);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Reminder alert states and refs
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [showAdminAlertModal, setShowAdminAlertModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const reminderTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const rejectedIdsRef = useRef("");
  const shopIdRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [menuStatuses, setMenuStatuses] = useState({});
  const [maintenanceModal, setMaintenanceModal] = useState(null);
  const [notifications, setNotifications] = useState({
    incoming_orders: 0,
    my_orders: 0,
    community: 0,
  });
  const [shopStatus, setShopStatus] = useState("active"); // default to active to prevent flash
  const [shopId, setShopId] = useState(null);
  const [shopLogo, setShopLogo] = useState(null);
  const [isLoadingShop, setIsLoadingShop] = useState(true);

  // Socket & detailed notifications state for mobile bell
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [socket, setSocket] = useState(null);
  const [localReadIds, setLocalReadIds] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeAuctionCount, setActiveAuctionCount] = useState(0);
  const [showDeviceLoginPrompt, setShowDeviceLoginPrompt] = useState(false);
  const [deviceAttemptId, setDeviceAttemptId] = useState("");
  const [showForcedLogoutModal, setShowForcedLogoutModal] = useState(false);

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
          setIsLoadingShop(false);
        }
      } else {
        setIsLoadingShop(false);
      }
      setIsLoaded(true);
    }
  }, []);

  // Listen for shop status changes from other parts of the app
  useEffect(() => {
    const handleSyncShop = () => {
      if (user?.id) {
        fetchShopStatus(user.id);
      }
    };
    const handleSyncUser = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener("shop_status_changed", handleSyncShop);
    window.addEventListener("user_profile_updated", handleSyncUser);
    return () => {
      window.removeEventListener("shop_status_changed", handleSyncShop);
      window.removeEventListener("user_profile_updated", handleSyncUser);
    };
  }, [user?.id]);

  const fetchMenuStatuses = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/menu-controls`);
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        const statusMap = {};
        result.data.forEach((item) => {
          statusMap[item.menu_key] = {
            status: item.status,
            message: item.message,
          };
        });
        setMenuStatuses(statusMap);
      }
    } catch (err) {
      console.error("Error fetching menu statuses", err);
    }
  };

  // Load menu control statuses from backend
  useEffect(() => {
    fetchMenuStatuses();
  }, []);

  const handleMenuClick = (e, key, name) => {
    const config = menuStatuses[key];
    if (config && (config.status === "maintenance" || config.status === "development")) {
      e.preventDefault();
      setMaintenanceModal({
        name,
        status: config.status,
        message: config.message,
      });
      setIsMobileMenuOpen(false);
      return true; // blocked
    }
    return false; // allowed
  };

  const getActiveMenuConfig = (currentPath) => {
    for (const item of MENU_ITEMS) {
      if (item.submenu) {
        for (const sub of item.submenu) {
          if (isSubmenuActive(sub.href, currentPath)) {
            return { key: sub.key, name: sub.name };
          }
        }
      } else if (item.href) {
        const isActive = item.href === "/akun/pengaturan" ? currentPath === "/akun/pengaturan" || currentPath.startsWith("/akun/pengaturan/edit") : item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);
        if (isActive) {
          return { key: item.key, name: item.name };
        }
      }
    }
    return null;
  };

  const fetchShopStatus = async (userId) => {
    if (!userId || userId === "undefined" || userId === "null") {
      console.warn("fetchShopStatus skipped: invalid userId:", userId);
      setIsLoadingShop(false);
      return;
    }
    setIsLoadingShop(true);
    try {
      const url = `${getApiUrl()}/shops/user/${userId}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const result = await res.json();
      if (result.data) {
        setShopStatus(result.data.status?.toLowerCase() || "active");
        setShopId(result.data.id);
        shopIdRef.current = result.data.id;
        setShopLogo(result.data.logo_url);
        fetchSellerOrders(result.data.id);
      } else {
        setShopStatus("none");
        setShopId(null);
        shopIdRef.current = null;
        setShopLogo(null);
      }
    } catch (err) {
      console.error("Error fetching shop status from", getApiUrl(), err);
      setShopStatus("active");
      setShopId(null);
      setShopLogo(null);
    } finally {
      setIsLoadingShop(false);
    }
  };

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
    setCountdown(60);

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
    }, 60000);
  }, [clearAllTimers]);

  const fetchBuyerOrders = async (userId) => {
    try {
      const response = await fetch(`${getApiUrl()}/orders/user/${userId}`);
      const result = await response.json();
      if (response.ok) setOrders(result.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchSellerOrders = async (sId) => {
    if (!sId) return;
    try {
      const response = await fetch(`${getApiUrl()}/orders/shop/${sId}`);
      const result = await response.json();
      if (response.ok) setSellerOrders(result.data || []);
    } catch (err) {
      console.error("Error fetching seller orders:", err);
    }
  };

  const handleDismissReminder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/orders/${orderId}/dismiss-reminder`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (response.ok) {
        if (user?.id) {
          fetchBuyerOrders(user.id);
        }
        if (shopIdRef.current) {
          fetchSellerOrders(shopIdRef.current);
        }
      }
    } catch (err) {
      console.error("Error dismissing reminder:", err);
    }
  };

  const handleCloseModal = () => {
    setShowAdminAlertModal(false);
    if (rejectedIdsRef.current) {
      startReminderCountdown();
    }
  };

  const isSellerPage = rawPathname.startsWith("/toko-saya") || rawPathname.startsWith("/user/toko");

  const adminRejectedOrders = isSellerPage
    ? sellerOrders.filter((order) => {
        const hasReminder = ["payment_verified", "waiting_shipment"].includes(order.status) && order.admin_reminder;
        return hasReminder;
      })
    : orders.filter((order) => {
        const isPaymentRejected = order.status === "waiting_payment" && order.payment_rejection_reason;
        const isAdminCancelled = order.status === "cancelled" && order.rejection_reason && (order.rejection_reason.includes("Admin") || order.rejection_reason.includes("admin"));
        const hasReminder = order.status === "shipped" && order.admin_reminder;
        return isPaymentRejected || isAdminCancelled || hasReminder;
      });

  const paymentRejectedCount = adminRejectedOrders.filter((o) => o.status === "waiting_payment").length;
  const adminCancelledCount = adminRejectedOrders.filter((o) => o.status === "cancelled").length;
  const reminderCount = adminRejectedOrders.filter((o) => o.admin_reminder && (o.status === "shipped" || o.status === "payment_verified" || o.status === "waiting_shipment")).length;

  const total = adminRejectedOrders.length;
  const currentOrder = adminRejectedOrders[currentIndex] || null;
  const isPaymentRejected = currentOrder?.status === "waiting_payment";
  const isReminder = !!currentOrder?.admin_reminder;

  const handlePrev = () => setCurrentIndex((i) => (i === 0 ? adminRejectedOrders.length - 1 : i - 1));
  const handleNext = () => setCurrentIndex((i) => (i === adminRejectedOrders.length - 1 ? 0 : i + 1));

  const handleGoToOrders = () => {
    handleCloseModal();
    if (currentOrder) {
      if (isSellerPage) {
        router.push("/user/toko/pesanan-masuk");
      } else {
        if (currentOrder.status === "waiting_payment") {
          router.push(`/user/pesanan/bayar/${currentOrder.id}`);
        } else {
          router.push(`/user/pesanan/transaksi/${currentOrder.id}`);
        }
      }
    } else {
      router.push(isSellerPage ? "/user/toko/pesanan-masuk" : "/user/pesanan");
    }
  };

  // ─── Reactive: modal toggle based on orders ─────────────────────
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
  }, [orders, sellerOrders, isSellerPage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Auto-open submenu if active child exists, and close other menus/dropdowns on path change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initialOpenStates = {};
      MENU_ITEMS.forEach((item) => {
        if (item.submenu && item.submenu.some((sub) => isSubmenuActive(sub.href, pathname))) {
          initialOpenStates[item.name] = true;
          initialOpenStates[`mobile_${item.name}`] = true;
        }
      });
      setOpenSubmenus(initialOpenStates);
      setIsMobileMenuOpen(false);
      setShowNotifDropdown(false);
    }
  }, [pathname]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const url = `${getApiUrl()}/notifications/${user.id}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok) {
        setNotifications(result.data);
      }
    } catch (err) {
      console.error("Error fetching notifications from", getApiUrl(), err);
    }
  };

  const fetchDetailedCounts = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${getApiUrl()}/notifications/${user.id}`);
      const result = await res.json();
      if (res.ok) {
        setNotifCount((result.data.incoming_orders || 0) + (result.data.my_orders || 0) + (result.data.community || 0) + (result.data.chats || 0) + (result.data.system || 0));
      }
    } catch (e) {
      console.error("Error fetching detailed counts", e);
    }
  };

  const fetchDetailedNotifications = async () => {
    if (!user?.id) return;
    setIsLoadingNotifs(true);
    try {
      const res = await fetch(`${getApiUrl()}/notifications/list/${user.id}`);
      const result = await res.json();
      if (res.ok) setNotifList(result.data || []);
    } catch (e) {
      console.error("Error fetching notifications list", e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const fetchActiveAuctionsCount = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${getApiUrl()}/bids/user/${userId}`);
      const result = await response.json();
      if (response.ok && result.data) {
        const now = new Date().getTime();
        const activeCount = result.data.filter((item) => {
          const end = item.end_date ? new Date(item.end_date).getTime() : 0;
          const isEnded = item.status === "ended" || item.status === "sold" || end <= now;
          return !isEnded;
        }).length;
        setActiveAuctionCount(activeCount);
      }
    } catch (err) {
      console.error("Error fetching active auctions count:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchDetailedCounts();
      fetchDetailedNotifications();
      fetchActiveAuctionsCount(user.id);
      fetchBuyerOrders(user.id);
      if (shopId) {
        fetchSellerOrders(shopId);
      }
      const interval = setInterval(() => {
        fetchNotifications();
        fetchDetailedCounts();
        fetchActiveAuctionsCount(user.id);
        fetchBuyerOrders(user.id);
        if (shopIdRef.current) {
          fetchSellerOrders(shopIdRef.current);
        }
      }, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [user?.id, shopId]);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    const newSocket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });
    setSocket(newSocket);
    newSocket.emit("join_user", user.id);

    newSocket.on("new_notification", (data) => {
      fetchNotifications();
      fetchDetailedCounts(); // Fetch accurate counts from backend
      fetchDetailedNotifications(); // Refresh list
      fetchActiveAuctionsCount(user.id);
      fetchShopStatus(user.id);
      fetchBuyerOrders(user.id);
      if (shopIdRef.current) {
        fetchSellerOrders(shopIdRef.current);
      }
    });

    newSocket.on("order_updated", () => {
      fetchBuyerOrders(user.id);
      if (shopIdRef.current) {
        fetchSellerOrders(shopIdRef.current);
      }
    });

    newSocket.on("listing_bid_updated", () => {
      fetchActiveAuctionsCount(user.id);
    });

    newSocket.on("auction_ended", () => {
      fetchActiveAuctionsCount(user.id);
    });

    newSocket.on("menu_controls_updated", () => {
      fetchMenuStatuses();
    });

    newSocket.on("new_listing_created", () => {
      window.dispatchEvent(new CustomEvent("sync_quota"));
    });

    newSocket.on("listing_deleted", () => {
      window.dispatchEvent(new CustomEvent("sync_quota"));
    });

    newSocket.on("shop_quota_updated", () => {
      fetchShopStatus(user.id);
      window.dispatchEvent(new CustomEvent("sync_quota"));
    });

    newSocket.on("shop_upgrade_status_updated", () => {
      fetchShopStatus(user.id);
    });

    newSocket.on("shop_membership_updated", () => {
      fetchShopStatus(user.id);
    });

    newSocket.on("forced_logout", () => {
      setShowForcedLogoutModal(true);
    });

    newSocket.on("other_device_login_attempt", ({ attemptId }) => {
      setDeviceAttemptId(attemptId);
      setShowDeviceLoginPrompt(true);
    });

    return () => newSocket.disconnect();
  }, [user?.id]);

  // Mark as read when entering community
  useEffect(() => {
    if (pathname === "/akun/komunitas" && user?.id) {
      const markAsRead = async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${getApiUrl()}/notifications/${user.id}/read`, {
            method: "PUT",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          setNotifications((prev) => ({ ...prev, community: 0 }));
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

  const handleAllowDeviceLogin = () => {
    if (socket && deviceAttemptId) {
      socket.emit("respond_login_attempt", { attemptId: deviceAttemptId, action: "allow" });
      handleLogout();
    }
    setShowDeviceLoginPrompt(false);
  };

  const handleDenyDeviceLogin = () => {
    if (socket && deviceAttemptId) {
      socket.emit("respond_login_attempt", { attemptId: deviceAttemptId, action: "deny" });
    }
    setShowDeviceLoginPrompt(false);
  };

  const toggleSubmenu = (name) => {
    setOpenSubmenus((prev) => ({
      [name]: !prev[name],
    }));
  };

  const activeMenu = getActiveMenuConfig(pathname);
  const activeStatus = activeMenu ? menuStatuses[activeMenu.key]?.status : "active";
  const activeMessage = activeMenu ? menuStatuses[activeMenu.key]?.message : "";

  if (activeStatus === "maintenance" || activeStatus === "development") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-8 text-white z-[9999] animate-in fade-in duration-200">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] text-center animate-in scale-in-95 duration-200">
          {activeStatus === "maintenance" ? (
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6 border border-amber-500/20 animate-pulse">
              <Wrench size={40} />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <Code size={40} />
            </div>
          )}

          <h1 className="text-3xl font-black mb-2">{activeStatus === "maintenance" ? "Pemeliharaan Sistem" : "Tahap Pengembangan"}</h1>

          <p className="text-zinc-400 font-medium text-sm mb-6">
            Halaman <span className="text-white font-bold">{activeMenu.name}</span> sedang dalam status {activeStatus === "maintenance" ? "pemeliharaan" : "pengembangan"}.
          </p>

          <div className="w-full bg-zinc-950 border border-zinc-850 p-5 rounded-2xl mb-8 text-left">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Informasi Perbaikan</p>
            <p className="text-zinc-350 text-xs leading-relaxed font-semibold">{activeMessage || (activeStatus === "maintenance" ? "Tim kami sedang melakukan pemeliharaan pada halaman ini untuk meningkatkan layanan. Silakan kembali beberapa saat lagi." : "Halaman ini sedang dalam tahap perancangan aktif dan akan segera hadir.")}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/")} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl transition-all active:scale-[0.98]">
              Kembali ke Beranda
            </button>
            <button onClick={() => router.back()} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-zinc-800 active:scale-[0.98]">
              Halaman Sebelumnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayLogo = isSellerPage && shopLogo ? getLogoUrl(shopLogo) : user?.avatar_url ? getImageUrl(user.avatar_url) : null;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`${isCollapsed ? "w-24" : "w-72"} bg-zinc-900 border-r border-zinc-800 flex-col h-screen sticky top-0 hidden md:flex z-40 transition-all duration-300 relative`}>
        {/* Toggle Collapse Button */}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-12 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 z-50 hover:bg-zinc-700 transition-all">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* User Profile Header */}
        <div className={`p-8 border-b border-zinc-800 pt-12 ${isCollapsed ? "px-4 flex flex-col items-center" : ""}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? "" : "mb-2"}`}>
            {!isLoaded ? (
              <>
                <div className="w-14 h-14 bg-zinc-800 rounded-2xl animate-pulse shrink-0"></div>
                {!isCollapsed && (
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2"></div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden">{displayLogo ? <img src={displayLogo} alt={user?.username || "User"} className="w-full h-full object-cover" /> : user?.username ? user.username.charAt(0).toUpperCase() : "U"}</div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white truncate">{user?.name || user?.username || "Pengguna"}</p>
                    <p className="text-sm text-zinc-400 truncate">{user?.email || ""}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden`}>
          {!isCollapsed ? <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 truncate">Menu Akun</p> : <div className="h-4"></div>}
          {MENU_ITEMS.map((item) => {
            const parentStatus = menuStatuses[item.key]?.status || "active";
            if (parentStatus === "hidden") return null;

            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenus[item.name];
            const isActive = item.submenu ? item.submenu.some((sub) => isSubmenuActive(sub.href, pathname)) : item.href === "/akun/pengaturan" ? pathname === "/akun/pengaturan" || pathname.startsWith("/akun/pengaturan/edit") : item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <div key={item.name} className="space-y-1">
                {hasSubmenu ? (
                  <button onClick={() => toggleSubmenu(item.name)} className={`w-full flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                    <Icon size={20} className="shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate flex items-center">
                          {item.name}
                          {parentStatus === "maintenance" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Maint</span>}
                          {parentStatus === "development" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">Dev</span>}
                        </span>
                        {item.name === "Pesanan Saya" && notifications.my_orders > 0 && <span className="mr-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.my_orders}</span>}
                        {item.name === "Dashboard Seller" && notifications.incoming_orders > 0 && <span className="mr-2 bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.incoming_orders}</span>}
                        <ChevronRight size={16} className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-90" : ""}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    onClick={(e) => handleMenuClick(e, item.key, item.name)}
                    className={`flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isActive ? "bg-emerald-50 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                  >
                    <Icon size={20} className={`shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                    {!isCollapsed && (
                      <span className="flex-1 truncate flex items-center">
                        {item.name}
                        {parentStatus === "maintenance" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Maint</span>}
                        {parentStatus === "development" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">Dev</span>}
                      </span>
                    )}
                    {!isCollapsed && item.name === "Komunitas Saya" && notifications.community > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">{notifications.community}</span>}
                    {!isCollapsed && item.name === "Pesanan Saya" && notifications.my_orders > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.my_orders}</span>}
                    {isCollapsed && ((item.name === "Komunitas Saya" && notifications.community > 0) || (item.name === "Pesanan Saya" && (notifications.my_orders > 0 || activeAuctionCount > 0)) || (item.name === "Dashboard Seller" && notifications.incoming_orders > 0)) && (
                      <div className="absolute top-2 right-4 w-2.5 h-2.5 bg-red-500 border-2 border-zinc-900 rounded-full"></div>
                    )}
                  </Link>
                )}

                {/* Submenu Rendering */}
                {hasSubmenu && isSubmenuOpen && !isCollapsed && (
                  <div className="ml-12 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.submenu.map((sub) => {
                      const subStatus = menuStatuses[sub.key]?.status || "active";
                      if (subStatus === "hidden") return null;

                      const hasNoShop = !isLoadingShop && (shopStatus === "none" || !shopId);
                      const isLocked = ((sub.name === "Produk Reguler" || sub.name === "Lelang Produk") && shopStatus !== "active") || ((sub.name === "Dashboard Utama" || sub.name === "Daftar Produk" || sub.name === "Pesanan Masuk" || sub.name === "Pengajuan Keuangan" || sub.name === "Upgrade Toko") && hasNoShop);

                      if (isLocked) {
                        const lockReason = hasNoShop ? "Buka Toko Dahulu" : "Tunggu Verifikasi Admin";
                        return (
                          <div key={sub.name} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 cursor-not-allowed group relative" title={lockReason}>
                            <span className="flex items-center gap-2">
                              {sub.name}
                              <Lock size={12} className="text-zinc-700" />
                            </span>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50 border border-zinc-700">{lockReason}</div>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={sub.name}
                          href={sub.name === "Profil Toko" && shopId ? `/toko-saya/profil/${shopId}` : sub.href}
                          onClick={(e) => handleMenuClick(e, sub.key, sub.name)}
                          className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSubmenuActive(sub.href, pathname) ? "text-emerald-500 font-bold bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                          <span className="flex items-center">
                            {sub.name}
                            {subStatus === "maintenance" && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 ml-1.5">Maint</span>}
                            {subStatus === "development" && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 ml-1.5">Dev</span>}
                          </span>
                          {sub.name === "Pesanan Masuk" && notifications.incoming_orders > 0 && <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">{notifications.incoming_orders}</span>}
                          {item.name === "Pesanan Saya" && sub.name === "Pesanan Aktif" && notifications.my_orders > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">{notifications.my_orders}</span>}
                          {item.name === "Pesanan Saya" && sub.name === "Lelang Aktif" && activeAuctionCount > 0 && <span className="bg-amber-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">{activeAuctionCount}</span>}
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
          <button onClick={handleLogout} title={isCollapsed ? "Keluar Sesi" : ""} className={`w-full flex items-center justify-center gap-3 ${isCollapsed ? "px-0" : "px-4"} py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all group`}>
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
            {!isLoaded ? (
              <>
                <div className="w-10 h-10 bg-zinc-800 rounded-xl animate-pulse shrink-0"></div>
                <div className="space-y-1.5 flex flex-col justify-center">
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-24"></div>
                  <div className="h-2 bg-zinc-800 rounded animate-pulse w-16"></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">{displayLogo ? <img src={displayLogo} alt={user?.username || "User"} className="w-full h-full object-cover" /> : user?.username ? user.username.charAt(0).toUpperCase() : "U"}</div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{user?.name || user?.username || "Pengguna"}</p>
                </div>
              </>
            )}
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
                      const token = localStorage.getItem("token");
                      fetch(`${getApiUrl()}/notifications/${user.id}/read-all`, {
                        method: "PUT",
                        headers: {
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                      })
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
                {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 animate-bounce">{notifCount}</span>}
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
          <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 p-4 animate-in fade-in slide-in-from-top-3 duration-200 z-50 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Notifikasi</h3>
                {notifList.length > 0 && <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">{notifList.length}</span>}
              </div>
              <button
                className="text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                onClick={async () => {
                  if (user) {
                    try {
                      const token = localStorage.getItem("token");
                      await fetch(`${getApiUrl()}/notifications/${user.id}`, {
                        method: "DELETE",
                        headers: {
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                      });
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

                    if (notif.type === "chat") {
                      IconComponent = MessageSquare;
                      iconColor = "bg-emerald-500/10 text-emerald-400";
                    } else if (notif.type === "disbursement") {
                      IconComponent = CreditCard;
                      iconColor = "bg-emerald-500/10 text-emerald-400";
                    } else if (notif.type.includes("order")) {
                      IconComponent = Package;
                      iconColor = "bg-blue-500/10 text-blue-400";
                    } else if (notif.type === "community") {
                      IconComponent = Users;
                      iconColor = "bg-purple-500/10 text-purple-400";
                    } else if (notif.type === "moderation_product") {
                      IconComponent = Package;
                      iconColor = notif.title.includes("Setuju") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400";
                    } else if (notif.type === "moderation_shop") {
                      IconComponent = Store;
                      iconColor = notif.title.includes("Verifikasi") ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400";
                    } else if (notif.type.includes("auction")) {
                      IconComponent = Gavel;
                      iconColor = "bg-amber-500/10 text-amber-400";
                    }

                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (notif.link === "chat_modal") {
                            const event = new CustomEvent("openInbox", {
                              detail: notif.data,
                            });
                            window.dispatchEvent(event);
                          } else {
                            window.location.href = notif.link;
                          }
                          setLocalReadIds((prev) => [...prev, notif.id]);
                          setShowNotifDropdown(false);
                        }}
                        className={`w-full px-2.5 py-3 transition-all flex items-start gap-3 group text-left relative rounded-lg my-1 ${!notif.is_read && !localReadIds.includes(notif.id) ? "bg-emerald-500/5 border-l-3 border-emerald-500" : "hover:bg-zinc-800/30"}`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center transition-transform`}>
                          <IconComponent size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-black text-white truncate pr-1">{notif.title}</p>
                            <p className="text-[8px] font-bold text-zinc-500 shrink-0">{new Date(notif.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <p className="text-[11px] font-semibold text-zinc-400 leading-normal mb-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                            {new Date(notif.time).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
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
              <Link href="/user/pesanan" onClick={() => setShowNotifDropdown(false)} className="flex items-center justify-center w-full py-2.5 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-[0.98]">
                Lihat Semua Aktivitas
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 max-h-[80vh] overflow-y-auto flex flex-col">
            <nav className="p-4 space-y-2 flex-1">
              <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Menu Akun</p>
              {MENU_ITEMS.map((item) => {
                const parentStatus = menuStatuses[item.key]?.status || "active";
                if (parentStatus === "hidden") return null;

                const Icon = item.icon;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isSubmenuOpen = openSubmenus[`mobile_${item.name}`];
                const isActive = item.submenu ? item.submenu.some((sub) => isSubmenuActive(sub.href, pathname)) : item.href === "/akun/pengaturan" ? pathname === "/akun/pengaturan" || pathname.startsWith("/akun/pengaturan/edit") : item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <div key={item.name} className="space-y-1">
                    {hasSubmenu ? (
                      <>
                        <button
                          onClick={() =>
                            setOpenSubmenus((prev) => ({
                              ...prev,
                              [`mobile_${item.name}`]: !prev[`mobile_${item.name}`],
                            }))
                          }
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                        >
                          <Icon size={20} />
                          <span className="flex-1 text-left flex items-center">
                            {item.name}
                            {parentStatus === "maintenance" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Maint</span>}
                            {parentStatus === "development" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">Dev</span>}
                          </span>
                          {item.name === "Pesanan Saya" && notifications.my_orders > 0 && <span className="mr-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.my_orders}</span>}
                          {item.name === "Dashboard Seller" && notifications.incoming_orders > 0 && <span className="mr-2 bg-emerald-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.incoming_orders}</span>}
                          <ChevronRight size={16} className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-90" : ""}`} />
                        </button>
                        {isSubmenuOpen && (
                          <div className="ml-10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.submenu.map((sub) => {
                              const subStatus = menuStatuses[sub.key]?.status || "active";
                              if (subStatus === "hidden") return null;

                              const hasNoShop = !isLoadingShop && (shopStatus === "none" || !shopId);
                              const isLocked = ((sub.name === "Produk Reguler" || sub.name === "Lelang Produk") && shopStatus !== "active") || ((sub.name === "Dashboard Utama" || sub.name === "Daftar Produk" || sub.name === "Pesanan Masuk" || sub.name === "Pengajuan Keuangan" || sub.name === "Upgrade Toko") && hasNoShop);

                              if (isLocked) {
                                const lockReason = hasNoShop ? "Buka Toko Dahulu" : "Tunggu Verifikasi Admin";
                                return (
                                  <div key={sub.name} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 cursor-not-allowed group relative" title={lockReason}>
                                    <span className="flex items-center gap-2">
                                      {sub.name}
                                      <Lock size={12} className="text-zinc-700" />
                                    </span>
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50 border border-zinc-700">{lockReason}</div>
                                  </div>
                                );
                              }

                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.name === "Profil Toko" && shopId ? `/toko-saya/profil/${shopId}` : sub.href}
                                  onClick={(e) => {
                                    const blocked = handleMenuClick(e, sub.key, sub.name);
                                    if (!blocked) setIsMobileMenuOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSubmenuActive(sub.href, pathname) ? "text-emerald-500 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                  <span className="flex items-center">
                                    {sub.name}
                                    {subStatus === "maintenance" && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 ml-1.5">Maint</span>}
                                    {subStatus === "development" && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 ml-1.5">Dev</span>}
                                  </span>
                                  {sub.name === "Pesanan Masuk" && notifications.incoming_orders > 0 && <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">{notifications.incoming_orders}</span>}
                                  {item.name === "Pesanan Saya" && sub.name === "Pesanan Aktif" && notifications.my_orders > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">{notifications.my_orders}</span>}
                                  {item.name === "Pesanan Saya" && sub.name === "Lelang Aktif" && activeAuctionCount > 0 && <span className="bg-amber-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">{activeAuctionCount}</span>}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          const blocked = handleMenuClick(e, item.key, item.name);
                          if (!blocked) setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                      >
                        <Icon size={20} />
                        <span className="flex-1 truncate flex items-center">
                          {item.name}
                          {parentStatus === "maintenance" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Maint</span>}
                          {parentStatus === "development" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">Dev</span>}
                        </span>
                        {item.name === "Komunitas Saya" && notifications.community > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">{notifications.community}</span>}
                        {item.name === "Pesanan Saya" && notifications.my_orders > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{notifications.my_orders}</span>}
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
      {/* --- MAINTENANCE MODAL --- */}
      {maintenanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-md w-full relative animate-in scale-in-95 duration-200 text-white">
            <div className="flex flex-col items-center text-center">
              {maintenanceModal.status === "maintenance" ? (
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 border border-amber-500/20 animate-pulse">
                  <Wrench size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 border border-blue-500/20">
                  <Code size={32} />
                </div>
              )}

              <h3 className="text-2xl font-black text-white mb-2">{maintenanceModal.status === "maintenance" ? "Pemeliharaan Sistem" : "Tahap Pengembangan"}</h3>

              <p className="text-zinc-400 font-medium text-sm mb-4">
                Menu <span className="text-white font-bold">{maintenanceModal.name}</span> sedang dalam status {maintenanceModal.status === "maintenance" ? "pemeliharaan" : "pengembangan"}.
              </p>

              <div className="w-full bg-zinc-950 border border-zinc-850 p-4 rounded-2xl mb-8 text-left">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Pesan Admin</p>
                <p className="text-zinc-350 text-xs leading-relaxed font-semibold">{maintenanceModal.message || (maintenanceModal.status === "maintenance" ? "Tim kami sedang melakukan pembaruan rutin pada menu ini. Silakan coba lagi nanti." : "Fitur ini sedang dirancang dan akan segera hadir untuk meningkatkan pengalaman Anda.")}</p>
              </div>

              <button onClick={() => setMaintenanceModal(null)} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]">
                Tutup Peringatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sesi di Perangkat Lain Aktif Modal */}
      {showDeviceLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleDenyDeviceLogin} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center relative z-10 animate-in zoom-in duration-300 shadow-2xl">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 leading-tight">Sesi Baru Mencoba Masuk</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">Sesi baru terdeteksi mencoba masuk ke akun Anda dari perangkat lain. Apakah Anda ingin mengizinkan masuk? Sesi di perangkat ini akan berakhir jika Anda mengizinkan.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleAllowDeviceLogin} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm">
                Izinkan & Keluar
              </button>
              <button onClick={handleDenyDeviceLogin} className="w-full border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 font-bold py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm">
                Tetap Masuk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sesi Berakhir Modal */}
      {showForcedLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center relative z-10 animate-in zoom-in duration-300 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <XCircle size={36} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 leading-tight">Sesi Berakhir</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">Akun Anda telah masuk di perangkat lain. Sesi di perangkat ini berakhir.</p>
            <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm font-semibold">
              Masuk Kembali
            </button>
          </div>
        </div>
      )}

      {/* ─── Floating Reminder Badge (saat modal tertutup, countdown berjalan) ─── */}
      {!showAdminAlertModal && countdown > 0 && (
        <button
          onClick={() => {
            clearAllTimers();
            setCurrentIndex(0);
            setShowAdminAlertModal(true);
          }}
          className="fixed bottom-6 right-6 z-[190] flex items-center gap-3 bg-zinc-900 border border-red-500/30 text-white rounded-2xl px-4 py-3 hover:border-red-500/60 transition-all active:scale-95 shadow-2xl animate-bounce"
          style={{ animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="relative w-9 h-9 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#27272a" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={countdown > 0 ? 2 * Math.PI * 14 - (countdown / 60) * (2 * Math.PI * 14) : 2 * Math.PI * 14} style={{ transition: "stroke-dashoffset 1s linear" }} />
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
              <div className="flex gap-2 px-7 pb-4 flex-wrap">
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
                {reminderCount > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black">
                    <Clock size={11} />
                    {reminderCount} Pengingat Admin
                  </span>
                )}
              </div>
            )}

            <div className="h-px bg-zinc-800 mx-7" />

            {/* ── Order Card ── */}
            <div className="px-7 py-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-black text-emerald-400 font-mono tracking-wide">{currentOrder.order_id}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isPaymentRejected ? "bg-red-500/10 text-red-400 border-red-500/20" : isReminder ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                  {isPaymentRejected ? "Pembayaran Ditolak" : isReminder ? "Pengingat Admin" : "Dibatalkan Admin"}
                </span>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-black text-white">{currentOrder.product?.name || "-"}</p>
                <p className="text-[11px] text-zinc-500 font-semibold">
                  {isSellerPage ? (
                    <>
                      Pembeli: <span className="text-zinc-400">{currentOrder.receiver_name || currentOrder.user?.username || "-"}</span>
                    </>
                  ) : (
                    <>
                      Penjual: <span className="text-zinc-400">{currentOrder.shop?.name || "-"}</span>
                    </>
                  )}
                </p>
              </div>

              <div className={`${isReminder ? "bg-amber-500/5 border-amber-500/15" : "bg-red-500/5 border-red-500/15"} p-4 border rounded-2xl`}>
                <p className="text-[11px] text-zinc-400 font-semibold mb-1 uppercase tracking-widest">{isReminder ? "Pesan Pengingat Admin" : "Alasan Admin"}</p>
                <p className="text-sm text-zinc-200 leading-relaxed font-semibold">{isPaymentRejected ? currentOrder.payment_rejection_reason : isReminder ? currentOrder.admin_reminder : currentOrder.rejection_reason}</p>
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

              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 w-full">
                  <button onClick={handleCloseModal} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-zinc-700 active:scale-95">
                    Tutup
                  </button>
                  <button onClick={handleGoToOrders} className="flex-[2] flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95">
                    Proses Pesanan
                    <ArrowRight size={14} />
                  </button>
                </div>
                {isReminder && (
                  <button
                    onClick={async () => {
                      await handleDismissReminder(currentOrder.id);
                      handleCloseModal();
                    }}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 border border-amber-400/20"
                  >
                    Saya Mengerti (Hapus Pengingat)
                  </button>
                )}
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
    </>
  );
}
