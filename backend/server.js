require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Middleware to handle CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect to the database
connectDB();

// Parse incoming JSON payloads for request bodies
app.use(express.json());

// Serve static files from the "public" directory (e.g., frontend assets like index.html, CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// Define routes
app.get("/", (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>AI-Powered Invoice Generator API</title>
        <style>
          body { font-family: Arial, sans-serif; margin:40px; color:#333; }
          .container{max-width:700px;margin:0 auto;}
          a{color:#0366d6;}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to the AI-Powered Invoice Generator API</h1>
          <p>The API is running successfully.</p>
        </div>
      </body>
    </html>
  `);
});
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

// console.log(process.env);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
