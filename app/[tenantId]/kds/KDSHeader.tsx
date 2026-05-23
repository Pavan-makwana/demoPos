import { FiClock, FiCoffee } from "react-icons/fi";

interface KDSHeaderProps {
  ticketCount: number;
  currentTime: string;
}

export default function KDSHeader({
  ticketCount,
  currentTime,
}: KDSHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
          <FiCoffee size={22} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-amber-400 uppercase">
            Kitchen Display
          </h1>
          <p className="text-xs text-muted-foreground tracking-wider">
            Live Order Queue
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-red-400 font-bold text-sm">
            {ticketCount} Active
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted border border-border px-4 py-2">
          <FiClock size={14} className="text-muted-foreground" />
          <span className="font-mono text-foreground text-sm tabular-nums">
            {currentTime}
          </span>
        </div>
      </div>
    </div>
  );
}
