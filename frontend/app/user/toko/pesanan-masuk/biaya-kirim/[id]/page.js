"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Info,
  Package,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import ActionModal from "@/components/ActionModal";
import OrderTimeline from "@/components/OrderTimeline";

export default function InputShippingCostPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingCost, setIsUpdatingCost] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [costForm, setCostForm] = useState({
    shipping_cost: "",
    packing_cost: "",
  });

  useEffect(() => {
    fetchOrderDetail();

    // Setup Socket.io for Real-time Updates
    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null
          }
        });
        socket.emit("join_user", userData.id);

        socket.on("new_notification", () => {
          fetchOrderDetail(); // Auto-refresh when status changes
        });
      } catch (e) {
        console.error("Socket connection error in biaya-kirim", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(
        `${getApiUrl()}/orders/${id}`,
      );
      const result = await res.json();
      if (res.ok && result.data) {
        const orderData = result.data;
        if (orderData.status !== "waiting_shipping_cost") {
          router.replace(`/user/toko/pesanan-masuk/detail/${id}`);
          return;
        }
        setOrder(orderData);
        setCostForm({
          shipping_cost: orderData.shipping_cost || "",
          packing_cost: orderData.packing_cost || "",
        });
      } else {
        setModalConfig({
          isOpen: true,
          type: "warning",
          title: "Gagal Memuat",
          message: "Gagal memuat detail pesanan. Silakan coba lagi.",
          onConfirm: () => router.push("/user/toko/pesanan-masuk"),
        });
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Terjadi kesalahan saat menghubungkan ke server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCostSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (
      !order.product?.is_free_shipping &&
      Number(costForm.shipping_cost) <= 0
    ) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Biaya Belum Diisi",
        message: "Mohon masukkan biaya ongkos kirim yang valid (lebih dari 0).",
      });
      return;
    }

    if (!order.product?.is_free_packing && Number(costForm.packing_cost) <= 0) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Biaya Belum Diisi",
        message: "Mohon masukkan biaya packing yang valid (lebih dari 0).",
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: "save",
      title: "Kirim Invoice?",
      message: `Kirim rincian biaya ke pembeli? Total tagihan akan menjadi ${formatPrice(Number(order.price) * Number(order.quantity) + (Number(costForm.shipping_cost) || 0) + (Number(costForm.packing_cost) || 0) + (Number(order.admin_fee) || 5000))}.`,
      confirmText: "Ya, Kirim Sekarang",
      cancelText: "Periksa Lagi",
      onConfirm: () => processUpdateCost(),
    });
  };

  const processUpdateCost = async () => {
    setIsUpdatingCost(true);
    setModalConfig((prev) => ({ ...prev, isLoading: true }));

    try {
      const payload = {
        shipping_cost: order.product?.is_free_shipping
          ? 0
          : parseInt(costForm.shipping_cost) || 0,
        packing_cost: order.product?.is_free_packing
          ? 0
          : parseInt(costForm.packing_cost) || 0,
      };

      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${getApiUrl()}/orders/${id}/shipping-cost`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Invoice Terkirim!",
          message:
            "Biaya pengiriman telah berhasil dikirim ke pembeli. Pesanan akan masuk ke tahap pembayaran.",
          onConfirm: () => router.replace("/user/toko/pesanan-masuk"),
        });
      } else {
        const result = await response.json();
        setModalConfig({
          isOpen: true,
          type: "danger",
          title: "Gagal Mengirim",
          message: result.message || "Gagal memperbarui biaya pengiriman.",
        });
      }
    } catch (err) {
      console.error(err);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Sistem",
        message: "Terjadi kesalahan koneksi saat mengirim data.",
      });
    } finally {
      setIsUpdatingCost(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-black animate-pulse uppercase tracking-widest text-[10px]">
          Memuat Formulir Ongkir...
        </p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/user/toko/pesanan-masuk/detail/${id}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
            <ChevronLeft size={18} />
          </div>
          <span className="text-sm font-bold">Kembali ke Detail</span>
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            Status Saat Ini
          </p>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
            {order.status === "waiting_shipping_cost"
              ? "Perlu Input Ongkir"
              : "Invoice Terkirim"}
          </span>
        </div>
      </div>

      {/* Unified Stepper Section */}
      <OrderStepper order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Input Form & Timeline */}
        <div className="lg:col-span-7 space-y-8">
          {/* RIWAYAT / TIMELINE */}
          {/* <OrderTimeline order={order} formatPrice={formatPrice} /> */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative overflow-hidden">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Kirim Invoice Biaya
                  </h2>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                    Masukkan rincian biaya pengiriman & packing
                  </p>
                </div>
              </div>

              <form onSubmit={handleCostSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Truck size={12} className="text-emerald-500" /> Biaya
                      Ongkos Kirim{" "}
                      {!order.product?.is_free_shipping && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm group-focus-within:text-emerald-500 transition-colors">
                        Rp
                      </div>
                      <input
                        required
                        type="number"
                        disabled={order.product?.is_free_shipping}
                        value={
                          order.product?.is_free_shipping
                            ? 0
                            : costForm.shipping_cost
                        }
                        onChange={(e) =>
                          setCostForm({
                            ...costForm,
                            shipping_cost: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-[2rem] py-5 pl-14 pr-8 text-white focus:outline-none focus:border-emerald-500 transition-all font-black text-lg disabled:opacity-50"
                        placeholder="0"
                      />
                      {order.product?.is_free_shipping && (
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          Gratis Ongkir
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Package size={12} className="text-emerald-500" /> Biaya
                      Packing{" "}
                      {!order.product?.is_free_packing && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm group-focus-within:text-emerald-500 transition-colors">
                        Rp
                      </div>
                      <input
                        required
                        type="number"
                        disabled={order.product?.is_free_packing}
                        value={
                          order.product?.is_free_packing
                            ? 0
                            : costForm.packing_cost
                        }
                        onChange={(e) =>
                          setCostForm({
                            ...costForm,
                            packing_cost: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-[2rem] py-5 pl-14 pr-8 text-white focus:outline-none focus:border-blue-400 transition-all font-black text-lg disabled:opacity-50"
                        placeholder="0"
                      />
                      {order.product?.is_free_packing && (
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          Gratis Packing
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-[2.5rem] p-8 border border-zinc-800 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/20 pb-3">
                    <span className="text-zinc-500 font-bold">
                      Harga Produk ({order.quantity} Ekor)
                    </span>
                    <span className="text-white font-black">
                      {formatPrice(order.price * order.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/20 pb-3">
                    <span className="text-zinc-500 font-bold">
                      Biaya Pengiriman
                    </span>
                    <span className="text-white font-black">
                      {order.product?.is_free_shipping ? (
                        <span className="text-emerald-500 uppercase text-[10px] font-black">
                          Gratis
                        </span>
                      ) : (
                        formatPrice(costForm.shipping_cost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/20 pb-3">
                    <span className="text-zinc-500 font-bold">
                      Biaya Packing
                    </span>
                    <span className="text-white font-black">
                      {order.product?.is_free_packing ? (
                        <span className="text-emerald-500 uppercase text-[10px] font-black">
                          Gratis
                        </span>
                      ) : (
                        formatPrice(costForm.packing_cost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-4">
                    <span className="text-zinc-500 font-bold">Biaya Admin</span>
                    <span className="text-white font-black">
                      {formatPrice(order.admin_fee || 5000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Total Tagihan Baru
                      </p>
                      <p className="text-zinc-400 text-[10px] font-medium italic">
                        Invoice yang akan dikirim ke pembeli
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-3xl font-black text-emerald-500 tracking-tighter">
                        {formatPrice(
                          Number(order.price) * Number(order.quantity) +
                            (Number(costForm.shipping_cost) || 0) +
                            (Number(costForm.packing_cost) || 0) +
                            (Number(order.admin_fee) || 5000),
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-4">
                    <Link
                      href={`/user/toko/pesanan-masuk/detail/${id}`}
                      className="flex-1 py-4 lg:py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-center text-sm"
                    >
                      Batal
                    </Link>
                    <button
                      type="submit"
                      disabled={
                        isUpdatingCost ||
                        order.status !== "waiting_shipping_cost"
                      }
                      className="flex-[2] py-4 lg:py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest"
                    >
                      {isUpdatingCost ? (
                        <>
                          <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                          Mengirim Invoice...
                        </>
                      ) : (
                        <>
                          Kirim Invoice Sekarang <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Alamat Pengiriman Recap removed from here */}
        </div>

        {/* RIGHT: Product Summary */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 space-y-8">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag size={16} className="text-emerald-500" /> Ringkasan
              Pesanan
            </h3>

            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                <img
                  src={order.product?.images?.[0]}
                  alt={order.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                    {order.product?.species}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                    ID : {order.product?.product_id || "-"}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white leading-tight">
                  {order.product?.name}
                </h4>
                <p className="text-sm font-bold text-zinc-500">
                  {order.quantity} Ekor • {formatPrice(order.price)} / ekor
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold">Subtotal Produk</span>
                <span className="text-white font-black">
                  {formatPrice(order.price * order.quantity)}
                </span>
              </div>
              <div className="p-4 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl flex gap-3">
                <AlertCircle
                  size={18}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-amber-500/80 font-medium leading-relaxed italic">
                  Pastikan Anda telah mengecek tarif kurir sesuai dengan dimensi
                  & berat paket ke alamat tujuan di samping.
                </p>
              </div>
            </div>
          </div>

          {/* Detail Pembeli */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 space-y-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} className="text-emerald-500" /> Detail Pembeli
            </h3>
            <div className="grid grid-cols-1 gap-5 p-5 lg:p-6 bg-zinc-950/50 rounded-[1.5rem] lg:rounded-[2rem] border border-zinc-800">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  Penerima
                </p>
                <p className="text-lg font-black text-white">
                  {order.receiver_name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  Kontak WhatsApp
                </p>
                <div className="flex items-center gap-2 text-emerald-500 font-black">
                  <Info size={14} />
                  {order.phone_number}
                </div>
              </div>
              <div className="h-px bg-zinc-800/50 my-1"></div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  Alamat Lengkap
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  {order.shipping_address}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal for Notifications & Success */}
      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText || "Oke, Lanjutkan"}
        cancelText={modalConfig.cancelText || "Batal"}
        isLoading={modalConfig.isLoading}
      />
    </div>
  );
}
