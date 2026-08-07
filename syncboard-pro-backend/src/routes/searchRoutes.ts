import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { search } from "../controllers/searchController";

const searchRoutes = Router();
 
searchRoutes.get("/:projectId/search", protect, search);

export default searchRoutes;