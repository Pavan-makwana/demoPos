import { db } from "../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
  FiClock,
  FiCheckCircle,
  FiShoppingBag,
  FiMessageSquare,
} from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";

interface TicketCardProps {
  ticket: any;
  onMarkReady: (orderId: string) => void;
}

export default function TicketCard({ ticket, onMarkReady }: TicketCardProps) {
  const isDineIn = ticket.orderType === "dine_in";
  const itemsToPrepare = ticket.unpreparedItems?.length > 0 ? ticket.unpreparedItems : ticket.items;

  const handleToggleItem = async (item: any) => {
    try {
      const orderRef = doc(db, "orders", ticket.id);
      
      const updatedItems = (ticket.items || []).map((i: any) => {
        if (i.cartItemId === item.cartItemId || (i.itemId === item.itemId && !i.cartItemId)) {
          return { ...i, prepared: !i.prepared };
        }
        return i;
      });

      const updatedUnpreparedItems = (ticket.unpreparedItems || []).map((i: any) => {
        if (i.cartItemId === item.cartItemId || (i.itemId === item.itemId && !i.cartItemId)) {
          return { ...i, prepared: !i.prepared };
        }
        return i;
      });

      await updateDoc(orderRef, {
        items: updatedItems,
        unpreparedItems: updatedUnpreparedItems,
      });
    } catch (error) {
      console.error("Failed to toggle item prepared state:", error);
    }
  };

  const allItemsChecked = itemsToPrepare.length > 0 && itemsToPrepare.every((item: any) => item.prepared);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-transform hover:-translate-y-0.5">
      {/* Ticket Header */}
      <div
        className="px-4 py-3 bg-primary/10 border-b border-border"
      >
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 text-sm font-bold tracking-wider text-primary"
          >
            {isDineIn ? (
              <>
                <MdOutlineTableRestaurant size={16} /> TABLE
                {ticket.tableNumber}
              </>
            ) : (
              <>
                <FiShoppingBag size={14} /> TAKEAWAY
              </>
            )}
          </div>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            #{ticket.id.slice(-4).toUpperCase()}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <FiClock size={11} />
          {ticket.createdAt?.toDate()
            ? ticket.createdAt
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now"}
        </div>
      </div>

      {/* Items & Kitchen Notes */}
      <div className="flex-1 p-4">
        <ul className="space-y-3">
          {itemsToPrepare.map(
            (item: any, index: number) => {
              const isChecked = !!item.prepared;
              return (
                <li
                  key={index}
                  className={`flex flex-col border-b border-border pb-3 last:border-0 last:pb-0 transition-opacity ${isChecked ? 'opacity-50' : 'opacity-100'}`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-500" 
                      checked={isChecked}
                      onChange={() => handleToggleItem(item)}
                    />
                    <span className="min-w-[2rem] rounded bg-amber-500/20 px-1.5 py-0.5 text-center text-sm font-bold text-amber-400">
                      {item.quantity}x
                    </span>
                    <span className={`text-sm font-semibold text-foreground leading-snug ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                      {item.name}
                    </span>
                  </label>

                  {/* Render Kitchen Notes if they exist */}
                  {item.notes && (
                    <div className="mt-1.5 ml-10 flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      <FiMessageSquare size={12} className="mt-0.5 shrink-0" />
                      <span className="font-medium italic">{item.notes}</span>
                    </div>
                  )}
                </li>
              );
            },
          )}
        </ul>
      </div>

      {/* Mark Ready Button */}
      <button
        disabled={!allItemsChecked}
        onClick={() => onMarkReady(ticket.id)}
        className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <FiCheckCircle size={16} />
        Mark Ready
      </button>
    </div>
  );
}
