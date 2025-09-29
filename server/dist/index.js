"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const container_routes_1 = __importDefault(require("./routes/container.routes"));
const offloading_routes_1 = __importDefault(require("./routes/offloading.routes"));
const sale_routes_1 = __importDefault(require("./routes/sale.routes"));
const customerPayment_routes_1 = __importDefault(require("./routes/customerPayment.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const uploads_routes_1 = __importDefault(require("./routes/uploads.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ───────────────────── Middlewares ─────────────────────
app.use((0, cors_1.default)({
    origin: "*", // TODO: restrict in production
}));
app.use(express_1.default.json());
// Swagger setup temporarily disabled to fix path-to-regexp issues
// ───────────────────── API Routes ─────────────────────
app.use("/api/auth", auth_routes_1.default);
app.use("/api/companies", company_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/suppliers", supplier_routes_1.default);
app.use("/api/containers", container_routes_1.default);
app.use("/api/offloading", offloading_routes_1.default);
app.use("/api/sales", sale_routes_1.default);
app.use("/api/payments", customerPayment_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
app.use("/api/uploads", uploads_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/audit", audit_routes_1.default);
// ───────────────────── Static (Next.js export) ─────────────────────
const clientBuildPath = path_1.default.join(__dirname, "../../client/out");
app.use(express_1.default.static(clientBuildPath));
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
