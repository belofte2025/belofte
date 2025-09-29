// server/src/app.ts
import express, { type RequestHandler } from "express";
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

/* ───────────────── Middlewares ───────────────── */
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN?.split(",") ?? ["*"]) as any,
    credentials: true,
  })
);
app.use(express.json());

/* ───────────────── Swagger setup ───────────────── */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Offloading App API",
      version: "1.0.0",
      description: "API docs for OffloadTracker system",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://localhost:4000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
});

// Wrap/cast to satisfy Express 5 typings
const swaggerServe: RequestHandler = (req, res, next) =>
  (swaggerUi.serve as unknown as RequestHandler)(req, res, next);
const swaggerSetup: RequestHandler = swaggerUi.setup(
  swaggerSpec
) as unknown as RequestHandler;

app.use("/api-docs", swaggerServe, swaggerSetup);

/* ───────────────── API Routes ───────────────── */
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

// Health check
app.get("/api/health", ((_, res) => {
  res.json({ ok: true });
}) as RequestHandler);

/* ───────────────── Static client (optional) ─────────────────
   Only if you build the Next.js client to "client/out" and want to serve it from Express.
   Set SERVE_CLIENT=true to enable. Not used on Vercel serverless.
*/
if (process.env.SERVE_CLIENT === "true") {
  const clientBuildPath = path.join(__dirname, "../../client/out");
  app.use(express.static(clientBuildPath));

  const spaHandler: RequestHandler = (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "API route not found" });
      return;
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  };

  // IMPORTANT: use "*" (or "/:path(*)"), NOT "/*"
  app.get("*", spaHandler);
}

export default app;
