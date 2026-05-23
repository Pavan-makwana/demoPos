"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";
import FloorPlanHeader from "./FloorPlanHeader";
import FloorPlanGrid from "./FloorPlanGrid";
import TableModal from "./TableModal";
import { useAuth } from "../../../../lib/AuthContext";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-hot-toast";


export default function FloorPlanner() {
  const { tenantId, features } = useAuth();

  if (features && features.qrMenu === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-6 font-['DM_Sans',sans-serif]">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 mb-2">
          <FiAlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-black text-rose-600">Module Disabled</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The Floor Plan & QR Self-Ordering module has been deactivated for your workspace by the SaaS Super Admin.
        </p>
      </div>
    );
  }

  const [zones, setZones] = useState(["Main Dining", "Patio", "Balcony"]);
  const [activeZone, setActiveZone] = useState("Main Dining");
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);


  useEffect(() => {
    const fetchFloorPlan = async () => {
      if (!tenantId) return;
      const planRef = doc(db, "floorplans", tenantId);
      const snap = await getDoc(planRef);
      if (snap.exists()) {
        setTables(snap.data().tables || []);
        if (snap.data().zones) setZones(snap.data().zones);
      }
      setLoading(false);
    };
    fetchFloorPlan();
  }, [tenantId]);

  const handleSavePlan = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "floorplans", tenantId), {
        tenantId,
        zones,
        tables,
        updatedAt: new Date(),
      });
      toast.success("Floor plan saved successfully!");
    } catch (error) {
      toast.error("Failed to save floor plan.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveTable = (tableData: { number: string; capacity: number }) => {
    if (selectedPosition === null) return;
    const newTable = {
      id: `${activeZone}-${selectedPosition}`,
      zone: activeZone,
      position: selectedPosition,
      number: tableData.number,
      capacity: Number(tableData.capacity),
    };
    setTables((prev) => {
      const filtered = prev.filter((t) => t.id !== newTable.id);
      return [...filtered, newTable];
    });
    setSelectedPosition(null);
  };
  const handleDeleteTable = () => {
    if (selectedPosition === null) return;
    setTables((prev) =>
      prev.filter(
        (t) => !(t.position === selectedPosition && t.zone === activeZone),
      ),
    );
    setSelectedPosition(null);
  };

  const getQRUrl = (tableNumber: string) => {
    return `${window.location.origin}/menu/${tenantId}/${tableNumber}`;
  };

  const downloadAllQRs = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    tables.forEach((table, index) => {
      const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
      if (canvas) {
        if (index > 0) pdf.addPage();
        const imgData = canvas.toDataURL("image/png");
        // Center the QR code
        pdf.setFontSize(20);
        pdf.text(`Table ${table.number}`, 105, 40, { align: "center" });
        pdf.addImage(imgData, "PNG", 55, 60, 100, 100);
        pdf.setFontSize(14);
        pdf.text("Scan to order", 105, 175, { align: "center" });
      }
    });
    pdf.save("All_Tables_QRs.pdf");
  };

  const downloadSingleQR = (table: any) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
    if (canvas) {
      const imgData = canvas.toDataURL("image/png");
      pdf.setFontSize(20);
      pdf.text(`Table ${table.number}`, 105, 40, { align: "center" });
      pdf.addImage(imgData, "PNG", 55, 60, 100, 100);
      pdf.setFontSize(14);
      pdf.text("Scan to order", 105, 175, { align: "center" });
      pdf.save(`Table_${table.number}_QR.pdf`);
    }
  };
  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <FiLoader className="animate-spin text-2xl text-primary" />
      </div>
    );
  const currentZoneTables = tables.filter((t) => t.zone === activeZone);
  const existingTableForModal = currentZoneTables.find(
    (t) => t.position === selectedPosition,
  );
  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-8 ">

      <FloorPlanHeader
        zones={zones}
        activeZone={activeZone}
        setActiveZone={setActiveZone}
        onSave={handleSavePlan}
        isSaving={isSaving}
        onDownloadAllQRs={downloadAllQRs}
      />
      <FloorPlanGrid
        currentZoneTables={currentZoneTables}
        onCellClick={setSelectedPosition}
        onDownloadSingleQR={downloadSingleQR}
        activeOrders={[]}
        onOccupiedCellClick={() => { }}
      />
      <TableModal
        isOpen={selectedPosition !== null}
        position={selectedPosition}
        existingTable={existingTableForModal}
        onClose={() => setSelectedPosition(null)}
        onSave={handleSaveTable}
        onDelete={handleDeleteTable}
        onDownloadQR={() => {
          if (existingTableForModal) downloadSingleQR(existingTableForModal);
        }}
      />

      {/* Hidden QR Codes for Canvas Generation */}
      <div className="hidden">
        {tables.map((table) => (
          <QRCodeCanvas
            key={table.id}
            id={`qr-${table.id}`}
            value={getQRUrl(table.number)}
            size={512}
            level="H"
          />
        ))}
      </div>
    </div>
  );
}
