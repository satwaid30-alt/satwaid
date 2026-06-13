"use client";

import { Package, ShoppingBag, CheckCircle2, XCircle, AlertCircle, X, Store, Calendar, Tag, ChevronLeft, ChevronRight, Info, Truck, Trash2, MessageSquare, ArrowLeft, ScrollText, Clock, Gavel } from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getLogoUrl, getImageUrl } from "@/app/utils/api";

export default function AdminProductDetailPage({ params }) {
  const { id } = use(params);
  console.log("Extracted ID:", id);
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [listingOrders, setListingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'verify', 'reject', 'delete'
    rejectionReason: "",
  });

  useEffect(() => {
    if (id) {
      fetchListingDetail();
      fetchListingOrders();
    }
  }, [id]);

  const fetchListingDetail = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/listings/${id}`);
      const result = await response.json();
      if (response.ok) {
        setListing(result.data);
      } else {
        alert("Gagal memuat detail produk");
        router.push("/admin/toko-user/detail-produk");
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchListingOrders = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/orders/listing/${id}`);
      const result = await response.json();
      if (response.ok) {
        setListingOrders(result.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleActionClick = (type) => {
    setConfirmModal({
      isOpen: true,
      type,
      rejectionReason: "",
    });
  };

  const processAction = async () => {
    const { type, rejectionReason } = confirmModal;

    if (type === "reject" && !rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan.");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      if (type === "delete") {
        const response = await fetch(`${getApiUrl()}/listings/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (response.ok) router.push("/admin/toko-user/detail-produk");
      } else {
        const status = type === "verify" ? "active" : "rejected";
        const response = await fetch(`${getApiUrl()}/listings/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            status,
            rejection_reason: type === "reject" ? rejectionReason : null,
          }),
        });
        if (response.ok) {
          if (type === "verify") {
            router.push("/admin/toko-user/detail-produk");
          } else {
            fetchListingDetail();
          }
        }
      }
      setConfirmModal({ isOpen: false, type: "", rejectionReason: "" });
    } catch (err) {
      console.error("Error processing action:", err);
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "sold":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "history":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const getStatusLabel = (status) => {
    if (status?.toLowerCase() === "sold") return "Terjual";
    return status || "Active";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 animate-in fade-in duration-700">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-[100] bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin/toko-user/detail-produk" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">Kembali ke Daftar</span>
          </Link>

          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Status Saat Ini</p>
            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(listing.status)}`}>{getStatusLabel(listing.status)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 px-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
          {listing.status?.toLowerCase() === "history" ? (
            <div className="p-10 lg:p-14 space-y-8 animate-in fade-in duration-500">
              {/* Basic Header Info */}
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pb-8 border-b border-zinc-800">
                <div className="w-24 h-24 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-inner">
                  {listing.images && listing.images[0] ? (
                    <img src={getImageUrl(listing.images[0])} alt={listing.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-800">
                      <ShoppingBag size={32} />
                    </div>
                  )}
                </div>
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${listing.type === "sell" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{listing.type === "sell" ? "Reguler" : "Lelang"}</span>
                    {listing.product_id && <span className="px-4 py-1.5 rounded-full text-[10px] font-mono font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 bg-zinc-950/50">ID: {listing.product_id}</span>}
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest border bg-zinc-500/10 border-zinc-500/20">Arsip History</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">{listing.species}</p>
                    <h2 className="text-xl lg:text-2xl font-black text-white leading-tight break-words tracking-tight">{listing.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                    <Store size={16} className="text-zinc-500" />
                    <span>
                      Toko: <strong className="text-zinc-300">{listing.shop?.name}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Daftar Invoice Penjualan */}
              <div className="p-8 bg-zinc-950/30 rounded-[2.5rem] border border-zinc-800/50">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <ScrollText size={14} className="text-purple-500" /> Daftar Invoice Penjualan
                  </p>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase rounded-full border border-purple-500/20">{listingOrders.length} Transaksi</span>
                </div>

                {listingOrders && listingOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                          <th className="pb-3 font-black">Nomor Invoice</th>
                          <th className="pb-3 font-black">Pembeli</th>
                          <th className="pb-3 font-black">Tanggal</th>
                          <th className="pb-3 font-black text-center">Kuantitas</th>
                          <th className="pb-3 font-black text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {listingOrders.map((order, idx) => (
                          <tr key={idx} className="text-xs hover:bg-zinc-900/40 transition-colors">
                            <td className="py-4 font-mono font-bold text-white tracking-wide">{order.order_id}</td>
                            <td className="py-4 text-zinc-400 font-medium">{order.user?.username || order.user?.email || "Pembeli"}</td>
                            <td className="py-4 text-zinc-500">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                            <td className="py-4 text-center">
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20 text-[10px] font-bold">{order.quantity || 1} Ekor</span>
                            </td>
                            <td className="py-4 text-right">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  order.status === "completed" || order.status === "disbursed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : (order.status === "cancelled" || order.status === "cancelled_dismissed") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {order.status === "pending_shipping_info"
                                  ? "Isi Alamat"
                                  : order.status === "waiting_shipping_cost"
                                    ? "Input Ongkir"
                                    : order.status === "waiting_payment"
                                      ? "Belum Bayar"
                                      : order.status === "processing"
                                        ? "Verifikasi Admin"
                                        : order.status === "payment_verified"
                                          ? "Perlu Dikirim"
                                          : order.status === "shipped"
                                            ? "Dikirim"
                                            : order.status === "completed"
                                              ? "Selesai"
                                              : order.status === "cancelled"
                                                ? "Dibatalkan"
                                                : order.status === "cancelled_dismissed"
                                                  ? "Dibatalkan (Dibersihkan)"
                                                  : order.status === "complained"
                                                    ? "Dikomplain"
                                                    : order.status === "disbursement_requested"
                                                      ? "Pengajuan Pencairan"
                                                      : order.status === "disbursed"
                                                        ? "Dana Dicairkan"
                                                        : order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center bg-zinc-950/40 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-sm font-bold text-zinc-500">Belum ada riwayat transaksi untuk produk ini.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Image Area */}
              <div className="w-full h-[400px] md:h-[500px] bg-zinc-950 relative group shrink-0">
                {listing.images && listing.images[activeImageIndex] ? (
                  <img src={getImageUrl(listing.images[activeImageIndex])} alt={listing.name} className="w-full h-full object-contain bg-zinc-950" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-800">
                    <ShoppingBag size={120} />
                  </div>
                )}

                {/* Image Navigation */}
                {listing.images?.length > 1 && (
                  <>
                    <button onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : listing.images.length - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 backdrop-blur-md text-white rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={28} />
                    </button>
                    <button onClick={() => setActiveImageIndex((prev) => (prev < listing.images.length - 1 ? prev + 1 : 0))} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 backdrop-blur-md text-white rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}

                {/* Thumbnails */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-zinc-950/30 backdrop-blur-md rounded-[2rem] border border-white/5">
                  {listing.images?.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20" : "border-transparent opacity-50 hover:opacity-100"}`}>
                      <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-10 lg:p-14 space-y-5">
                {/* Header Title */}
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border ${listing.type === "sell" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{listing.type === "sell" ? "Reguler" : "Lelang"}</span>
                    {listing.product_id && <span className="px-5 py-2 rounded-full text-[11px] font-mono font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 bg-zinc-950/50">ID: {listing.product_id}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-2">{listing.species}</p>
                    <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight break-words tracking-tight">{listing.name}</h2>
                  </div>
                </div>

                {/* Price Card */}
                <div className={`rounded-[2.5rem] p-8 border flex flex-col md:flex-row md:items-center justify-between shadow-inner relative overflow-hidden ${listing.type === "auction" ? "bg-amber-500/5 border-amber-500/20" : "bg-zinc-950/50 border-zinc-800"}`}>
                  <div className="relative z-10 w-full">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{listing.type === "sell" ? "Harga Jual Produk" : "Open Bid (OB)"}</p>
                    <div className="flex flex-wrap items-baseline gap-2 lg:gap-4">
                      <p className="text-2xl lg:text-3xl font-black text-white">Rp {new Number(listing.type === "sell" ? listing.price : listing.current_bid || listing.start_bid).toLocaleString("id-ID")}</p>
                      {listing.type === "auction" && <p className="text-amber-500 font-black text-sm mb-2">(Kelipatan +Rp {new Number(listing.multiple).toLocaleString("id-ID")})</p>}
                    </div>

                    {listing.type === "auction" && listing.bin_price && (
                      <div className="mt-4 pt-4 border-t border-amber-500/10 w-full max-w-sm">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Beli Sekarang (BIN)</p>
                        <p className="text-xl font-black text-white">Rp {new Number(listing.bin_price).toLocaleString("id-ID")}</p>
                      </div>
                    )}

                    {listing.type === "auction" && (
                      <div className="mt-6 pt-6 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={12} className="text-amber-500" /> Mulai Lelang
                          </p>
                          <p className="text-sm font-bold text-zinc-300">{new Date(listing.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", ":").replace(" pukul ", " • ")} WIB</p>
                        </div>
                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                          <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Clock size={12} className="text-amber-500" /> Berakhir Pada
                          </p>
                          <p className="text-sm font-black text-amber-500">{new Date(listing.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", ":").replace(" pukul ", " • ")} WIB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`absolute top-0 right-0 p-8 transition-colors hidden sm:block ${listing.type === "auction" ? "text-amber-500/5" : "text-emerald-500/5"}`}>{listing.type === "auction" ? <Gavel size={120} strokeWidth={1.5} /> : <Tag size={120} strokeWidth={1.5} />}</div>
                </div>

                {/* Badges */}
                {(listing.is_free_shipping || listing.is_free_packing) && (
                  <div className="flex flex-wrap gap-4">
                    {listing.is_free_shipping && (
                      <div className={`flex-1 min-w-[200px] p-6 border rounded-[2rem] flex items-center gap-4 shadow-sm ${listing.type === "auction" ? "bg-amber-500/5 border-amber-500/10" : "bg-emerald-500/5 border-emerald-500/10"}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${listing.type === "auction" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                          <Truck size={24} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest mb-1 ${listing.type === "auction" ? "text-amber-500" : "text-emerald-500"}`}>Gratis Ongkir</p>
                          <p className="text-sm text-zinc-500 font-bold">Layanan antar tanpa biaya</p>
                        </div>
                      </div>
                    )}
                    {listing.is_free_packing && (
                      <div className="flex-1 min-w-[200px] p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                          <Package size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Gratis Packing</p>
                          <p className="text-sm text-zinc-500 font-bold">Kemasan aman tanpa biaya</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-950/30 rounded-[2rem] border border-zinc-800/50 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 overflow-hidden shrink-0">{listing.shop?.logo_url ? <img src={getLogoUrl(listing.shop.logo_url)} className="w-full h-full object-cover" alt={listing.shop.name} /> : <Store size={28} />}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Toko Penjual</p>
                      <p className="text-sm font-black text-white truncate">{listing.shop?.name}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-950/30 rounded-[2rem] border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" /> Tanggal Pasang
                    </p>
                    <p className="text-sm font-black text-white">{new Date(listing.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="p-6 bg-zinc-950/30 rounded-[2rem] border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Truck size={14} className="text-emerald-500" /> Jangkauan Pengiriman
                    </p>
                    <p className="text-sm font-black text-white">{listing.shipping_type || "Belum diatur"}</p>
                  </div>
                  <div className="md:col-span-3 p-8 bg-zinc-950/30 rounded-[2.5rem] border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Package size={14} className="text-emerald-500" /> Ringkasan Sinkronisasi Stok
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-emerald-500/10">
                        <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-tighter mb-1">Stok Tersedia</p>
                        <p className="text-2xl font-black text-white">
                          {listing.stock || 0} <span className="text-xs text-zinc-500">Ekor</span>
                        </p>
                      </div>
                      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-blue-500/10">
                        <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-tighter mb-1">Total Terjual</p>
                        <p className="text-2xl font-black text-white">
                          {listingOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + (o.quantity || 1), 0)} <span className="text-xs text-zinc-500">Ekor</span>
                        </p>
                      </div>
                      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-amber-500/10">
                        <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-tighter mb-1">Dalam Proses</p>
                        <p className="text-2xl font-black text-white">
                          {listingOrders.filter((o) => !["completed", "cancelled", "complained"].includes(o.status)).reduce((sum, o) => sum + (o.quantity || 1), 0)} <span className="text-xs text-zinc-500">Ekor</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 p-8 bg-zinc-950/30 rounded-[2.5rem] border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <ScrollText size={14} className="text-purple-500" /> Daftar Invoice Penjualan
                      </p>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase rounded-full border border-purple-500/20">{listingOrders.length} Transaksi</span>
                    </div>

                    {listingOrders && listingOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                              <th className="pb-3 font-black">Nomor Invoice</th>
                              <th className="pb-3 font-black">Pembeli</th>
                              <th className="pb-3 font-black">Tanggal</th>
                              <th className="pb-3 font-black text-center">Kuantitas</th>
                              <th className="pb-3 font-black text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {listingOrders.map((order, idx) => (
                              <tr key={idx} className="text-xs hover:bg-zinc-900/40 transition-colors">
                                <td className="py-4 font-mono font-bold text-white tracking-wide">{order.order_id}</td>
                                <td className="py-4 text-zinc-400 font-medium">{order.user?.username || order.user?.email || "Pembeli"}</td>
                                <td className="py-4 text-zinc-500">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                                <td className="py-4 text-center">
                                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20 text-[10px] font-bold">{order.quantity || 1} Ekor</span>
                                </td>
                                <td className="py-4 text-right">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      order.status === "completed" || order.status === "disbursed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : (order.status === "cancelled" || order.status === "cancelled_dismissed") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {order.status === "pending_shipping_info"
                                      ? "Isi Alamat"
                                      : order.status === "waiting_shipping_cost"
                                        ? "Input Ongkir"
                                        : order.status === "waiting_payment"
                                          ? "Belum Bayar"
                                          : order.status === "processing"
                                            ? "Verifikasi Admin"
                                            : order.status === "payment_verified"
                                              ? "Perlu Dikirim"
                                              : order.status === "shipped"
                                                ? "Dikirim"
                                                : order.status === "completed"
                                                  ? "Selesai"
                                                  : order.status === "cancelled"
                                                    ? "Dibatalkan"
                                                    : order.status === "cancelled_dismissed"
                                                      ? "Dibatalkan (Dibersihkan)"
                                                      : order.status === "complained"
                                                        ? "Dikomplain"
                                                        : order.status === "disbursement_requested"
                                                          ? "Pengajuan Pencairan"
                                                          : order.status === "disbursed"
                                                            ? "Dana Dicairkan"
                                                            : order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-10 text-center bg-zinc-950/40 rounded-3xl border border-dashed border-zinc-800">
                        <p className="text-sm font-bold text-zinc-500">Belum ada riwayat transaksi untuk produk ini.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Info size={16} /> Deskripsi Produk Lengkap
                    </p>
                    <div className="flex-1 h-px bg-zinc-800/50"></div>
                  </div>
                  <div className="bg-zinc-950/50 p-8 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-zinc-800/50 shadow-inner overflow-hidden">
                    <div className="text-base text-zinc-400 leading-relaxed description-content font-medium break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: listing.description || "Tidak ada deskripsi." }}></div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Truck size={16} /> Ketentuan Pengiriman
                    </p>
                    <div className="flex-1 h-px bg-zinc-800/50"></div>
                  </div>
                  <div className="bg-zinc-950/50 p-8 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-zinc-800/50 shadow-inner overflow-hidden">
                    <div className="text-base text-zinc-400 leading-relaxed description-content font-medium break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: listing.shipping_description || "Tidak ada informasi pengiriman." }}></div>
                  </div>
                </div>

                {/* Admin Action Bar */}
                <div className="pt-10 border-t border-zinc-800 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Panel Moderasi Produk</h3>
                    <button onClick={() => handleActionClick("delete")} className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
                      <Trash2 size={16} /> Hapus Produk Selamanya
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listing.status?.toLowerCase() === "pending" && (
                      <>
                        <button onClick={() => handleActionClick("verify")} className="flex items-center justify-center gap-3 py-6 bg-emerald-500 text-zinc-950 rounded-[2rem] font-black text-sm hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">
                          <CheckCircle2 size={20} /> Setujui & Verifikasi Produk
                        </button>
                        <button onClick={() => handleActionClick("reject")} className="flex items-center justify-center gap-3 py-6 bg-zinc-800 text-zinc-400 rounded-[2rem] font-black text-sm hover:bg-red-500 hover:text-white transition-all border border-zinc-700 active:scale-95">
                          <XCircle size={20} /> Tolak Pemasangan Produk
                        </button>
                      </>
                    )}

                    {listing.status?.toLowerCase() === "active" && (
                      <button onClick={() => handleActionClick("reject")} className="md:col-span-2 flex items-center justify-center gap-3 py-6 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-[2rem] font-black text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 shadow-xl">
                        <XCircle size={20} /> Turunkan Produk dari Marketplace
                      </button>
                    )}

                    {listing.status?.toLowerCase() === "rejected" && (
                      <button onClick={() => handleActionClick("verify")} className="md:col-span-2 flex items-center justify-center gap-3 py-6 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-[2rem] font-black text-sm hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 transition-all active:scale-95 shadow-xl">
                        <AlertCircle size={20} /> Pulihkan Status Menjadi Aktif
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Standardized Action Modal */}
      <ActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={processAction}
        type={confirmModal.type === "verify" ? "success" : confirmModal.type === "delete" ? "danger" : "warning"}
        title={confirmModal.type === "verify" ? "Konfirmasi Verifikasi" : confirmModal.type === "reject" ? "Konfirmasi Penolakan" : "Hapus Permanen"}
        message={confirmModal.type === "verify" ? "Apakah Anda yakin produk ini sudah layak tayang di marketplace?" : confirmModal.type === "reject" ? "Silakan berikan alasan mengapa produk ini tidak layak tayang:" : "Produk ini akan dihapus selamanya dari sistem. Anda yakin?"}
        confirmText={confirmModal.type === "reject" ? "Kirim Penolakan" : "Ya, Lanjutkan"}
      >
        {confirmModal.type === "reject" && (
          <div className="relative mt-2">
            <MessageSquare className="absolute left-5 top-5 text-zinc-500" size={20} />
            <textarea
              placeholder="Tuliskan alasan penolakan secara jelas..."
              className="w-full bg-zinc-950 border border-zinc-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:outline-none focus:border-red-500 transition-all min-h-[140px] text-sm leading-relaxed"
              value={confirmModal.rejectionReason}
              onChange={(e) => setConfirmModal({ ...confirmModal, rejectionReason: e.target.value })}
            />
          </div>
        )}
      </ActionModal>

      <style jsx global>{`
        .description-content ul {
          list-style-type: disc !important;
          margin-left: 1.5rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
        }
        .description-content ol {
          list-style-type: decimal !important;
          margin-left: 1.5rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
        }
        .description-content p {
          margin-bottom: 1rem !important;
        }
      `}</style>
    </div>
  );
}
