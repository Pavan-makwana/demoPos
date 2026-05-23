"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiUsers, FiSliders, FiCheck, FiX, FiSearch, FiSliders as FiSettings, FiGrid, FiActivity, FiKey } from "react-icons/fi";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name?: string;
  location?: string;
  status?: string;
  features?: {
    inventory: boolean;
    kds: boolean;
    takeaway: boolean;
    qrMenu: boolean;
    analytics: boolean;
    staff: boolean;
  };
}

interface CafeUser {
  id: string;
  email?: string;
  tenantId?: string;
  role?: string;
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<CafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Real-time listener for tenants
    const unsubTenants = onSnapshot(
      collection(db, "tenants"),
      (snap) => {
        const tenantList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Tenant[];
        setTenants(tenantList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to tenants:", error);
        toast.error("Failed to load tenants");
      }
    );

    // Real-time listener for admin users
    const qUsers = query(collection(db, "users"), where("role", "==", "cafe_admin"));
    const unsubUsers = onSnapshot(
      qUsers,
      (snap) => {
        const userList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CafeUser[];
        setUsers(userList);
      },
      (error) => {
        console.error("Error listening to users:", error);
      }
    );

    return () => {
      unsubTenants();
      unsubUsers();
    };
  }, []);

  const getTenantAdminEmail = (tenantId: string) => {
    const admin = users.find((u) => u.tenantId === tenantId);
    return admin?.email || "No Operator Assigned";
  };

  const handleToggleFeature = async (tenantId: string, featureKey: "inventory" | "kds" | "takeaway" | "qrMenu" | "analytics" | "staff", currentVal: boolean) => {
    try {
      const tenantRef = doc(db, "tenants", tenantId);
      await updateDoc(tenantRef, {
        [`features.${featureKey}`]: !currentVal,
      });
      
      // Update selected tenant local modal state to reflect instantly
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant({
          ...selectedTenant,
          features: {
            ...((selectedTenant.features) || { inventory: true, kds: true, takeaway: true, qrMenu: true, analytics: true, staff: true }),
            [featureKey]: !currentVal,
          },
        });
      }
      
      toast.success("Tenant features updated");
    } catch (error) {
      console.error("Failed to update feature:", error);
      toast.error("Failed to update feature");
    }
  };

  // Filter tenants based on search query
  const filteredTenants = tenants.filter((tenant) => {
    const name = (tenant.name || "").toLowerCase();
    const id = tenant.id.toLowerCase();
    const email = getTenantAdminEmail(tenant.id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || id.includes(query) || email.includes(query);
  });

  // Calculate statistics
  const totalTenants = tenants.length;
  const activeKDS = tenants.filter(t => t.features?.kds !== false).length;
  const activeInventory = tenants.filter(t => t.features?.inventory !== false).length;

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8 font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <FiUsers className="text-rose-600" />
          Tenant Manager
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          Monitor your POS SaaS tenants, control system feature flags, and manage subscription access.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tenants</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{totalTenants}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <FiGrid size={24} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">KDS Feature Active</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{activeKDS}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <FiActivity size={24} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inventory Active</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{activeInventory}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FiKey size={24} />
          </div>
        </div>
      </div>

      {/* Tenant Table Container */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {/* Search */}
        <div className="mb-6 relative w-full max-w-sm">
          <FiSearch className="absolute left-3.5 top-3.5 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by ID, Cafe Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-input pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-rose-600 transition-all font-semibold"
          />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-bold">Tenant ID</th>
                <th className="px-5 py-4 font-bold">Cafe Name</th>
                <th className="px-5 py-4 font-bold">Operator Email</th>
                <th className="px-5 py-4 font-bold">Features State</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-bold text-muted-foreground">
                    Fetching SaaS data...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-bold text-muted-foreground">
                    No active tenants found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const features = tenant.features || { inventory: true, kds: true, takeaway: true, qrMenu: true, analytics: true, staff: true };
                  return (
                    <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-rose-600 text-xs">{tenant.id}</td>
                      <td className="px-5 py-4 font-bold text-foreground">{tenant.name || "Unnamed Cafe"}</td>
                      <td className="px-5 py-4 font-semibold text-muted-foreground">{getTenantAdminEmail(tenant.id)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.inventory !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            INV: {features.inventory !== false ? "ON" : "OFF"}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.kds !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            KDS: {features.kds !== false ? "ON" : "OFF"}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.takeaway !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            TKW: {features.takeaway !== false ? "ON" : "OFF"}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.qrMenu !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            QR: {features.qrMenu !== false ? "ON" : "OFF"}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.analytics !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            ANL: {features.analytics !== false ? "ON" : "OFF"}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            features.staff !== false ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            STF: {features.staff !== false ? "ON" : "OFF"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-sm cursor-pointer"
                        >
                          <FiSliders size={13} />
                          Manage Features
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Features Modal */}
      {isModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-foreground">Manage SaaS Modules</h3>
                <p className="text-xs font-semibold text-muted-foreground">{selectedTenant.name || "Tenant"} ({selectedTenant.id})</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTenant(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {[
                {
                  key: "inventory" as const,
                  label: "Inventory Management",
                  description: "Control stock tracking, low alerts, and ingredient deduction rules.",
                  color: "bg-emerald-600",
                },
                {
                  key: "kds" as const,
                  label: "Kitchen Display Queue (KDS)",
                  description: "Show digital ticket displays for prep chefs and track ready items.",
                  color: "bg-rose-600",
                },
                {
                  key: "takeaway" as const,
                  label: "Takeaway Ordering",
                  description: "Enable dedicated takeaway billing path alongside default dine-in.",
                  color: "bg-amber-600",
                },
                {
                  key: "qrMenu" as const,
                  label: "QR Table Self-Ordering",
                  description: "Allow dine-in customers to scan and place orders directly from their phone.",
                  color: "bg-indigo-600",
                },
                {
                  key: "analytics" as const,
                  label: "Sales Analytics & Finance",
                  description: "Access advanced sales reports, charts, expense tracking, and invoice details.",
                  color: "bg-cyan-600",
                },
                {
                  key: "staff" as const,
                  label: "Staff & Role Management",
                  description: "Invite employees, assign roles (waiter, cashier, chef), and track register shifts.",
                  color: "bg-purple-600",
                },
              ].map((f) => {
                const currentFeatures = selectedTenant.features || { inventory: true, kds: true, takeaway: true, qrMenu: true, analytics: true, staff: true };
                const isEnabled = currentFeatures[f.key] !== false;

                return (
                  <div key={f.key} className="flex items-start justify-between gap-4 rounded-2xl bg-muted/30 border border-border p-3 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{f.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{f.description}</p>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleFeature(selectedTenant.id, f.key, isEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        isEnabled ? "bg-rose-600" : "bg-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedTenant(null);
              }}
              className="w-full flex items-center justify-center rounded-2xl bg-foreground text-background py-3 text-sm font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Done Managing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
