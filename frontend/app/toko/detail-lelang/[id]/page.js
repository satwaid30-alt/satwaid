"use client";

import Navbar from "../../../../components/Navbar";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getLogoUrl } from "@/app/utils/api";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  XCircle,
  Info,
  Store,
  ShoppingBag,
  Star,
  Truck,
  Share2,
  Tag,
  Clock,
  Gavel,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import ActionModal from "../../../../components/ActionModal";
import { copyToClipboard } from "../../../utils/clipboard";

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const getParsedImages = (imagesData) => {
    if (!imagesData) return [];
    
    let rawImages = [];
    try {
      if (typeof imagesData === 'string') {
        if (imagesData.startsWith('[') || imagesData.startsWith('{')) {
          rawImages = JSON.parse(imagesData);
        } else {
          rawImages = [imagesData];
        }
      } else if (Array.isArray(imagesData)) {
        rawImages = imagesData;
      } else {
        rawImages = [imagesData];
      }
    } catch (e) {
      console.error("Error parsing imagesData:", e);
      return [];
    }

    const arr = Array.isArray(rawImages) ? rawImages : [rawImages];
    return arr
      .filter((img) => img && typeof img === 'string')
      .map((img) => {
        if (img.startsWith('http') || img.startsWith('data:')) {
          return img;
        }
        const baseUrl = getApiUrl();
        const path = img.startsWith('/') ? img : `/${img}`;
        return `${baseUrl}${path}`;
      });
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBuying, setIsBuying] = useState(false);

  const parsedImages = getParsedImages(selectedProduct?.images);

  // Bidding states
  const [bidAmount, setBidAmount] = useState(0);
  const [bidInputAmount, setBidInputAmount] = useState("");
  const [bids, setBids] = useState([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [socket, setSocket] = useState(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState("active"); // "scheduled", "active", "ended"

  // Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "",
    cancelText: "",
    isLoading: false,
  });

  const fetchProductDetail = async (id) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/listings/${id}`,
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setSelectedProduct(result.data);

        // Initialize standard bid amount safely using secure numeric parsing
        const currentBid =
          Number(result.data.current_bid) || Number(result.data.start_bid) || 0;
        const multiple = Number(result.data.multiple) || 0;
        const minBid = currentBid + multiple;
        setBidAmount(minBid);
        return result.data;
      }
    } catch (err) {
      console.error("Error fetching product detail:", err);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const fetchBids = async () => {
    if (!productId) return [];
    try {
      const response = await fetch(
        `${getApiUrl()}/listings/${productId}/bids`,
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setBids(result.data);
        return result.data;
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
    }
    return [];
  };

  useEffect(() => {
    // Load current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    if (productId) {
      fetchProductDetail(productId);
    }
  }, [productId]);

  // Socket.io connection & Initial Bids fetching
  useEffect(() => {
    if (!productId) return;

    // Fetch initial bids list
    fetchBids();

    // Establish Socket.io connection
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const newSocket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });
    setSocket(newSocket);

    // Join room
    newSocket.emit("join_auction", productId);

    // Listen for live bid updates
    newSocket.on("receive_bid", (newBid) => {
      setBids((prev) => {
        // Prevent duplication
        if (prev.some((b) => b.id === newBid.id)) return prev;
        const updated = [newBid, ...prev];
        // Sort descending by bid_amount
        return updated.sort(
          (a, b) => Number(b.bid_amount) - Number(a.bid_amount),
        );
      });

      // Update current bid in selectedProduct dynamically
      setSelectedProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_bid: Math.max(
            Number(prev.current_bid || 0),
            Number(newBid.bid_amount),
          ),
        };
      });
    });

    // Listen for auction ended event
    newSocket.on("auction_ended", async (data) => {
      if (
        data &&
        (String(data.listing_id) === String(productId))
      ) {
        setAuctionStatus("ended");
        setTimeLeft(null);

        // Refetch product detail and bids
        const updatedProduct = await fetchProductDetail(productId);
        await fetchBids();

        const userStr = localStorage.getItem("user");
        let activeUser = null;
        if (userStr) {
          try {
            activeUser = JSON.parse(userStr);
          } catch (e) {
            console.error("Error parsing user data", e);
          }
        }

        if (activeUser) {
          // If current user is the winner
          if (data.winner_id && String(activeUser.id) === String(data.winner_id)) {
            setActionModal({
              isOpen: true,
              type: "success",
              title: "Selamat! Anda Menang Lelang!",
              message: `Selamat! Anda memenangkan lelang untuk "${updatedProduct?.name || "produk ini"}". Silakan lengkapi data pengiriman dan lakukan pembayaran untuk memproses transaksi.`,
              confirmText: "Lengkapi Alamat & Bayar",
              cancelText: "Tutup",
              onConfirm: () => {
                window.location.href = `/user/pesanan/transaksi/${data.order_uuid}`;
              },
            });
          }
          // If current user is the seller
          else if (updatedProduct && String(updatedProduct.user_id) === String(activeUser.id)) {
            setActionModal({
              isOpen: true,
              type: "success",
              title: "Lelang Selesai!",
              message: data.winner_id
                ? "Lelang Anda telah berakhir dan pemenang telah ditentukan. Menunggu pembeli melengkapi alamat pengiriman."
                : "Lelang Anda telah berakhir tanpa adanya penawaran.",
              confirmText: data.winner_id ? "Lihat Pesanan Masuk" : "Tutup",
              cancelText: data.winner_id ? "Tutup" : "",
              onConfirm: () => {
                if (data.winner_id && data.order_uuid) {
                  window.location.href = `/user/toko/pesanan-masuk/detail/${data.order_uuid}`;
                } else {
                  setActionModal((prev) => ({ ...prev, isOpen: false }));
                }
              },
            });
          }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [productId]);

  // Live countdown timer effect
  useEffect(() => {
    if (!selectedProduct) return;

    const update = () => {
      const now = new Date().getTime();
      const start = selectedProduct.start_date
        ? new Date(selectedProduct.start_date).getTime()
        : 0;
      const end = selectedProduct.end_date
        ? new Date(selectedProduct.end_date).getTime()
        : 0;

      if (start > now) {
        setAuctionStatus("scheduled");
        const distance = start - now;
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({
          d: d.toString(),
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
        });
      } else if (end > now) {
        setAuctionStatus("active");
        const distance = end - now;
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({
          d: d.toString(),
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
        });
      } else {
        setAuctionStatus("ended");
        setTimeLeft(null);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [selectedProduct]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const minNextBid = selectedProduct
    ? (bids.length > 0
      ? Number(bids[0].bid_amount)
      : Number(selectedProduct.start_bid) || 0) + (Number(selectedProduct.multiple) || 0)
    : 0;

  const formatBidDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const date = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${date}/${month} ${hours}:${minutes}`;
  };

  const formatJlfPrice = (price) => {
    if (price === undefined || price === null) return "-";
    return new Intl.NumberFormat("id-ID").format(price) + ",-";
  };

  const handleBidInputChange = (val) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      setBidInputAmount("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(
      parseInt(cleanVal, 10),
    );
    setBidInputAmount(formatted);
  };

  const handleSubmitBid = async (e) => {
    if (e) e.preventDefault();

    if (!currentUser) {
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Perlu Login",
        message:
          "Silakan login terlebih dahulu untuk memasang penawaran lelang.",
        confirmText: "Login Sekarang",
        cancelText: "Batal",
        onConfirm: () => {
          window.location.href = "/login";
        },
      });
      return;
    }

    if (!selectedProduct) return;

    if (selectedProduct.user_id === currentUser.id) {
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Peringatan",
        message:
          "Anda tidak dapat memasang penawaran pada produk lelang Anda sendiri.",
        onConfirm: null,
      });
      return;
    }

    if (auctionStatus !== "active") {
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Lelang Tidak Aktif",
        message: "Lelang saat ini sedang tidak menerima penawaran baru.",
        onConfirm: null,
      });
      return;
    }

    const numericBidAmount = parseInt(bidInputAmount.replace(/\D/g, ""), 10);
    if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Input Tidak Valid",
        message: "Silakan masukkan nominal penawaran yang valid.",
        onConfirm: null,
      });
      return;
    }

    const baseBid =
      bids.length > 0
        ? Number(bids[0].bid_amount)
        : Number(selectedProduct.start_bid);

    const multiple = Number(selectedProduct.multiple) || 0;
    const minBid = baseBid + multiple;

    if (numericBidAmount < minBid) {
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Nominal Penawaran Terlalu Rendah",
        message: `Nominal penawaran minimal berikutnya adalah Rp ${new Intl.NumberFormat("id-ID").format(minBid)}.`,
        onConfirm: null,
      });
      return;
    }

    if (multiple > 0) {
      const increment = numericBidAmount - baseBid;
      if (increment % multiple !== 0) {
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Kelipatan Bid Tidak Sesuai",
          message: `Nominal penawaran harus berupa kelipatan Rp ${new Intl.NumberFormat("id-ID").format(multiple)} dari penawaran terakhir (${formatPrice(baseBid)}). Contoh: Rp ${new Intl.NumberFormat("id-ID").format(baseBid + multiple)}, Rp ${new Intl.NumberFormat("id-ID").format(baseBid + multiple * 2)}, dst.`,
          onConfirm: null,
        });
        return;
      }
    }

    setIsSubmittingBid(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiUrl()}/listings/${productId}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            bid_amount: numericBidAmount,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        setBidInputAmount("");
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Penawaran Berhasil!",
          message: `Penawaran Anda sebesar Rp ${new Intl.NumberFormat("id-ID").format(numericBidAmount)} telah berhasil dipasang.`,
          onConfirm: null,
        });
      } else {
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Gagal Memasang Penawaran",
          message:
            result.message || "Terjadi kesalahan saat memasang penawaran Anda.",
          onConfirm: null,
        });
      }
    } catch (err) {
      console.error("Error submitting bid:", err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Silakan coba lagi.",
        onConfirm: null,
      });
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    setActionModal({
      isOpen: true,
      type: "checkout",
      title: "Beli Sekarang (BIN)",
      message: `Apakah Anda yakin ingin membeli langsung ${selectedProduct.name} dengan harga BIN ${formatPrice(selectedProduct.bin_price)}? (Pilih YA berarti Anda langsung memenangkan produk lelang ini)`,
      confirmText: "Ya, Beli Sekarang",
      cancelText: "Batal",
      onConfirm: executeBINPurchase,
    });
  };

  const executeBINPurchase = async () => {
    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiUrl()}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            listing_id: selectedProduct.id,
            quantity: 1,
            is_bin: true,
          }),
        },
      );

      if (response.ok) {
        setAuctionStatus("ended");
        setTimeLeft(null);
        setSelectedProduct((prev) =>
          prev ? { ...prev, status: "ended", end_date: new Date() } : null,
        );

        setActionModal({
          isOpen: true,
          type: "success",
          title: "Pembelian BIN Berhasil!",
          message:
            "Pesanan BIN lelang Anda berhasil dibuat. Silakan lengkapi data pengiriman untuk memproses transaksi.",
          onConfirm: () => {
            window.location.href = "/user/pesanan?tab=pending_shipping_info";
          },
          confirmText: "Lengkapi Data Sekarang",
        });
      } else {
        const data = await response.json();
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Gagal Membeli BIN",
          message:
            data.message ||
            "Terjadi kesalahan saat memproses pembelian BIN Anda.",
          onConfirm: null,
        });
      }
    } catch (err) {
      console.error("BIN buy error:", err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
        onConfirm: null,
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleClaimVictory = async () => {
    if (!currentUser || !selectedProduct) return;
    setIsBuying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiUrl()}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            listing_id: selectedProduct.id,
            quantity: 1,
            is_bin: false,
          }),
        },
      );

      const result = await response.json();
      if (response.ok && result.data) {
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Transaksi Berhasil Dibuat!",
          message:
            "Kemenangan lelang Anda berhasil diproses. Silakan lengkapi data pengiriman untuk memproses transaksi.",
          onConfirm: () => {
            window.location.href = `/user/pesanan/transaksi/${result.data.id}`;
          },
          confirmText: "Lengkapi Data Sekarang",
        });
      } else {
        setActionModal({
          isOpen: true,
          type: "danger",
          title: "Gagal Memproses Transaksi",
          message:
            result.message ||
            "Terjadi kesalahan saat memproses transaksi lelang Anda.",
          onConfirm: null,
        });
      }
    } catch (err) {
      console.error("Claim victory error:", err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
        onConfirm: null,
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedProduct.name,
          text: `Ikuti lelang ${selectedProduct.name} di REPTILEHAVEN!`,
          url: url,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error sharing:", err);
      }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Link Berhasil Disalin",
        message:
          "Tautan lelang telah disalin ke clipboard Anda. Silakan bagikan ke teman Anda!",
        onConfirm: null,
      });
    } else {
      setActionModal({
        isOpen: true,
        type: "info",
        title: "Gagal Menyalin Otomatis",
        message: "Silakan salin link di browser Anda secara manual.",
        onConfirm: null,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
            Memuat Detail Lelang...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedProduct || selectedProduct.type !== "auction") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-400">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-2">
            Lelang Tidak Ditemukan
          </h2>
          <p className="text-zinc-500 mb-8">
            Maaf, produk lelang yang Anda cari tidak tersedia, sudah dihapus,
            atau bertipe jualan biasa.
          </p>
          <Link
            href="/lelang"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black px-8 py-3 rounded-2xl transition-all"
          >
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  const baseBid = selectedProduct
    ? bids.length > 0
      ? Number(bids[0].bid_amount)
      : Number(selectedProduct.start_bid)
    : 0;
  const multiple = selectedProduct ? Number(selectedProduct.multiple) || 0 : 0;
  const minBid = baseBid + multiple;

  const getBidValidation = () => {
    if (!bidInputAmount) {
      return {
        isValid: null,
        message: `Minimal bid berikutnya: ${formatPrice(minBid)} (Kelipatan +${formatPrice(multiple)})`,
      };
    }
    const numericVal = parseInt(bidInputAmount.replace(/\D/g, ""), 10);
    if (isNaN(numericVal) || numericVal <= 0) {
      return {
        isValid: false,
        message: "Masukkan nominal angka saja.",
      };
    }
    if (numericVal < minBid) {
      return {
        isValid: false,
        message: `Nominal harus minimal ${formatPrice(minBid)}.`,
      };
    }
    if (multiple > 0) {
      const increment = numericVal - baseBid;
      if (increment % multiple !== 0) {
        return {
          isValid: false,
          message: `Harus kelipatan +${formatPrice(multiple)} dari ${formatPrice(baseBid)}.`,
        };
      }
    }
    return {
      isValid: true,
      message: `Nominal valid: ${formatPrice(numericVal)}`,
    };
  };
  const validation = getBidValidation();

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 lg:pt-28 pb-12 flex flex-col">
      <div className="max-w-[1440px] mx-auto px-4 w-full flex-1 flex flex-col">
        {/* Back Link */}
        <Link
          href="/lelang"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-amber-600 font-bold mb-4 transition-colors group text-sm"
        >
          <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-amber-500 group-hover:bg-amber-50 transition-all">
            <ChevronLeft size={14} />
          </div>
          Kembali ke Toko
        </Link>

        <div className="bg-white lg:border lg:border-zinc-200 rounded-none lg:rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row lg:flex-1 lg:min-h-0 mb-4">
          {/* Left Side: Image Gallery */}
          <div className="lg:w-[45%] bg-white relative group border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col justify-center">
            {parsedImages.length > 0 &&
            parsedImages[activeImageIndex] ? (
              <img
                src={parsedImages[activeImageIndex]}
                className="w-full max-h-[320px] sm:max-h-[500px] lg:max-h-none aspect-square lg:aspect-auto object-contain p-4 sm:p-8 lg:p-20 transition-transform duration-700 group-hover:scale-105"
                alt={selectedProduct.name}
              />
            ) : (
              <div className="w-full aspect-square lg:h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50">
                <Tag size={64} strokeWidth={1} />
                <p className="mt-4 font-bold text-xs uppercase tracking-widest">
                  Tidak ada gambar
                </p>
              </div>
            )}

            {/* Image Navigation Arrows */}
            {parsedImages.length > 1 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === 0 ? parsedImages.length - 1 : prev - 1,
                    )
                  }
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-800 hover:bg-amber-500 hover:text-white transition-all pointer-events-auto active:scale-90"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === parsedImages.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-800 hover:bg-amber-500 hover:text-white transition-all pointer-events-auto active:scale-90"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Thumbnail Strip */}
            {parsedImages.length > 1 && (
              <div className="relative lg:absolute lg:bottom-6 bottom-4 inset-x-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar py-2">
                {parsedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${activeImageIndex === idx ? "border-amber-500 scale-105" : "border-zinc-200 opacity-60 hover:opacity-100"}`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Thumb ${idx}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Auction Details */}
          <div className="lg:w-[55%] p-4 sm:p-6 lg:p-10 xl:p-12 overflow-y-auto no-scrollbar">
            <div className="space-y-6 lg:space-y-8">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-zinc-100 text-zinc-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-zinc-200">
                    {selectedProduct.species || "Reptil"}
                  </span>
                  <span className="bg-amber-500 text-zinc-950 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-amber-600 flex items-center gap-1">
                    <Gavel size={11} />
                    Lelang Reptil
                  </span>
                  <span className="bg-zinc-100 text-zinc-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-zinc-200">
                    Dibuat:{" "}
                    {new Date(selectedProduct.created_at).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </span>
                  {/* <span
                    className="bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors select-all"
                    title="Klik untuk menyalin Product ID"
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        String(selectedProduct.product_id),
                      )
                    }
                  >
                    ID: {selectedProduct.product_id}
                  </span> */}
                </div>
                <h2 className="text-2xl lg:text-3xl xl:text-3xl font-black text-zinc-900 leading-tight">
                  {selectedProduct.name}
                </h2>
              </div>
              {/* Seller Info Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex-shrink-0">
                    {selectedProduct.shop?.logo_url ? (
                      <img
                        src={getLogoUrl(selectedProduct.shop.logo_url)}
                        className="w-full h-full object-cover"
                        alt={selectedProduct.shop.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                        <Store size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-amber-600 hover:underline cursor-pointer truncate">
                        {selectedProduct.shop?.name || "Penjual"}
                      </p>
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 flex-shrink-0">
                        <Star
                          size={10}
                          className="text-amber-500 fill-amber-500"
                        />
                        <span className="text-[10px] font-black text-zinc-900">
                          {selectedProduct.shop?.avgRating || "5.0"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 font-bold truncate">
                      <MapPin
                        size={12}
                        className="text-zinc-400 flex-shrink-0"
                      />{" "}
                      <span className="truncate">
                        {selectedProduct.shop?.city || "Lokasi tidak diset"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                  {selectedProduct.shop?.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedProduct.shop.whatsapp.replace(/\D/g, "")}?text=Halo ${selectedProduct.shop.name}, saya tertarik dengan lelang "${selectedProduct.name}" di REPTILEHAVEN.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-[11px] font-black text-white bg-[#25D366] hover:bg-[#128C7E] transition-all py-2.5 px-4 rounded-xl text-center"
                    >
                      <svg
                        className="w-3.5 h-3.5 fill-current flex-shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.448.265c1.485.881 3.192 1.347 4.933 1.348 5.456 0 9.897-4.44 9.899-9.898.001-2.646-1.03-5.133-2.903-7.006-1.874-1.874-4.359-2.907-7.004-2.907-5.457 0-9.898 4.44-9.9 9.898-.001 2.107.549 4.159 1.59 5.968l.301.517-1.103 4.029 4.125-1.082zM17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.677.15-.2.299-.777.979-.951 1.178-.174.2-.349.226-.65.075-.301-.15-1.272-.469-2.422-1.494-.894-.797-1.498-1.783-1.674-2.083-.176-.3-.019-.462.132-.611.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.1-.2.05-.375-.025-.525-.075-.15-.677-1.633-.927-2.235-.243-.587-.491-.507-.677-.517-.175-.008-.376-.01-.577-.01s-.526.075-.802.375c-.276.3-1.052 1.026-1.052 2.503s1.077 2.903 1.227 3.103c.15.2 2.119 3.235 5.132 4.532.716.308 1.276.492 1.711.631.719.228 1.373.196 1.89.119.576-.086 1.78-.727 2.031-1.428.25-.701.25-1.302.175-1.428-.075-.126-.276-.226-.577-.376z" />
                      </svg>
                      Hubungi
                    </a>
                  )}

                  <button
                    onClick={handleShare}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-[11px] font-black text-zinc-600 hover:text-emerald-600 transition-colors py-2.5 px-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-center"
                  >
                    <Share2 size={14} className="flex-shrink-0" /> Bagikan
                  </button>
                </div>
              </div>
              {/* Main Auction Info Card */}
              <div className="bg-transparent lg:bg-white rounded-none lg:rounded-[2rem] p-0 sm:p-0 lg:p-8 border-0 lg:border lg:border-zinc-200 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                {/* Live Countdown Header */}
                <div className="flex flex-col items-center justify-center text-center py-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                  {auctionStatus === "scheduled" && (
                    <>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <Calendar size={12} className="animate-bounce" /> Lelang
                        Dimulai Dalam
                      </p>
                      {timeLeft && (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                          {timeLeft.d !== "0" && (
                            <>
                              <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                                <span className="text-sm sm:text-xl font-black leading-none">
                                  {timeLeft.d}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                                  Hari
                                </span>
                              </div>
                              <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                                :
                              </span>
                            </>
                          )}
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.h}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Jam
                            </span>
                          </div>
                          <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                            :
                          </span>
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.m}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Menit
                            </span>
                          </div>
                          <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                            :
                          </span>
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px] ">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.s}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Detik
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {auctionStatus === "active" && (
                    <>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <Clock
                          size={12}
                          className="animate-spin duration-3000"
                        />{" "}
                        Sisa Waktu Lelang
                      </p>
                      {timeLeft ? (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                          {timeLeft.d !== "0" && (
                            <>
                              <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                                <span className="text-sm sm:text-xl font-black leading-none">
                                  {timeLeft.d}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                                  Hari
                                </span>
                              </div>
                              <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                                :
                              </span>
                            </>
                          )}
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.h}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Jam
                            </span>
                          </div>
                          <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                            :
                          </span>
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.m}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Menit
                            </span>
                          </div>
                          <span className="text-amber-400 font-black text-base sm:text-xl animate-pulse">
                            :
                          </span>
                          <div className="bg-white text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px]">
                            <span className="text-sm sm:text-xl font-black leading-none">
                              {timeLeft.s}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">
                              Detik
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-zinc-500">
                          MEMPROSES...
                        </span>
                      )}
                    </>
                  )}

                  {auctionStatus === "ended" && (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <span className="bg-zinc-150 text-zinc-600 border border-zinc-200 px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest">
                        Lelang Telah Berakhir
                      </span>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">
                        Penutupan resmi:{" "}
                        {selectedProduct.end_date
                          ? new Date(selectedProduct.end_date).toLocaleString(
                              "id-ID",
                              { dateStyle: "medium", timeStyle: "short" },
                            )
                          : "-"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing Parameters Grid (OB, Kelipatan, BIN) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-zinc-150">
                  <div className="text-center p-2 border-r border-zinc-100 flex flex-col justify-center">
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">
                      Tawaran Awal (OB)
                    </p>
                    <p className="text-[10px] xs:text-xs sm:text-base md:text-lg font-black text-zinc-800 tracking-tighter xs:tracking-tight">
                      {formatPrice(selectedProduct.start_bid)}
                    </p>
                  </div>
                  <div className="text-center p-2 border-r border-zinc-100 flex flex-col justify-center">
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">
                      Kelipatan
                    </p>
                    <p className="text-[10px] xs:text-xs sm:text-base md:text-lg font-black text-amber-600 tracking-tighter xs:tracking-tight">
                      +{formatPrice(selectedProduct.multiple)}
                    </p>
                  </div>
                  <div className="text-center p-2 flex flex-col justify-center">
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">
                      Beli Sekarang (BIN)
                    </p>
                    {selectedProduct.bin_price ? (
                      <p className="text-[10px] xs:text-xs sm:text-base md:text-lg font-black text-emerald-600 tracking-tighter xs:tracking-tight">
                        {formatPrice(selectedProduct.bin_price)}
                      </p>
                    ) : (
                      <p className="text-[8px] xs:text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest italic leading-none pt-0.5">
                        Tidak Ada
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-gradient-to-b from-amber-50/20 to-amber-50/10 border border-amber-200/60 p-3.5 xs:p-5 sm:p-6 rounded-2xl text-center space-y-1">
                    <p className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      BID SAAT INI
                    </p>
                    <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-amber-600 tracking-tight">
                      {formatPrice(
                        bids.length > 0
                          ? Number(bids[0].bid_amount)
                          : Number(selectedProduct.start_bid),
                      )}
                    </p>
                    <p className="text-[10px] sm:text-xs font-bold text-zinc-500 tracking-tight">
                      Minimum Bid Berikutnya:{" "}
                      <span className="text-zinc-900 font-black">
                        {formatPrice(minNextBid)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* BIN Instantly Buy Section (Moved to prevent accidental clicks) */}
                {selectedProduct.bin_price && auctionStatus === "active" && (
                  <div className="bg-emerald-50/70 border border-emerald-200/50 p-4 rounded-2xl flex flex-col xs:flex-row items-center justify-between gap-3">
                    <div className="text-center xs:text-left">
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1.5">
                        Beli Langsung (BIN)
                      </p>
                      <p className="text-base font-black text-emerald-600 leading-none">
                        {formatPrice(selectedProduct.bin_price)}
                      </p>
                    </div>
                    {!(
                      currentUser && selectedProduct.user_id === currentUser.id
                    ) &&
                      selectedProduct.stock > 0 && (
                        <button
                          onClick={handleBuyNow}
                          className="w-full xs:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag size={13} /> Beli Sekarang
                        </button>
                      )}
                  </div>
                )}

                {/* Bidders History & Manual Bid Form */}
                <div className="space-y-4 pt-4 border-t border-zinc-150">
                  {/* Daftar Penawar (Bidders History) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#2b4c7e]/10 flex items-center justify-center text-[#2b4c7e]">
                          <Gavel size={13} />
                        </div>
                        Daftar Penawar ({bids.length})
                      </h4>
                      {bids.length > 0 && (
                        <span className="text-[10px] font-black text-[#2b4c7e] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#2b4c7e] rounded-full animate-ping"></span>{" "}
                          Sinkronisasi Langsung
                        </span>
                      )}
                    </div>

                    {bids.length > 0 ? (
                      <div className="max-h-[220px] overflow-y-auto pr-1 border border-zinc-100 rounded-2xl divide-y divide-zinc-100/60 bg-zinc-50/20">
                        {bids.map((bid, index) => {
                          const isHighest = index === 0;
                          const bidderName =
                            bid.bidder?.name ||
                            bid.bidder?.username ||
                            "Penawar";
                          return (
                            <div
                              key={bid.id}
                              className={`flex items-center justify-between p-3.5 transition-colors ${
                                isHighest
                                  ? "bg-[#2b4c7e]/5 hover:bg-[#2b4c7e]/10"
                                  : "hover:bg-zinc-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-xs font-black shrink-0 border ${
                                    isHighest
                                      ? "bg-[#2b4c7e] text-white border-transparent"
                                      : "bg-white text-zinc-600 border-zinc-200"
                                  }`}
                                >
                                  {bid.bidder?.avatar_url ? (
                                    <img
                                      src={`${getApiUrl()}${bid.bidder.avatar_url}`}
                                      alt={bidderName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    className={
                                      bid.bidder?.avatar_url ? "hidden" : ""
                                    }
                                  >
                                    {bidderName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-[#2b4c7e] truncate leading-tight">
                                    {bidderName}
                                  </p>
                                  <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                                    {formatBidDate(bid.created_at)}
                                  </p>
                                </div>
                              </div>

                              {/* Bid Capsule */}
                              <div>
                                {isHighest ? (
                                  <div className="bg-[#2b4c7e] text-white px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-tight text-center min-w-[110px] sm:min-w-[130px] flex items-center justify-center">
                                    Rp {formatJlfPrice(Number(bid.bid_amount))}
                                  </div>
                                ) : (
                                  <div className="border border-zinc-200 text-zinc-700 bg-white px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-tight text-center min-w-[110px] sm:min-w-[130px]">
                                    Rp {formatJlfPrice(Number(bid.bid_amount))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20">
                        <p className="text-zinc-500 text-xs font-bold leading-none mb-1">
                          Belum Ada Penawaran
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Jadilah penawar pertama untuk lelang ini!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pasang Bid Form */}
                  {auctionStatus === "active" &&
                    !(
                      currentUser && selectedProduct.user_id === currentUser.id
                    ) &&
                    selectedProduct.stock > 0 && (
                      <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                              <Gavel size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                                Pasang Penawaran Anda
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-bold">
                                Form input harga bid lelang resmi
                              </p>
                            </div>
                          </div>
                          {!currentUser && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Belum Login
                            </span>
                          )}
                        </div>

                        {/* Guest mode quick hint */}
                        {!currentUser && (
                          <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                            *Anda belum masuk. Anda dapat memasukkan nominal bid
                            di bawah, namun akan diminta login saat mengirim
                            penawaran.
                          </p>
                        )}

                        {/* Manual Bid Form */}
                        <form
                          onSubmit={handleSubmitBid}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-zinc-200 rounded-2xl p-1.5 focus-within:border-[#2b4c7e] transition-all gap-1.5 shadow-sm"
                        >
                          <div className="flex items-center flex-1 min-w-0 px-3 py-2 sm:py-0">
                            <span className="font-black text-[#2b4c7e] text-sm mr-2 shrink-0 select-none">
                              Rp
                            </span>
                            <input
                              id="bid-amount-input"
                              type="text"
                              value={bidInputAmount}
                              onChange={(e) =>
                                handleBidInputChange(e.target.value)
                              }
                              placeholder={`Contoh: ${new Intl.NumberFormat("id-ID").format(minBid)}`}
                              className="w-full bg-transparent border-0 focus:outline-none text-zinc-900 placeholder:text-zinc-400 font-bold text-sm min-w-0"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingBid || !bidInputAmount}
                            className="bg-[#2b4c7e] hover:bg-[#1a355c] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-black px-5 py-3 sm:py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 tracking-wider uppercase active:scale-95 cursor-pointer"
                          >
                            {isSubmittingBid ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Gavel size={13} />
                                Kirim Bid
                              </>
                            )}
                          </button>
                        </form>

                        {/* Dynamic Live Validation Helper Text */}
                        <div className="text-[10px] font-bold px-1">
                          {validation.isValid === null && (
                            <span className="text-zinc-500">
                              Minimal bid berikutnya:{" "}
                              <span className="text-zinc-900 font-black">
                                {formatPrice(minBid)}
                              </span>{" "}
                              (Kelipatan +{formatPrice(multiple)})
                            </span>
                          )}
                          {validation.isValid === false && (
                            <span className="text-rose-600">
                              ⚠️ {validation.message}
                            </span>
                          )}
                          {validation.isValid === true && (
                            <span className="text-emerald-600">
                              ✓ {validation.message}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Scheduled Message */}
                  {auctionStatus === "scheduled" && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl text-center">
                      <p className="text-xs text-amber-800 font-bold leading-relaxed flex items-center justify-center gap-2">
                        <Calendar size={14} className="text-amber-500" /> Lelang
                        ini baru akan dibuka pada tanggal{" "}
                        {selectedProduct.start_date
                          ? new Date(selectedProduct.start_date).toLocaleString(
                              "id-ID",
                              { dateStyle: "medium", timeStyle: "short" },
                            )
                          : "-"}
                        . Harap menunggu untuk melakukan penawaran.
                      </p>
                    </div>
                  )}

                  {/* Locked/Ended Message / Transaction Process */}
                  {auctionStatus === "ended" && (
                    <div className="space-y-4">
                      <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-3xl text-center space-y-4">
                        <p className="text-xs text-zinc-500 font-bold leading-relaxed flex items-center justify-center gap-2 mb-0">
                          <XCircle size={14} className="text-zinc-400" /> Lelang
                          ini sudah berakhir. Seluruh penawaran tawar-menawar
                          dalam forum lelang telah ditutup secara permanen.
                        </p>

                        {(() => {
                          const hasOrder = !!selectedProduct.latestOrderUuid;
                          const hasBids = bids && bids.length > 0;
                          
                          if (hasOrder) {
                            const winnerName = selectedProduct.latestOrderBuyerName || "Pemenang";
                            const winnerPrice = Number(selectedProduct.latestOrderPrice || 0);
                            const winnerUserId = selectedProduct.latestOrderUserId;
                            
                            return (
                              <div className="pt-3 border-t border-zinc-200/50 space-y-3">
                                <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                                  Pemenang Lelang:{" "}
                                  <span className="text-[#2b4c7e] font-black uppercase">
                                    {winnerName}
                                  </span>{" "}
                                  dengan harga{" "}
                                  <span className="text-emerald-600 font-black text-sm">
                                    {formatPrice(winnerPrice)}
                                  </span>
                                </p>

                                {/* Winner Action */}
                                {currentUser && String(winnerUserId) === String(currentUser.id) && (
                                  <div className="pt-2">
                                    <Link
                                      href={`/user/pesanan/transaksi/${selectedProduct.latestOrderUuid}`}
                                      className="inline-flex w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs transition-all items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                    >
                                      Lengkapi Alamat Pengiriman & Bayar
                                    </Link>
                                  </div>
                                )}

                                {/* Seller Action */}
                                {currentUser && String(selectedProduct.user_id) === String(currentUser.id) && (
                                  <div className="pt-2">
                                    <Link
                                      href={`/user/toko/pesanan-masuk/detail/${selectedProduct.latestOrderUuid}`}
                                      className="inline-flex w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-black rounded-2xl text-xs transition-all items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                    >
                                      Lihat Detail Pesanan Masuk
                                    </Link>
                                  </div>
                                )}

                                {/* Visitor Info */}
                                {(!currentUser ||
                                  (String(winnerUserId) !== String(currentUser.id) &&
                                    String(selectedProduct.user_id) !== String(currentUser.id))) && (
                                  <p className="text-[10px] text-zinc-400 font-medium italic mb-0">
                                    Transaksi sedang diproses oleh pemenang lelang dan penjual.
                                  </p>
                                )}
                              </div>
                            );
                          } else if (hasBids) {
                            const winnerName = bids[0].bidder?.name || bids[0].bidder?.username || "Pemenang";
                            const winnerPrice = Number(bids[0].bid_amount || 0);
                            const winnerUserId = bids[0].user_id;

                            return (
                              <div className="pt-3 border-t border-zinc-200/50 space-y-3">
                                <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                                  Pemenang Lelang:{" "}
                                  <span className="text-[#2b4c7e] font-black uppercase">
                                    {winnerName}
                                  </span>{" "}
                                  dengan tawaran{" "}
                                  <span className="text-emerald-600 font-black text-sm">
                                    {formatPrice(winnerPrice)}
                                  </span>
                                </p>

                                {/* Winner Action */}
                                {currentUser && String(winnerUserId) === String(currentUser.id) && (
                                  <div className="pt-2">
                                    <button
                                      onClick={handleClaimVictory}
                                      disabled={isBuying}
                                      className="w-full h-12 bg-[#2b4c7e] hover:bg-[#1a355c] disabled:bg-zinc-300 disabled:text-zinc-400 text-white font-black rounded-2xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      {isBuying ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        "Proses Transaksi Kemenangan Lelang"
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* Seller Action */}
                                {currentUser && String(selectedProduct.user_id) === String(currentUser.id) && (
                                  <div className="pt-2">
                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 py-2.5 px-4 rounded-xl mb-0">
                                      Menunggu Pemenang Memulai Transaksi
                                    </p>
                                  </div>
                                )}

                                {/* Visitor Info */}
                                {(!currentUser ||
                                  (String(winnerUserId) !== String(currentUser.id) &&
                                    String(selectedProduct.user_id) !== String(currentUser.id))) && (
                                  <p className="text-[10px] text-zinc-400 font-medium italic mb-0">
                                    Transaksi sedang diproses oleh pemenang lelang dan penjual.
                                  </p>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div className="pt-2 border-t border-zinc-200/50">
                                <p className="text-xs text-zinc-400 font-bold mb-0">
                                  Lelang berakhir tanpa ada penawaran.
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-zinc-200/50"></div>

                {/* Free Shipping & Packing Badges */}
                {(selectedProduct.is_free_shipping ||
                  selectedProduct.is_free_packing) && (
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.is_free_shipping && (
                      <div className="flex-1 min-w-[130px] p-3.5 sm:p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase leading-none mb-1">
                            Gratis Ongkir
                          </p>
                          <p className="text-[11px] opacity-70 font-bold leading-none">
                            Ditanggung Penjual
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedProduct.is_free_packing && (
                      <div className="flex-1 min-w-[130px] p-3.5 sm:p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Info size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase leading-none mb-1">
                            Gratis Packing
                          </p>
                          <p className="text-[11px] opacity-70 font-bold leading-none">
                            Ditanggung Penjual
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Specifications Grid - Minimalist Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-zinc-50 lg:bg-white border border-zinc-150 lg:border-zinc-200 rounded-2xl p-3.5 sm:p-5 hover:border-amber-500/30 transition-all text-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">
                      Jenis Kelamin
                    </p>
                    <p className="text-[12px] font-black text-zinc-900 truncate">
                      {selectedProduct.sex === "Male" ||
                      selectedProduct.sex?.toLowerCase() === "jantan"
                        ? "Jantan"
                        : selectedProduct.sex === "Female" ||
                            selectedProduct.sex?.toLowerCase() === "betina"
                          ? "Betina"
                          : selectedProduct.sex || "Unsex"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 lg:bg-white border border-zinc-150 lg:border-zinc-200 rounded-2xl p-3.5 sm:p-5 hover:border-amber-500/30 transition-all text-center flex flex-col justify-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-2 sm:mb-3">
                      Pengiriman
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-black text-zinc-900 leading-tight">
                      {selectedProduct.shipping_type || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 lg:bg-white border border-zinc-150 lg:border-zinc-200 rounded-2xl p-3.5 sm:p-5 hover:border-amber-500/30 transition-all text-center flex flex-col justify-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-2 sm:mb-3">
                      ID Produk
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-black text-zinc-900 truncate leading-tight">
                      {selectedProduct.product_id || "-"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Info size={16} />
                    </div>
                    Deskripsi Produk
                  </h4>
                  <div
                    className="text-sm text-zinc-600 leading-relaxed description-content bg-transparent lg:bg-white p-0 lg:p-6 rounded-none lg:rounded-2xl border-0 lg:border lg:border-zinc-200"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedProduct.description || "Tidak ada deskripsi.",
                    }}
                  ></div>
                </div>

                {/* Shipping */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <MapPin size={16} />
                    </div>
                    Info Pengiriman & Garansi
                  </h4>
                  <div
                    className="text-sm text-zinc-600 leading-relaxed description-content bg-transparent lg:bg-white p-0 lg:p-6 rounded-none lg:rounded-2xl border-0 lg:border lg:border-zinc-200"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedProduct.shipping_description ||
                        "Tidak ada informasi pengiriman.",
                    }}
                  ></div>
                </div>

                {/* Final Status Indicator */}
                <div className="pt-8 border-t border-zinc-150">
                  {currentUser && selectedProduct.user_id === currentUser.id ? (
                    <div className="w-full bg-zinc-50 text-zinc-400 font-black py-5 rounded-2xl border border-zinc-200 flex items-center justify-center gap-3 cursor-not-allowed uppercase tracking-widest text-xs">
                      <XCircle size={20} /> Ini Adalah Produk Lelang Anda
                    </div>
                  ) : selectedProduct.stock <= 0 ? (
                    <div className="w-full bg-red-50/50 text-red-500 font-black py-5 rounded-2xl border border-red-100 flex items-center justify-center gap-3 cursor-not-allowed uppercase tracking-widest text-xs">
                      <AlertCircle size={20} /> Stok Habis / Terjual
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Modal */}
        <ActionModal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={actionModal.onConfirm}
          type={actionModal.type}
          title={actionModal.title}
          message={actionModal.message}
          confirmText={actionModal.confirmText}
          cancelText={actionModal.cancelText}
          isLoading={actionModal.isLoading}
        />

        <style jsx global>{`
          .description-content {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: normal;
            line-break: auto;
            white-space: normal;
          }
          .description-content p {
            margin-bottom: 1rem;
          }
          .description-content ul,
          .description-content ol {
            list-style-position: outside;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          .description-content ul {
            list-style-type: disc;
          }
          .description-content ol {
            list-style-type: decimal;
          }
          .description-content li {
            display: list-item;
            margin-bottom: 0.5rem;
          }
          .description-content li p {
            display: inline;
            margin: 0;
          }
          .description-content li::before {
            content: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}

export default function AuctionDetailPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar theme="light" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
                Memuat Detail Lelang...
              </p>
            </div>
          </div>
        }
      >
        <DetailContent />
      </Suspense>
    </main>
  );
}
