import z from "zod";

export const urlValidationSchema = z.object({
    longurl: z
            .string({required_err: "Url is required"})
            .trim()
            .url({message: "Enter a valid URL"}),

    shortcode: z
            .string({require_err: "Shortcode is required"})
            .trim()
            .min(2, {message: "Minimum 2 char"})
            .max(50, {message: "Maximum 50 char"})
})