import { FiPrinter } from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { RiShoppingBag3Line } from "react-icons/ri";
import { TbCurrencyRupee } from "react-icons/tb";
import { BiSolidBank } from "react-icons/bi";
import { IoWalletOutline } from "react-icons/io5";

interface HistoryTableRowProps {
  order: any;
  handleReprint: (order: any) => void;
}

export default function HistoryTableRow({
  order,
  handleReprint,
}: HistoryTableRowProps) {
  const paymentIcon = (method: string) => {
    if (method === "upi") return <IoWalletOutline size={13} />;
    if (method === "cash") return <TbCurrencyRupee size={13} />;
    return <BiSolidBank size={13} />;
  };

  const paymentStyles: Record<string, string> = {
    upi: "bg-primary/10 text-primary border border-primary/20",
    cash: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
    card: "bg-primary/10 text-primary border border-primary/20",
  };

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted">
      <td className="px-5 py-4 font-mono font-bold text-primary text-xs">
        #{order.id.slice(-6).toUpperCase()}
      </td>
      <td className="px-5 py-4 text-muted-foreground tabular-nums text-xs">
        {order.createdAt?.toDate()
          ? order.createdAt
              .toDate()
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now"}
      </td>
      <td className="px-5 py-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {order.orderType === "dine_in" ? (
            <>
              <MdOutlineTableRestaurant size={12} /> Table {order.tableNumber}
            </>
          ) : (
            <>
              <RiShoppingBag3Line size={12} /> Takeaway
            </>
          )}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${paymentStyles[order.payment?.method] || paymentStyles["card"]}`}
          >
            {paymentIcon(order.payment?.method)}
            {order.payment?.method || "N/A"}
          </span>
          {order.payment?.method === "cash" &&
            order.payment?.amountTendered !== undefined &&
            order.payment?.changeGiven !== undefined && (
              <span className="text-[10px] text-muted-foreground font-medium">
                (Tend: ₹{order.payment.amountTendered} / Change: ₹{order.payment.changeGiven})
              </span>
            )}
        </div>
      </td>
      <td className="px-5 py-4 text-right font-bold text-foreground tabular-nums">
        ₹{order.total.toFixed(2)}
      </td>
      <td className="px-5 py-4 text-center">
        <button
          onClick={() => handleReprint(order)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-hover border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <FiPrinter size={13} />
          Reprint
        </button>
      </td>
    </tr>
  );
}
