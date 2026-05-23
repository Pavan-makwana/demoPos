import { useEffect, useState } from 'react';
import { FiTrash2, FiDownload } from 'react-icons/fi';

interface TableModalProps {
  isOpen: boolean;
  position: number | null;
  existingTable: any | undefined;
  onClose: () => void;
  onSave: (data: { number: string; capacity: number }) => void;
  onDelete: () => void;
  onDownloadQR: () => void;
}

export default function TableModal({ isOpen, position, existingTable, onClose, onSave, onDelete, onDownloadQR }: TableModalProps) {
  const [tableForm, setTableForm] = useState({ number: '', capacity: 2 });

  // Update local form state when a new cell is clicked
  useEffect(() => {
    if (existingTable) {
      setTableForm({ number: existingTable.number, capacity: existingTable.capacity });
    } else {
      setTableForm({ number: '', capacity: 2 });
    }
  }, [existingTable, position]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tableForm);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground">
            {existingTable ? 'Edit Table' : 'Place Table'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Table Name / Number</label>
            <input
              required
              type="text"
              value={tableForm.number}
              onChange={e => setTableForm({...tableForm, number: e.target.value})}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
              placeholder="e.g. T4 or Window-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Seating Capacity</label>
            <input
              required
              type="number"
              min="1"
              value={tableForm.capacity}
              onChange={e => setTableForm({...tableForm, capacity: Number(e.target.value)})}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
              placeholder="2"
            />
          </div>
          <div className="mt-8 flex gap-3 pt-4">
            {existingTable && (
              <>
                <button
                  type="button"
                  onClick={onDownloadQR}
                  title="Download QR Code"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200"
                >
                  <FiDownload className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  title="Delete Table"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200"
                >
                  <FiTrash2 className="text-lg" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-muted font-bold text-foreground hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
            >
              Save Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}