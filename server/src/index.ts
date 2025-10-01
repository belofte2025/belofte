import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import customerRoutes from "./routes/customer.routes";
import supplierRoutes from "./routes/supplier.routes";
import containerRoutes from "./routes/container.routes";
import offloadingRoutes from "./routes/offloading.routes";
import saleRoutes from "./routes/sale.routes";
import customerPaymentRoutes from "./routes/customerPayment.routes";
import inventoryRoutes from "./routes/inventory.routes";
import userRoutes from "./routes/user.routes";
import auditRoutes from "./routes/audit.routes";
import reportRoutes from "./routes/report.routes";
import uploadsRoutes from "./routes/uploads.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ───────────────────── Middlewares ─────────────────────
app.use(
  cors({
    origin: "*", // TODO: restrict in production
  })
);
app.use(express.json());

// Swagger setup temporarily disabled to fix path-to-regexp issues

// ───────────────────── Health Check ─────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// ───────────────────── API Routes ─────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/containers", containerRoutes);
app.use("/api/offloading", offloadingRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", customerPaymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);

// ───────────────────── Static (Next.js export) ─────────────────────
const clientBuildPath = path.join(__dirname, "../../client/out");
app.use(express.static(clientBuildPath));

// ───────────────────── Catch-all for SPA ─────────────────────
// Temporarily disabled to test if this was causing path-to-regexp issues
/*
app.get("/*", ((req, res) => {
  // Keep API namespace for the JSON routes above
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  return res.sendFile(path.join(clientBuildPath, "index.html"));
}) as express.RequestHandler);
*/

// ───────────────────── Start ─────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  // console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
});
