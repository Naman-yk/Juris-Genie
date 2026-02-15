"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("DEBUG: server.ts loaded");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const init_index_1 = require("./services/init-index");
const init_1 = require("./db/init");
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        (0, init_1.initDb)();
        if (process.env.PINECONE_INDEX) {
            await (0, init_index_1.ensureIndex)(process.env.PINECONE_INDEX);
        }
        app_1.default.listen(Number(PORT), () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (e) {
        console.error("Failed to start server:", e);
        process.exit(1);
    }
})();
