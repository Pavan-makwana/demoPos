"use client";

import { FiPercent, FiSettings } from "react-icons/fi";

export default function TaxesPage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4 md:p-8 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
          <FiPercent size={32} />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2">GST & Taxes</h1>
        <div className="my-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-500">
          <FiSettings className="animate-spin" />
          Module Under Construction
        </div>
        <p className="text-sm font-semibold text-muted-foreground mt-4 leading-relaxed">
          The Goods and Services Tax (GST), service charges, and custom tax brackets module is currently being built. You will soon be able to configure dynamic tax rules per category.
        </p>
      </div>
    </div>
  );
}
