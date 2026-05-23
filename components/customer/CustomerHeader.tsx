import { FiCheckCircle } from "react-icons/fi";

interface CustomerHeaderProps {
  tableNumber: string;
  orderSuccess: boolean;
}

export default function CustomerHeader({
  tableNumber,
  orderSuccess,
}: CustomerHeaderProps) {
  return (
    <>
      <div className="bg-card px-5 py-6 shadow-sm border-b border-border">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          Ladoo
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-1">
          Ordering for Table
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md ml-1">
            {tableNumber}
          </span>
        </p>
      </div>

      {orderSuccess && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700 shadow-sm border border-emerald-200 animate-fade-in-down">
          <FiCheckCircle className="text-2xl shrink-0" />
          <div>
            <p className="font-bold text-sm">Order sent to kitchen!</p>
            <p className="text-xs opacity-80">Your food is being prepared.</p>
          </div>
        </div>
      )}
    </>
  );
}
