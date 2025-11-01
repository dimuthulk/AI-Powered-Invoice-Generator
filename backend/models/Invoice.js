const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxPercentage: { type: Number, required: true },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    billFrom: {
      businessName: String,
      email: String,
      address: String,
      phone: String,
    },
    billTo: {
      clientName: String,
      email: String,
      address: String,
      phone: String,
    },
    items: [itemSchema],
    notes: { type: String },
    paymentTerms: { type: String, default: "Net 15" },
    status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
    subtotal: Number,
    taxTotal: Number,
    total: Number,
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
