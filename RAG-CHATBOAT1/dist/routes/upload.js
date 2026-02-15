"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
const path_1 = __importDefault(require("path"));
const generative_ai_1 = require("@google/generative-ai");
// @ts-ignore
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const chunker_1 = require("../services/chunker");
const local_search_1 = require("../services/local-search");
const router = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, "..", "..", "uploads");
if (!(0, fs_2.existsSync)(uploadDir))
    (0, fs_2.mkdirSync)(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage });
router.post("/", auth_middleware_1.authenticateToken, upload.single("file"), async (req, res) => {
    let text = "";
    let filePath = "";
    try {
        if (req.file) {
            filePath = req.file.path;
            console.log("Reading PDF/File:", filePath);
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(dataBuffer);
            text = data.text;
            console.log(`Parsed text length: ${text.length}`);
            // --- LOCAL RAG: Chunk & Store Locally (INSTANT, NO API CALLS) ---
            const chunkSize = Number(process.env.CHUNK_SIZE ?? 8000);
            const chunks = (0, chunker_1.chunkText)(text, chunkSize);
            console.log(`Chunked into ${chunks.length} pieces.`);
            // Store chunks locally using keyword index (NO embeddings, NO Pinecone)
            (0, local_search_1.saveChunks)(chunks);
            console.log("Chunks indexed locally. ZERO API calls. Instant.");
            // --- Generate Analysis (1 API call, with auto-retry on 429) ---
            let analysis = {};
            const apiKey = process.env.GEMINI_API_KEY;
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Analyze this legal document and provide a JSON response with:
      - "clarity_score": number 0-100
      - "risk_score": number 0-100
      - "time_saved": string estimate
      - "summary": brief summary string
      - "risks": array of {label: string, value: number 0-100}

      Document Text:
      ${text.slice(0, 30000)}`;
            let analysisSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`Analysis attempt ${attempt}/3...`);
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const textResponse = response.text();
                    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        analysis = JSON.parse(jsonMatch[0]);
                        analysisSuccess = true;
                        console.log("Analysis generated successfully!");
                        break;
                    }
                }
                catch (analysisError) {
                    const is429 = analysisError.status === 429;
                    if (is429 && attempt < 3) {
                        console.log(`Quota hit. Waiting 45s before retry ${attempt + 1}/3...`);
                        await new Promise(r => setTimeout(r, 45000));
                    }
                    else {
                        console.error("Analysis failed:", analysisError.message?.slice(0, 120));
                    }
                }
            }
            if (!analysisSuccess) {
                analysis = {
                    clarity_score: 50,
                    risk_score: 50,
                    time_saved: "Estimated 2 hours",
                    summary: "Quota temporarily exhausted. Re-upload in a few minutes for full analysis.",
                    risks: [{ label: "Pending Analysis", value: 50 }]
                };
            }
            // Cleanup uploaded PDF
            if (filePath && fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            return res.json({
                message: 'File indexed successfully (Local RAG Mode)',
                analysis
            });
        }
        else {
            return res.status(400).json({ error: "No file uploaded" });
        }
    }
    catch (error) {
        console.error('Upload error:', error);
        try {
            if (filePath && fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        }
        catch (e) { }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
