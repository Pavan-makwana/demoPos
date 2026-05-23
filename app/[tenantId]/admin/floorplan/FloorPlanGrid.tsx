import { FiPlus, FiUsers, FiDownload } from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";

interface FloorPlanGridProps {
  currentZoneTables: any[];
  onCellClick: (position: number) => void;
  onDownloadSingleQR: (table: any) => void;
  activeOrders: any[];
  onOccupiedCellClick: (tableNumber: string, activeOrder: any) => void;
}

export default function FloorPlanGrid({
  currentZoneTables,
  onCellClick,
  onDownloadSingleQR,
  activeOrders,
  onOccupiedCellClick,
}: FloorPlanGridProps) {
  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-x-auto">
      <div
        className="grid min-w-[700px] gap-3 bg-muted p-4 rounded-2xl border border-border "
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: TOTAL_CELLS }).map((_, index) => {
          const table = currentZoneTables.find((t) => t.position === index);
          const activeOrder = table
            ? activeOrders.find((o) => o.tableNumber === table.number)
            : null;

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (table && activeOrder) {
                  onOccupiedCellClick(table.number, activeOrder);
                } else {
                  onCellClick(index);
                }
              }}
              className={`relative flex h-28 flex-col items-center justify-center rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                table
                  ? activeOrder
                    ? "border-rose-500 bg-rose-500/10 text-rose-600 shadow-md shadow-rose-500/10"
                    : "border-primary bg-primary/10 text-primary shadow-md shadow-primary/5 "
                  : "border-dashed border-border bg-transparent hover:border-primary hover:bg-primary/5"
              }`}
            >
              {table ? (
                <>
                  {activeOrder ? (
                    <div className="absolute top-1.5 left-2 flex items-center gap-1.5">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">
                        Occupied
                      </span>
                    </div>
                  ) : null}

                  <MdOutlineTableRestaurant
                    className={`mb-0.5 text-2xl ${
                      activeOrder ? "text-rose-500" : "opacity-80"
                    }`}
                  />
                  <span className="font-black tracking-tight text-sm">
                    {table.number}
                  </span>

                  {activeOrder ? (
                    <div className="mt-1 flex items-center gap-1 rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                      {activeOrder.items?.length || 0} Items • ₹{activeOrder.total?.toFixed(0)}
                    </div>
                  ) : (
                    <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] font-bold opacity-70">
                      <FiUsers /> {table.capacity}
                    </span>
                  )}

                  {!activeOrder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadSingleQR(table);
                      }}
                      title="Download QR"
                      className="absolute top-1 right-1 rounded-md bg-background/50 p-1 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <FiDownload size={12} />
                    </button>
                  )}
                </>
              ) : (
                <FiPlus className="text-2xl text-muted-foreground/40 " />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
