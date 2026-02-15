"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const upload_1 = __importDefault(require("./routes/upload"));
const query_1 = __importDefault(require("./routes/query"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
// ⭐ Enable CORS for all frontend requests
app.use((0, cors_1.default)());
// Parse JSON bodies
app.use(express_1.default.json({ limit: '10mb' }));
// Serve uploaded files
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
// Serve Frontend
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "Frontend/assets")));
// Routes
app.use("/upload", upload_1.default);
app.use("/query", query_1.default);
app.use("/auth", auth_routes_1.default);
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
exports.default = app;
