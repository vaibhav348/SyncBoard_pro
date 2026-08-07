import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { verifyProjectAccess } from "../utils/Verifyprojectaccess";
import { search } from "../controllers/searchController";

const searchRoutes = Router();
 
searchRoutes.get("/:projectId/search", protect, verifyProjectAccess, search);

export default searchRoutes;