"use client";

import { MdOutlineTableRestaurant } from "react-icons/md";
import { RiShoppingBag3Line } from "react-icons/ri";
import { FiChevronRight } from "react-icons/fi";
import { useAuth } from "../../../lib/AuthContext";

interface CartHeaderProps {
  orderType: "dine_in" | "takeaway";
  setOrderType: (type: "dine_in" | "takeaway") => void;
  tableNumber: string;
  onOpenTableSelector: () => void;
  mobileSheet?: boolean;
}

export default function CartHeader({
  orderType,
  setOrderType,
  tableNumber,
  onOpenTableSelector,
  mobileSheet,
}: CartHeaderProps) {
  const { features } = useAuth();
  const showTakeaway = features?.takeaway !== false;

  return (
    <div className="border-b border-border p-4">
      {!mobileSheet && (
        <h2 className="mb-4 text-base font-bold tracking-tight text-foreground">
          Current Order
        </h2>
      )}

      <div className={`grid gap-2 ${showTakeaway ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          onClick={() => setOrderType("dine_in")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            orderType === "dine_in"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-muted text-muted-foreground hover:bg-hover hover:text-foreground"
          }`}
        >
          <MdOutlineTableRestaurant size={16} /> Dine In
        </button>
        {showTakeaway && (
          <button
            onClick={() => setOrderType("takeaway")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              orderType === "takeaway"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:bg-hover hover:text-foreground"
            }`}
          >
            <RiShoppingBag3Line size={15} /> Takeaway
          </button>
        )}
      </div>

      {/* THE FIX: Dynamic Live Service Hub Button (Always Visible!) */}
      <div className="mt-3">
        <button
          onClick={onOpenTableSelector}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-muted p-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-hover"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-primary">
              {orderType === "dine_in" ? (
                <MdOutlineTableRestaurant size={18} />
              ) : (
                <RiShoppingBag3Line size={18} />
              )}
            </div>
            <div className="text-left flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                {orderType === "dine_in" ? "Service Area" : "Takeaway Queue"}
              </span>
              <span
                className={
                  (orderType === "dine_in" && !tableNumber)
                    ? "text-muted-foreground leading-none"
                    : "text-foreground leading-none"
                }
              >
                {orderType === "dine_in"
                  ? tableNumber
                    ? `Table: ${tableNumber}`
                    : "Select a Table..."
                  : "View Active Orders"}
              </span>
            </div>
          </div>
          <FiChevronRight className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}