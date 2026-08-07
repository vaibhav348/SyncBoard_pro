"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const searchController_1 = require("../controllers/searchController");
const searchRoutes = (0, express_1.Router)();
searchRoutes.get("/:projectId/search", authMiddleware_1.protect, searchController_1.search);
exports.default = searchRoutes;
