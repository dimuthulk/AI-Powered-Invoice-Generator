import { GoogleGenAI } from "@google/genai";
import Invoice from "../models/Invoice.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const parseInvoiceFromText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text input is required" });
  }
  try {
    const prompt = `You are an expert invoice data extraction AI. Analyze the following text and extract the relevant information to create an invoice.
    The output must be a valid JSON object.
    
    The JSON object should have the following structure:
    {
    "clientName": "string",
    "email": "string (if available)",
    "address": "string (if available)",
    "items": [{
      "name": "string",
      "quantity": "number",
      "unitprice": "number"
    ]
    }
    
    Here is the text to parse
    ------- TEXT START -------
    ${text}
    ------- TEXT END -------
    
    Extract the data and provide only the JSON object.`;

    // Allow model override from env; don't hardcode cutting-edge names here
    const modelName = process.env.GOOGLE_GENAI_MODEL || "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    let responseText = response.text;

    if (typeof responseText !== "string") {
      if (typeof response.text === "function") {
        responseText = response.text();
      } else {
        throw new Error("Unexpected response format from AI model");
      }
    }

    const clearedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(clearedJson);
    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error parsing invoice text with AI:", error);

    // If model not found, try to list available models to help debugging
    let modelList = null;
    try {
      if (ai && ai.models) {
        if (typeof ai.models.list === "function") {
          modelList = await ai.models.list();
        } else if (typeof ai.models.listModels === "function") {
          modelList = await ai.models.listModels();
        }
      }
    } catch (listErr) {
      console.error("Error listing available models:", listErr);
    }

    const details = (error && error.message) || String(error);
    res.status(500).json({
      message: "Failed to parse invoice data from text",
      details,
      availableModels: modelList || undefined,
      note: "If you see a 404 about the model, set GOOGLE_GENAI_MODEL to a supported model name (see availableModels)",
    });
  }
};

const generateReminderEmail = async (req, res) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID is required" });
  }
  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    const prompt = `You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.
    
    Use the following details to personalize the email:
    - Client Name: ${invoice.billTo.clientName}
    - Invoice Number: ${invoice.invoiceNumber}
    - Amount Due: $${invoice.total.toFixed(2)}
    - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
    
    The tone should be friendly but clear. Keep it concise. Start the email with "Subject"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({ reminderText: response.text });
  } catch (error) {
    console.error("Error generating reminder email with AI:", error);
    res.status(500).json({
      message: "Failed to generate reminder email",
      details: error.message,
    });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id });

    if (invoices.length === 0) {
      return res.status(200).json({
        insights: ["No invoice data available to generate insights."],
      });
    }

    // Process anf summarize data
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
    const unpaidInvoices = invoices.filter((inv) => inv.status !== "Paid");
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalOutstanding = unpaidInvoices.reduce(
      (acc, inv) => acc + inv.total,
      0
    );

    const dataSummary = `
    - Total number of invoices: ${totalInvoices}
    - Total paid invoices: ${paidInvoices.length}
    - Total unpaid invoices: ${unpaidInvoices.length}
    - Total revenue from paid invoices: $${totalRevenue.toFixed(2)}
    - Total outstanding amount from unpaid/pending invoices: $${totalOutstanding.toFixed(
      2
    )}
    - Recent invoices (last 5): ${invoices
      .slice(0, 5)
      .map(
        (inv) =>
          `Invoice #${inv.invoiceNumber} for ${inv.total.toFixed(
            2
          )} with status ${inv.status}`
      )
      .join(", ")}`;

    const prompt = `
    You are a friendly and insightful financial analyst for a small business owner.
    Based on the following summary of their invoice data, provide 2-3 concise and actionable insights.
    Each insight should be a short string in a JSON array.
    The insights should be encouraging and helpful. Do not just repeat the data.
    For example, if there is a high outstanding amount, suggest sending reminders. If revenue is high, be encouraging.
    
    Data Summary:
    ${dataSummary}
    
    Return your response as a valid JSON object with a single key "insights" which is an array of strings.
    Example format: {"insights": ["Your revenue is looking strong this month!", "You have 5 overdue invoices. Consider sending reminders to get paid faster."]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    const clearedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(clearedJson).insights;
    res.status(200).json({ insights: parsedData });
  } catch (error) {
    console.error("Error dashboard summary with AI:", error);
    res.status(500).json({
      message: "Failed to generate dashboard summary",
      details: error.message,
    });
  }
};

export { parseInvoiceFromText, generateReminderEmail, getDashboardSummary };
