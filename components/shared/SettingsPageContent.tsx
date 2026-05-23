"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { auth, db } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { FiCheck, FiLogOut, FiSettings, FiLoader, FiBriefcase, FiEdit2, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

export default function SettingsPageContent() {
  const { user, tenantId } = useAuth();
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCurrency, setEditCurrency] = useState("INR");
  const [editTaxRate, setEditTaxRate] = useState("");

  const fetchTenant = async () => {
    if (!tenantId) {
      setLoadingTenant(false);
      return;
    }
    try {
      const snap = await getDoc(doc(db, "tenants", tenantId));
      if (snap.exists()) {
        const data = snap.data();
        setTenantInfo(data);
        setEditName(data.name || "");
        setEditLocation(data.location || "");
        setEditCurrency(data.currency || "INR");
        setEditTaxRate(data.taxRate !== undefined && data.taxRate !== null ? String(data.taxRate) : "");
      } else {
        // Document doesn't exist, create it with default data for newkappscorner
        const initialData = {
          name: tenantId === "newkappscorner" ? "Kapp's Corner" : "Not Configured",
          location: tenantId === "newkappscorner" ? "Main Outlet" : "Not Configured",
          currency: "INR",
          taxRate: "",
          features: { inventory: true, kds: true, takeaway: true }
        };
        await setDoc(doc(db, "tenants", tenantId), initialData);
        setTenantInfo(initialData);
        setEditName(initialData.name);
        setEditLocation(initialData.location);
        setEditCurrency(initialData.currency);
        setEditTaxRate("");
      }
    } catch (err) {
      console.error("Failed to load tenant settings:", err);
    } finally {
      setLoadingTenant(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out");
      router.push("/login");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      setLoadingTenant(true);
      const updatedData = {
        name: editName,
        location: editLocation,
        currency: editCurrency,
        taxRate: editTaxRate === "" ? "" : parseFloat(editTaxRate),
      };

      await updateDoc(doc(db, "tenants", tenantId), updatedData);
      toast.success("Business profile updated successfully");
      setIsEditing(false);
      await fetchTenant();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to save changes");
      setLoadingTenant(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-['DM_Sans',sans-serif]">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <FiSettings className="text-primary" />
              Settings
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Manage your POS account preferences and business metadata.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <FiLogOut />
            Sign Out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Plan Card */}
          <div className="md:col-span-1 flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] h-24 w-24 rounded-full bg-primary/10 blur-xl" />
            <div>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                <FiBriefcase />
                Current Plan
              </div>
              <h2 className="text-3xl font-black text-foreground mb-1">Pro Plan</h2>
              <p className="text-xs font-semibold text-muted-foreground mb-6">
                Active monthly subscription
              </p>

              <ul className="space-y-3">
                {[
                  "Real-time KDS syncing",
                  "Floor plan customization",
                  "Smart inventory sync",
                  "Multi-tenant data isolation",
                  "Advanced ledger summaries",
                ].map((feat, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <FiCheck size={12} />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Business Profile Details */}
          <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Business Profile</h3>
              {!loadingTenant && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <FiEdit2 size={13} />
                  Edit Profile
                </button>
              )}
            </div>
            
            {loadingTenant ? (
              <div className="flex h-40 items-center justify-center">
                <FiLoader className="animate-spin text-primary" size={24} />
              </div>
            ) : isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Cafe / Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Default Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Leave blank for no tax"
                      value={editTaxRate}
                      onChange={(e) => setEditTaxRate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(tenantInfo?.name || "");
                      setEditLocation(tenantInfo?.location || "");
                      setEditCurrency(tenantInfo?.currency || "INR");
                      setEditTaxRate(tenantInfo?.taxRate !== undefined && tenantInfo?.taxRate !== null ? String(tenantInfo.taxRate) : "");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <FiX size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <FiSave size={14} />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Cafe / Restaurant Name
                  </label>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {tenantInfo?.name || "Not Configured"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Location
                  </label>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {tenantInfo?.location || "Not Configured"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Currency Symbol
                  </label>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {tenantInfo?.currency || "INR"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Default Tax Rate
                  </label>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {tenantInfo?.taxRate !== undefined && tenantInfo?.taxRate !== null && tenantInfo?.taxRate !== ""
                      ? `${tenantInfo.taxRate}%`
                      : ""}
                  </p>
                </div>
                <div className="sm:col-span-2 pt-4 border-t border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Your Operator Email
                  </label>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {user?.email || "Unknown User"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
