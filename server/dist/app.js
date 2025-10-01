"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
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
/* ───────────────── Middlewares ───────────────── */
app.use((0, cors_1.default)({
    origin: (process.env.CORS_ORIGIN?.split(",") ?? ["*"]),
    credentials: true,
}));
app.use(express_1.default.json());
/* ───────────────── Swagger setup ───────────────── */
const swaggerSpec = (0, swagger_jsdoc_1.default)({
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
const swaggerServe = (req, res, next) => swagger_ui_express_1.default.serve(req, res, next);
const swaggerSetup = swagger_ui_express_1.default.setup(swaggerSpec);
app.use("/api-docs", swaggerServe, swaggerSetup);
/* ───────────────── API Routes ───────────────── */
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
// Health check
app.get("/api/health", ((_, res) => {
    res.json({ ok: true });
}));
/* ───────────────── Static client (optional) ─────────────────
   Only if you build the Next.js client to "client/out" and want to serve it from Express.
   Set SERVE_CLIENT=true to enable. Not used on Vercel serverless.
*/
if (process.env.SERVE_CLIENT === "true") {
    const clientBuildPath = path_1.default.join(__dirname, "../../client/out");
    app.use(express_1.default.static(clientBuildPath));
    const spaHandler = (req, res) => {
        if (req.path.startsWith("/api")) {
            res.status(404).json({ error: "API route not found" });
            return;
        }
        res.sendFile(path_1.default.join(clientBuildPath, "index.html"));
    };
    // IMPORTANT: use "*" (or "/:path(*)"), NOT "/*"
    app.get("*", spaHandler);
}
exports.default = app;
