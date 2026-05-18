"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ShoppingBag,
    Search,
    Filter,
    ChevronRight,
    Clock,
    Truck,
    CheckCircle2,
    XCircle,
    MoreVertical,
    MessageSquare,
    Store,
    CreditCard,
    Package,
    ArrowRight,
    MapPin,
    AlertCircle,
    Info,
    ScrollText,
    Trash2,
    ShoppingCart,
    Eye,
    Save,
    Edit3,
    Star
} from "lucide-react";
import Image from "next/image";
import ActionModal from "@/components/ActionModal";
import { io } from "socket.io-client";

export default function PesananPage() {
    const [activeTab, setActiveTab] = useState("semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [isProcessingCart, setIsProcessingCart] = useState(false);

    // Global Action Modal State
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '',
        isLoading: false
    });

    // Shipping & Detail Modal States
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
    const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);
    const [shippingForm, setShippingForm] = useState({
        receiver_name: "",
        phone_number: "",
        shipping_address: ""
    });

    // Rating Modal State
    const [ratingModal, setRatingModal] = useState({
        isOpen: false,
        orderId: null,
        rating: 5,
        review: "",
        isLoading: false
    });

    const fetchOrders = async () => {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        if (!userStr || !process.env.NEXT_PUBLIC_API_URL) {
            setIsLoading(false);
            return;
        }

        try {
            const user = JSON.parse(userStr);
            const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/user/${user.id}`;
            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                setOrders(result.data || []);
            } else {
                console.error("Failed to fetch orders:", result.message);
            }
        } catch (err) {
            console.error("Error fetching orders from", process.env.NEXT_PUBLIC_API_URL, err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCartItems = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr || !process.env.NEXT_PUBLIC_API_URL) return;
        try {
            const user = JSON.parse(userStr);
            const url = `${process.env.NEXT_PUBLIC_API_URL}/cart/${user.id}`;
            const response = await fetch(url);
            const result = await response.json();
            if (response.ok) {
                setCartItems(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching cart from", process.env.NEXT_PUBLIC_API_URL, err);
        }
    };

    useEffect(() => {
        // Handle tab from query param
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            if (tabParam) {
                setActiveTab(tabParam);
            }
        }

        fetchOrders();
        fetchCartItems();

        // Setup Socket.io for Real-time Updates
        const userStr = localStorage.getItem("user");
        let socket;
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                socket = io(process.env.NEXT_PUBLIC_API_URL);
                socket.emit("join_user", userData.id);
                
                socket.on("new_notification", () => {
                    fetchOrders(); // Auto-refresh when status changes
                    fetchCartItems();
                });
            } catch (e) {
                console.error("Socket connection error", e);
            }
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const handleRemoveFromCart = async (cartId) => {
        setActionModal({
            isOpen: true,
            type: 'danger',
            title: 'Hapus dari Keranjang?',
            message: 'Apakah Anda yakin ingin menghapus item ini dari keranjang belanja Anda?',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        fetchCartItems();
                        setActionModal(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        });
    };

    const handleCancelOrder = (orderId) => {
        setActionModal({
            isOpen: true,
            type: 'warning',
            title: 'Batalkan Pesanan?',
            message: 'Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan ke penjual.',
            confirmText: 'Ya, Batalkan',
            onConfirm: async () => {
                const userStr = localStorage.getItem("user");
                if (!userStr) return;
                const user = JSON.parse(userStr);

                setActionModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/cancel`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            cancellation_reason: 'Dibatalkan oleh pembeli'
                        })
                    });
                    if (response.ok) {
                        fetchOrders();
                        setActionModal({
                            isOpen: true,
                            type: 'success',
                            title: 'Berhasil Dibatalkan',
                            message: 'Pesanan Anda telah berhasil dibatalkan.',
                            onConfirm: null
                        });
                    } else {
                        const err = await response.json();
                        alert(err.message || "Gagal membatalkan pesanan.");
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setActionModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleResolveComplaint = (orderId) => {
        setRatingModal({
            isOpen: true,
            orderId: orderId,
            rating: 5,
            review: "",
            isLoading: false
        });
    };

    const submitRating = async () => {
        setRatingModal(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${ratingModal.orderId}/resolve-complaint`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: ratingModal.rating,
                    review: ratingModal.review
                })
            });

            if (response.ok) {
                fetchOrders();
                setRatingModal(prev => ({ ...prev, isOpen: false }));
                setActionModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Berhasil Selesai',
                    message: 'Komplain telah diselesaikan dan penilaian Anda telah disimpan. Terima kasih!',
                    onConfirm: null
                });
            } else {
                const err = await response.json();
                alert(err.message || "Gagal menyelesaikan komplain.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRatingModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDeleteOrderHistory = (orderId) => {
        setActionModal({
            isOpen: true,
            type: 'danger',
            title: 'Hapus Riwayat?',
            message: 'Apakah Anda yakin ingin menghapus catatan ini secara permanen dari daftar belanja?',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                setActionModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/history`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        fetchOrders();
                        setActionModal({
                            isOpen: true,
                            type: 'success',
                            title: 'Berhasil Dihapus',
                            message: 'Riwayat pesanan telah dihapus.',
                            onConfirm: null
                        });
                    } else {
                        const err = await response.json();
                        alert(err.message || "Gagal menghapus riwayat.");
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setActionModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleCheckoutCart = (item) => {
        setActionModal({
            isOpen: true,
            type: 'checkout',
            title: 'Konfirmasi Pembelian',
            message: `Apakah Anda yakin ingin membeli langsung "${item.product?.name}" sebanyak ${item.quantity} ekor? (Pilih YA berarti Anda setuju untuk membelinya)`,
            confirmText: 'Ya, Beli Sekarang',
            cancelText: 'Batal',
            onConfirm: () => executeCheckout(item)
        });
    };

    const executeCheckout = async (item) => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        setActionModal(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    listing_id: item.listing_id,
                    quantity: item.quantity,
                    from_cart: true
                })
            });

            if (response.ok) {
                // Remove from cart after successful order
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${item.id}`, { method: 'DELETE' });
                fetchOrders();
                fetchCartItems();
                setActiveTab("pending_shipping_info");
                setActionModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Berhasil Memesan!',
                    message: 'Pesanan Anda telah dibuat. Silakan lengkapi data pengiriman Anda sekarang.',
                    onConfirm: null
                });
            } else {
                const err = await response.json();
                setActionModal({
                    isOpen: true,
                    type: 'danger',
                    title: 'Gagal Checkout',
                    message: err.message || "Terjadi kesalahan saat memproses pesanan.",
                    onConfirm: null
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        setIsUpdatingShipping(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${selectedOrder.id}/shipping-info`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shippingForm)
            });

            if (response.ok) {
                setShowShippingModal(false);
                fetchOrders();
                setActionModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Data Tersimpan!',
                    message: 'Data pengiriman berhasil disimpan. Menunggu seller menentukan ongkos kirim.',
                    onConfirm: null
                });
            } else {
                alert("Gagal menyimpan data pengiriman.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingShipping(false);
        }
    };

    const openDetailModal = (order) => {
        setSelectedOrder(order);
        setShowDetail(true);
        setActiveDetailImageIndex(0);
    };

    const tabs = [
        { id: "semua", label: "Semua", icon: <ShoppingBag size={14} /> },
        { id: "keranjang", label: `Keranjang (${cartItems.length})`, icon: <ShoppingCart size={14} /> },
        { id: "pending_shipping_info", label: `Lengkapi Data (${orders.filter(o => o.status === 'pending_shipping_info').length})`, icon: <MapPin size={14} /> },
        { id: "waiting_shipping_cost", label: `Menunggu Ongkir (${orders.filter(o => o.status === 'waiting_shipping_cost').length})`, icon: <Truck size={14} /> },
        { id: "waiting_payment", label: `Belum Bayar (${orders.filter(o => o.status === 'waiting_payment').length})`, icon: <CreditCard size={14} /> },
        { id: "processing", label: `Diproses (${orders.filter(o => ['processing', 'waiting_shipment', 'payment_verified'].includes(o.status)).length})`, icon: <Clock size={14} /> },
        { id: "shipped", label: `Dikirim (${orders.filter(o => o.status === 'shipped').length})`, icon: <Truck size={14} /> },
        { id: "completed", label: `Selesai (${orders.filter(o => ['completed', 'disbursement_requested', 'disbursed'].includes(o.status)).length})`, icon: <CheckCircle2 size={14} /> },
        { id: "cancelled", label: `Dibatalkan (${orders.filter(o => o.status === 'cancelled').length})`, icon: <XCircle size={14} /> },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending_shipping_info": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "waiting_shipping_cost": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "waiting_payment": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "waiting_shipment": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "payment_verified": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "shipped": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "complained": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "pending_shipping_info": return "Lengkapi Data";
            case "waiting_shipping_cost": return "Menunggu Ongkir";
            case "waiting_payment": return "Menunggu Pembayaran";
            case "processing": return "Sedang Diproses";
            case "waiting_shipment": return "Sedang Diproses";
            case "payment_verified": return "Sedang Diproses";
            case "shipped": return "Dalam Pengiriman";
            case "complained": return "Dikomplain";
            case "completed": return "Selesai";
            case "disbursement_requested": return "Selesai";
            case "disbursed": return "Selesai";
            case "cancelled": return "Dibatalkan";
            default: return status;
        }
    };

    const formatPrice = (price) => {
        const num = parseFloat(price) || 0;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(num);
    };

    // Active orders: exclude 'completed', 'cancelled', dan status post-completed (disbursement flow)
    // Status disbursement_requested dan disbursed adalah proses internal seller-admin,
    // bagi buyer pesanan tersebut sudah 'selesai' dan tidak perlu ditampilkan di proses transaksi
    const activeOrders = orders.filter(o => {
        if (['completed', 'cancelled', 'cancelled_dismissed', 'disbursement_requested', 'disbursed'].includes(o.status)) return false;
        // Hanya sembunyikan jika produk benar-benar sudah 'sold' (berarti sudah ada yang menyelesaikan transaksi)
        // TAPI jangan sembunyikan order yang statusnya masih aktif
        if (o.product && o.product.status === 'sold' && !['processing', 'payment_verified', 'waiting_shipment', 'shipped', 'complained'].includes(o.status)) return false;
        return true;
    });

    const filteredOrders = (() => {
        // Tab Dibatalkan: tampilkan semua pesanan cancelled
        if (activeTab === 'cancelled') {
            const cancelled = orders.filter(o => ['cancelled', 'cancelled_dismissed'].includes(o.status));
            const matchSearch = (order) => {
                const productName = order.product?.name || "";
                const orderId = order.order_id || "";
                return productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    orderId.toLowerCase().includes(searchQuery.toLowerCase());
            };
            return cancelled.filter(matchSearch);
        }

        // Tab Selesai: tampilkan SEMUA order yang sudah selesai termasuk disbursement flow
        if (activeTab === 'completed') {
            const completed = orders.filter(o => ['completed', 'disbursement_requested', 'disbursed'].includes(o.status));
            const matchSearch = (order) => {
                const productName = order.product?.name || "";
                const orderId = order.order_id || "";
                return productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    orderId.toLowerCase().includes(searchQuery.toLowerCase());
            };
            return completed.filter(matchSearch);
        }

        return activeOrders.filter(order => {
            const matchesTab = activeTab === "semua" ||
                (activeTab === "proses_transaksi" && !['cancelled'].includes(order.status)) ||
                (activeTab === "processing" && ['processing', 'waiting_shipment', 'payment_verified'].includes(order.status)) ||
                order.status === activeTab;

            const productName = order.product?.name || "";
            const orderId = order.order_id || "";
            const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                orderId.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    })();

    const filteredCart = cartItems.filter(item =>
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) && item.product?.stock > 0
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Pesanan Aktif</h1>
                    <p className="text-zinc-400 font-medium">Pantau dan kelola transaksi yang sedang berjalan</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/user/pesanan/riwayat-pembelian"
                        className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group"
                    >
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Riwayat Pembelian
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Filter & Search Section - Reorganized for better visibility */}
            <div className="space-y-4 ">
                {/* Search Row */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-2 md:p-3 flex flex-col lg:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari pesanan atau nomor invoice..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl md:rounded-2xl py-3 md:py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-xs md:text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Tabs Row - Optimized for Mobile Grid */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    {[
                        { id: "semua", label: "Semua", icon: <ShoppingBag size={16} /> },
                        { id: "keranjang", label: `Keranjang (${cartItems.length})`, icon: <ShoppingCart size={16} /> },
                        { id: "proses_transaksi", label: "Proses Transaksi", icon: <Clock size={16} /> },
                        { id: "cancelled", label: "Dibatalkan", icon: <XCircle size={16} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-3 px-4 md:px-6 py-3.5 md:py-3 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all border ${activeTab === tab.id
                                ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/20"
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"} ${tab.id === "cancelled" ? "col-span-2 sm:col-span-1" : ""}`}
                        >
                            <span className="shrink-0">{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                            {tab.id === "proses_transaksi" && activeOrders.filter(o => !['cancelled'].includes(o.status)).length > 0 && (
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${activeTab === tab.id ? "bg-zinc-950/20 text-zinc-900" : "bg-emerald-500 text-zinc-950"}`}>
                                    {activeOrders.filter(o => !['cancelled'].includes(o.status)).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-zinc-900/50 border border-zinc-800 rounded-3xl animate-pulse" />
                    ))
                ) : (
                    <>
                        {/* Cart Items - Show in 'Semua' or 'Keranjang' */}
                        {(activeTab === "semua" || activeTab === "keranjang") && filteredCart.length > 0 && (
                            <div className="space-y-4">
                                {activeTab === "semua" && (
                                    <div className="flex items-center gap-4 px-2 pt-4">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap">
                                            <ShoppingCart size={14} /> Item di Keranjang
                                        </p>
                                        <div className="flex-1 h-px bg-zinc-800/50"></div>
                                    </div>
                                )}
                                {filteredCart.map((item) => (
                                    <div key={item.id} className="bg-zinc-900/20 border border-zinc-800 hover:border-emerald-500/30 rounded-3xl overflow-hidden transition-all group p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-2 duration-500 shadow-xl">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700 shadow-inner">
                                            <img src={item.product?.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 mb-1">
                                                <Store size={14} className="text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{item.product?.shop?.name}</span>
                                            </div>
                                            <h3 className="text-base md:text-xl font-black text-white mb-1 line-clamp-2">{item.product?.name}</h3>
                                            <div className="flex items-center justify-center md:justify-start gap-4">
                                                <p className="text-lg font-black text-emerald-500">{formatPrice(item.product?.price || 0)}</p>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400">
                                                    <span>Jumlah: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <Link
                                                href={`/user/pesanan/detail-pesanan/${item.id}?source=cart`}
                                                className="p-4 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all shadow-inner"
                                                title="Lihat Detail Produk"
                                            >
                                                <Eye size={20} />
                                            </Link>
                                            <button
                                                onClick={() => handleRemoveFromCart(item.id)}
                                                className="p-4 bg-zinc-950 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl border border-zinc-800 transition-all shadow-inner"
                                                title="Hapus dari Keranjang"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleCheckoutCart(item)}
                                                disabled={isProcessingCart}
                                                className="flex-1 md:flex-none px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 h-[54px]"
                                            >
                                                {isProcessingCart ? (
                                                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <><ShoppingBag size={20} /> Beli Sekarang</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Orders Section - Show in 'Semua' or status-specific tabs */}
                        {(activeTab !== "keranjang") && (
                            <div className="space-y-4">
                                {activeTab === "semua" && filteredOrders.length > 0 && (
                                    <div className="flex items-center gap-4 px-2 pt-6">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap">
                                            <Clock size={14} /> Riwayat & Proses Transaksi
                                        </p>
                                        <div className="flex-1 h-px bg-zinc-800/50"></div>
                                    </div>
                                )}

                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden transition-all group shadow-xl"
                                        >
                                            {/* Card Header */}
                                            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40">
                                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <ShoppingBag size={14} className="text-emerald-500" />
                                                        <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-wider">{order.order_id}</span>
                                                    </div>
                                                    <div className="h-1 w-1 bg-zinc-700 rounded-full shrink-0"></div>
                                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 whitespace-nowrap">
                                                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className={`px-3 md:px-4 py-1 rounded-full border text-[8px] md:text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </div>
                                            </div>

                                            {/* Mini Progress Bar for Buyer */}
                                            <div className="px-3 md:px-6 py-2.5 md:py-3 bg-zinc-900/30 border-b border-zinc-800/50">
                                                <div className="flex items-center justify-between gap-1">
                                                    {[
                                                        { id: 'data', label: 'Data', step: 1 },
                                                        { id: 'ongkir', label: 'Ongkir', step: 2 },
                                                        { id: 'bayar', label: 'Bayar', step: 3 },
                                                        { id: 'verifikasi', label: 'Verifikasi', step: 4 },
                                                        { id: 'kirim', label: 'Kirim', step: 5 },
                                                        { id: 'selesai', label: 'Selesai', step: 6 },
                                                    ].map((s, i) => {
                                                        const statusOrder = {
                                                            'pending_shipping_info': 1,
                                                            'waiting_shipping_cost': 2,
                                                            'waiting_payment': 3,
                                                            'processing': 4,
                                                            'payment_verified': 5,
                                                            'waiting_shipment': 5,
                                                            'shipped': 5,
                                                            'complained': 5,
                                                            'completed': 6,
                                                            'cancelled': 0
                                                        };
                                                        const currentStep = statusOrder[order.status] || 0;
                                                        const isDone = currentStep >= s.step;
                                                        const isCurrent = currentStep === s.step;

                                                        return (
                                                            <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                                                <div className={`h-1 rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-800"} ${isCurrent ? "animate-pulse" : ""}`}></div>
                                                                <span className={`text-[7px] font-black uppercase tracking-tighter text-center ${isDone ? "text-emerald-500" : "text-zinc-600"} ${isCurrent ? "animate-pulse" : ""}`}>
                                                                    {s.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700 shadow-inner mx-auto md:mx-0">
                                                    <img src={order.product?.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 min-w-0 text-center md:text-left">
                                                    <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 mb-1">
                                                        <Store size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{order.shop?.name}</span>
                                                    </div>
                                                    <h3 className="text-base md:text-xl font-black text-white mb-2 line-clamp-2">{order.product?.name}</h3>
                                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                                        <p className="text-lg font-black text-white">{formatPrice(order.total_price)}</p>
                                                        <div className="flex items-center gap-1 text-zinc-500 text-xs font-bold">
                                                            <span>{order.quantity} Item</span>
                                                            <span>•</span>
                                                            <span className="uppercase">{order.product?.type === 'sell' ? 'Beli Langsung' : 'Lelang'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-center items-end gap-3 w-full md:w-auto">
                                                    {!['completed', 'cancelled'].includes(order.status) && (
                                                        <>
                                                            <Link
                                                                href={`/user/pesanan/transaksi/${order.id}`}
                                                                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl transition-all text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                            >
                                                                <ShoppingBag size={14} /> Proses Transaksi
                                                            </Link>
                                                            {!['processing', 'payment_verified', 'waiting_shipment', 'shipped', 'complained'].includes(order.status) && (
                                                                <button
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                    className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all text-xs font-black flex items-center justify-center gap-2"
                                                                >
                                                                    <XCircle size={14} /> Batal
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {order.status === 'complained' && (
                                                        <button
                                                            onClick={() => handleResolveComplaint(order.id)}
                                                            className="w-full sm:w-auto px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-zinc-950 border border-emerald-500/20 rounded-2xl transition-all text-xs font-black flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 size={14} /> Selesaikan Komplain
                                                        </button>
                                                    )}
                                                    {order.status === 'cancelled' && (
                                                        <button
                                                            onClick={() => handleDeleteOrderHistory(order.id)}
                                                            className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all text-xs font-black flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Hapus
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/user/pesanan/detail-pesanan/${order.id}`}
                                                        className="w-full sm:w-auto px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl border border-zinc-700 transition-all text-xs font-black text-center"
                                                    >
                                                        Detail
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    activeTab !== "semua" && (
                                        <div className="py-20 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] border-dashed">
                                            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 shadow-inner">
                                                <ShoppingBag size={48} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-white">Belum Ada Pesanan</h3>
                                                <p className="text-zinc-500 max-w-xs mx-auto text-sm">Anda belum memiliki pesanan di kategori ini.</p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {/* Global Empty State for 'Semua' */}
                        {activeTab === "semua" && filteredCart.length === 0 && filteredOrders.length === 0 && (
                            <div className="py-20 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] border-dashed">
                                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 shadow-inner">
                                    <ShoppingBag size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Belum Ada Aktivitas</h3>
                                    <p className="text-zinc-500 max-w-xs mx-auto text-sm">Anda belum memiliki keranjang atau riwayat pesanan apapun.</p>
                                </div>
                                <Link
                                    href="/toko"
                                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    Mulai Belanja
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                        <AlertCircle size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Butuh Bantuan?</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Jika ada kendala dengan pesanan Anda, jangan ragu untuk menghubungi Admin atau Penjual melalui fitur chat.</p>
                </div>
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                        <MapPin size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Alamat Pengiriman</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Pastikan alamat pengiriman Anda sudah benar untuk menghindari kendala dalam proses pengiriman hewan.</p>
                </div>
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                        <Clock size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Waktu Pembayaran</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Segera selesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak dibatalkan secara otomatis.</p>
                </div>
            </div>
            {/* Rating Modal */}
            {ratingModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !ratingModal.isLoading && setRatingModal(prev => ({ ...prev, isOpen: false }))}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
                        
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Penilaian Pesanan</h2>
                            <p className="text-zinc-500 text-sm font-medium">Berikan rating dan ulasan Anda untuk menyelesaikan komplain ini.</p>

                            <div className="py-6 flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                                        className={`transition-all transform hover:scale-125 ${star <= ratingModal.rating ? "text-amber-400" : "text-zinc-800"}`}
                                    >
                                        <Star size={40} fill={star <= ratingModal.rating ? "currentColor" : "none"} strokeWidth={2} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={ratingModal.review}
                                onChange={(e) => setRatingModal(prev => ({ ...prev, review: e.target.value }))}
                                placeholder="Tulis ulasan Anda di sini... (opsional)"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none h-32"
                            />

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <button
                                    onClick={() => setRatingModal(prev => ({ ...prev, isOpen: false }))}
                                    disabled={ratingModal.isLoading}
                                    className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitRating}
                                    disabled={ratingModal.isLoading}
                                    className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {ratingModal.isLoading ? (
                                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                    ) : "Simpan Penilaian"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Action Modal Rendering */}
            <ActionModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={actionModal.onConfirm}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                confirmText={actionModal.confirmText}
                isLoading={actionModal.isLoading}
            />
        </div>
    );
}

