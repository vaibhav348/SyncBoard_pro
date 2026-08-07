/// <reference path="../global.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

            req.user = decoded as any;

            return next();
        } catch (error) {
            console.error("Token verification failed:", error);
            return res.status(401).json({ message: "Bhai, token valid nahi hai! Unauthorized access." });
        }

    }
    if (!token) {
        return res.status(401).json({ message: "Bhai, token missing hai! Login karke token bhejo." });
    }
}