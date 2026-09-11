require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { jsonrepair } = require("jsonrepair");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

app.get("/", (req, res) => {
  res.send("AI Resume Builder Backend Running");
});

// Helper function to query OpenRouter and safely handle/repair JSON output
async function callOpenRouterJSON(systemPrompt, userPrompt) {
  const openRouterResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000, // Prevents early truncation
      }),
    },
  );

  if (!openRouterResponse.ok) {
    const errorText = await openRouterResponse.text();
    throw new Error(
      `OpenRouter error (${openRouterResponse.status}): ${errorText}`,
    );
  }

  const data = await openRouterResponse.json();
  let rawContent = data.choices?.[0]?.message?.content?.trim() || "";

  // Strip Markdown code blocks
  rawContent = rawContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct parsing first, fallback to repairing truncated JSON
  try {
    return JSON.parse(rawContent);
  } catch (initialParseError) {
    console.warn("Raw JSON parsing failed, attempting jsonrepair fallback...");
    try {
      const repairedJSON = jsonrepair(rawContent);
      return JSON.parse(repairedJSON);
    } catch (repairError) {
      console.error("JSON Repair also failed. Raw string was:\n", rawContent);
      throw new Error(
        "AI returned truncated or malformed JSON. Please try again.",
      );
    }
  }
}

// 1. MATCH & TAILOR ROUTE
app.post("/tailor-resume", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file || !jobDescription) {
      return res.status(400).json({
        success: false,
        error:
          "Both a resume PDF and client requirements (job description) are required.",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Currently only PDF files are supported.",
      });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: "Failed to extract text from the provided PDF.",
      });
    }

    // Keep prompt output requirements concise to prevent exceeding token limits
    const systemPrompt = `
You are an expert ATS Optimization Engine.

TASK:
Compare candidate resume against Client Requirements and generate a tailored version targeting a 90+ ATS score.

RULES:
- Do NOT fabricate fake companies, degrees, or experience.
- Keep response CONCISE to prevent payload truncation.
- Limit professional summary to 2-3 sentences.
- Limit bullet points per job to a maximum of 2-3 high-impact concise points.
- Output ONLY valid JSON matching this schema:

{
  "initialMatchScore": 65,
  "projectedAtsScore": 95,
  "keyKeywordsAdded": ["Keyword1", "Keyword2"],
  "tailoredResume": {
    "name": "Candidate Full Name",
    "jobTitle": "Target Role Title",
    "contactInfo": {
      "phone": "Phone",
      "email": "Email",
      "city": "City",
      "linkedin": "LinkedIn"
    },
    "summary": "Short 2-3 sentence summary.",
    "skills": "Comma-separated list of skills",
    "experience": [
      {
        "role": "Role Title",
        "company": "Company Name",
        "location": "Location",
        "duration": "Duration",
        "description": "2-3 concise bullet points separated by newlines."
      }
    ],
    "education": "Education details",
    "awards": "Certifications or awards"
  }
}
`.trim();

    const userPrompt = `
CLIENT REQUIREMENTS:
${jobDescription}

CANDIDATE RESUME:
${resumeText}
`.trim();

    const tailoredData = await callOpenRouterJSON(systemPrompt, userPrompt);

    res.json({
      success: true,
      data: tailoredData,
    });
  } catch (error) {
    console.error("Tailor Resume Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate tailored resume.",
    });
  }
});

// 2. QUICK SCORE ROUTE
app.post("/resume-score", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Resume file is required.",
      });
    }

    const { jobDescription } = req.body;
    let resumeText = "";

    if (req.file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text.trim();
    } else {
      return res.status(400).json({
        success: false,
        error: "Currently only PDF resumes are supported.",
      });
    }

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text from the resume.",
      });
    }

    const systemPrompt = `
You are an expert ATS resume evaluator.
Return ONLY valid raw JSON matching this structure:
{
  "score": 75,
  "analysis": "Short summary.",
  "categoryScores": {
    "atsCompatibility": 70,
    "professionalSummary": 80,
    "workExperience": 75,
    "skills": 80,
    "achievementsAndImpact": 70,
    "structureAndClarity": 85
  },
  "strengths": ["Strength 1"],
  "improvements": ["Improvement 1"],
  "recommendations": ["Recommendation 1"]
}
`.trim();

    const userPrompt = `
${jobDescription ? `TARGET REQUIREMENTS:\n${jobDescription}\n\n` : ""}
RESUME TEXT:
${resumeText}
`.trim();

    const scoreResult = await callOpenRouterJSON(systemPrompt, userPrompt);

    res.json({
      success: true,
      score: scoreResult.score,
      analysis: scoreResult.analysis || "",
      categoryScores: scoreResult.categoryScores || {},
      strengths: scoreResult.strengths || [],
      improvements: scoreResult.improvements || [],
      recommendations: scoreResult.recommendations || [],
    });
  } catch (error) {
    console.error("Resume Score Error:", error);
    res.status(500).json({
      success: false,
      error: "Resume scoring failed.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
