import { useEffect, useMemo, useState } from "react";
import { getItems, createItem, updateItem, deleteItem, adjustStock } from "./api.js";
import ItemForm from "./ItemForm.jsx";

export default function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | item
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await getItems());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const lowItems = useMemo(() => items.filter((i) => i.isLowStock), [items]);
  const outCount = items.filter((i) => i.quantity === 0).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (onlyLow && !i.isLowStock) return false;
      if (!q) return true;
      return [i.name, i.sku, i.category, i.location].some((f) => f?.toLowerCase().includes(q));
    });
  }, [items, search, onlyLow]);

  async function save(data) {
    if (editing === "new") await createItem(data);
    else await updateItem(editing._id, data);
    setEditing(null);
    load();
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    try { await deleteItem(item._id); load(); } catch (err) { setError(err.message); }
  }

  async function nudge(item, change) {
    try {
      const updated = await adjustStock(item._id, change);
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Stockroom</h1>
          <p className="sub">{items.length} items tracked · {outCount} out of stock</p>
        </div>
        <button className="btn primary" onClick={() => setEditing("new")}>Add item</button>
      </header>

      {lowItems.length > 0 && (
        <div className="alert" role="alert">
          <strong>{lowItems.length} {lowItems.length === 1 ? "item needs" : "items need"} restocking:</strong>{" "}
          {lowItems.slice(0, 4).map((i) => i.name).join(", ")}
          {lowItems.length > 4 && ` and ${lowItems.length - 4} more`}
          <button className="link" onClick={() => setOnlyLow(true)}>Show only these</button>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, SKU, category or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="check">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="empty">Loading inventory…</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {items.length === 0 ? "No items yet. Add your first warehouse item to start tracking stock." : "No items match your filters."}
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>SKU</th><th>Category</th><th>Location</th>
                <th className="num">Stock</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const out = item.quantity === 0;
                return (
                  <tr key={item._id} className={item.isLowStock ? "low" : ""}>
                    <td className="name">{item.name}</td>
                    <td className="mono">{item.sku}</td>
                    <td>{item.category}</td>
                    <td>{item.location || "—"}</td>
                    <td className="num">
                      <div className="stepper">
                        <button aria-label={`Remove one ${item.name}`} onClick={() => nudge(item, -1)} disabled={out}>−</button>
                        <span><b>{item.quantity}</b> <small>{item.unit}</small></span>
                        <button aria-label={`Add one ${item.name}`} onClick={() => nudge(item, 1)}>+</button>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${out ? "out" : item.isLowStock ? "warn" : "ok"}`}>
                        {out ? "Out of stock" : item.isLowStock ? `Low (≤ ${item.lowStockThreshold})` : "In stock"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="btn small ghost" onClick={() => setEditing(item)}>Edit</button>
                      <button className="btn small danger" onClick={() => remove(item)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ItemForm item={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
