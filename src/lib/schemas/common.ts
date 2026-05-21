import { z } from "zod";

export const nullableString = z
  .string()
  .transform((v) => v.trim() || null)
  .nullable()
  .optional();

export const nullableUrl = z.preprocess(
  (v) => (!v || v === "" ? null : v),
  z.string().url("Must be a valid URL").nullable()
);

export const tagsField = z.string().transform((v) =>
  v
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
);
