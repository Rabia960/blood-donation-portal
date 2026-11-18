import { useEffect, useState } from "react";
import {
  getInventory,
  updateInventory,
  type InventoryItem,
  type Center,
} from "../api";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function InventoryPanel({ centers }: { centers: Center[] }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [centerId, setCenterId] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [units, setUnits] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getInventory();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  useEffect(() => {
    const selected = items.find(
      (item) =>
        String(item.center_id) === centerId &&
        item.blood_group === bloodGroup
    );
    setUnits(String(selected?.units ?? 0));
  }, [items, centerId, bloodGroup]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedUnits = Number(units);

    if (!centerId || !Number.isInteger(parsedUnits) || parsedUnits < 0 || parsedUnits > 100000) {
      setError("Select a centre and enter a whole number from 0 to 100000.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await updateInventory(Number(centerId), bloodGroup, parsedUnits);
      setMessage("Inventory updated successfully.");
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update inventory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 space-y-5 text-left">
      <p className="text-sm text-stone-600">
        Demo inventory management. Stock figures must be verified by the blood centre.
      </p>

      <form onSubmit={handleSave} className="space-y-3 rounded-xl border border-stone-200 p-4">
        <label className="block text-sm font-semibold">
          Select centre
          <select
            className="mt-2 w-full rounded-lg border p-3"
            value={centerId}
            onChange={(event) => setCenterId(event.target.value)}
            required
          >
            <option value="">Choose a centre</option>
            {centers.filter((center) => center.active).map((center) => (
              <option key={center.id} value={center.id}>
                {center.name} — {center.city}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Blood group
          <select
            className="mt-2 w-full rounded-lg border p-3"
            value={bloodGroup}
            onChange={(event) => setBloodGroup(event.target.value)}
          >
            {bloodGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Available units
          <input
            className="mt-2 w-full rounded-lg border p-3"
            type="number"
            min="0"
            max="100000"
            step="1"
            value={units}
            onChange={(event) => setUnits(event.target.value)}
            required
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}

        <button className="dialog-action" type="submit" disabled={saving || !centerId}>
          {saving ? "Saving..." : "Save stock update"}
        </button>
      </form>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Current centre inventory</h3>
          <button
            type="button"
            className="text-sm font-semibold text-emerald-700"
            onClick={() => void loadInventory()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-stone-500">No inventory records found.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.center_name}</p>
                  <p className="text-xs text-stone-500">{item.city} · {item.blood_group}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold">{item.units} units</p>
                  <p className="text-xs text-stone-500">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
