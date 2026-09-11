const express = require("express");
const { z } = require("zod");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { uploadPdf } = require("../middleware/upload");
const { analyzeLimiter } = require("../middleware/rateLimit");

const { extractText } = require("../services/pdfService");
const { analyzeJobDescription } = require("../services/geminiService");

const router = express.Router();
const jobDescriptionSchema = z.object({
    jobDesc: z
        .string()
        .trim()
        .min(1, "Job description is required")
        .max(30000, "Job description is too long"),
    targetRole: z
        .string()
        .trim()
        .min(1, "Role title is required")
        .max(200, "Role title is too long"),
});

router.post(
    "/",
    requireAuth,
    analyzeLimiter,
    uploadPdf("file"),
    validate(jobDescriptionSchema),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(400, "No file uploaded");
        }
        const { text } = await extractText(req.file.buffer);
        const { jobDesc, targetRole } = req.body;

        const { analysis, model, promptTokens, responseTokens } =
            await analyzeJobDescription({
                rawText: text,
                jobDesc: jobDesc,
                targetRole,
            });

        res.status(200).json({
            analysis,
            meta: {
                model,
                promptTokens,
                responseTokens,
            },
        });
    })
);

module.exports = router;