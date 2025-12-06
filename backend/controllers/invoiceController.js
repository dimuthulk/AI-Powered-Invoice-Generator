const Invoice = require("../models/Invoice");

// @desc   Create a new invoice
// @route  POST /api/invoices
// @access Private

exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentTerms,
    } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Invoice must include at least one item" });
    }

    // Normalize items and calculate per-item totals, subtotal and taxTotal
    let subtotal = 0;
    let taxTotal = 0;

    const normalizedItems = items.map((item) => {
      const name = item.name;
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      // support both `taxPercent` (old clients) and `taxPercentage` (schema)
      const taxPercentage =
        item.taxPercentage != null ? Number(item.taxPercentage) : 0;

      const lineSubtotal = unitPrice * quantity;
      const lineTax = (lineSubtotal * (taxPercentage || 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        name,
        quantity,
        unitPrice,
        taxPercentage,
        total: lineTotal,
      };
    });

    const total = subtotal + taxTotal;

    const invoice = new Invoice({
      user: userId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      items: normalizedItems,
      notes,
      paymentTerms,
      subtotal,
      taxTotal,
      total,
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

// @desc   Get all invoices for the logged-in user
// @route  GET /api/invoices
// @access Private
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id }).populate(
      "user",
      "name email"
    );
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

// @desc   Get a single invoice by ID
// @route  GET /api/invoices/:id
// @access Private
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    // Check if the invoice belongs to the user
    if (invoice.user._id.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

// @desc   Update an invoice
// @route  PUT /api/invoices/:id
// @access Private
exports.updateInvoice = async (req, res) => {
  try {
    const user = req.user;
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      items,
      notes,
      paymentTerms,
      status,
    } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Invoice must include at least one item" });
    }

    // Normalize items and calculate per-item totals, subtotal and taxTotal
    let subtotal = 0;
    let taxTotal = 0;

    const normalizedItems = items.map((item) => {
      const name = item.name;
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      // support both `taxPercent` (old clients) and `taxPercentage` (schema)
      const taxPercentage =
        item.taxPercentage != null
          ? Number(item.taxPercentage)
          : item.taxPercent != null
          ? Number(item.taxPercent)
          : 0;

      const lineSubtotal = unitPrice * quantity;
      const lineTax = (lineSubtotal * (taxPercentage || 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        name,
        quantity,
        unitPrice,
        taxPercentage,
        total: lineTotal,
      };
    });

    const total = subtotal + taxTotal;

    // Find existing invoice and update fields
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // ensure the stored user field is the requesting user's id
    invoice.user = req.user?.id || req.user?._id || req.user;
    invoice.invoiceNumber = invoiceNumber;
    invoice.invoiceDate = invoiceDate;
    invoice.dueDate = dueDate;
    invoice.billFrom = billFrom;
    invoice.billTo = billTo;
    invoice.items = normalizedItems;
    invoice.notes = notes;
    invoice.paymentTerms = paymentTerms;
    if (status != null) invoice.status = status;
    invoice.subtotal = subtotal;
    invoice.taxTotal = taxTotal;
    invoice.total = total;

    await invoice.save();
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// @desc   Delete an invoice
// @route  DELETE /api/invoices/:id
// @access Private
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};
