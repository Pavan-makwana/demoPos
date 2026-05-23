"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../../lib/AuthContext";

import KDSHeader from "./KDSHeader";
import TicketCard from "./TicketCard";

export default function KitchenDisplay() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const { tenantId, features } = useAuth();

  if (features && features.kds === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-6 font-['DM_Sans',sans-serif]">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 mb-2">
          <FiCheckCircle size={32} className="rotate-45" />
        </div>
        <h1 className="text-2xl font-black text-rose-600">Module Disabled</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The Kitchen Display Queue (KDS) has been deactivated for your workspace by the SaaS Super Admin.
        </p>
      </div>
    );
  }

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      where("kitchenStatus", "==", "pending"), // Only show tickets the chef needs to cook
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeTickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(activeTickets);
    });
    return () => unsubscribe();
  }, [tenantId]);

  // THE TRAFFIC LIGHT TRIGGER
  const markAsReady = async (orderId: string) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      kitchenStatus: "ready", // Removes it from the Chef's KDS
      serveStatus: "ready_for_pickup", // Turns the table BLUE on the POS
      unpreparedItems: [], // CLEARS THE QUEUE! So next time they order, it starts fresh.
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background p-4 md:p-6 text-foreground font-['DM_Mono',monospace]">
      <KDSHeader ticketCount={tickets.length} currentTime={currentTime} />

      <div className="flex-1 overflow-y-auto mt-4 pr-1">
        {tickets.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border">
              <FiCheckCircle size={36} className="text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              Kitchen is all clear
            </p>
            <p className="text-sm text-muted-foreground">No pending orders right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onMarkReady={markAsReady}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
