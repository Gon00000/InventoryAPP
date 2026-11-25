import mongoose from "mongoose";

const whole = { validator: Number.isInteger, message: "{PATH} must be a whole number" };

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    sku: { type: String, required: [true, "SKU is required"], unique: true, trim: true, uppercase: true },
    category: { type: String, trim: true, default: "General" },
    location: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: [0, "Quantity cannot be negative"], validate: whole, default: 0 },
    lowStockThreshold: { type: Number, min: [0, "Threshold cannot be negative"], validate: whole, default: 10 },
    unit: { type: String, trim: true, default: "pcs" },
  },
  { timestamps: true }
);

itemSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});
itemSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Item", itemSchema);
