import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    sku: { type: String, required: [true, "SKU is required"], unique: true, trim: true, uppercase: true },
    category: { type: String, trim: true, default: "General" },
    location: { type: String, trim: true, default: "" }, // e.g. "Aisle 4 / Shelf B"
    quantity: { type: Number, required: true, min: [0, "Quantity cannot be negative"], default: 0 },
    lowStockThreshold: { type: Number, min: [0, "Threshold cannot be negative"], default: 10 },
    unit: { type: String, trim: true, default: "pcs" },
  },
  { timestamps: true }
);

// Virtual flag used by the API and UI
itemSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});
itemSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Item", itemSchema);
