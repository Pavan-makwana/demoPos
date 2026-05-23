"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { processCheckout } from "../../lib/actions";
import { printReceipt } from "../../lib/thermal-printer";
import { useAuth } from "../../lib/AuthContext";
import { FiX, FiCheckCircle, FiCreditCard, FiPercent, FiUser, FiPhone } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { IoWalletOutline } from "react-icons/io5";
import { TbCurrencyRupee } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa"; 

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = "cash" | "upi" | "card";
type ModalStep = "crm" | "selection" | "success";
type DiscountType = "none" | "flat" | "percent";

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  upi: { label: "UPI", icon: <IoWalletOutline size={18} /> },
  cash: { label: "Cash", icon: <TbCurrencyRupee size={18} /> },
  card: { label: "Card", icon: <FiCreditCard size={18} /> },
};

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, subtotal, orderType, tableNumber, clearCart, activeOrderId, updateItemQuantity } = useCartStore();

  const [step, setStep] = useState<ModalStep>("crm");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState("");
  const { tenantId: authTenantId } = useAuth();
  const params = useParams();
  const routeTenantId = params?.tenantId as string;
  const tenantId = routeTenantId || authTenantId || "newkappscorner";

  // CRM State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Discount State
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [amountTendered, setAmountTendered] = useState<number | "">("");

  if (!isOpen) return null;
  
  // --- DYNAMIC MATH ENGINE ---
  const discountAmount = 
    discountType === "flat" ? discountValue : 
    discountType === "percent" ? subtotal * (discountValue / 100) : 0;
  
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const newTaxAmount = discountedSubtotal * 0; // 0% GST on discounted amount
  const finalTotal = discountedSubtotal + newTaxAmount;

  // Cash Tendered & Change States
  const changeGiven = amountTendered !== "" ? Math.max(0, Number(amountTendered) - finalTotal) : 0;

  const handleFinalCheckout = async () => {
    setIsProcessing(true);
    const transactionId = paymentMethod === "card" ? cardNumber.slice(-4) : null;
    const payload = {
      tenantId,
      cart,
      subtotal: discountedSubtotal,
      taxAmount: newTaxAmount,
      total: finalTotal,
      orderType,
      tableNumber,
      paymentMethod,
      transactionId,
      activeOrderId,
      customer: {
        name: customerName || "Walk-in Customer",
        phone: customerPhone || null
      },
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount
      },
      amountTendered: paymentMethod === "cash" ? Number(amountTendered) : finalTotal,
      changeGiven: paymentMethod === "cash" ? changeGiven : 0
    };

    const result = await processCheckout(payload as any);

    if (result.success) {
      setFinalOrderId(result.orderId);
      setStep("success");
      
      // Keeping your thermal printer integration!
      printReceipt({
        orderId: result.orderId,
        cart,
        subtotal: discountedSubtotal,
        taxAmount: newTaxAmount,
        total: finalTotal,
        paymentMethod,
        discount: {
          type: discountType,
          value: discountValue,
          amount: discountAmount
        }
      });
    } else {
      toast.error("Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const sendWhatsAppReceipt = () => {
    if (!customerPhone) return toast.error("No phone number provided!");
    
    // Format a beautiful WhatsApp Message with itemized breakdown
    const itemsText = cart
      .map((item) => `• ${item.name} x ${item.quantity} - ₹${item.subtotal.toFixed(0)}`)
      .join("\n");
      
    const discountText = discountAmount > 0 ? `\n*Discount:* -₹${discountAmount.toFixed(0)}` : "";
    const orderInfo = orderType === "dine_in" ? `Table: ${tableNumber}` : "Takeaway";
    
    const text = `*Ladoo POS System*\n` +
      `---------------------------\n` +
      `*Order ID:* #${finalOrderId.slice(-6).toUpperCase()}\n` +
      `*Customer:* ${customerName || "Guest"}\n` +
      `*Type:* ${orderInfo}\n` +
      `---------------------------\n` +
      `*Items Ordered:*\n` +
      `${itemsText}\n` +
      `---------------------------\n` +
      `*Subtotal:* ₹${subtotal.toFixed(0)}${discountText}\n` +
      `*Grand Total:* *₹${finalTotal.toFixed(0)}*\n\n` +
      `Thank you for visiting New Kapp's Corner! \n Ladoo POS😊`;

    const url = `https://wa.me/91${customerPhone}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
    resetAndClose();
  };

  const resetAndClose = () => {
    clearCart();
    setStep("crm");
    setPaymentMethod("upi");
    setCustomerName("");
    setCustomerPhone("");
    setDiscountType("none");
    setDiscountValue(0);
    setCardNumber("");
    setCardCvv("");
    setAmountTendered("");
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        
        {/* STEP 1: CRM & DISCOUNTS */}
        {step === "crm" && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Customer Details</h2>
              <button onClick={onClose} className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-hover hover:text-foreground">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3.5 text-muted-foreground" />
                  <input type="text" placeholder="e.g. Rahul Sharma" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3.5 text-muted-foreground" />
                  <input type="tel" maxLength={10} placeholder="e.g. 9876543210" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            {/* Manual Quantity Editor */}
            {cart.length > 0 && (
              <div className="border-t border-border pt-4 mb-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Update Quantities
                </label>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 select-none">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="flex items-center justify-between rounded-xl bg-muted p-2 border border-border/50">
                      <div className="min-w-0 flex-1 pl-1">
                        <p className="truncate text-xs font-bold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          ₹{item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-hover text-xs font-black"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              updateItemQuantity(item.itemId, val);
                            }
                          }}
                          className="w-10 text-center rounded-lg bg-background border border-border text-xs font-black py-0.5 outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-hover text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4 mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Apply Discount</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => { setDiscountType("none"); setDiscountValue(0); }} className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${discountType === 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>None</button>
                <button onClick={() => setDiscountType("percent")} className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${discountType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>% Off</button>
                <button onClick={() => setDiscountType("flat")} className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${discountType === 'flat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>₹ Off</button>
              </div>
              {discountType !== "none" && (
                <div className="relative">
                  {discountType === 'percent' ? <FiPercent className="absolute left-3 top-3.5 text-muted-foreground" /> : <TbCurrencyRupee className="absolute left-3 top-3.5 text-muted-foreground" />}
                  <input type="number" min="0" placeholder={`Enter ${discountType === 'percent' ? 'Percentage' : 'Amount'}`} value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary" />
                </div>
              )}
            </div>

            <button onClick={() => setStep("selection")} className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-colors">
              Proceed to Payment
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT SELECTION */}
        {step === "selection" && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Complete Payment</h2>
              <button onClick={onClose} className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-hover hover:text-foreground">
                <FiX size={18} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-border bg-muted p-4 text-center">
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Total Amount Due</p>
              <p className="text-4xl font-black text-emerald-400 tabular-nums">₹{finalTotal.toFixed(2)}</p>
              {discountAmount > 0 && <p className="text-xs font-bold text-emerald-500 mt-1">Saved ₹{discountAmount.toFixed(2)}</p>}
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {(["upi", "cash", "card"] as PaymentMethod[]).map((method) => {
                const cfg = METHOD_CONFIG[method];
                const active = paymentMethod === method;
                return (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-bold uppercase tracking-wide transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic action area */}
            <div className="mb-6 min-h-[160px] rounded-2xl border-2 border-dashed border-border bg-background p-5 flex flex-col items-center justify-center">
              {paymentMethod === "upi" && (
                <div className="text-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scan to Pay</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=quantatech@okhdfcbank&pn=Ladoo&am=${finalTotal.toFixed(2)}`} alt="UPI QR" className="mx-auto h-32 w-32 rounded-xl border-4 border-[#1c1f2b] shadow-lg" />
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="w-full space-y-3">
                  <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full rounded-xl border border-border bg-muted p-3 text-sm text-foreground focus:border-primary outline-none" />
                  <input type="password" placeholder="CVV" maxLength={3} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="w-full rounded-xl border border-border bg-muted p-3 text-sm text-foreground focus:border-primary outline-none" />
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="w-full space-y-4">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <TbCurrencyRupee size={28} />
                    </div>
                    <p className="text-sm font-bold text-foreground">Cash Payment</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Amount Tendered (₹)
                      </label>
                      <input
                        type="number"
                        min={finalTotal}
                        step="any"
                        required
                        placeholder={`e.g. ${Math.ceil(finalTotal)}`}
                        value={amountTendered || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAmountTendered(val === "" ? "" : Number(val));
                        }}
                        className="w-full rounded-xl border border-border bg-input p-3 text-sm text-foreground focus:border-primary outline-none font-bold"
                      />
                    </div>
                    
                    {amountTendered !== "" && (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm font-bold text-emerald-500 animate-fadeIn">
                        <span>Change Given:</span>
                        <span className="text-lg tabular-nums">₹{changeGiven.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("crm")} disabled={isProcessing} className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold text-muted-foreground hover:bg-hover disabled:opacity-50">Back</button>
              <button
                onClick={handleFinalCheckout}
                disabled={
                  isProcessing ||
                  (paymentMethod === "cash" && (amountTendered === "" || Number(amountTendered) < finalTotal))
                }
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Confirm Paid"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & WHATSAPP */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10">
              <FiCheckCircle size={42} />
            </div>
            <h2 className="mb-1 text-3xl font-black text-foreground">Success!</h2>
            <p className="mb-6 font-mono text-xs text-primary tracking-widest">#{finalOrderId.slice(-6).toUpperCase()}</p>
            
            <div className="w-full space-y-3">
              <button onClick={sendWhatsAppReceipt} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 font-bold text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#20bd5a] transition-colors">
                <FaWhatsapp size={20} /> Send WhatsApp Bill
              </button>
              <button onClick={resetAndClose} className="w-full rounded-xl bg-muted py-3.5 font-bold text-foreground border border-border hover:bg-hover transition-colors">
                Next Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}