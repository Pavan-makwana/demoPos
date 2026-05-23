import { FiSave, FiLoader, FiDownload } from "react-icons/fi";
interface FloorPlanHeaderProps {
  zones: string[];
  activeZone: string;
  setActiveZone: (zone: string) => void;
  onSave: () => void;
  isSaving: boolean;
  onDownloadAllQRs: () => void;
}
export default function FloorPlanHeader({
  zones,
  activeZone,
  setActiveZone,
  onSave,
  isSaving,
  onDownloadAllQRs,
}: FloorPlanHeaderProps) {
  return (
    <>
      {" "}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            Floor Planner
          </h1>{" "}
          <p className="text-sm text-muted-foreground">
            Design your layout and assign tables for Dine-in and QR ordering.
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadAllQRs}
            className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-6 py-3 font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
          >
            <FiDownload className="text-xl" />
            Download QRs
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
          >
            {isSaving ? (
              <FiLoader className="animate-spin" />
            ) : (
              <FiSave className="text-xl" />
            )}
            {isSaving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>
      <div className="mb-6 flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">

        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`whitespace-nowrap rounded-xl px-6 py-3 text-sm font-bold transition-all ${activeZone === zone ? "bg-primary text-primary-foreground shadow-md " : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {zone}
          </button>
        ))}
      </div>
    </>
  );
}
