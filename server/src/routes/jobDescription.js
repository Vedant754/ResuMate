const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { uploadPdf } = require("../middleware/upload");
const { analyzeLimiter } = require("../middleware/rateLimit");

const { extractText } = require("../services/pdfService");
const { parseResume: parseStructured } = require("../services/structuredParser");
const { analyzeJobDescription } = require("../services/geminiService");

const router = express.Router();

router.post(
    "/analyze",
    requireAuth,
    analyzeLimiter,
    uploadPdf.single("file"),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(400, "No file uploaded");
        }
        const { jobDesc } = req.body;
        const text = await extractText(req.file.buffer);
        const structuredData = await parseStructured(text);

        const { analysis, model, promptTokens, responseTokens } =
            await analyzeJobDescription({
                rawText: text,
                jobDesc: jobDesc,
            });

        res.status(200).json({
            structuredData,
            analysis,
            meta: {
                model,
                promptTokens,
                responseTokens,
            },
        });
    })
);