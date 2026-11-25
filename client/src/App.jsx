import { useEffect, useMemo, useState } from "react";
import { getItems, createItem, updateItem, deleteItem, adjustStock } from "./api.js";
import ItemForm from "./ItemForm.jsx";
import Icon from "./Icon.jsx";

const LABEL = { ok: "In stock", low: "Low stock", out: "Out of stock" };
const TABS = [["all", "All"], ["ok", "In stock"], ["low", "Low stock"], ["out", "Out of stock"]];
const statusOf = (i) => (i.quantity === 0 ? "out" : i.quantity <= i.lowStockThreshold ? "low" : "ok");

function ago(date) {
  const s = Math.max(0, (Date.now() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState({ key: "updatedAt", dir: "desc" });
  const [editing, setEditing] = useState(null); // null | "new" | item
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

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
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const c = { all: items.length, ok: 0, low: 0, out: 0 };
    items.forEach((i) => c[statusOf(i)]++);
    return c;
  }, [items]);
  const units = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items]);
  const attention = items.filter((i) => statusOf(i) !== "ok");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => {
      if (status !== "all" && statusOf(i) !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;
      return [i.name, i.sku, i.category, i.location].some((f) => f?.toLowerCase().includes(q));
    });
    return list.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      const r = typeof x === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
      return sort.dir === "asc" ? r : -r;
    });
  }, [items, query, status, category, sort]);

  async function save(data) {
    if (editing === "new") {
      await createItem(data);
      setToast("Item added");
    } else {
      await updateItem(editing._id, data);
      setToast("Changes saved");
    }
    setEditing(null);
    load();
  }

  async function remove() {
    const target = confirm;
    setConfirm(null);
    try {
      await deleteItem(target._id);
      setToast(`Deleted ${target.name}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function nudge(item, change) {
    try {
      const updated = await adjustStock(item._id, change);
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } catch (err) {
      setError(err.message);
    }
  }

  const Th = ({ k, children, num }) => (
    <th className={num ? "num" : ""} aria-sort={sort.key === k ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button className="sort" onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === "asc" ? "desc" : "asc" }))}>
        {children}
        {sort.key === k && <Icon name={sort.dir === "asc" ? "up" : "down"} size={13} />}
      </button>
    </th>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo"><Icon name="box" size={20} /></span>
            <div>
              <strong>Stockroom</strong>
              <small>Warehouse Inventory Management</small>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={16} /> Add item
          </button>
        </div>
      </header>

      <main className="page">
        <div className="kpis">
          <div className="kpi">
            <span className="kpi-label">Total items</span>
            <strong>{counts.all}</strong>
            <span className="kpi-note">{categories.length} {categories.length === 1 ? "category" : "categories"}</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Units on hand</span>
            <strong>{units.toLocaleString()}</strong>
            <span className="kpi-note">Across all locations</span>
          </div>
          <button className="kpi kpi-warn" onClick={() => setStatus("low")}>
            <span className="kpi-label">Low stock</span>
            <strong>{counts.low}</strong>
            <span className="kpi-note">At or below reorder level</span>
          </button>
          <button className="kpi kpi-bad" onClick={() => setStatus("out")}>
            <span className="kpi-label">Out of stock</span>
            <strong>{counts.out}</strong>
            <span className="kpi-note">Needs immediate restock</span>
          </button>
        </div>

        {attention.length > 0 && (
          <div className="banner" role="alert">
            <Icon name="alert" />
            <p>
              <strong>{attention.length} {attention.length === 1 ? "item needs" : "items need"} restocking.</strong>{" "}
              {attention.slice(0, 3).map((i) => i.name).join(", ")}
              {attention.length > 3 && ` and ${attention.length - 3} more`}
            </p>
            <button className="btn btn-small" onClick={() => setStatus(counts.low ? "low" : "out")}>Review</button>
          </div>
        )}

        {error && <p className="page-error">{error}</p>}

        <section className="card">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" size={16} />
              <input type="search" placeholder="Search name, SKU, category or location" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="tabs" role="tablist">
            {TABS.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={status === key} className={status === key ? "tab active" : "tab"} onClick={() => setStatus(key)}>
                {label} <span className="count">{counts[key]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <p className="empty">Loading inventory...</p>
          ) : rows.length === 0 ? (
            <p className="empty">
              {items.length === 0 ? "No items yet. Add your first warehouse item to start tracking stock." : "No items match your filters."}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <Th k="name">Item</Th>
                    <Th k="sku">SKU</Th>
                    <th>Location</th>
                    <Th k="quantity" num>Stock level</Th>
                    <Th k="lowStockThreshold" num>Reorder at</Th>
                    <th>Status</th>
                    <Th k="updatedAt">Updated</Th>
                    <th><span className="sr">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const s = statusOf(item);
                    const pct = Math.min(100, Math.round((item.quantity / Math.max(1, item.lowStockThreshold * 3)) * 100));
                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="item-name">{item.name}</div>
                          <div className="item-cat">{item.category}</div>
                        </td>
                        <td className="mono">{item.sku}</td>
                        <td>{item.location || "-"}</td>
                        <td className="num">
                          <div className="stock">
                            <button className="step" aria-label={`Remove one ${item.name}`} onClick={() => nudge(item, -1)} disabled={item.quantity === 0}>-</button>
                            <div className="stock-main">
                              <span className="qty">{item.quantity} <small>{item.unit}</small></span>
                              <span className="bar"><span className={`fill ${s}`} style={{ width: `${pct}%` }} /></span>
                            </div>
                            <button className="step" aria-label={`Add one ${item.name}`} onClick={() => nudge(item, 1)}>+</button>
                          </div>
                        </td>
                        <td className="num">{item.lowStockThreshold}</td>
                        <td><span className={`badge ${s}`}>{LABEL[s]}</span></td>
                        <td className="muted">{ago(item.updatedAt)}</td>
                        <td>
                          <div className="actions">
                            <button className="icon-btn" aria-label={`Edit ${item.name}`} onClick={() => setEditing(item)}><Icon name="edit" size={16} /></button>
                            <button className="icon-btn danger" aria-label={`Delete ${item.name}`} onClick={() => setConfirm(item)}><Icon name="trash" size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && rows.length > 0 && <p className="footnote">Showing {rows.length} of {items.length} items</p>}
        </section>
      </main>

      {editing && <ItemForm item={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />}

      {confirm && (
        <div className="overlay center" onClick={() => setConfirm(null)}>
          <div className="dialog" role="alertdialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete item?</h3>
            <p><strong>{confirm.name}</strong> ({confirm.sku}) will be permanently removed from inventory. This cannot be undone.</p>
            <div className="dialog-actions">
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={remove}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
