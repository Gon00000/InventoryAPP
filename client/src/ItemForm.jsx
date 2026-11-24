import { useState } from "react";

const empty = { name: "", sku: "", category: "", location: "", quantity: 0, lowStockThreshold: 10, unit: "pcs" };

export default function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...empty, ...item } : empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: form.name,
        sku: form.sku,
        category: form.category || "General",
        location: form.location,
        unit: form.unit || "pcs",
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2>{item ? "Edit item" : "Add item"}</h2>
        <div className="grid">
          <label className="span2">Item name
            <input required value={form.name} onChange={set("name")} autoFocus />
          </label>
          <label>SKU
            <input required value={form.sku} onChange={set("sku")} />
          </label>
          <label>Category
            <input value={form.category} onChange={set("category")} placeholder="General" />
          </label>
          <label className="span2">Bin location
            <input value={form.location} onChange={set("location")} placeholder="Aisle 4, Shelf B" />
          </label>
          <label>Quantity in stock
            <input type="number" min="0" required value={form.quantity} onChange={set("quantity")} />
          </label>
          <label>Unit
            <input value={form.unit} onChange={set("unit")} />
          </label>
          <label className="span2">Alert me when stock falls to
            <input type="number" min="0" required value={form.lowStockThreshold} onChange={set("lowStockThreshold")} />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? "Saving…" : item ? "Save changes" : "Add item"}</button>
        </div>
      </form>
    </div>
  );
}
