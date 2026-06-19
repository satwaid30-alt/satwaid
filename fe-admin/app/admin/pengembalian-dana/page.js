"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet, Search, Filter, Eye, CheckCircle2, XCircle, Clock, ExternalLink, Image as ImageIcon, AlertCircle, User, Store, ArrowRight, RefreshCw, Copy, Receipt, Printer, X, Download } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

export default function AdminRefundPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copySuccess, setCopySuccess] = useState(null);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [printRefund, setPrintRefund] = useState(null);

  // Form State
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [refundProofPreview, setRefundProofPreview] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Block dangerous extensions
    const blockedExtensions = [".php", ".exe", ".svg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));
    if (blockedExtensions.includes(fileExtension)) {
      alert("File dengan format tersebut diblokir demi keamanan. Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).");
      e.target.value = "";
      return;
    }

    // Validate allowed image MIME types
    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      alert("Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).");
      e.target.value = "";
      return;
    }

    // Size check
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran gambar terlalu besar. Maksimal adalah 1MB.");
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRefunds = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/refunds`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setRefunds(result.data);
      } else {
        setError(result.message || "Gagal memuat data dari server");
      }
    } catch (err) {
      console.error("Error fetching refunds:", err);
      setError(err.message || "Terjadi kesalahan koneksi jaringan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchRefunds();
    }, 0);

    // Setup Socket.io for Real-time Updates
    let socket;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      socket = io(getApiUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });

      socket.on("connect", () => {
        console.log("[Socket] Admin Refunds Connected");
        socket.emit("join_admin");
      });

      socket.on("admin_notification", (data) => {
        console.log("[Socket] Received admin notification:", data);
        fetchRefunds(true);
      });

      socket.on("order_updated_admin", (data) => {
        console.log("[Socket] Received order updated admin event:", data);
        fetchRefunds(true);
      });
    } catch (e) {
      console.error("Socket connection error:", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRefunds(true);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(id);
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
      month: "short",
      year: "numeric",
    });
  };

  const loadHtml2Canvas = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("DOM is only available in browser"));
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => resolve(window.html2canvas);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const waitForImages = async (node) => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          // Safety timeout 3s
          setTimeout(resolve, 3000);
        });
      }),
    );
    // Two animation frames so browser finishes paint
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
  };

  const handleDownloadInvoiceImage = async () => {
    if (!printRefund) return;

    try {
      const html2canvas = await loadHtml2Canvas();

      // --- Build a self-contained off-screen invoice element ---
      const INVOICE_WIDTH = 794;

      // Determine status badge colours
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

      // Build inner HTML matching the on-screen invoice exactly
      const logoBase = window.location.origin;
      const refundProofSrc = printRefund.refund_proof ? (printRefund.refund_proof.startsWith("data:") ? printRefund.refund_proof : `${logoBase}${printRefund.refund_proof}`) : null;

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
        <!-- Watermark -->
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;opacity:0.055;">
          <img src="${logoBase}/images/Logo-Bg-2-2.png" crossorigin="anonymous" style="width:400px;height:100px;object-fit:contain;transform:rotate(-20deg);margin-top:40%;" />
        </div>

        <!-- Header Strip -->
        <div style="background:#1e3a8a;margin:-40px -48px 40px -48px;padding:36px 48px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
          <img src="${logoBase}/images/Logo-Bg-1-2.png" crossorigin="anonymous" style="height:72px;object-fit:contain;display:block;" />
          <div style="text-align:right;">
            <div style="font-size:13px;color:rgba(255,255,255,0.65);font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Invoice Pengembalian Dana</div>
            <div style="font-size:22px;font-weight:900;color:#fff;font-family:monospace;margin-top:4px;">${printRefund.order_id}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:6px;">Diterbitkan: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        <!-- Body -->
        <div style="position:relative;z-index:1;">

          <!-- Status Badge -->
          <div style="margin-bottom:32px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:100px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:1px solid ${badgeBorder};">
              <span style="width:8px;height:8px;border-radius:50%;background:${badgeColor};display:inline-block;flex-shrink:0;"></span>
              <span style="line-height:1; vertical-align:text-top;margin-top:-12px;">${badgeText}</span>
            </div>
            <span style="font-size:11px;color:#6b7280;font-weight:600;line-height:1;vertical-align:text-top;margin-top:-12px;">• Tanggal Transfer: ${dateStr(printRefund.updated_at)}</span>
          </div>

          <!-- 2-col Info Grid -->
          <div style="display:flex;gap:24px;margin-bottom:36px;">
            <!-- Buyer -->
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

            <!-- Shop -->
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

          <!-- Product Table -->
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

          <!-- Cost Breakdown -->
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
          <!-- Notes -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:800;color:#059669;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Catatan Admin</div>
            <div style="font-size:13px;color:#374151;font-weight:600;font-style:italic;">&ldquo;${printRefund.refund_notes}&rdquo;</div>
          </div>`
              : ""
          }

          <!-- Footer -->
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

      // Wait for all images inside the off-screen invoice
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

  const getRefundBankDetails = (order) => {
    if (order.bank_account) {
      return {
        bankName: order.bank_name || "N/A",
        accountNumber: order.bank_account,
        accountName: order.bank_holder || "N/A",
      };
    }

    if (order.user?.bank_accounts) {
      const bankAccounts = order.user.bank_accounts;
      let bankObj = null;
      if (Array.isArray(bankAccounts)) {
        if (bankAccounts.length > 0) {
          bankObj = bankAccounts[0];
        }
      } else if (typeof bankAccounts === "object") {
        bankObj = bankAccounts;
      } else {
        try {
          const parsed = JSON.parse(bankAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            bankObj = parsed[0];
          } else if (typeof parsed === "object") {
            bankObj = parsed;
          }
        } catch (e) {}
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

  const handleOpenProcessModal = (refund) => {
    setSelectedRefund(refund);
    setRefundProofFile(null);
    setRefundProofPreview("");
    setRefundNotes("");
    setShowProcessModal(true);
  };

  const handleOpenRejectModal = (refund) => {
    setSelectedRefund(refund);
    setRefundNotes("");
    setShowRejectModal(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!refundProofFile) {
      alert("Bukti transfer (Gambar) wajib diunggah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");

      // Verify file size limit again
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
      if (refundProofFile.size > MAX_FILE_SIZE) {
        alert("Ukuran gambar bukti transfer terlalu besar. Maksimal adalah 1MB.");
        setIsSubmitting(false);
        return;
      }

      // Rename file randomly prior to upload to prevent overrides
      const fileName = refundProofFile.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));
      const randomString = Math.random().toString(36).substring(2, 15);
      const randomFilename = `${Date.now()}_refund_${randomString}${fileExtension}`;
      const renamedFile = new File([refundProofFile], randomFilename, { type: refundProofFile.type });

      // Upload to S3 (folder 'payments')
      const { objectKey } = await uploadImageToS3(renamedFile, token, "payments");
      const fileUrl = "/" + objectKey;

      const res = await fetch(`${getApiUrl()}/orders/${selectedRefund.id}/refund`, {
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
        fetchRefunds();
      } else {
        alert(result.message || "Gagal memproses refund");
      }
    } catch (err) {
      console.error("Error processing refund:", err);
      alert(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!refundNotes.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/${selectedRefund.id}/reject-refund`, {
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
        fetchRefunds();
      } else {
        alert(result.message || "Gagal menolak refund");
      }
    } catch (err) {
      console.error("Error rejecting refund:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredRefunds = refunds.filter((refund) => {
    const matchesStatus = filterStatus === "all" ? true : refund.refund_status === filterStatus;

    const matchesSearch = refund.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) || refund.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || refund.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || refund.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Stats Counters
  const counts = {
    all: refunds.length,
    pending: refunds.filter((r) => r.refund_status === "pending" || !r.refund_status).length,
    refunded: refunds.filter((r) => r.refund_status === "refunded").length,
    rejected: refunds.filter((r) => r.refund_status === "rejected").length,
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRefunds.slice(indexOfFirstItem, indexOfLastItem);

  const [prevFilterStatus, setPrevFilterStatus] = useState(filterStatus);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  if (filterStatus !== prevFilterStatus || searchQuery !== prevSearchQuery) {
    setPrevFilterStatus(filterStatus);
    setPrevSearchQuery(searchQuery);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Data Pengembalian Dana...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <Wallet className="text-emerald-500" size={28} /> Kelola Pengembalian Dana
          </h1>
          <p className="text-xs text-zinc-500 font-medium italic uppercase tracking-widest">Tinjau pembatalan transaksi berbayar dan kelola transfer refund ke rekening pembeli</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Perbarui
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-start gap-4 animate-in fade-in duration-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Gagal Memuat Data Refund</h4>
            <p className="text-xs text-zinc-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Semua Permintaan", count: counts.all, colorClass: "text-white" },
          { label: "Menunggu Transfer", count: counts.pending, colorClass: "text-amber-500" },
          { label: "Transfer Berhasil", count: counts.refunded, colorClass: "text-emerald-500" },
          { label: "Refund Ditolak", count: counts.rejected, colorClass: "text-red-500" },
        ].map((card) => (
          <div key={card.label} className="p-5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col gap-2 transition-all shadow-lg">
            <p className={`text-3xl font-black ${card.colorClass}`}>{card.count}</p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Nama Pembeli, Produk, atau Toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
          />
        </div>
        <div className="md:col-span-4 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-black uppercase tracking-widest appearance-none cursor-pointer">
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Transfer ({counts.pending})</option>
            <option value="refunded">Transfer Berhasil ({counts.refunded})</option>
            <option value="rejected">Refund Ditolak ({counts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Pesanan & Batal</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk & Toko</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pembeli</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rekening Refund</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tanggal Refund</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Nominal</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Bukti Bayar</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {currentItems.length > 0 ? (
                currentItems.map((refund, index) => {
                  const bank = getRefundBankDetails(refund);
                  const isPending = refund.refund_status === "pending" || !refund.refund_status;
                  const isRefunded = refund.refund_status === "refunded";
                  const isRejected = refund.refund_status === "rejected";

                  return (
                    <tr key={refund.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-zinc-600">{indexOfFirstItem + index + 1}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-white tracking-wider font-mono">{refund.order_id}</p>
                            <button onClick={() => handleCopy(refund.order_id, `inv-${refund.id}`)} className="text-zinc-600 hover:text-white transition-colors">
                              {copySuccess === `inv-${refund.id}` ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500">Batal: {formatDate(refund.cancelled_at || refund.updated_at)}</p>
                          {refund.rejection_reason && (
                            <div className="pt-1.5 border-t border-zinc-800/50 mt-1 max-w-[200px]">
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Alasan Batal</p>
                              <p className="text-[9px] text-zinc-500 italic leading-snug line-clamp-2">{refund.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1 max-w-[200px]">
                          <p className="text-xs font-black text-white truncate">{refund.product?.name || "-"}</p>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Store size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold uppercase truncate">{refund.shop?.name || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-emerald-500" />
                            <span className="text-xs font-black text-white">@{refund.user?.username || "user"}</span>
                          </div>
                          {refund.user?.phone && <p className="text-[9px] font-bold text-zinc-500 font-mono pl-4">{refund.user.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {bank ? (
                          <div className="space-y-1 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850 max-w-[240px]">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-white tracking-tight">{bank.bankName}</p>
                              <button onClick={() => handleCopy(bank.accountNumber, `bank-${refund.id}`)} className="text-zinc-600 hover:text-white transition-colors">
                                {copySuccess === `bank-${refund.id}` ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                            <p className="text-xs font-black text-emerald-400 font-mono tracking-wider">{bank.accountNumber}</p>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter truncate">a.n. {bank.accountName}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-500">
                            <AlertCircle size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Rekening Belum Diatur</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        {isRefunded && (refund.refunded_at || refund.updated_at) ? (
                          <div className="space-y-1">
                            <span className="text-xs font-black text-white">{formatDate(refund.refunded_at || refund.updated_at)}</span>
                            <p className="text-[9px] font-bold text-zinc-500">Pukul {new Date(refund.refunded_at || refund.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-sm font-black text-white">{formatPrice(refund.total_price)}</span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {refund.payment_proof ? (
                          <button onClick={() => setZoomImage(refund.payment_proof)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                            <Eye size={10} /> Preview
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-650 uppercase tracking-wider">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <Clock size={8} /> Pending
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={8} /> Refunded
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <XCircle size={8} /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {isPending ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => handleOpenProcessModal(refund)} className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/10">
                                Proses
                              </button>
                              <button type="button" onClick={() => handleOpenRejectModal(refund)} className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-[9px] uppercase tracking-widest transition-all active:scale-95">
                                Tolak
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 justify-center">
                              <Link href={`/admin/pengembalian-dana/detail/${refund.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">
                                <Eye size={10} /> Detail
                              </Link>
                              <button type="button" onClick={() => setPrintRefund(refund)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">
                                <Receipt size={10} /> Invoice
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-w-[150px] mx-auto flex flex-col items-center">
                            {refund.refund_notes && <p className="text-[9px] text-zinc-500 italic leading-snug line-clamp-2 text-center">&ldquo;{refund.refund_notes}&rdquo;</p>}
                            {refund.refund_proof && (
                              <button onClick={() => setZoomImage(refund.refund_proof)} className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-400 hover:underline uppercase tracking-widest">
                                Bukti Transfer <ExternalLink size={8} />
                              </button>
                            )}
                            <div className="flex items-center gap-1.5 justify-center mt-1">
                              <Link href={`/admin/pengembalian-dana/detail/${refund.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">
                                <Eye size={10} /> Detail
                              </Link>
                              <button
                                onClick={() => setPrintRefund(refund)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                  isRefunded ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/10" : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
                                }`}
                              >
                                <Receipt size={10} /> Invoice
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-650 mx-auto">
                        <Wallet size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Tidak Ada Data Refund</p>
                        <p className="text-xs text-zinc-500 font-medium">Seluruh pengajuan pengembalian dana telah selesai diproses.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROCESS REFUND MODAL */}
      {showProcessModal && selectedRefund && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isSubmitting && setShowProcessModal(false)}></div>
          <form onSubmit={handleProcessRefund} className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-inner mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Proses Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Selesaikan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{selectedRefund.order_id}</span> sebesar <span className="text-emerald-400 font-bold">{formatPrice(selectedRefund.total_price)}</span>.
              </p>
            </div>

            {/* Rekening Info Box */}
            {getRefundBankDetails(selectedRefund) && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tujuan Rekening Buyer</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Bank</span>
                  <span className="font-bold text-white">{getRefundBankDetails(selectedRefund).bankName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Nomor Rekening</span>
                  <span className="font-bold text-emerald-400 font-mono tracking-wider">{getRefundBankDetails(selectedRefund).accountNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Atas Nama</span>
                  <span className="font-bold text-white uppercase">{getRefundBankDetails(selectedRefund).accountName}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Gambar Invoice Refund <span className="text-red-500">*</span>
                </label>

                {!refundProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group p-6">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                        <ImageIcon size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-300 group-hover:text-white transition-colors">Pilih / Unggah Gambar Invoice Refund</p>
                        <p className="text-[10px] font-bold text-zinc-500">Format: PNG, JPG, JPEG (Maks. 1MB)</p>
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} required className="hidden" />
                  </label>
                ) : (
                  <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                    <img src={refundProofPreview} alt="Preview Gambar Invoice" className="w-full h-full object-cover" />
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintRefund({
                      ...selectedRefund,
                      refund_proof: refundProofPreview || selectedRefund.refund_proof,
                      refund_notes: refundNotes,
                      refund_status: "refunded",
                      updated_at: new Date().toISOString(),
                    });
                  }}
                  className="w-full py-3.5 bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-700 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Eye size={14} /> Pratinjau & Unduh Gambar Invoice Refund
                </button>
                <p className="text-[9px] text-zinc-500 text-center mt-1.5 font-bold uppercase tracking-wider">* Klik tombol di atas, lalu klik &quot;Unduh Gambar (PNG)&quot; di layar pratinjau untuk menyimpan gambar invoice, lalu unggah gambarnya pada kolom di atas.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button type="button" onClick={() => setShowProcessModal(false)} disabled={isSubmitting} className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all">
                Batal
              </button>
              <button type="submit" disabled={isSubmitting || !refundProofFile} className="py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
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
      {showRejectModal && selectedRefund && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isSubmitting && setShowRejectModal(false)}></div>
          <form onSubmit={handleRejectRefund} className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner mb-2">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Tolak Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Tolak pengajuan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{selectedRefund.order_id}</span>. Status refund akan berubah menjadi ditolak.
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
              <button type="button" onClick={() => setShowRejectModal(false)} disabled={isSubmitting} className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all">
                Batal
              </button>
              <button type="submit" disabled={isSubmitting || !refundNotes.trim()} className="py-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
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

      {/* ZOOM IMAGE MODAL (BUYER PAYMENT PROOF) */}
      {zoomImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setZoomImage(null)}></div>
          <div className="max-w-4xl max-h-[85vh] relative z-10 overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 shadow-3xl animate-in zoom-in duration-300">
            <img src={getImageUrl(zoomImage)} alt="Zoomed Payment Proof" className="max-w-full max-h-[80vh] object-contain rounded-[2rem]" />
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

      {/* PRINT REFUND INVOICE MODAL */}
      {printRefund &&
        (() => {
          const bank = getRefundBankDetails(printRefund);
          const buyerName = printRefund.user?.name || printRefund.user?.username || "-";
          const shopName = printRefund.shop?.name || "-";
          const shopCity = printRefund.shop?.city || "";
          const shopProvince = printRefund.shop?.province || "";

          const status = printRefund.refund_status;
          let badgeBg = "#d1fae5";
          let badgeColor = "#065f46";
          let badgeBorder = "#6ee7b7";
          let badgeText = "Dana Telah Dikembalikan";

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

          return (
            <div id="invoice-print-wrapper" className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4 no-print-bg">
              {/* Toolbar */}
              <div className="fixed top-4 right-4 flex items-center gap-3 z-[201] no-print">
                <button onClick={handleDownloadInvoiceImage} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                  <Download size={16} /> Unduh Gambar (PNG)
                </button>
                <button onClick={() => setPrintRefund(null)} className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
                  <X size={18} />
                </button>
              </div>

              {/* Invoice Paper */}
              <div
                id="satwaid-invoice"
                style={{
                  background: "#ffffff",
                  color: "#111827",
                  width: "794px",
                  minHeight: "1123px",
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
                  padding: "40px 48px",
                }}
              >
                {/* Watermark Logo */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 0,
                    opacity: 0.055,
                  }}
                >
                  <img
                    src="/images/Logo-Bg-2-2.png"
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: "480px",
                      height: "480px",
                      objectFit: "contain",
                      transform: "rotate(-25deg)",
                    }}
                  />
                </div>

                {/* Header Strip */}
                <div
                  style={{
                    background: "#1e3a8a",
                    margin: "-40px -48px 40px -48px",
                    padding: "36px 48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div>
                    <img
                      src="/images/Logo-Bg-1-2.png"
                      alt="SatwaiD"
                      crossOrigin="anonymous"
                      style={{
                        height: "72px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>Invoice Pengembalian Dana</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", fontFamily: "monospace", marginTop: "4px" }}>{printRefund.order_id}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>Diterbitkan: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Status Badge */}
                  {/* Status Badge Container */}
                  <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        borderRadius: "100px",
                        background: badgeBg,
                        color: badgeColor,
                        fontSize: "11px",
                        fontWeight: "800",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        border: `1px solid ${badgeBorder}`,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: badgeColor,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ lineHeight: "1" }}>{badgeText}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", lineHeight: "1" }}>
                      • Tanggal Transfer: {printRefund.updated_at ? new Date(printRefund.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>

                  {/* 2-column info grid */}
                  <div style={{ display: "flex", gap: "24px", marginBottom: "36px" }}>
                    {/* Buyer (Recipient) */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#059669", borderRadius: "2px", display: "inline-block", flexShrink: 0 }}></span>
                        <span style={{ lineHeight: "1" }}>Penerima Refund (Pembeli)</span>
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{buyerName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>@{printRefund.user?.username || "user"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>{printRefund.user?.email || "-"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{printRefund.user?.phone || "-"}</div>
                      {bank && (
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                          <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Rekening Pengembalian</div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "#111827" }}>{bank.bankName}</div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", fontFamily: "monospace", letterSpacing: "0.06em" }}>{bank.accountNumber}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>a.n. {bank.accountName}</div>
                        </div>
                      )}
                    </div>

                    {/* Shop / Order Info */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#7c3aed", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#7c3aed", borderRadius: "2px", display: "inline-block", flexShrink: 0 }}></span>
                        <span style={{ lineHeight: "1" }}>Informasi Toko &amp; Pesanan</span>
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{shopName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>
                        {shopCity}
                        {shopProvince ? `, ${shopProvince}` : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>Owner: {printRefund.shop?.owner?.name || printRefund.shop?.user?.name || "-"}</div>
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                        <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Detail Pembatalan</div>
                        <div style={{ fontSize: "12px", color: "#374151", fontWeight: "600", marginBottom: "2px" }}>Tgl Pembatalan: {formatDate(printRefund.cancelled_at || printRefund.updated_at)}</div>
                        {printRefund.rejection_reason && <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600", marginTop: "4px", fontStyle: "italic" }}>Alasan: &ldquo;{printRefund.rejection_reason}&rdquo;</div>}
                      </div>
                    </div>
                  </div>

                  {/* Product Table */}
                  <div style={{ marginBottom: "32px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#111827" }}>
                          <th style={{ padding: "14px 20px", textAlign: "left", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "8px 0 0 8px" }}>Produk</th>
                          <th style={{ padding: "14px 20px", textAlign: "center", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Qty</th>
                          <th style={{ padding: "14px 20px", textAlign: "right", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "0 8px 8px 0" }}>Total Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{printRefund.product?.name || "Produk"}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", fontWeight: "600" }}>Kategori: {printRefund.product?.species || "-"}</div>
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "700", color: "#374151" }}>{printRefund.quantity || 1}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "800", color: "#111827" }}>{formatPrice(printRefund.price * (printRefund.quantity || 1))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Cost Breakdown */}
                  <div style={{ marginBottom: "32px", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: "340px", background: "#f9fafb", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb", height: "fit-content" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Subtotal Produk</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{formatPrice(printRefund.price * (printRefund.quantity || 1))}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Ongkos Kirim</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{formatPrice(printRefund.shipping_cost || 0)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Biaya Packing</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{formatPrice(printRefund.packing_cost || 0)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Biaya Admin</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{formatPrice(printRefund.admin_fee || 5000)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#ecfdf5", borderTop: "2px solid #6ee7b7" }}>
                        <span style={{ fontSize: "13px", color: "#065f46", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Dikembalikan</span>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#059669", fontFamily: "monospace" }}>{formatPrice(printRefund.total_price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {printRefund.refund_notes && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Catatan Admin</div>
                      <div style={{ fontSize: "13px", color: "#374151", fontWeight: "600", fontStyle: "italic" }}>&ldquo;{printRefund.refund_notes}&rdquo;</div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ borderTop: "2px dashed #e5e7eb", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "40px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Diterbitkan oleh</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#059669" }}>SatwaiD Platform</div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "auto" }}>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Dokumen Verifikasi</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", fontFamily: "monospace" }}>{printRefund.order_id}</div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", marginTop: "2px" }}>Dicetak: {new Date().toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <style
                dangerouslySetInnerHTML={{
                  __html: `
                @media print {
                  body {
                    background: white !important;
                    color: black !important;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #satwaid-invoice, #satwaid-invoice * {
                    visibility: visible;
                  }
                  #satwaid-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
                @media screen {
                  .no-print-bg {
                    background: rgba(0,0,0,0.85) !important;
                  }
                }
              `,
                }}
              />
            </div>
          );
        })()}
    </div>
  );
}
