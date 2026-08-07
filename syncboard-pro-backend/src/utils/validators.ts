import mongoose from "mongoose";
import { z } from "zod";

/**
 * Validates that a string is a well-formed Mongo ObjectId.
 * Use this INSTEAD of z.string() for any field that will be passed to
 * `new mongoose.Types.ObjectId(...)` or `Model.findById(...)`.
 * Prevents CastError -> unhandled 500s and turns them into clean 400s.
 */
export const objectId = (fieldName = "ID") =>
    z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: `Invalid ${fieldName} format`,
    });

/** Same as objectId(), but allows null (e.g. "unassign" / "move to backlog"). */
export const nullableObjectId = (fieldName = "ID") =>
    z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: `Invalid ${fieldName} format`,
        })
        .nullable();

/** Reusable bounded, trimmed title field. */
export const titleField = (min = 2, max = 150) =>
    z
        .string()
        .trim()
        .min(min, `Title should be at least ${min} characters long`)
        .max(max, `Title cannot exceed ${max} characters`);

/** Reusable bounded, trimmed description field. */
export const descriptionField = (min = 0, max = 2000) =>
    min > 0
        ? z
              .string()
              .trim()
              .min(min, `Description should be at least ${min} characters long`)
              .max(max, `Description cannot exceed ${max} characters`)
        : z.string().trim().max(max, `Description cannot exceed ${max} characters`);

/** Validates an Express :param as an ObjectId and short-circuits with a 400 if not. */
export const isValidObjectId = (id: string | undefined): id is string =>
    Boolean(id) && mongoose.Types.ObjectId.isValid(id as string);