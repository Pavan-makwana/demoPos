import { FiSearch, FiFilter, FiChevronDown } from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { RiShoppingBag3Line } from "react-icons/ri";

interface HistoryTopBarProps {
  tableFilter: string;
  setTableFilter: (v: string) => void;
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
  orderTypeFilter: string;
  setOrderTypeFilter: (v: string) => void;
}

const ORDER_TYPES = [
  { value: "all", label: "All Orders", icon: null },
  { value: "dine_in", label: "Dine In", icon: MdOutlineTableRestaurant },
  { value: "takeaway", label: "Takeaway", icon: RiShoppingBag3Line },
];

export default function HistoryTopBar({
  tableFilter,
  setTableFilter,
  paymentFilter,
  setPaymentFilter,
  orderTypeFilter,
  setOrderTypeFilter,
}: HistoryTopBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Row 1: Order type toggle */}
      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
        {ORDER_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => {
              setOrderTypeFilter(value);
              // Clear table filter when switching away from dine_in
              if (value !== "dine_in") setTableFilter("");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              orderTypeFilter === value
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {Icon && <Icon size={13} />}
            {label}
          </button>
        ))}
      </div>

      {/* Row 2: Table search (only when dine_in selected) + payment dropdown */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        {/* Table number search — visible only for dine_in */}
        {orderTypeFilter === "dine_in" && (
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MdOutlineTableRestaurant
                className="text-muted-foreground"
                size={15}
              />
            </div>
            <input
              type="text"
              placeholder="Search by Table Number..."
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="block w-full rounded-xl border border-border bg-card p-2.5 pl-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        {/* Payment Method dropdown */}
        <div className="relative w-full sm:w-48 sm:ml-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FiFilter className="text-muted-foreground" size={13} />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="block w-full appearance-none rounded-xl border border-border bg-card p-2.5 pl-9 pr-10 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Payments</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <FiChevronDown className="text-muted-foreground" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
