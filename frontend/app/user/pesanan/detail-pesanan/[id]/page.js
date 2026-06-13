"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getLogoUrl, getImageUrl } from "@/app/utils/api";
import { Package, Info, MapPin, Store, ScrollText, Truck, CreditCard, CheckCircle2, Clock, ShoppingCart, ShoppingBag, ChevronLeft, XCircle, Calendar, MessageCircle, AlertCircle } from "lucide-react";
import ShippingInfo from "@/components/ShippingInfo";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source"); // 'cart' or null

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);
  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    receiver_name: "",
    phone_number: "",
    shipping_address: "",
  });

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    reason: "",
    customReason: "",
    isLoading: false,
  });

  useEffect(() => {
    fetchOrderDetail();

    // Setup Socket.io for Real-time Updates
    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr && source !== "cart") {
      try {
        const userData = JSON.parse(userStr);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null,
          },
        });
        socket.emit("join_user", userData.id);

        socket.on("new_notification", () => {
          fetchOrderDetail(); // Auto-refresh when status changes
        });
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, source]);

  const fetchOrderDetail = async () => {
    try {
      const url = source === "cart" ? `${getApiUrl()}/cart/item/${id}` : `${getApiUrl()}/orders/${id}`;

      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.data) {
        // If cart, map product info to look like order
        if (source === "cart") {
          const cartItem = result.data;
          setOrder({
            ...cartItem,
            shop: cartItem.product?.shop,
            status: "cart",
            total_price: cartItem.product.price * cartItem.quantity,
            price: cartItem.product.price,
          });
        } else {
          setOrder(result.data);
          setShippingForm({
            receiver_name: result.data.receiver_name || "",
            phone_number: result.data.phone_number || "",
            shipping_address: result.data.shipping_address || "",
          });
        }
      } else {
        alert(source === "cart" ? "Gagal memuat detail keranjang" : "Gagal memuat detail pesanan");
        router.push("/user/pesanan");
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    setCancelModal({
      isOpen: true,
      reason: "",
      customReason: "",
      isLoading: false,
    });
  };

  const submitCancelOrder = async () => {
    const { reason, customReason } = cancelModal;
    const finalReason = reason === "Lainnya" ? customReason : reason;

    setCancelModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/orders/${id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          cancellation_reason: finalReason,
        }),
      });
      if (response.ok) {
        setCancelModal((prev) => ({ ...prev, isOpen: false }));
        alert("Pesanan berhasil dibatalkan");
        fetchOrderDetail();
      } else {
        const err = await response.json();
        alert(err.message || "Gagal membatalkan pesanan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mematalkan pesanan");
    } finally {
      setCancelModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingShipping(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/orders/${id}/shipping-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(shippingForm),
      });
      if (response.ok) {
        setShowShippingModal(false);
        fetchOrderDetail();
      } else {
        alert("Gagal menyimpan data pengiriman");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsUpdatingShipping(false);
    }
  };

  const handleCheckoutCart = async (item) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);

    setIsProcessingCart(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl()}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          user_id: user.id,
          listing_id: item.listing_id,
          quantity: item.quantity,
          from_cart: true,
        }),
      });

      if (response.ok) {
        // Remove from cart after successful order
        await fetch(`${getApiUrl()}/cart/${item.id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        alert("Berhasil membuat pesanan! Silakan lengkapi data pengiriman Anda.");
        router.push("/user/pesanan?tab=pending_shipping_info");
      } else {
        const err = await response.json();
        alert(err.message || "Gagal checkout");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsProcessingCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "Lengkapi Data";
      case "waiting_shipping_cost":
        return "Menunggu Ongkir";
      case "waiting_payment":
        return "Menunggu Pembayaran";
      case "processing":
        return "Sedang Diproses";
      case "shipped":
        return "Dalam Pengiriman";
      case "completed":
      case "disbursement_requested":
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
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "waiting_shipping_cost":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "waiting_payment":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "completed":
      case "disbursement_requested":
      case "disbursed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const handleWhatsAppChat = () => {
    const message = encodeURIComponent(source === "cart" ? `Halo ${order.shop?.name}, saya berminat dengan produk ${order.product?.name}. Apakah masih tersedia?` : `Halo ${order.shop?.name}, saya berminat dengan produk ${order.product?.name} (Invoice: ${order.order_id}). Apakah masih tersedia?`);
    window.open(`https://wa.me/62${order.shop?.whatsapp || ""}?text=${message}`, "_blank");
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/user/pesanan/riwayat-pembelian" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
            <ChevronLeft size={18} />
          </div>
          <span className="text-sm font-bold">Kembali ke Pesanan</span>
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{source === "cart" ? "Status" : "Nomor Invoice"}</p>
          <p className="text-sm font-black text-white">{source === "cart" ? "Keranjang Belanja" : order.order_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Detail Section */}
        <div className="lg:col-span-8 space-y-8">
          {/* Status Header */}
          {!["completed", "disbursement_requested", "disbursed"].includes(order.status) && <OrderStepper order={order} className="mb-8" />}

          <div className={`p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border flex items-center justify-between ${source === "cart" ? "bg-zinc-800 text-zinc-400 border-zinc-700" : getStatusStyle(order.status)}`}>
            <div className="space-y-1">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-70">Status Terkini</p>
              <h2 className="text-base md:text-2xl font-black">{source === "cart" ? "Dalam Keranjang" : getStatusLabel(order.status)}</h2>
            </div>
            <div className="w-10 h-10 md:w-16 md:h-16 bg-white/10 rounded-xl md:rounded-3xl flex items-center justify-center shrink-0">
              {["completed", "disbursement_requested", "disbursed"].includes(order.status) ? (
                <>
                  <CheckCircle2 size={20} className="md:hidden" />
                  <CheckCircle2 size={32} className="hidden md:block" />
                </>
              ) : (
                <>
                  <Clock size={20} className="md:hidden" />
                  <Clock size={32} className="hidden md:block" />
                </>
              )}
            </div>
          </div>

          {source !== "cart" && <OrderTimeline order={order} formatPrice={formatPrice} />}

          {/* Product & Order Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 lg:p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Image Carousel */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} className="text-emerald-500" /> Foto Produk
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden relative aspect-square group">
                    {order.product?.images?.length > 0 ? (
                      <img src={getImageUrl(order.product.images[activeImageIndex])} className="w-full h-full object-cover transition-all duration-500" alt={order.product.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800">
                        <Package size={48} />
                      </div>
                    )}
                    {order.product?.images?.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-zinc-950/50 backdrop-blur-md rounded-full border border-white/10">
                        {order.product.images.map((_, i) => (
                          <div key={i} onClick={() => setActiveImageIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeImageIndex === i ? "bg-emerald-500 w-3" : "bg-white/30"}`}></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Meta */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Info size={14} className="text-emerald-500" /> Informasi Produk
                    </h3>
                    <div>
                      <h4 className="text-2xl font-black text-white mb-3">{order.product?.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-zinc-800 text-[10px] text-zinc-300 rounded-lg border border-zinc-700 font-bold uppercase tracking-wider">{order.product?.species}</span>
                        <span
                          className={`px-3 py-1 text-[10px] rounded-lg border font-bold uppercase tracking-wider ${order.product?.sex === "Male" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : order.product?.sex === "Female" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}
                        >
                          {order.product?.sex || "Unsex"}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">{order.product?.type === "sell" ? "Jual Langsung" : "Lelang"}</span>
                        <span className="px-3 py-1 bg-zinc-800 text-[10px] text-zinc-400 rounded-lg border border-zinc-700 font-bold uppercase tracking-wider">ID Produk: {order.product?.product_id || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Harga Satuan</p>
                      <p className="text-lg font-black text-emerald-500">{formatPrice(order.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jumlah</p>
                      <p className="text-lg font-black text-white">{order.quantity} Item</p>
                    </div>
                  </div>

                  {/* Shipping Type Info */}
                  <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-dashed border-blue-500/20 rounded-2xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-zinc-950 font-black border border-blue-500/20 shrink-0">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Jangkauan Pengiriman</p>
                      <p className="text-sm font-black text-white">{order.product?.shipping_type || "Tidak ditentukan"}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-950/30 rounded-3xl border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-zinc-700 overflow-hidden">{order.shop?.logo_url ? <img src={getLogoUrl(order.shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={24} />}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-0.5">Penjual</p>
                        <p className="text-sm font-black text-white truncate">{order.shop?.name}</p>
                      </div>
                    </div>
                    <button onClick={handleWhatsAppChat} className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-zinc-950 text-xs font-black rounded-xl transition-all border border-emerald-500/20 flex items-center justify-center gap-2">
                      <MessageCircle size={14} /> Chat Penjual
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Description */}

              {/* Shipping Info Card (For Shipped/Completed Status) */}
              <ShippingInfo order={order} />

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ScrollText size={16} /> Deskripsi Produk
                  </p>
                  <div className="flex-1 h-px bg-zinc-800/50"></div>
                </div>
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/50">
                  <div
                    className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: order.product?.description || "Tidak ada deskripsi.",
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Truck size={16} /> Info Pengiriman
                  </p>
                  <div className="flex-1 h-px bg-zinc-800/50"></div>
                </div>
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/50">
                  <div
                    className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: order.product?.shipping_description || "Tidak ada informasi pengiriman.",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Cost Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-500" /> Ringkasan Biaya
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 font-medium">Subtotal Produk</span>
                <span className="text-white font-bold">{formatPrice(order.price * order.quantity)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 font-medium">Biaya Kirim</span>
                <span className="text-white font-black">{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : order.product?.is_free_shipping ? <span className="text-emerald-500">Gratis</span> : formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 font-medium">Biaya Packing</span>
                <span className="text-white font-black">{order.packing_cost > 0 ? formatPrice(order.packing_cost) : order.product?.is_free_packing ? <span className="text-emerald-500">Gratis</span> : formatPrice(0)}</span>
              </div>
              <div className="h-px bg-zinc-800 my-6"></div>
              <div className="flex justify-between items-center">
                <span className="text-white font-black">Total Bayar</span>
                <span className="text-3xl font-black text-emerald-500 tracking-tighter">{formatPrice(order.total_price)}</span>
              </div>
            </div>

            <div className=" space-y-3">
              {source === "cart" && (
                <button onClick={() => handleCheckoutCart(order)} disabled={isProcessingCart} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-sm font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
                  {isProcessingCart ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShoppingCart size={18} /> Checkout Sekarang
                    </>
                  )}
                </button>
              )}
              {order.status === "waiting_payment" && <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-sm font-black transition-all active:scale-[0.98]">Bayar Sekarang</button>}
              {order.status !== "cart" && !["completed", "disbursement_requested", "disbursed", "cancelled", "cancelled_dismissed", "shipped"].includes(order.status) && order.product?.type === "sell" && (
                <button onClick={handleCancelOrder} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-sm font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <XCircle size={18} /> Batalkan Pesanan
                </button>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          {source !== "cart" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-emerald-500" /> Informasi Pengiriman
              </h3>
              {order.shipping_address ? (
                <div className="space-y-4">
                  <div className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Penerima</p>
                    <p className="text-sm text-white font-bold">{order.receiver_name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{order.phone_number}</p>
                  </div>
                  <div className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Alamat Lengkap</p>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">{order.shipping_address}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-800 space-y-4">
                  <MapPin size={32} className="mx-auto text-zinc-700" />
                  <p className="text-xs text-zinc-500 font-medium">Alamat belum dilengkapi. Silakan lengkapi untuk memproses pesanan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowShippingModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h3 className="text-2xl font-black text-white">Data Pengiriman</h3>
                <p className="text-zinc-500 font-medium">Lengkapi alamat untuk menghitung ongkos kirim</p>
              </div>

              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Penerima</label>
                  <input
                    required
                    type="text"
                    value={shippingForm.receiver_name}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        receiver_name: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="Contoh: John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={shippingForm.phone_number}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        phone_number: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                  <textarea
                    required
                    rows={3}
                    value={shippingForm.shipping_address}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        shipping_address: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                    placeholder="Jl. Nama Jalan No. XX, Kota, Provinsi, Kode Pos"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowShippingModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all">
                    Batal
                  </button>
                  <button type="submit" disabled={isUpdatingShipping} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all disabled:opacity-50">
                    {isUpdatingShipping ? "Menyimpan..." : "Simpan & Lanjut"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !cancelModal.isLoading && setCancelModal((prev) => ({ ...prev, isOpen: false }))}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                  <XCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Batalkan Pesanan?</h3>
                <p className="text-zinc-400 font-medium text-xs leading-relaxed px-4">Apakah Anda yakin ingin membatalkan pesanan ini? Jika pesanan telah diproses seller, pengembalian dana akan melalui peninjauan Admin SatwaiD.</p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Pilih Alasan Pembatalan</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {["Seller belum memberikan respon setelah pembayaran", "Seller belum mengirim nomor resi pengiriman", "Status pengiriman tidak jelas / tidak ada update", "Waktu pengiriman terlalu lama", "Permintaan pembatalan oleh Seller", "Terjadi kesalahan transaksi / pembayaran", "Alamat atau data pengiriman salah", "Lainnya"].map(
                    (option, idx) => (
                      <label key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer text-xs font-bold ${cancelModal.reason === option ? "bg-red-500/5 border-red-500/40 text-white" : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}>
                        <input type="radio" name="cancelReason" value={option} checked={cancelModal.reason === option} onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))} className="accent-red-500 w-4 h-4 shrink-0" />
                        <span>{option}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {cancelModal.reason === "Lainnya" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Tulis Alasan Lainnya</label>
                  <textarea
                    rows={3}
                    value={cancelModal.customReason}
                    onChange={(e) => setCancelModal((prev) => ({ ...prev, customReason: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-red-500 transition-all resize-none font-medium placeholder:text-zinc-600"
                    placeholder="Masukkan alasan pembatalan Anda di sini..."
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setCancelModal((prev) => ({ ...prev, isOpen: false }))} disabled={cancelModal.isLoading} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black rounded-2xl text-xs uppercase tracking-wider transition-all">
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={submitCancelOrder}
                  disabled={cancelModal.isLoading || !cancelModal.reason || (cancelModal.reason === "Lainnya" && !cancelModal.customReason.trim())}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/15"
                >
                  {cancelModal.isLoading ? "Memproses..." : "Ya, Batalkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .description-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
        .description-content ul {
          list-style-type: disc !important;
          margin-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .description-content ol {
          list-style-type: decimal !important;
          margin-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .description-content li {
          margin-bottom: 0.25rem !important;
        }
      `}</style>
    </div>
  );
}
