"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = exports.descriptionField = exports.titleField = exports.nullableObjectId = exports.objectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
/**
 * Validates that a string is a well-formed Mongo ObjectId.
 * Use this INSTEAD of z.string() for any field that will be passed to
 * `new mongoose.Types.ObjectId(...)` or `Model.findById(...)`.
 * Prevents CastError -> unhandled 500s and turns them into clean 400s.
 */
const objectId = (fieldName = "ID") => zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: `Invalid ${fieldName} format`,
});
exports.objectId = objectId;
/** Same as objectId(), but allows null (e.g. "unassign" / "move to backlog"). */
const nullableObjectId = (fieldName = "ID") => zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: `Invalid ${fieldName} format`,
})
    .nullable();
exports.nullableObjectId = nullableObjectId;
/** Reusable bounded, trimmed title field. */
const titleField = (min = 2, max = 150) => zod_1.z
    .string()
    .trim()
    .min(min, `Title should be at least ${min} characters long`)
    .max(max, `Title cannot exceed ${max} characters`);
exports.titleField = titleField;
/** Reusable bounded, trimmed description field. */
const descriptionField = (min = 0, max = 2000) => min > 0
    ? zod_1.z
        .string()
        .trim()
        .min(min, `Description should be at least ${min} characters long`)
        .max(max, `Description cannot exceed ${max} characters`)
    : zod_1.z.string().trim().max(max, `Description cannot exceed ${max} characters`);
exports.descriptionField = descriptionField;
/** Validates an Express :param as an ObjectId and short-circuits with a 400 if not. */
const isValidObjectId = (id) => Boolean(id) && mongoose_1.default.Types.ObjectId.isValid(id);
exports.isValidObjectId = isValidObjectId;
