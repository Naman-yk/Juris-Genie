"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const init_1 = __importDefault(require("../db/init"));
exports.UserModel = {
    create: (user) => {
        const stmt = init_1.default.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        const info = stmt.run(user.name, user.email, user.password);
        return { id: Number(info.lastInsertRowid), ...user };
    },
    findByEmail: (email) => {
        const stmt = init_1.default.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },
    findById: (id) => {
        const stmt = init_1.default.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    }
};
