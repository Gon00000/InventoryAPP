import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

const empty = { name: "", sku: "", category: "", location: "", quantity: 0, lowStockThreshold: 10, unit: "pcs" };

export default function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...empty, ...item } : empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

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
      <form className="drawer" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{item ? "Edit item" : "Add item"}</h2>
            <p>{item ? "Update details and stock levels." : "Register a new warehouse item."}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><Icon name="close" /></button>
        </header>

        <div className="drawer-body">
          <p className="section-title">Item details</p>
          <label>Item name
            <input required value={form.name} onChange={set("name")} autoFocus />
          </label>
          <div className="row2">
            <label>SKU
              <input required value={form.sku} onChange={set("sku")} placeholder="DRL-18V-01" />
            </label>
            <label>Category
              <input value={form.category} onChange={set("category")} placeholder="General" />
            </label>
          </div>
          <label>Bin location
            <input value={form.location} onChange={set("location")} placeholder="Aisle 4, Shelf B" />
          </label>

          <p className="section-title">Stock</p>
          <div className="row2">
            <label>Quantity on hand
              <input type="number" min="0" required value={form.quantity} onChange={set("quantity")} />
            </label>
            <label>Unit
              <input value={form.unit} onChange={set("unit")} />
            </label>
          </div>
          <label>Reorder level
            <input type="number" min="0" required value={form.lowStockThreshold} onChange={set("lowStockThreshold")} />
            <span className="hint">You are alerted when stock falls to this number or below.</span>
          </label>
          {error && <p className="form-error">{error}</p>}
        </div>

        <footer className="drawer-foot">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : item ? "Save changes" : "Add item"}</button>
        </footer>
      </form>
    </div>
  );
}
