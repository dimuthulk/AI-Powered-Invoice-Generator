import { GoogleGenAI } from "@google/genai";
import Invoice from "../models/Invoice.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

const parseInvoiceFromText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text input is required" });
  }

  // Simple local extractor to fall back to when AI is unavailable.
  const localExtractor = (txt) => {
    const invoice = {
      clientName: "",
      email: "",
      address: "",
      items: [],
    };

    try {
      const invMatch = /INV[-_\s]?(\d{2,}|\d{4}-\d{3,})/i.exec(txt);
      if (invMatch) invoice.invoiceNumber = invMatch[0];
      const emailMatch = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.exec(txt);
      if (emailMatch) invoice.email = emailMatch[0];
      const nameMatch =
        /(?:Client|Bill To|Billed To|To):?\s*([A-Za-z ,.'-]{2,})/i.exec(txt);
      if (nameMatch) invoice.clientName = nameMatch[1].trim();

      // Attempt to find simple line items like: "1 x Widget - $10" or "Widget 2 10"
      const lines = txt
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        const moneyMatch = /\$?\s*(\d+[,.]?\d*)/.exec(line);
        if (moneyMatch) {
          const name = line.replace(/\$?\s*(\d+[,.]?\d*)/, "").trim();
          // crude heuristics for qty
          const qtyMatch =
            /^(\d+)\s*[xX\*]?/.exec(name) || /\s(\d+)\s/.exec(name);
          const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
          const unitprice = Number(moneyMatch[1].replace(/,/g, "")) || 0;
          invoice.items.push({
            name: name || "Item",
            quantity: qty,
            unitprice,
          });
        }
        if (invoice.items.length >= 10) break;
      }
    } catch (e) {
      // swallow
    }
    return invoice;
  };

  // Build prompt
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
      }]
    }

    Here is the text to parse
    ------- TEXT START -------
    ${text}
    ------- TEXT END -------

    Extract the data and provide only the JSON object.`;

  const modelName = process.env.GOOGLE_GENAI_MODEL || "gemini-2.5-flash";
  const maxAttempts = 3;
  let attempt = 0;
  let lastErr = null;
  let aiResponse = null;

  while (attempt < maxAttempts) {
    try {
      aiResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      break;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const isServiceUnavailable =
        err && (err.status === 503 || (err.error && err.error.code === 503));
      if (!isServiceUnavailable) break;
      const delay = 400 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (aiResponse) {
    try {
      let responseText = aiResponse.text;
      if (typeof responseText !== "string") {
        if (typeof aiResponse.text === "function")
          responseText = aiResponse.text();
        else throw new Error("Unexpected AI response format");
      }
      const clearedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsedData = JSON.parse(clearedJson);
      return res.status(200).json(parsedData);
    } catch (err) {
      console.error("Error parsing AI response for invoice parsing:", err);
      lastErr = lastErr || err;
    }
  }

  // AI failed or parsing failed — attempt to list models for diagnostics
  let modelList = null;
  try {
    if (ai && ai.models) {
      if (typeof ai.models.list === "function")
        modelList = await ai.models.list();
      else if (typeof ai.models.listModels === "function")
        modelList = await ai.models.listModels();
    }
  } catch (listErr) {
    console.error("Error listing available models:", listErr);
  }

  // Provide a best-effort local parse to avoid failing entirely
  const fallback = localExtractor(text);

  return res.status(503).json({
    message:
      "AI model unavailable or failed to parse text. Returning best-effort extraction.",
    aiError: lastErr ? lastErr.message || String(lastErr) : undefined,
    availableModels: modelList || undefined,
    fallback,
    note: "You can retry later or set GOOGLE_GENAI_MODEL to a supported model.",
  });
};

const generateReminderEmail = async (req, res) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID is required" });
  }

  // helper to safely extract text from various AI client response shapes
  const extractTextFromAi = (resp) => {
    if (!resp) return null;
    // direct string
    if (typeof resp === "string") return resp;
    // common simple shape
    if (typeof resp.text === "string") return resp.text;
    if (typeof resp.text === "function") {
      try {
        const t = resp.text();
        return typeof t === "string" ? t : null;
      } catch (e) {
        return null;
      }
    }
    // common fields from various clients
    if (typeof resp.output_text === "string") return resp.output_text;
    if (typeof resp.generated_text === "string") return resp.generated_text;
    // Google GenAI V1-like shape
    if (Array.isArray(resp.output) && resp.output[0]?.content) {
      const content = resp.output[0].content;
      if (Array.isArray(content)) {
        const texts = content
          .map((c) => (typeof c.text === "string" ? c.text : ""))
          .filter(Boolean);
        if (texts.length) return texts.join("\n");
      }
    }
    // candidate-based shapes
    if (Array.isArray(resp.candidates) && resp.candidates[0]) {
      const cand = resp.candidates[0];
      if (typeof cand.content === "string") return cand.content;
      if (Array.isArray(cand.content)) {
        const texts = cand.content
          .map((c) => (typeof c.text === "string" ? c.text : ""))
          .filter(Boolean);
        if (texts.length) return texts.join("\n");
      }
      if (typeof cand.message === "string") return cand.message;
    }
    // OpenAI-like choices
    if (Array.isArray(resp.choices) && resp.choices[0]) {
      const ch = resp.choices[0];
      if (typeof ch.text === "string") return ch.text;
      if (ch.message?.content && Array.isArray(ch.message.content)) {
        const texts = ch.message.content
          .map((c) => (typeof c.text === "string" ? c.text : ""))
          .filter(Boolean);
        if (texts.length) return texts.join("\n");
      }
    }
    return null;
  };

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const modelName = process.env.GOOGLE_GENAI_MODEL || "gemini-2.5-flash";
    const prompt = `You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.

    Use the following details to personalize the email:
    - Client Name: ${
      invoice.billTo?.clientName || invoice.billTo?.name || "Customer"
    }
    - Invoice Number: ${invoice.invoiceNumber}
    - Amount Due: $${(Number(invoice.total) || 0).toFixed(2)}
    - Due Date: ${
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"
    }

    The tone should be friendly but clear. Keep it concise. Start the email with "Subject"`;

    // Retry/backoff for transient service issues
    const maxAttempts = 3;
    let attempt = 0;
    let lastErr = null;
    let aiResponse = null;
    while (attempt < maxAttempts) {
      try {
        aiResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        break;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        const isServiceUnavailable =
          err && (err.status === 503 || (err.error && err.error.code === 503));
        if (!isServiceUnavailable) break;
        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (aiResponse) {
      try {
        const text = extractTextFromAi(aiResponse);
        if (typeof text === "string" && text.trim().length > 0) {
          return res.status(200).json({ reminderText: text });
        } else {
          throw new Error("Unexpected AI response format - no text extracted");
        }
      } catch (err) {
        lastErr = lastErr || err;
        console.error("Error parsing AI reminder response:", err);
      }
    }

    // Attempt to list models for diagnostics
    let modelList = null;
    try {
      if (ai && ai.models) {
        if (typeof ai.models.list === "function")
          modelList = await ai.models.list();
        else if (typeof ai.models.listModels === "function")
          modelList = await ai.models.listModels();
      }
    } catch (listErr) {
      console.error("Error listing available models:", listErr);
    }

    // Fallback deterministic reminder text
    const fallbackReminder = `Subject: Reminder — Invoice ${
      invoice.invoiceNumber
    } is due

