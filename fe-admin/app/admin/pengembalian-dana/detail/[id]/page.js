"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wallet, ArrowLeft, Calendar, CheckCircle2, Clock, Copy, ExternalLink, Eye, FileText, Image as ImageIcon, Info, MapPin, MessageCircle, Package, Printer, Receipt, RefreshCw, Store, Trash2, Truck, User, X, XCircle, AlertCircle, Phone } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm") || lower.endsWith(".mkv");
};

export default function DetailRefundPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { id } = params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Form Processing State
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [refundProofPreview, setRefundProofPreview] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setOrder(result.data);
      } else {
        setError(result.message || "Gagal memuat detail pengembalian dana");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan koneksi jaringan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        fetchOrderDetail();
      }, 0);
    }
  }, [id]);

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(key);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRefundBankDetails = (ord) => {
    if (!ord) return null;
    if (ord.bank_account) {
      return {
        bankName: ord.bank_name || "N/A",
        accountNumber: ord.bank_account,
        accountName: ord.bank_holder || "N/A",
      };
    }
    if (ord.user?.bank_accounts) {
      const bankAccounts = ord.user.bank_accounts;
      let bankObj = null;
      if (Array.isArray(bankAccounts)) {
        if (bankAccounts.length > 0) {
          bankObj = bankAccounts[0];
        }
      } else if (typeof bankAccounts === "object") {
        bankObj = bankAccounts;
      }
      if (bankObj) {
        return {
          bankName: bankObj.bank_name || bankObj.bankName || "N/A",
          accountNumber: bankObj.account_number || bankObj.accountNumber || "N/A",
          accountName: bankObj.account_name || bankObj.accountName || bankObj.accountHolder || bankObj.account_holder || "N/A",
        };
      }
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const blockedExtensions = [".php", ".exe", ".svg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));
    if (blockedExtensions.includes(fileExtension)) {
      alert("Format file diblokir demi keamanan. Gunakan gambar (PNG, JPG, JPEG, WEBP).");
      e.target.value = "";
      return;
    }

    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      alert("Hanya diperbolehkan mengunggah file gambar.");
      e.target.value = "";
      return;
    }

    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran gambar maksimal adalah 1MB.");
      e.target.value = "";
      return;
    }

    setRefundProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRefundProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setRefundProofFile(null);
    setRefundProofPreview("");
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (!refundProofFile) {
      alert("Bukti transfer (Gambar) wajib diunggah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const MAX_FILE_SIZE = 1 * 1024 * 1024;
      if (refundProofFile.size > MAX_FILE_SIZE) {
        alert("Ukuran file maksimal 1MB.");
        setIsSubmitting(false);
        return;
      }

      const fileName = refundProofFile.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));
      const randomString = Math.random().toString(36).substring(2, 15);
      const randomFilename = `${Date.now()}_refund_${randomString}${fileExtension}`;
      const renamedFile = new File([refundProofFile], randomFilename, { type: refundProofFile.type });

      // Upload to S3
      const { objectKey } = await uploadImageToS3(renamedFile, token, "payments");
      const fileUrl = "/" + objectKey;

      const res = await fetch(`${getApiUrl()}/orders/${order.id}/refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          refund_proof: fileUrl,
          refund_notes: refundNotes,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setShowProcessModal(false);
        setRefundProofFile(null);
        setRefundProofPreview("");
        fetchOrderDetail();
      } else {
        alert(result.message || "Gagal memproses refund");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRefund = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (!refundNotes.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/${order.id}/reject-refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          refund_notes: refundNotes,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setShowRejectModal(false);
        fetchOrderDetail();
      } else {
        alert(result.message || "Gagal menolak refund");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoiceImage = async () => {
    if (!printRefund) return;

    try {
      const html2canvas = await loadHtml2Canvas();
      const INVOICE_WIDTH = 794;

      const status = printRefund.refund_status;
      let badgeBg = "#d1fae5",
        badgeColor = "#065f46",
        badgeBorder = "#6ee7b7",
        badgeText = "Dana Telah Dikembalikan";
      if (status === "rejected") {
        badgeBg = "#fee2e2";
        badgeColor = "#991b1b";
        badgeBorder = "#fca5a5";
        badgeText = "Refund Ditolak";
      } else if (status === "pending" || !status) {
        badgeBg = "#fef3c7";
        badgeColor = "#92400e";
        badgeBorder = "#fcd34d";
        badgeText = "Menunggu Transfer Refund";
      }

      const bank = getRefundBankDetails(printRefund);
      const buyerName = printRefund.user?.name || printRefund.user?.username || "-";
      const shopName = printRefund.shop?.name || "-";
      const shopCity = printRefund.shop?.city || "";
      const shopProvince = printRefund.shop?.province || "";
      const dateStr = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
      const priceStr = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseFloat(v) || 0);

      const logoBase = window.location.origin;

      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        zIndex: "-1",
        background: "#ffffff",
      });

      const invoice = document.createElement("div");
      Object.assign(invoice.style, {
        background: "#ffffff",
        color: "#111827",
        width: `${INVOICE_WIDTH}px`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "40px 48px",
        boxSizing: "border-box",
      });

      invoice.innerHTML = `
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;opacity:0.055;">
          <img src="${logoBase}/images/Logo-Bg-2-2.png" crossorigin="anonymous" style="width:400px;height:100px;object-fit:contain;transform:rotate(-20deg);margin-top:40%;" />
        </div>
        <div style="background:#1e3a8a;margin:-40px -48px 40px -48px;padding:36px 48px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
          <img src="${logoBase}/images/Logo-Bg-1-2.png" crossorigin="anonymous" style="height:72px;object-fit:contain;display:block;" />
          <div style="text-align:right;">
            <div style="font-size:13px;color:rgba(255,255,255,0.65);font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Invoice Pengembalian Dana</div>
            <div style="font-size:22px;font-weight:900;color:#fff;font-family:monospace;margin-top:4px;">${printRefund.order_id}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:6px;">Diterbitkan: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>
        <div style="position:relative;z-index:1;">
          <div style="margin-bottom:32px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:100px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:1px solid ${badgeBorder};">
              <span style="width:8px;height:8px;border-radius:50%;background:${badgeColor};display:inline-block;flex-shrink:0;"></span>
              <span style="line-height:1; vertical-align:text-top;margin-top:-12px;">${badgeText}</span>
            </div>
            <span style="font-size:11px;color:#6b7280;font-weight:600;line-height:1;vertical-align:text-top;margin-top:-12px;">• Tanggal Transfer: ${dateStr(printRefund.refunded_at || printRefund.updated_at)}</span>
          </div>
          <div style="display:flex;gap:24px;margin-bottom:36px;">
            <div style="flex:1;background:#f9fafb;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
              <div style="font-size:10px;font-weight:800;color:#059669;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                <span style="width:3px;height:14px;background:#059669;border-radius:2px;display:inline-block;flex-shrink:0;"></span><span style="line-height:1;vertical-align:text-top;margin-top:-12px;">Penerima Refund (Pembeli)</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:#111827;margin-bottom:4px;">${buyerName}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">@${printRefund.user?.username || "user"}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">${printRefund.user?.email || "-"}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;">${printRefund.user?.phone || "-"}</div>
              ${
                bank
                  ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;">
                <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Rekening Pengembalian</div>
                <div style="font-size:13px;font-weight:800;color:#111827;">${bank.bankName}</div>
                <div style="font-size:13px;font-weight:700;color:#374151;font-family:monospace;letter-spacing:0.06em;">${bank.accountNumber}</div>
                <div style="font-size:11px;color:#6b7280;font-weight:600;">a.n. ${bank.accountName}</div>
              </div>`
                  : ""
              }
            </div>
            <div style="flex:1;background:#f9fafb;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
              <div style="font-size:10px;font-weight:800;color:#7c3aed;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                <span style="width:3px;height:14px;background:#7c3aed;border-radius:2px;display:inline-block;flex-shrink:0;"></span><span style="line-height:1;vertical-align:text-top;margin-top:-12px;">Informasi Toko &amp; Pesanan</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:#111827;margin-bottom:4px;">${shopName}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">${shopCity}${shopProvince ? ", " + shopProvince : ""}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">Owner: ${printRefund.shop?.owner?.name || printRefund.shop?.user?.name || "-"}</div>
              <div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;">
                <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Detail Pembatalan</div>
                <div style="font-size:12px;color:#374151;font-weight:600;margin-bottom:2px;">Tgl Pembatalan: ${dateStr(printRefund.cancelled_at || printRefund.updated_at)}</div>
                ${printRefund.rejection_reason ? `<div style="font-size:11px;color:#ef4444;font-weight:600;margin-top:4px;font-style:italic;">Alasan: &ldquo;${printRefund.rejection_reason}&rdquo;</div>` : ""}
              </div>
            </div>
          </div>

          <div style="margin-bottom:32px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#111827;">
                  <th style="padding:14px 20px;text-align:left;color:#fff;font-weight:800;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;border-radius:8px 0 0 8px;">Produk</th>
                  <th style="padding:14px 20px;text-align:center;color:#fff;font-weight:800;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">Qty</th>
                  <th style="padding:14px 20px;text-align:right;color:#fff;font-weight:800;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;border-radius:0 8px 8px 0;">Total Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:16px 20px;">
                    <div style="font-weight:700;color:#111827;font-size:14px;">${printRefund.product?.name || "Produk"}</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:2px;font-weight:600;">Kategori: ${printRefund.product?.species || "-"}</div>
                  </td>
                  <td style="padding:16px 20px;text-align:center;font-weight:700;color:#374151;">${printRefund.quantity || 1}</td>
                  <td style="padding:16px 20px;text-align:right;font-weight:800;color:#111827;">${priceStr(printRefund.price * (printRefund.quantity || 1))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-bottom:32px;display:flex;justify-content:flex-end;">
            <div style="width:340px;background:#f9fafb;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Subtotal Produk</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(printRefund.price * (printRefund.quantity || 1))}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Ongkos Kirim</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(printRefund.shipping_cost || 0)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Biaya Packing</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(printRefund.packing_cost || 0)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Biaya Admin</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(printRefund.admin_fee || 5000)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:16px 20px;background:#ecfdf5;border-top:2px solid #6ee7b7;">
                <span style="font-size:13px;color:#065f46;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Total Dikembalikan</span>
                <span style="font-size:15px;font-weight:900;color:#059669;font-family:monospace;">${priceStr(printRefund.total_price)}</span>
              </div>
            </div>
          </div>
          ${
            printRefund.refund_notes
              ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:800;color:#059669;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Catatan Admin</div>
            <div style="font-size:13px;color:#374151;font-weight:600;font-style:italic;">&ldquo;${printRefund.refund_notes}&rdquo;</div>
          </div>`
              : ""
          }
          <div style="border-top:2px dashed #e5e7eb;padding-top:24px;display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;">
            <div>
              <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">Diterbitkan oleh</div>
              <div style="font-size:16px;font-weight:900;color:#059669;">SatwaiD Platform</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">Dokumen Verifikasi</div>
              <div style="font-size:11px;color:#9ca3af;font-weight:700;font-family:monospace;">${printRefund.order_id}</div>
              <div style="font-size:10px;color:#9ca3af;font-weight:600;margin-top:2px;">Dicetak: ${new Date().toLocaleString("id-ID")}</div>
            </div>
          </div>
        </div>
      `;

      wrapper.appendChild(invoice);
      document.body.appendChild(wrapper);

      await waitForImages(invoice);

      const canvas = await html2canvas(invoice, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: INVOICE_WIDTH,
        height: invoice.scrollHeight,
        windowWidth: INVOICE_WIDTH,
        windowHeight: invoice.scrollHeight,
      });

      document.body.removeChild(wrapper);

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `Invoice_Refund_${printRefund?.order_id?.replace(/\//g, "-") || "preview"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar:", err);
      alert("Terjadi kesalahan saat mengunduh gambar invoice. Silakan coba lagi.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Memuat Detail Refund...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 bg-radial">
        <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 rounded-full mx-auto shadow-inner">
            <AlertCircle size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Detail Tidak Ditemukan</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">{error || "Data refund gagal dimuat atau tidak valid."}</p>
          </div>
          <Link href="/admin/pengembalian-dana" className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 border border-zinc-700">
            <ArrowLeft size={14} /> Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  const bank = getRefundBankDetails(order);
  const isPending = order.refund_status === "pending" || !order.refund_status;
  const isRefunded = order.refund_status === "refunded";
  const isRejected = order.refund_status === "rejected";

  return (
    <div className="p-6 lg:p-10 space-y-8 min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/pengembalian-dana" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Refund
        </Link>
        <button onClick={fetchOrderDetail} className="p-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 md:p-10 space-y-10">
        {/* Invoice Header details */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-zinc-800">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Rincian Pengembalian Dana</p>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-3">Invoice #{order.order_id}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} /> Batal: {formatDate(order.cancelled_at || order.updated_at)}
              </span>
              <span>•</span>
              {isRefunded && (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Refund Selesai: {formatDate(order.refunded_at || order.updated_at)}
                </span>
              )}
              {isPending && <span className="text-amber-500">Menunggu Verifikasi & Transfer</span>}
              {isRejected && <span className="text-red-500">Permintaan Refund Ditolak</span>}
            </div>
            {order.rejection_reason && (
              <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-[10px] space-y-2">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Alasan Pembatalan (Oleh Seller/User)</p>
                <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">&ldquo;{order.rejection_reason}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isPending && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRefundProofFile(null);
                    setRefundProofPreview("");
                    setRefundNotes("");
                    setShowProcessModal(true);
                  }}
                  className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 shadow-emerald-500/10"
                >
                  Proses Transfer
                </button>
                <button
                  onClick={() => {
                    setRefundNotes("");
                    setShowRejectModal(true);
                  }}
                  className="px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95"
                >
                  Tolak
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Buyer Card */}
          <div className="bg-zinc-950/40 p-6 rounded-[2rem] border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-emerald-500" /> Penerima Refund (Pembeli)
            </h3>
            <div className="space-y-2">
              <p className="text-base font-black text-white">{order.user?.name || "-"}</p>
              <p className="text-xs font-bold text-zinc-400">@{order.user?.username || "user"}</p>
              <p className="text-xs text-zinc-500 font-mono">{order.user?.email || "-"}</p>
              {order.user?.phone && (
                <p className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                  <Phone size={12} /> {order.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Seller / Shop Card */}
          <div className="bg-zinc-950/40 p-6 rounded-[2rem] border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Store size={14} className="text-purple-400" /> Informasi Toko & Seller
            </h3>
            <div className="space-y-2">
              <p className="text-base font-black text-white">{order.shop?.name || "-"}</p>
              <p className="text-xs font-bold text-zinc-400">Owner: {order.shop?.owner?.name || order.shop?.user?.name || "-"}</p>
              <p className="text-xs text-zinc-500 font-mono">{order.shop?.owner?.email || "-"}</p>
              {order.shop?.whatsapp && (
                <p className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                  <MessageCircle size={12} /> +62 {order.shop.whatsapp}
                </p>
              )}
            </div>
          </div>

          {/* Refund Bank Details Card */}
          <div className="bg-zinc-950/40 p-6 rounded-[2rem] border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} className="text-blue-400" /> Rekening Tujuan Refund
            </h3>
            {bank ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Bank</span>
                  <span className="text-xs font-black text-white">{bank.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No. Rekening</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-emerald-400 font-mono tracking-wider">{bank.accountNumber}</span>
                    <button onClick={() => handleCopy(bank.accountNumber, "bank-no")} className="text-zinc-600 hover:text-white transition-colors">
                      {copySuccess === "bank-no" ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider shrink-0">Atas Nama</span>
                  <span className="text-xs font-black text-white uppercase text-right leading-tight max-w-[150px] truncate">{bank.accountName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-3 bg-amber-500/5 border border-dashed border-amber-500/20 text-amber-500 rounded-2xl text-xs font-bold leading-normal">
                <AlertCircle size={16} className="shrink-0" />
                <span>Buyer belum menambahkan rekening bank pengembalian dana.</span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details & Product Table */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
            <Package size={14} className="text-emerald-500" /> Item Transaksi & Rincian Nominal
          </h3>
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-[2rem] p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800/80">
              <div className="space-y-1.5 flex-1">
                <p className="text-lg font-black text-white">{order.product?.name || "-"}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider rounded-lg">Kategori: {order.product?.species || "-"}</span>
                  <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider rounded-lg">Jumlah: {order.quantity || 1} Item</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Harga Satuan</p>
                <p className="text-lg font-mono font-black text-white">{formatPrice(order.price)}</p>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-1 shadow-inner">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subtotal Produk</p>
                <p className="text-base font-mono font-black text-white">{formatPrice(order.price * (order.quantity || 1))}</p>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-1 shadow-inner">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ongkos Kirim</p>
                <p className={`text-base font-mono font-black ${order.shipping_cost > 0 ? "text-white" : "text-emerald-500"}`}>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Gratis Ongkir"}</p>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-1 shadow-inner">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Biaya Packing</p>
                <p className={`text-base font-mono font-black ${order.packing_cost > 0 ? "text-white" : "text-emerald-500"}`}>{order.packing_cost > 0 ? formatPrice(order.packing_cost) : "Gratis Packing"}</p>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-1 shadow-inner">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Biaya Admin</p>
                <p className="text-base font-mono font-black text-white">{formatPrice(order.admin_fee || 5000)}</p>
              </div>
            </div>

            {/* Total Section */}
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center mt-2">
              <div>
                <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest leading-none mb-1.5">Total Dana Refund</p>
                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Subtotal + Ongkir + Packing + Admin</p>
              </div>
              <p className="text-2xl font-mono font-black text-emerald-400">{formatPrice(order.total_price)}</p>
            </div>
          </div>
        </div>

        {/* Notes & Proof grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-zinc-800/50">
          {/* Cancellation Reasons / Admin Notes */}
          <div className="space-y-6">
            {order.refund_notes && (
              <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Catatan / Keterangan Admin</p>
                <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">&ldquo;{order.refund_notes}&rdquo;</p>
              </div>
            )}

            {/* Buyer Payment Proof */}
            {order.payment_proof && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bukti Transfer Asal (Pembeli)</h4>
                <div onClick={() => setZoomImage(order.payment_proof)} className="relative w-fit rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 group cursor-pointer">
                  <img src={getImageUrl(order.payment_proof)} alt="Bukti Bayar Pembeli" className="w-40 h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] text-white font-black uppercase tracking-widest">Klik Detail</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refund Proof Image */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bukti Transfer Refund (Admin)</h4>
            {order.refund_proof ? (
              <div onClick={() => setZoomImage(order.refund_proof)} className="relative w-fit rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 group cursor-pointer">
                <img src={getImageUrl(order.refund_proof)} alt="Bukti Transfer Refund" className="w-40 h-40 object-cover group-hover:scale-105 transition-transform duration-300 border-none" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Klik Detail</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-40 bg-zinc-950/40 rounded-[2rem] border border-dashed border-zinc-800 text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-650">
                  <ImageIcon size={18} />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Belum Ada Bukti Transfer</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROCESS REFUND MODAL */}
      {showProcessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isSubmitting && setShowProcessModal(false)}></div>
          <form onSubmit={handleProcessRefund} className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-inner mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Proses Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Selesaikan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{order.order_id}</span> sebesar <span className="text-emerald-400 font-bold">{formatPrice(order.total_price)}</span>.
              </p>
            </div>

            {/* Bank details preview */}
            {bank && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-bold">Tujuan Transfer</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold">Bank</span>
                  <span className="font-bold text-white">{bank.bankName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold">Nomor Rekening</span>
                  <span className="font-bold text-emerald-400 font-mono tracking-wider">{bank.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold">Atas Nama</span>
                  <span className="font-bold text-white uppercase">{bank.accountName}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Gambar Bukti Transfer Refund <span className="text-red-500">*</span>
                </label>

                {!refundProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group p-6">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                        <ImageIcon size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-300 group-hover:text-white transition-colors">Pilih / Unggah Gambar Bukti Transfer Refund</p>
                        <p className="text-[10px] font-bold text-zinc-500">Format: PNG, JPG, JPEG (Maks. 1MB)</p>
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} required className="hidden" />
                  </label>
                ) : (
                  <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                    <img src={refundProofPreview} alt="Preview Gambar Bukti Transfer" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => setZoomImage(refundProofPreview)} className="p-3 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
                        <Eye size={14} /> Lihat
                      </button>
                      <button type="button" onClick={handleRemoveFile} className="p-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
                        <XCircle size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Catatan Admin (Opsional)</label>
                <textarea
                  rows={3}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Masukkan keterangan tambahan jika diperlukan..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button type="button" onClick={() => setShowProcessModal(false)} disabled={isSubmitting} className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all animate-none active:scale-[0.98]">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !refundProofFile}
                className="py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Proses Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT REFUND MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isSubmitting && setShowRejectModal(false)}></div>
          <form onSubmit={handleRejectRefund} className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner mb-2">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Tolak Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Tolak pengajuan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{order.order_id}</span>. Status refund akan berubah menjadi ditolak.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Masukkan alasan lengkap penolakan pengembalian dana..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-red-500 transition-all resize-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button type="button" onClick={() => setShowRejectModal(false)} disabled={isSubmitting} className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98]">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !refundNotes.trim()}
                className="py-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Tolak Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      {zoomImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setZoomImage(null)}></div>
          <div className="max-w-4xl max-h-[85vh] relative z-10 overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 shadow-3xl animate-in zoom-in duration-300">
            <img src={getImageUrl(zoomImage)} alt="Zoomed Proof" className="max-w-full max-h-[80vh] object-contain rounded-[2rem]" />
            <div className="absolute top-4 right-4">
              <button onClick={() => setZoomImage(null)} className="w-10 h-10 bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-all">
                <XCircle size={20} />
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <a href={getImageUrl(zoomImage)} target="_blank" rel="noreferrer" className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/30">
                <ExternalLink size={14} /> Buka Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
