import { Router } from "express";
import Item from "../models/Item.js";

const router = Router();

// GET /api/items?search=&lowStock=true
router.get("/", async (req, res, next) => {
  try {
    const { search, lowStock } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { category: rx }, { location: rx }];
    }
    if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
    }
    const items = await Item.find(filter).sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post("/", async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/items/:id
router.put("/:id", async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/items/:id/stock  { change: -5 }  quick stock adjustment
router.patch("/:id/stock", async (req, res, next) => {
  try {
    const change = Number(req.body.change);
    if (!Number.isFinite(change)) return res.status(400).json({ message: "change must be a number" });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.quantity = Math.max(0, item.quantity + change);
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/items/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
