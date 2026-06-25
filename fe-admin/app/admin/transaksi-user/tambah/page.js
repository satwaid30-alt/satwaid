"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Megaphone, Send, Clock, User, Package, AlertCircle, Store } from "lucide-react";

function ReminderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(orderId ? "" : "ID Pesanan tidak ditemukan di URL");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const result = await res.json();
        if (res.ok) {
          setOrder(result.data);

          // Set template message based on status
          const buyerName = result.data.receiver_name || result.data.user?.username || "Pembeli";
          const sellerName = result.data.shop?.name || "Penjual";
          const productName = result.data.product?.name || "Produk";

          if (["payment_verified", "waiting_shipment"].includes(result.data.status)) {
            setMessage(`Halo ${sellerName}, pesanan dengan ID ${result.data.order_id} untuk produk "${productName}" telah diverifikasi pembayarannya. Mohon untuk segera mengirimkan produk dan menginputkan nomor resi pengiriman di Pesanan Masuk toko Anda.`);
          } else {
            setMessage(`Halo ${buyerName}, pesanan Anda dengan ID ${result.data.order_id} untuk produk "${productName}" telah dikirim. Mohon konfirmasi penerimaan barang di halaman Pesanan Anda apabila produk sudah diterima dengan baik.`);
          }
        } else {
          setError(result.message || "Gagal mengambil data pesanan");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Terjadi kesalahan koneksi saat mengambil data pesanan");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const isSellerReminder = order && ["payment_verified", "waiting_shipment"].includes(order.status);
    const endpoint = isSellerReminder ? "send-resi-reminder" : "send-reminder";

    setIsSending(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ message: message.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Pesan pengingat berhasil dikirim!");
        router.push("/admin/transaksi-user");
      } else {
        alert(result.message || "Gagal mengirim pengingat");
      }
    } catch (err) {
      console.error("Error sending reminder:", err);
      alert("Terjadi kesalahan koneksi saat mengirim pengingat");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Data Pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={24} />
        </div>
        <p className="text-red-400 font-bold">{error}</p>
        <Link href="/admin/transaksi-user" className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
          Kembali ke Daftar Transaksi
        </Link>
      </div>
    );
  }

  const isSellerReminder = order && ["payment_verified", "waiting_shipment"].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/admin/transaksi-user" className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-amber-500 transition-all border border-zinc-800">
          <ChevronLeft size={18} />
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
            <Megaphone className="text-amber-500" size={22} /> Kirim Pengingat Transaksi
          </h1>
          <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase">{isSellerReminder ? "Hubungi penjual untuk segera mengirimkan produk & input resi" : "Hubungi pembeli untuk segera menyelesaikan pesanan"}</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-xl">
        {/* Order Info Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-inner">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} /> ID Pesanan
            </p>
            <p className="text-sm font-bold text-white font-mono">{order?.order_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} /> Pembeli
            </p>
            <p className="text-sm font-bold text-white uppercase">{order?.receiver_name || order?.user?.username}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Store size={12} className="text-emerald-500" /> Penjual
            </p>
            <p className="text-sm font-bold text-white uppercase">{order?.shop?.name || "Toko"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={12} /> Produk
            </p>
            <p className="text-sm font-bold text-white truncate" title={order?.product?.name}>
              {order?.product?.name}
            </p>
          </div>
        </div>

        {/* Message Composition Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pesan Pengingat</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 p-5 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-sm leading-relaxed font-semibold" placeholder="Tulis pesan pengingat Anda di sini..." required />
            <p className="text-[10px] text-zinc-500 italic font-semibold">{isSellerReminder ? "Pesan ini akan dikirim sebagai notifikasi real-time dan modal popup di halaman Penjual." : "Pesan ini akan dikirim sebagai notifikasi real-time dan modal popup di halaman Pembeli."}</p>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800/50">
            <Link href="/admin/transaksi-user" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
              Batal
            </Link>
            <button type="submit" disabled={isSending || !message.trim()} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10">
              <Send size={14} />
              {isSending ? "Mengirim..." : "Kirim Pengingat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionReminderPage() {
  return (
    <div className="p-6 lg:p-10 min-h-screen">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Halaman...</p>
          </div>
        }
      >
        <ReminderForm />
      </Suspense>
    </div>
  );
}