Hi ${invoice.billTo?.clientName || invoice.billTo?.name || "there"},

This is a friendly reminder that invoice ${invoice.invoiceNumber} for $${(
      Number(invoice.total) || 0
    ).toFixed(2)} is ${
      invoice.status === "Paid"
        ? "already marked as paid"
        : `due on ${
            invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
              : "a pending date"
          }`
    }.

Please let us know if you need any assistance or if you've already made the payment. Thank you!

Best regards,
${"Your Company"}`;

    return res.status(200).json({
      reminderText: fallbackReminder,
      usedFallback: true,
      aiError: lastErr ? lastErr.message || String(lastErr) : undefined,
      availableModels: modelList || undefined,
      note: "Returned fallback reminder because AI model was unavailable or failed.",
    });
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

    // Process and summarize data
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
    const unpaidInvoices = invoices.filter((inv) => inv.status !== "Paid");
    const totalRevenue = paidInvoices.reduce(
      (acc, inv) => acc + (Number(inv.total) || 0),
      0
    );
    const totalOutstanding = unpaidInvoices.reduce(
      (acc, inv) => acc + (Number(inv.total) || 0),
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
          `Invoice #${inv.invoiceNumber} for ${(Number(inv.total) || 0).toFixed(
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

    // In-memory cache for last successful insights to survive transient outages
    const modelName = process.env.GOOGLE_GENAI_MODEL || "gemini-2.5-flash";
    const maxAttempts = 3;

    if (
      global.__aiInsightsCache &&
      Date.now() - global.__aiInsightsCache.ts <
        (process.env.AI_INSIGHTS_CACHE_TTL_MS
          ? Number(process.env.AI_INSIGHTS_CACHE_TTL_MS)
          : 5 * 60 * 1000)
    ) {
      return res
        .status(200)
        .json({ insights: global.__aiInsightsCache.data, usedCache: true });
    }

    let attempt = 0;
    let aiResponse = null;
    let lastErr = null;
    while (attempt < maxAttempts) {
      try {
        aiResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        break;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        const isServiceUnavailable =
          err && (err.status === 503 || (err.error && err.error.code === 503));
        if (!isServiceUnavailable) break;
        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (aiResponse) {
      try {
        const responseText = aiResponse.text;
        const clearedJson = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsedData = JSON.parse(clearedJson).insights;
        try {
          global.__aiInsightsCache = { data: parsedData, ts: Date.now() };
        } catch (e) {}
        return res.status(200).json({ insights: parsedData });
      } catch (err) {
        console.error("Error parsing AI response for dashboard summary:", err);
        lastErr = lastErr || err;
      }
    }

    if (global.__aiInsightsCache && global.__aiInsightsCache.data) {
      return res.status(200).json({
        insights: global.__aiInsightsCache.data,
        usedCache: true,
        aiError: lastErr ? lastErr.message || String(lastErr) : undefined,
      });
    }

    const localSummarize = (invoices) => {
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
      const unpaidInvoices = invoices.filter((inv) => inv.status !== "Paid");
      const totalRevenue = paidInvoices.reduce(
        (acc, inv) => acc + (Number(inv.total) || 0),
        0
      );
      const totalOutstanding = unpaidInvoices.reduce(
        (acc, inv) => acc + (Number(inv.total) || 0),
        0
      );

      const insights = [];
      if (totalRevenue > 0) {
        insights.push(
          `Good job — you've collected $${totalRevenue.toFixed(2)} from ${
            paidInvoices.length
          } invoices.`
        );
      }
      if (unpaidInvoices.length > 0) {
        insights.push(
          `You have ${
            unpaidInvoices.length
          } unpaid invoices totaling $${totalOutstanding.toFixed(
            2
          )}. Consider sending reminders.`
        );
      }
      if (totalInvoices >= 5) {
        const recent = invoices
          .slice(0, 5)
          .map(
            (inv) =>
              `#${inv.invoiceNumber} ($${(Number(inv.total) || 0).toFixed(2)})`
          );
        insights.push(`Recent invoices: ${recent.join(", ")}`);
      }
      if (insights.length === 0)
        insights.push("No notable invoice activity yet.");
      return insights;
    };

    const fallbackInsights = localSummarize(invoices);
    return res.status(200).json({
      insights: fallbackInsights,
      usedFallback: true,
      aiError: lastErr ? lastErr.message || String(lastErr) : undefined,
    });
  } catch (error) {
    console.error("Error dashboard summary with AI:", error);
    res.status(500).json({
      message: "Failed to generate dashboard summary",
      details: error.message,
    });
  }
};

export { parseInvoiceFromText, generateReminderEmail, getDashboardSummary };
