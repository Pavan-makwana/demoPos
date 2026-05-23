"use client";

interface PaymentGatewayModalProps {
  isOpen: boolean;
}

export default function PaymentGatewayModal({ isOpen }: PaymentGatewayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6 font-['DM_Sans',sans-serif]">
      <div className="flex flex-col items-center justify-center space-y-6 text-center animate-fade-in-down">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        <h2 className="text-2xl font-black text-foreground">Processing Payment...</h2>
        <p className="text-muted-foreground">Please complete the payment on your UPI app.</p>
        <p className="mt-8 text-sm font-bold text-amber-500">
          (Simulating Webhook in 3 seconds...)
        </p>
      </div>
    </div>
  );
}
