"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, ShoppingBag, User, Calendar, CreditCard, DollarSign, Info, Receipt, Mail, Printer, Download, X } from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

const isVideoUrl = (url) => {
  if (!url) return false;
  let finalPath = url;
  try {
    if (typeof url === "string" && (url.startsWith("[") || url.startsWith("{"))) {
      const parsed = JSON.parse(url);
      finalPath = Array.isArray(parsed) ? parsed[0] : parsed;
    } else if (Array.isArray(url)) {
      finalPath = url[0];
    }
  } catch (e) {}
  if (!finalPath || typeof finalPath !== "string") return false;
  const lower = finalPath.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".mkv") || lower.endsWith(".webm") || lower.endsWith(".3gp") || lower.endsWith(".ogg");
};

export default function UploadFinanceDocPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState("");
  const [additionalFee, setAdditionalFee] = useState(0);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Helper to get Seller/Shop Owner bank info
  const getSellerBankInfo = () => {
    const owner = order?.shop?.owner;
    let bankAccounts = owner?.bank_accounts;

    // If it is a string representation of JSON, parse it
    if (typeof bankAccounts === "string") {
      try {
        bankAccounts = JSON.parse(bankAccounts);
      } catch (e) {
        bankAccounts = null;
      }
    }

    if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
      const primaryBank = bankAccounts[0];
      return {
        bankName: primaryBank.bank_name || primaryBank.bankName || "-",
        bankAccount: primaryBank.account_number || primaryBank.accountNumber || primaryBank.bank_account || "-",
        bankHolder: primaryBank.account_name || primaryBank.accountName || primaryBank.bank_holder || owner.name || "-",
      };
    }

    // Fallbacks
    return {
      bankName: order?.shop?.bank_name || "-",
      bankAccount: order?.shop?.bank_account || "-",
      bankHolder: order?.shop?.bank_holder || owner?.name || "-",
    };
  };

  const sellerBank = getSellerBankInfo();

  // Calculate total disbursement
  const totalDisbursement = Number(order?.price || 0) * Number(order?.quantity || 1) + Number(order?.shipping_cost || 0) + Number(order?.packing_cost || 0);

  useEffect(() => {
    if (order) {
      setAdditionalFee(order.additional_fee || 0);
      setNotes(order.disbursement_notes || "");
    }
  }, [order]);

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const fetchOrderDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, { headers });
      const result = await res.json();
      if (res.ok && result.data) {
        setOrder(result.data);
      } else {
        alert("Gagal memuat detail transaksi");
        router.push("/admin/keuangan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
      if (file.size > MAX_FILE_SIZE) {
        setActionModal({
          isOpen: true,
          type: "warning",
          title: "Ukuran File Terlalu Besar",
          message: "Ukuran file bukti transfer tidak boleh melebihi 1MB. Silakan pilih file yang lebih kecil.",
          onConfirm: () => setActionModal((prev) => ({ ...prev, isOpen: false })),
        });
        e.target.value = ""; // Reset input file
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Silakan pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem("admin_token");

      // 1. Upload the file first to S3
      const s3Token = typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("admin_token") : null;
      const { objectKey } = await uploadImageToS3(selectedFile, s3Token, "disbursements");
      const fileUrl = "/" + objectKey;

      // 2. Call the disburse API
      const disburseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/disburse`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          disbursement_proof: fileUrl,
          disbursement_notes: notes,
          additional_fee: additionalFee,
        }),
      });

      if (disburseRes.ok) {
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Dana Dicairkan",
          message: `Bukti transfer untuk invoice ${order.order_id} berhasil diunggah. Seller akan mendapatkan notifikasi.`,
          onConfirm: () => router.push(`/admin/keuangan/detail-pembayaran/${order.shop_id}`),
        });
      } else {
        const errData = await disburseRes.json();
        throw new Error(errData.message || "Gagal menyimpan data pencairan");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setIsUploading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
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
    if (!invoiceOrder) return;

    try {
      const html2canvas = await loadHtml2Canvas();

      // --- Build a self-contained off-screen invoice element ---
      const INVOICE_WIDTH = 794;

      const inv = invoiceOrder;
      const subtotal = Number(inv.price || 0) * Number(inv.quantity || 1);
      const shipping = Number(inv.shipping_cost || 0);
      const packing = Number(inv.packing_cost || 0);
      const adminFee = Number(inv.admin_fee || 0);
      const addFee = Number(inv.additional_fee || 0);
      const total = subtotal + shipping + packing + adminFee;
      const disbursed = subtotal + shipping + packing - addFee;
      const shop = inv.shop;
      const bankAccounts = shop?.owner?.bank_accounts || [];

      let parsedBankAccounts = bankAccounts;
      if (typeof bankAccounts === "string") {
        try {
          parsedBankAccounts = JSON.parse(bankAccounts);
        } catch (e) {
          parsedBankAccounts = [];
        }
      }
      const bank = Array.isArray(parsedBankAccounts) && parsedBankAccounts.length > 0 ? parsedBankAccounts[0] : null;

      const dateStr = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
      const priceStr = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseFloat(v) || 0);

      const logoBase = window.location.origin;

      const badgeBg = "#d1fae5";
      const badgeColor = "#065f46";
      const badgeBorder = "#6ee7b7";
      const badgeText = "Dana Telah Dicairkan";
      const transferDateStr = inv.disbursed_at ? dateStr(inv.disbursed_at) : dateStr(new Date());

      const sellerName = shop?.name || "-";
      const sellerOwnerName = shop?.owner?.name || shop?.user?.name || "-";
      const sellerEmail = shop?.owner?.email || "-";
      const sellerPhone = shop?.whatsapp ? `+62 ${shop.whatsapp}` : "-";

      const bankDetails = bank
        ? {
            bankName: bank.bank_name || bank.bankName || "-",
            accountNumber: bank.account_number || bank.accountNumber || "-",
            accountName: bank.account_name || bank.accountName || shop?.owner?.name || "-",
          }
        : null;

      const buyerName = inv.user?.name || inv.user?.username || "-";
      const buyerUsername = inv.user?.username || "user";
      const buyerEmail = inv.user?.email || "-";
      const buyerPhone = inv.user?.phone || "-";
      const orderDate = dateStr(inv.created_at);
      const requestDate = inv.disbursement_requested_at ? dateStr(inv.disbursement_requested_at) : "-";

      const productName = inv.product?.name || "Produk";
      const productId = inv.product?.product_id || "-";
      const productSpecies = inv.product?.species || "-";
      const qty = inv.quantity || 1;
      const unitPrice = inv.price || 0;

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
            <div style="font-size:13px;color:rgba(255,255,255,0.65);font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Invoice Pencairan Dana</div>
            <div style="font-size:22px;font-weight:900;color:#fff;font-family:monospace;margin-top:4px;">${inv.order_id}</div>
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
            <span style="font-size:11px;color:#6b7280;font-weight:600;line-height:1;vertical-align:text-top;margin-top:-12px;">• Tanggal Transfer: ${transferDateStr}</span>
          </div>

          <!-- 2-col Info Grid -->
          <div style="display:flex;gap:24px;margin-bottom:36px;">
            <!-- Seller -->
            <div style="flex:1;background:#f9fafb;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
              <div style="font-size:10px;font-weight:800;color:#059669;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                <span style="width:3px;height:14px;background:#059669;border-radius:2px;display:inline-block;flex-shrink:0;"></span><span style="line-height:1;vertical-align:text-top;margin-top:-12px;">Penerima Pencairan (Penjual)</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:#111827;margin-bottom:4px;">${sellerName}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">Owner: ${sellerOwnerName}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">${sellerEmail}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;">${sellerPhone}</div>
              ${
                bankDetails
                  ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;">
                <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Rekening Penerima</div>
                <div style="font-size:13px;font-weight:800;color:#111827;">${bankDetails.bankName}</div>
                <div style="font-size:13px;font-weight:700;color:#374151;font-family:monospace;letter-spacing:0.06em;">${bankDetails.accountNumber}</div>
                <div style="font-size:11px;color:#6b7280;font-weight:600;">a.n. ${bankDetails.accountName}</div>
              </div>`
                  : ""
              }
            </div>

            <!-- Buyer -->
            <div style="flex:1;background:#f9fafb;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
              <div style="font-size:10px;font-weight:800;color:#7c3aed;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                <span style="width:3px;height:14px;background:#7c3aed;border-radius:2px;display:inline-block;flex-shrink:0;"></span><span style="line-height:1;vertical-align:text-top;margin-top:-12px;">Informasi Pembeli &amp; Pesanan</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:#111827;margin-bottom:4px;">${buyerName}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">@${buyerUsername}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px;">${buyerEmail}</div>
              <div style="font-size:12px;color:#6b7280;font-weight:600;">${buyerPhone}</div>
              <div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;">
                <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Detail Pesanan</div>
                <div style="font-size:12px;color:#374151;font-weight:600;margin-bottom:2px;">Tgl Order: ${orderDate}</div>
                <div style="font-size:12px;color:#374151;font-weight:600;margin-bottom:2px;">Tgl Pengajuan: ${requestDate}</div>
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
                  <th style="padding:14px 20px;text-align:right;color:#fff;font-weight:800;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">Harga Satuan</th>
                  <th style="padding:14px 20px;text-align:right;color:#fff;font-weight:800;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;border-radius:0 8px 8px 0;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:16px 20px;">
                    <div style="font-weight:700;color:#111827;font-size:14px;">${productName}</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:2px;font-weight:600;">ID: ${productId} • Kategori: ${productSpecies}</div>
                  </td>
                  <td style="padding:16px 20px;text-align:center;font-weight:700;color:#374151;">${qty}</td>
                  <td style="padding:16px 20px;text-align:right;font-weight:700;color:#374151;">${priceStr(unitPrice)}</td>
                  <td style="padding:16px 20px;text-align:right;font-weight:800;color:#111827;">${priceStr(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cost Breakdown -->
          <div style="margin-bottom:32px;display:flex;justify-content:flex-end;">
            <div style="width:340px;background:#f9fafb;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Subtotal Produk</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(subtotal)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Ongkos Kirim</span>
                <span style="font-size:12px;font-weight:700;color:${inv.product?.is_free_shipping ? "#059669" : "#374151"};">${inv.product?.is_free_shipping ? "GRATIS" : priceStr(shipping)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Biaya Packing</span>
                <span style="font-size:12px;font-weight:700;color:${inv.product?.is_free_packing ? "#059669" : "#374151"};">${inv.product?.is_free_packing ? "GRATIS" : priceStr(packing)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#6b7280;font-weight:600;">Biaya Admin</span>
                <span style="font-size:12px;font-weight:700;color:#374151;">${priceStr(adminFee)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:16px 20px;background:#111827;">
                <span style="font-size:13px;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Total Tagihan Pembeli</span>
                <span style="font-size:15px;font-weight:900;color:#34d399;font-family:monospace;">${priceStr(total)}</span>
              </div>
              ${
                addFee > 0
                  ? `
                  <div style="display:flex;justify-content:space-between;padding:12px 20px;border-top:1px solid #e5e7eb;background:#fff7ed;">
                    <span style="font-size:12px;color:#92400e;font-weight:700;">Potongan Biaya Transfer</span>
                    <span style="font-size:12px;font-weight:800;color:#dc2626;">-${priceStr(addFee)}</span>
                  </div>
                  `
                  : ""
              }
              <div style="display:flex;justify-content:space-between;padding:16px 20px;background:#ecfdf5;border-top:2px solid #6ee7b7;">
                <span style="font-size:13px;color:#065f46;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Dana Diterima Penjual</span>
                <span style="font-size:15px;font-weight:900;color:#059669;font-family:monospace;">${priceStr(disbursed)}</span>
              </div>
            </div>
          </div>

          ${
            inv.disbursement_notes
              ? `
          <!-- Notes -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:800;color:#059669;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Catatan Admin</div>
            <div style="font-size:13px;color:#374151;font-weight:600;font-style:italic;">&ldquo;${inv.disbursement_notes}&rdquo;</div>
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
              <div style="font-size:11px;color:#9ca3af;font-weight:700;font-family:monospace;">${inv.order_id}</div>
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
      link.download = `Invoice_Cair_${inv?.order_id?.replace(/\//g, "-") || "preview"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar:", err);
      alert("Terjadi kesalahan saat mengunduh gambar invoice. Silakan coba lagi.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat detail transaksi...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <Link href={`/admin/keuangan/detail-pembayaran/${order.shop_id}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
            <ChevronLeft size={20} />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Kembali ke Keuangan</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setInvoiceOrder(order)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]">
            <Download size={14} className="text-emerald-500" /> Unduh Invoice
          </button>
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] font-black text-emerald-500 font-mono tracking-wider">{order.order_id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <Upload size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{order.disbursed_at ? "Detail Pencairan" : "Upload Bukti"}</h2>
                  <p className="text-zinc-500 text-sm font-medium">{order.disbursed_at ? "Informasi penyelesaian transaksi" : "Unggah dokumen penyelesaian transaksi"}</p>
                </div>
              </div>

              {order.disbursed_at ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-zinc-950">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Status Pencairan</p>
                          <p className="text-sm font-black text-white uppercase">Selesai Ditransfer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Tanggal Cair</p>
                        <p className="text-xs font-bold text-zinc-300">{new Date(order.disbursed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bukti Transfer</label>
                    <div className="relative group rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video">
                      <img src={getImageUrl(order.disbursement_proof)} className="w-full h-full object-contain" alt="Bukti Transfer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={getImageUrl(order.disbursement_proof)} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-zinc-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                          Lihat Resolusi Penuh
                        </a>
                      </div>
                    </div>
                  </div>

                  {order.disbursement_notes && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Catatan Admin</label>
                      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-zinc-400 text-sm font-medium italic">&quot;{order.disbursement_notes}&quot;</div>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <button type="button" onClick={() => setInvoiceOrder(order)} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]">
                      <Download size={20} /> Unduh Invoice
                    </button>
                    <Link href={`/admin/keuangan/detail-pembayaran/${order.shop_id}`} className="flex-1 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 border border-zinc-700 active:scale-[0.98]">
                      <ChevronLeft size={20} /> Kembali ke Daftar
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/*,.pdf" />
                      <label htmlFor="file-upload" className="block bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-12 text-center hover:border-emerald-500/50 transition-all cursor-pointer group-hover:bg-zinc-950">
                        {previewUrl ? (
                          <div className="space-y-4">
                            {selectedFile?.type.includes("image") ? (
                              <img src={previewUrl} className="max-h-48 mx-auto rounded-2xl shadow-2xl border border-zinc-800" alt="Preview" />
                            ) : (
                              <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                                <FileText size={40} />
                              </div>
                            )}
                            <p className="text-sm font-bold text-white">{selectedFile?.name}</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setPreviewUrl(null);
                                setSelectedFile(null);
                              }}
                              className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                            >
                              Hapus File
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-zinc-700 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                              <FileText size={32} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Pilih File Bukti Transaksi</p>
                              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">PNG, JPG, atau PDF (Max. 1MB)</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Biaya Tambahan */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                        Biaya Tambahan (Potongan)
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm select-none">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={additionalFee}
                          onChange={(e) => setAdditionalFee(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-bold focus:outline-none focus:border-red-500/60 transition-all shadow-inner"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 font-bold ml-1 italic">* Isi jika ada potongan biaya transfer antar bank. Kosongkan jika tidak ada.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Catatan Tambahan</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                        placeholder="Tuliskan keterangan mengenai dokumen ini..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isUploading || !selectedFile} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]">
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        Sedang Mengunggah...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} /> Konfirmasi & Simpan
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-emerald-500">
              <Receipt size={300} />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-inner animate-in fade-in duration-300">
                {order.product?.images && isVideoUrl(order.product.images) ? <video src={getImageUrl(order.product.images)} className="w-full h-full object-cover" preload="metadata" muted playsInline /> : <img src={getImageUrl(order.product?.images) || "/placeholder.png"} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-white line-clamp-1">{order.product?.name}</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  {formatPrice(order.price)} x {order.quantity}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detail Penerima Dana (Seller)</h4>
              <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <CreditCard size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Nama Bank</p>
                    <p className="text-sm font-black text-white uppercase">{sellerBank.bankName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Info size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Nomor Rekening</p>
                    <p className="text-sm font-black text-white tracking-widest">{sellerBank.bankAccount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <User size={14} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Atas Nama</p>
                    <p className="text-sm font-black text-white">{sellerBank.bankHolder}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Mail size={14} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Email Pemilik</p>
                    <p className="text-sm font-black text-white">{order?.shop?.owner?.email || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span className="uppercase tracking-tighter">Harga Produk</span>
                <span className="text-white">{formatPrice(Number(order.price || 0) * Number(order.quantity || 1))}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span className="uppercase tracking-tighter">Ongkos Kirim</span>
                <span className="text-white">{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span className="uppercase tracking-tighter">Biaya Packing</span>
                <span className="text-white">{formatPrice(order.packing_cost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span className="uppercase tracking-tighter">Biaya Tambahan</span>
                <span className="text-red-500">-{formatPrice(additionalFee)}</span>
              </div>
              <div className="h-px bg-zinc-800"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-black text-white uppercase tracking-widest">Dana Dicairkan</span>
                <span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatPrice(totalDisbursement - (Number(additionalFee) || 0))}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Instruksi Admin</p>
              <p className="text-[11px] text-amber-500/70 font-medium leading-relaxed">Pastikan nominal transfer sesuai dengan &quot;Dana Dicairkan&quot; dan nomor rekening tujuan sudah divalidasi kebenarannya.</p>
            </div>
          </div>
        </div>
      </div>

      <ActionModal isOpen={actionModal.isOpen} type={actionModal.type} title={actionModal.title} message={actionModal.message} onConfirm={actionModal.onConfirm} />

      {/* ===== INVOICE MODAL ===== */}
      {invoiceOrder &&
        (() => {
          const inv = invoiceOrder;
          const subtotal = Number(inv.price || 0) * Number(inv.quantity || 1);
          const shipping = Number(inv.shipping_cost || 0);
          const packing = Number(inv.packing_cost || 0);
          const adminFee = Number(inv.admin_fee || 0);
          const addFee = Number(inv.additional_fee || 0);
          const total = subtotal + shipping + packing + adminFee;
          const disbursed = subtotal + shipping + packing - addFee;
          const shop = inv.shop;
          const bankAccounts = shop?.owner?.bank_accounts || [];

          let parsedBankAccounts = bankAccounts;
          if (typeof bankAccounts === "string") {
            try {
              parsedBankAccounts = JSON.parse(bankAccounts);
            } catch (e) {
              parsedBankAccounts = [];
            }
          }
          const bank = Array.isArray(parsedBankAccounts) && parsedBankAccounts.length > 0 ? parsedBankAccounts[0] : null;

          const dateStr = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
          const priceStr = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseFloat(v) || 0);

          const badgeBg = "#d1fae5";
          const badgeColor = "#065f46";
          const badgeBorder = "#6ee7b7";
          const badgeText = "Dana Telah Dicairkan";
          const transferDateStr = inv.disbursed_at ? dateStr(inv.disbursed_at) : dateStr(new Date());

          const sellerName = shop?.name || "-";
          const sellerOwnerName = shop?.owner?.name || shop?.user?.name || "-";
          const sellerEmail = shop?.owner?.email || "-";
          const sellerPhone = shop?.whatsapp ? `+62 ${shop.whatsapp}` : "-";

          const bankDetails = bank
            ? {
                bankName: bank.bank_name || bank.bankName || "-",
                accountNumber: bank.account_number || bank.accountNumber || "-",
                accountName: bank.account_name || bank.accountName || shop?.owner?.name || "-",
              }
            : null;

          const buyerName = inv.user?.name || inv.user?.username || "-";
          const buyerUsername = inv.user?.username || "user";
          const buyerEmail = inv.user?.email || "-";
          const buyerPhone = inv.user?.phone || "-";
          const orderDate = dateStr(inv.created_at);
          const requestDate = inv.disbursement_requested_at ? dateStr(inv.disbursement_requested_at) : "-";

          const productName = inv.product?.name || "Produk";
          const productId = inv.product?.product_id || "-";
          const productSpecies = inv.product?.species || "-";
          const qty = inv.quantity || 1;
          const unitPrice = inv.price || 0;

          return (
            <div id="invoice-print-wrapper" className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4 no-print-bg">
              {/* Toolbar */}
              <div className="fixed top-4 right-4 flex items-center gap-3 z-[201] no-print">
                <button onClick={handleDownloadInvoiceImage} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                  <Download size={16} /> Unduh Gambar (PNG)
                </button>
                <button onClick={() => setInvoiceOrder(null)} className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
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
                  boxSizing: "border-box",
                }}
              >
                {/* Watermark */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, opacity: 0.055 }}>
                  <img src="/images/Logo-Bg-2-2.png" alt="" style={{ width: "400px", height: "100px", objectFit: "contain", transform: "rotate(-20deg)", marginTop: "40%" }} />
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
                  <img src="/images/Logo-Bg-1-2.png" alt="SatwaiD" style={{ height: "72px", objectFit: "contain", display: "block" }} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>Invoice Pencairan Dana</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", fontFamily: "monospace", marginTop: "4px" }}>{inv.order_id}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>Diterbitkan: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Status Badge */}
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
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", lineHeight: "1" }}>• Tanggal Transfer: {transferDateStr}</span>
                  </div>

                  {/* 2-column info grid */}
                  <div style={{ display: "flex", gap: "24px", marginBottom: "36px" }}>
                    {/* Seller */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#059669", borderRadius: "2px", display: "inline-block", flexShrink: 0 }}></span>
                        Penerima Pencairan (Penjual)
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{sellerName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>Owner: {sellerOwnerName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>{sellerEmail}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{sellerPhone}</div>
                      {bankDetails && (
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                          <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Rekening Penerima</div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "#111827" }}>{bankDetails.bankName}</div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", fontFamily: "monospace", letterSpacing: "0.06em" }}>{bankDetails.accountNumber}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>a.n. {bankDetails.accountName}</div>
                        </div>
                      )}
                    </div>

                    {/* Buyer */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#7c3aed", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#7c3aed", borderRadius: "2px", display: "inline-block", flexShrink: 0 }}></span>
                        Informasi Pembeli &amp; Pesanan
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{buyerName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>@{buyerUsername}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>{buyerEmail}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{buyerPhone}</div>
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                        <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Detail Pesanan</div>
                        <div style={{ fontSize: "12px", color: "#374151", fontWeight: "600", marginBottom: "2px" }}>Tgl Order: {orderDate}</div>
                        <div style={{ fontSize: "12px", color: "#374151", fontWeight: "600", marginBottom: "2px" }}>Tgl Pengajuan: {requestDate}</div>
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
                          <th style={{ padding: "14px 20px", textAlign: "right", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Harga Satuan</th>
                          <th style={{ padding: "14px 20px", textAlign: "right", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "0 8px 8px 0" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{productName}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", fontWeight: "600" }}>
                              ID: {productId} • Kategori: {productSpecies}
                            </div>
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "700", color: "#374151" }}>{qty}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "700", color: "#374151" }}>{priceStr(unitPrice)}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "800", color: "#111827" }}>{priceStr(subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Cost Breakdown */}
                  <div style={{ marginBottom: "32px", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: "340px", background: "#f9fafb", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Subtotal Produk</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{priceStr(subtotal)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Ongkos Kirim</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: inv.product?.is_free_shipping ? "#059669" : "#374151" }}>{inv.product?.is_free_shipping ? "GRATIS" : priceStr(shipping)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Biaya Packing</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: inv.product?.is_free_packing ? "#059669" : "#374151" }}>{inv.product?.is_free_packing ? "GRATIS" : priceStr(packing)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Biaya Admin</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{priceStr(adminFee)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#111827" }}>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Tagihan Pembeli</span>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#34d399", fontFamily: "monospace" }}>{priceStr(total)}</span>
                      </div>
                      {addFee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#fff7ed" }}>
                          <span style={{ fontSize: "12px", color: "#92400e", fontWeight: "700" }}>Potongan Biaya Transfer</span>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626" }}>-{priceStr(addFee)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#ecfdf5", borderTop: "2px solid #6ee7b7" }}>
                        <span style={{ fontSize: "13px", color: "#065f46", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dana Diterima Penjual</span>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#059669", fontFamily: "monospace" }}>{priceStr(disbursed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {inv.disbursement_notes && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Catatan Admin</div>
                      <div style={{ fontSize: "13px", color: "#374151", fontWeight: "600", fontStyle: "italic" }}>&ldquo;{inv.disbursement_notes}&rdquo;</div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ borderTop: "2px dashed #e5e7eb", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Diterbitkan oleh</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#059669" }}>SatwaiD Platform</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Dokumen Resmi</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", fontFamily: "monospace" }}>{inv.order_id}</div>
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
