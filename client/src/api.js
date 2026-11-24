const BASE = `${import.meta.env.VITE_API_URL || ""}/api/items`;

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const getItems = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${BASE}${qs ? `?${qs}` : ""}`);
};
export const createItem = (item) => request(BASE, { method: "POST", body: JSON.stringify(item) });
export const updateItem = (id, item) => request(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(item) });
export const adjustStock = (id, change) =>
  request(`${BASE}/${id}/stock`, { method: "PATCH", body: JSON.stringify({ change }) });
export const deleteItem = (id) => request(`${BASE}/${id}`, { method: "DELETE" });
