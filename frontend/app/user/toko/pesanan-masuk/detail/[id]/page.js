"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import { ShoppingBag, MapPin, DollarSign, Clock, CheckCircle2, AlertCircle, X, XCircle, Package, Truck, Info, ChevronLeft, ScrollText, ChevronDown, CreditCard, ShieldAlert, Gavel, Tag } from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";

function ShippedNotification() {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl w-full text-left">
      <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Pemberitahuan</p>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">Apabila barang sudah sampai dan buyer belum klik pesanan selesai, silakan hubungi buyer atau admin.</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [successMessage, setSuccessMessage] = useState("");
  const [isProductCardOpen, setIsProductCardOpen] = useState(false);

  useEffect(() => {
    fetchOrderDetail();

    // Setup Socket.io for Real-time Updates
    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null,
          },
        });

        socket.on("connect", () => {
          console.log("[Socket] Seller connected successfully with ID:", socket.id);
          socket.emit("join_user", userData.id);
          socket.emit("join_order", id);
        });

        socket.on("connect_error", (err) => {
          console.error("[Socket] Seller connection error:", err.message);
        });

        socket.on("new_notification", (notif) => {
          console.log("[Socket] Seller received new_notification:", notif);
          fetchOrderDetail(); // Auto-refresh when status changes
        });

        socket.on("order_updated", (update) => {
          console.log("[Socket] Seller received order_updated:", update);
          fetchOrderDetail(); // Auto-refresh when transaction changes
        });
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/orders/${id}`);
      const result = await res.json();
      if (res.ok && result.data) {
        setOrder(result.data);
      } else {
        alert("Gagal memuat detail pesanan");
        router.push("/user/toko/pesanan-masuk");
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "Menunggu Alamat";
      case "waiting_shipping_cost":
        return "Perlu Input Ongkir";
      case "waiting_payment":
        return "Menunggu Pembayaran";
      case "processing":
        return "Menunggu Verifikasi";
      case "payment_verified":
        return "Perlu Dikirim";
      case "waiting_shipment":
        return "Perlu Dikirim";
      case "shipped":
        return "Dikirim";
      case "complained":
        return "Dikomplain";
      case "completed":
        return "Selesai";
      case "disbursement_requested":
        return "Selesai";
      case "disbursed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      case "waiting_shipping_cost":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "waiting_payment":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "processing":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "payment_verified":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "waiting_shipment":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "complained":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursement_requested":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-10 lg:py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 space-y-8">
      {/* Success Message Notification */}
      {successMessage && (
        <div className="fixed top-24 right-10 z-[200] bg-emerald-500 text-zinc-950 px-8 py-4 rounded-2xl font-black flex items-center gap-3 animate-in slide-in-from-right-10">
          <CheckCircle2 size={24} />
          {successMessage}
        </div>
      )}

      {/* Back Button */}
      <Link href="/user/toko/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
          <ChevronLeft size={18} />
        </div>
        <span className="text-sm font-bold">Kembali ke Pesanan Masuk</span>
      </Link>

      {/* Stepper Section */}
      <div className="hidden md:block">
        <OrderStepper order={order} />
      </div>

      {/* Rejection Notice */}
      {order.status === "waiting_payment" && order.payment_rejection_reason && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 text-left animate-in slide-in-from-top-4 duration-500">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Pembayaran Ditolak Admin</p>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed">
              Mohon maaf, transaksi Anda terhambat sementara karena bukti pembayaran pembeli ditolak oleh admin. Alasan: <span className="text-red-400 font-semibold">{order.payment_rejection_reason}</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Product & Buyer Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Order Card (Accordion) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
            <button onClick={() => setIsProductCardOpen(!isProductCardOpen)} className="w-full flex items-center justify-between p-4 md:p-8 hover:bg-zinc-800/50 transition-all border-b border-zinc-800/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shrink-0 ${isProductCardOpen ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500"}`}>
                  <ShoppingBag size={20} className="md:hidden" />
                  <ShoppingBag size={24} className="hidden md:block" />
                </div>
                <div className="text-left min-w-0">
                  <h2 className={`text-sm sm:text-base md:text-xl font-black uppercase tracking-tight truncate ${isProductCardOpen ? "text-emerald-500" : "text-white"}`}>Rincian Produk & Pembeli</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-zinc-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
                      {order.order_id} • {order.product?.name}
                    </p>
                    {order.product?.type === "auction" ? (
                      <span className="px-1.5 py-0.5 bg-purple-500/10 text-[8px] text-purple-400 rounded font-black uppercase tracking-widest border border-purple-500/20 shrink-0">Lelang</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-sky-500/10 text-[8px] text-sky-400 rounded font-black uppercase tracking-widest border border-sky-500/20 shrink-0">Jual</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown size={20} className={`text-emerald-500 transition-transform duration-500 shrink-0 ${isProductCardOpen ? "rotate-180" : ""}`} />
            </button>

            {isProductCardOpen && (
              <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Product Image */}
                  <div className="w-full md:w-64 aspect-square rounded-[2rem] overflow-hidden bg-zinc-950 border border-zinc-800 relative group">
                    {order.product?.images?.[activeImageIndex] ? (
                      <img src={order.product.images[activeImageIndex]} alt={order.product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800">
                        <Package size={64} />
                      </div>
                    )}
                    {order.product?.images?.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                        {order.product.images.map((_, i) => (
                          <div
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex(i);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeImageIndex === i ? "bg-emerald-500 w-3" : "bg-white/30"}`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {order.product?.type === "auction" ? (
                          <span className="px-2.5 py-1 bg-purple-500/10 text-[9px] text-purple-400 rounded-lg font-black uppercase tracking-widest border border-purple-500/20 flex items-center gap-1.5">
                            <Gavel size={10} /> Produk Lelang
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-sky-500/10 text-[9px] text-sky-400 rounded-lg font-black uppercase tracking-widest border border-sky-500/20 flex items-center gap-1.5">
                            <Tag size={10} /> Produk Jual
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-[9px] text-emerald-500 rounded font-black uppercase tracking-widest border border-emerald-500/20">{order.product?.species}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-[9px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">ID Produk: {order.product?.product_id || "-"}</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">{order.product?.name}</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Harga</p>
                        <p className="text-lg font-black text-white">{formatPrice(order.price)}</p>
                      </div>
                      <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jumlah</p>
                        <p className="text-lg font-black text-white">{order.quantity} Ekor</p>
                      </div>
                    </div>

                    {/* Shipping Type Info */}
                    <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-dashed border-blue-500/20 rounded-2xl">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-zinc-950 font-black border border-blue-500/20">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Jangkauan</p>
                        <p className="text-sm font-black text-white">{order.product?.shipping_type || "Tidak ditentukan"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-800/50"></div>

                {/* Descriptions Section (Transparent Layout) */}
                <div className="px-2 py-4 md:px-8 md:py-10 space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ScrollText size={16} /> Deskripsi Produk
                      </p>
                      <div className="flex-1 h-px bg-zinc-800/50"></div>
                    </div>
                    <div
                      className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: order.product?.description || "Tidak ada deskripsi.",
                      }}
                    ></div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Truck size={16} /> Info Pengiriman
                      </p>
                      <div className="flex-1 h-px bg-zinc-800/50"></div>
                    </div>
                    <div
                      className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: order.product?.shipping_description || "Tidak ada informasi pengiriman.",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>{" "}
          {/* Timeline / Riwayat Perjalanan */}
          <OrderTimeline order={order} formatPrice={formatPrice} />
        </div>

        {/* RIGHT: Transaction Summary & Action */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 space-y-6 md:space-y-8">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" /> Rincian Pembayaran
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold">Subtotal Produk</span>
                <span className="text-white font-black">{formatPrice(order.price * order.quantity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold">Ongkos Kirim</span>
                <span className="text-white font-black">{order.product?.is_free_shipping ? <span className="text-emerald-500">Gratis</span> : order.shipping_cost !== null ? formatPrice(order.shipping_cost) : formatPrice(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold">Biaya Packing</span>
                <span className="text-white font-black">{order.product?.is_free_packing ? <span className="text-emerald-500">Gratis</span> : order.packing_cost !== null ? formatPrice(order.packing_cost) : formatPrice(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold">Biaya Admin</span>
                <span className="text-white font-black">{formatPrice(order.admin_fee || 5000)}</span>
              </div>
              <div className="h-px bg-zinc-800"></div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Tagihan</span>
                <span className="text-xl sm:text-3xl font-black text-emerald-500 tracking-tighter">{formatPrice(order.total_price)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {order.status === "waiting_shipping_cost" && (
                <Link href={`/user/toko/pesanan-masuk/biaya-kirim/${order.id}`} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95">
                  Input Ongkir & Packing
                </Link>
              )}

              {["waiting_shipment", "payment_verified"].includes(order.status) && (
                <Link href={`/user/toko/pesanan-masuk/pengiriman/${order.id}`} className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-zinc-950 rounded-2xl transition-all font-black text-sm flex items-center justify-center gap-3 active:scale-95">
                  <Truck size={22} /> Masukkan Resi Pengiriman
                </Link>
              )}

              <button
                onClick={() => {
                  const phone = order.user?.phone || order.phone_number || "";
                  const formatted = phone.replace(/^0/, "62").replace(/\D/g, "");

                  const receiverName = order.receiver_name || order.user?.name || "Kak";
                  const orderId = order.order_id || "";
                  const productName = order.product?.name || "";

                  const message = `Halo ${receiverName}, terima kasih telah berbelanja! Pesanan Anda dengan ID *${orderId}* (${productName}) sudah dikirim dan dalam perjalanan. Jika paket telah sampai dan diterima dengan baik, mohon kesediaannya untuk mengklik tombol *Pesanan Diterima* di dashboard akun Anda untuk menyelesaikan transaksi. Terima kasih!`;
                  const encodedText = encodeURIComponent(message);

                  window.open(`https://wa.me/${formatted}?text=${encodedText}`, "_blank");
                }}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-zinc-950 rounded-2xl transition-all font-black text-xs flex items-center justify-center gap-2.5 active:scale-95 border border-emerald-400/20"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.68 1.973 14.198 1.94 11.99 1.94c-5.439 0-9.865 4.372-9.87 9.802 0 1.76.476 3.479 1.382 5.02L2.451 21.6l4.196-1.446zm11.393-5.263c-.293-.146-1.73-.853-1.998-.951-.267-.099-.462-.146-.657.146-.195.293-.756.951-.926 1.146-.17.195-.341.219-.634.073-.293-.146-1.238-.456-2.359-1.454-.872-.777-1.46-1.738-1.631-2.03-.17-.293-.018-.452.129-.597.132-.13.293-.341.439-.512.146-.17.195-.293.293-.488.097-.195.048-.366-.024-.512-.072-.146-.657-1.583-.9-2.17-.236-.57-.478-.492-.657-.502-.17-.008-.366-.01-.561-.01-.195 0-.512.073-.78.366-.268.293-1.024 1.001-1.024 2.441 0 1.439 1.048 2.83 1.195 3.025.147.195 2.062 3.149 4.996 4.417.697.302 1.24.482 1.66.617.7.223 1.338.192 1.843.117.563-.083 1.73-.707 1.976-1.39.244-.683.244-1.268.17-1.39-.074-.121-.268-.194-.561-.34z" />
                </svg>
                Hubungi Pembeli via WhatsApp
              </button>
            </div>
          </div>

          {/* Shipping Details Moved Here - Inside the same sidebar column */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 space-y-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-pink-500" /> Informasi Pengiriman
            </h3>
            {order.shipping_address ? (
              <div className="space-y-5">
                <div className="p-5 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-white font-black uppercase tracking-tight">{order.receiver_name}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{order.shipping_address}</p>
                  </div>


                  <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <Info size={12} className="text-zinc-400" />
                      </div>
                      <p className="text-[11px] font-bold tracking-tight">{order.phone_number}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking Info Section */}
                {order.tracking_number && (
                  <div className="p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Resi Pengiriman</p>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                        <Truck size={10} /> Terkirim
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-black text-white tracking-wider">{order.tracking_number}</p>
                    </div>
                    {order.status === "shipped" && (
                      <div className="pt-3 border-t border-zinc-800">
                        <ShippedNotification />
                      </div>
                    )}
                    {order.shipping_proof && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 w-fit">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-4 pt-3 mb-2">Bukti Pengiriman</p>
                        <div className="px-4 pb-4">
                          <img
                            src={order.shipping_proof.startsWith("http") ? order.shipping_proof : `${getApiUrl()}${order.shipping_proof}`}
                            alt="Bukti Pengiriman"
                            className="w-32 h-32 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-500 border border-zinc-800"
                            onClick={() => window.open(order.shipping_proof.startsWith("http") ? order.shipping_proof : `${getApiUrl()}${order.shipping_proof}`, "_blank")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                <MapPin size={24} className="text-zinc-700 animate-pulse" />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Belum Ada Alamat</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .description-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        .description-content ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          margin-left: 1.25rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
          padding-left: 0.5rem !important;
        }
        .description-content ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          margin-left: 1.25rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
          padding-left: 0.5rem !important;
        }
        .description-content li {
          margin-bottom: 0.5rem !important;
          padding-left: 0.25rem !important;
          line-height: 1.6 !important;
        }
        .description-content p {
          margin-bottom: 1rem !important;
        }
      `}</style>
    </div>
  );
}
