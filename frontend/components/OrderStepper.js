"use client";

import { ShoppingBag, MapPin, Truck, CreditCard, Clock, Package, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

export default function OrderStepper({ order, className = "" }) {
  if (!order) return null;

  const normalizedStatus = ["disbursement_requested", "disbursed"].includes(order.status) ? "completed" : order.status;
  const isCancelled = ["cancelled", "cancelled_dismissed"].includes(order.status);

  const statusMap = {
    pending_shipping_info: 1,
    waiting_shipping_cost: 2,
    waiting_payment: 3,
    processing: 4,
    payment_verified: 5,
    waiting_shipment: 5,
    shipped: 5,
    complained: 5, // Tertahan di step 5 (80%)
    completed: 6,
    cancelled: 0,
  };

  const currentStep = statusMap[normalizedStatus] || 1;

  // Step completion logic for tracking steps when cancelled
  const stepCompletions = {
    1: !!(order.address_filled_at || order.receiver_name || !['pending_shipping_info', 'cancelled', 'cancelled_dismissed'].includes(order.status)),
    2: !!(order.shipping_cost_set_at || order.shipping_cost !== null || !['pending_shipping_info', 'waiting_shipping_cost', 'cancelled', 'cancelled_dismissed'].includes(order.status)),
    3: !!(order.payment_uploaded_at || order.payment_proof || ['processing', 'payment_verified', 'shipped', 'completed', 'complained'].includes(normalizedStatus)),
    4: !!(order.payment_verified_at || ['payment_verified', 'shipped', 'completed', 'complained'].includes(normalizedStatus)),
    5: !!(order.shipped_at || order.tracking_number || ['shipped', 'completed', 'complained'].includes(normalizedStatus)),
    6: !!(order.completed_at || ['completed', 'complained'].includes(normalizedStatus)),
  };

  // Find first uncompleted step (represents where it got cancelled)
  let cancelledStep = 1;
  if (isCancelled) {
    for (let s = 1; s <= 6; s++) {
      if (!stepCompletions[s]) {
        cancelledStep = s;
        break;
      }
    }
  }

  const progressStep = isCancelled ? cancelledStep - 1 : currentStep - 1;
  const progressWidth = Math.max(0, progressStep * 20);

  const steps = [
    { id: "data", label: "Data Pembeli", icon: <MapPin size={20} />, step: 1 },
    { id: "ongkir", label: "Ongkir", icon: <Truck size={20} />, step: 2 },
    { id: "pembayaran", label: "Pembayaran", icon: <CreditCard size={20} />, step: 3 },
    { id: "verifikasi", label: "Verifikasi", icon: <Clock size={20} />, step: 4 },
    { id: "pengiriman", label: "Pengiriman", icon: <Package size={20} />, step: 5 },
    { id: "selesai", label: "Selesai", icon: <CheckCircle2 size={20} />, step: 6 },
  ];

  return (
    <div className={`hidden md:block bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 shadow-2xl overflow-hidden relative ${className}`}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-emerald-500">
        <ShoppingBag size={300} />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between relative gap-6 md:gap-0">
        <div className="absolute top-[22px] lg:top-[45px] left-[calc(100%/12)] right-[calc(100%/12)] h-1 bg-zinc-800/50 hidden md:block">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>

        {steps.map((step, idx) => {
          const isCompleted = isCancelled 
            ? step.step < cancelledStep 
            : currentStep > step.step || (normalizedStatus === "completed" && step.step === 6);
          const isActive = !isCancelled && currentStep === step.step && normalizedStatus !== "completed";
          const isCancelledStep = isCancelled && step.step === cancelledStep;
          const isComplainedStep = normalizedStatus === "complained" && step.step === 6;

          return (
            <div key={step.id} className="flex flex-row md:flex-col items-center gap-4 md:gap-4 relative z-10 flex-1 w-full md:w-auto">
              <div
                className={`w-[45px] h-[45px] lg:w-[90px] lg:h-[90px] rounded-2xl lg:rounded-[2.5rem] flex items-center justify-center transition-all duration-700 border-2 lg:border-4 shrink-0 ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-400/20 text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] rotate-[10deg]"
                    : isComplainedStep || isCancelledStep
                      ? "bg-red-500 border-red-400/20 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                      : isActive
                        ? "bg-zinc-950 border-emerald-500 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-110"
                        : "bg-zinc-950 border-zinc-800 text-zinc-700"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={24} className="lg:w-10 lg:h-10 animate-in zoom-in duration-500" />
                ) : isComplainedStep ? (
                  <ShieldAlert size={24} className="lg:w-10 lg:h-10 animate-in zoom-in duration-500" />
                ) : isCancelledStep ? (
                  <XCircle size={24} className="lg:w-10 lg:h-10 animate-in zoom-in duration-500 text-white" />
                ) : (
                  <div className="scale-75 lg:scale-100">{step.icon}</div>
                )}
              </div>
              <div className="text-left md:text-center space-y-1">
                <p className={`text-[10px] lg:text-[10px] font-black uppercase tracking-[0.2em] ${
                  isCancelledStep ? "text-red-500" :
                  isActive || isCompleted ? "text-emerald-500" : 
                  isComplainedStep ? "text-red-500" : 
                  "text-zinc-300"
                }`}>
                  {isComplainedStep ? "Komplain" : isCancelledStep ? "Batal" : step.label}
                </p>
                {(isActive || isCompleted || isComplainedStep || isCancelledStep) && (
                  <div className={`hidden md:flex px-3 py-1 ${
                    isComplainedStep || isCancelledStep ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                  } rounded-full items-center justify-center gap-1.5 border`}>
                    <span className={`w-1.5 h-1.5 ${isComplainedStep || isCancelledStep ? "bg-red-500" : "bg-emerald-500"} rounded-full`}></span>
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${isComplainedStep || isCancelledStep ? "text-red-500" : "text-emerald-500"}`}>
                      {normalizedStatus === "completed" ? "Transaksi Selesai" : 
                       isComplainedStep ? "Dalam Komplain" : 
                       isCancelledStep ? "Batal di Tahap Ini" :
                       "Proses Aktif"}
                    </span>
                  </div>
                )}
              </div>
              {/* Mobile vertical line connector */}
              {idx < steps.length - 1 && <div className={`absolute left-[22px] top-[45px] w-0.5 h-6 bg-zinc-800 md:hidden ${isCompleted ? "bg-emerald-500" : ""}`}></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
