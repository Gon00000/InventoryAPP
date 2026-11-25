import { useEffect, useId, useState } from "react";
import Icon from "./Icon.jsx";

const empty = { name: "", sku: "", category: "", location: "", quantity: "0", lowStockThreshold: "10", unit: "pcs" };

function makeSku(category) {
  const p = (category || "ITM").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  return `${p}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function NumberField({ label, value, onChange, hint, quick = [] }) {
  const id = useId();
  const n = Number(value) || 0;
  const set = (v) => onChange(String(Math.max(0, Math.round(v))));
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
        <button type="button" className="step" aria-label="Decrease" onClick={() => set(n - 1)}>-</button>
        <input id={id} required inputMode="numeric" pattern="[0-9]*" style={{ textAlign: "center" }}
          value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
        <button type="button" className="step" aria-label="Increase" onClick={() => set(n + 1)}>+</button>
      </div>
      {quick.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {quick.map((q) => (
            <button type="button" key={q} className="step" style={{ width: "auto", padding: "0 10px" }} onClick={() => set(n + q)}>+{q}</button>
          ))}
        </div>
      )}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export default function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(
    item ? { ...empty, ...item, quantity: String(item.quantity), lowStockThreshold: String(item.lowStockThreshold) } : empty
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setNum = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Item name is required");
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim() || "General",
        location: form.location.trim(),
        unit: form.unit.trim() || "pcs",
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
            <div>
              <label htmlFor="sku">SKU</label>
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                <input id="sku" required value={form.sku} onChange={set("sku")} placeholder="DRL-18V-01" />
                <button type="button" className="btn btn-small" onClick={() => setForm({ ...form, sku: makeSku(form.category) })}>Auto</button>
              </div>
            </div>
            <label>Category
              <input value={form.category} onChange={set("category")} placeholder="General" />
            </label>
          </div>
          <label>Bin location
            <input value={form.location} onChange={set("location")} placeholder="Aisle 4, Shelf B" />
          </label>

          <p className="section-title">Stock</p>
          <div className="row2">
            <NumberField label="Quantity on hand" value={form.quantity} onChange={setNum("quantity")} quick={[10, 50]} />
            <label>Unit
              <input value={form.unit} onChange={set("unit")} />
            </label>
          </div>
          <NumberField label="Reorder level" value={form.lowStockThreshold} onChange={setNum("lowStockThreshold")}
            hint="You are alerted when stock falls to this number or below." />
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
