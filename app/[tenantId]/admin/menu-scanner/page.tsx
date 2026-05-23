"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { FiUploadCloud, FiCpu, FiCheckCircle, FiSave, FiList } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../../../lib/AuthContext";
import { toast } from "react-hot-toast";

export default function MenuScannerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { tenantId } = useAuth();

  // Convert the image to Base64 so we can send it to our API
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedItems([]); // Reset if they upload a new image
  };

  const handleScanMenu = async () => {
    if (!imageFile) return;
    setIsScanning(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(",")[1];

        // Send to our Next.js API route
        const res = await fetch("/api/scan-menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64String }),
        });

        const result = await res.json();

        if (result.success) {
          setExtractedItems(result.data);
          toast.success("Menu scanned successfully!");
        } else {
          toast.error("Error: " + result.error);
        }
        setIsScanning(false);
      };
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong during the scan.");
      setIsScanning(false);
    }
  };

  const publishToFirebase = async () => {
    if (extractedItems.length === 0) return;
    if (!tenantId) {
      toast.error("Tenant ID is missing.");
      return;
    }
    setIsSaving(true);

    try {
      
      // Save every item to the "menus" collection
      for (const item of extractedItems) {
        await addDoc(collection(db, "menus"), {
          tenantId,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          description: item.description,
          isAvailable: true,
          createdAt: serverTimestamp(),
        });
      }

      toast.success(`Successfully published ${extractedItems.length} items to your POS Menu!`);
      setExtractedItems([]);
      setImageFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save to database.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background p-8 font-['DM_Sans',sans-serif]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <FiCpu className="text-purple-500" /> AI Menu Importer
          </h1>
          <p className="text-muted-foreground mt-1">Upload a photo of a physical menu and let AI do the data entry.</p>
        </div>
        <Link href="/admin" className="rounded-xl bg-muted px-6 py-3 font-bold text-foreground hover:bg-hover transition-colors">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: UPLOAD & PREVIEW */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
          <h2 className="text-xl font-bold text-foreground mb-4">1. Upload Image</h2>
          
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-12 text-center cursor-pointer hover:bg-primary/10 transition-colors">
              <FiUploadCloud size={48} className="text-primary mb-4" />
              <span className="text-lg font-bold text-foreground">Click to upload menu photo</span>
              <span className="text-sm text-muted-foreground mt-2">JPEG, PNG up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="space-y-4">
              <img src={previewUrl} alt="Menu Preview" className="w-full rounded-2xl border border-border max-h-[400px] object-contain bg-black/50" />
              <div className="flex gap-3">
                <button onClick={() => { setPreviewUrl(null); setImageFile(null); }} className="flex-1 rounded-xl bg-muted py-3 font-bold text-foreground hover:bg-hover transition-colors">
                  Choose Different Image
                </button>
                <button onClick={handleScanMenu} disabled={isScanning} className="flex-1 rounded-xl bg-purple-600 py-3 font-bold text-white shadow-lg shadow-purple-900/30 hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isScanning ? <FiCpu className="animate-spin" /> : <FiCpu />}
                  {isScanning ? "AI is Scanning..." : "Scan Menu with AI"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EXTRACTED DATA */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FiList className="text-emerald-500" /> 2. Verify & Publish
            </h2>
            <span className="rounded-md bg-muted px-3 py-1 text-xs font-bold text-muted-foreground border border-border">
              {extractedItems.length} Items Found
            </span>
          </div>

          {extractedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-12">
              <FiCheckCircle size={48} className="mb-4 opacity-20" />
              <p>Scan a menu image to see the extracted items here.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto max-h-[400px] rounded-xl border border-border bg-muted/50 p-2 mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3 font-semibold">Item Name</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extractedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted transition-colors">
                        <td className="p-3 font-bold text-foreground">{item.name}</td>
                        <td className="p-3 text-muted-foreground"><span className="bg-background border border-border px-2 py-1 rounded text-[10px]">{item.category}</span></td>
                        <td className="p-3 font-black text-emerald-400 text-right tabular-nums">₹{item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={publishToFirebase} disabled={isSaving} className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
                <FiSave />
                {isSaving ? "Publishing to POS..." : `Publish ${extractedItems.length} Items to POS`}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}