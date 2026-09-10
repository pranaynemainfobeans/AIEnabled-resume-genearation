require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

app.get("/", (req, res) => {
  res.send("AI Resume Builder Backend Running");
});

//To customize the resume based on the job description and candidate's experience
app.post("/customize-resume", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Missing inputs" });
    }

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
            {
              role: "system",
              content: `
                  You are an expert resume optimization system.

                  You ONLY output clean, professional resume content.

                  Rules:
                  - Never introduce your response.
                  - Never say "Here is..." or "Sure..."
                  - Do not provide explanations.
                  - Do not use markdown.
                  - Do not invent experience, technologies, achievements, metrics, certifications, or responsibilities.
                  - Only use information provided by the candidate.
                  - Use ATS-friendly terminology where appropriate.
                  - Preserve factual accuracy.
                          `.trim(),
            },
            {
              role: "user",
              content: `
                  TARGET JOB DESCRIPTION:

                  ${jobDescription}

                  CANDIDATE EXPERIENCE:

                  ${resumeText}

                  Rewrite the candidate experience to better match the target job description.

                  Output ONLY the rewritten professional bullet points.
          `.trim(),
            },
          ],
          temperature: 0.1,
        }),
      },
    );

    if (!openRouterResponse.ok) {
      throw new Error(
        `OpenRouter server responded with status ${openRouterResponse.status}`,
      );
    }

    const data = await openRouterResponse.json();
    let rawAIResponse = data.choices[0].message.content.trim();

    // FAILSAFE CLEANUP: Strip away common conversational patterns if the LLM slips up
    rawAIResponse = rawAIResponse
      .replace(
        /^(here is|here's|sure, here is|here are the|optimized description:|enhanced description:)[^\n]*\n*/gi,
        "",
      ) // Removes introduction lines
      .replace(/\*\*/g, "") // Removes any leftover markdown bold asterisks
      .trim();

    res.json({
      success: true,
      enhancedText: rawAIResponse,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({
      success: false,
      error: "AI processing failed",
    });
  }
});

// ... (keep your existing setup and /customize-resume route)

// To optimize the professional summary based on the job description
app.post("/optimize-summary", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Missing inputs" });
    }

    const prompt = `
      You are an expert system that ONLY outputs raw, clean resume content. You never chat or introduce your work.

      TASK:
      Optimize the candidate's PROFESSIONAL SUMMARY to match the provided JOB DESCRIPTION. 
      Make it compelling, professional, and dense with ATS-friendly keywords. Keep it to 3-4 sentences max.

      CRITICAL RULES:
      - Do NOT include any introductory or concluding text (e.g., do NOT say "Here is your summary").
      - Do NOT use markdown bolding (**).
      - Output ONLY the clean text summary.
      - Start directly with the first word of the optimized summary.

      TARGET JOB DESCRIPTION:
      ${jobDescription}

      CANDIDATE'S CURRENT SUMMARY:
      ${resumeText}
      `;

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
            {
              role: "system",
              content: `
              You are an expert system that ONLY outputs raw, clean resume content. You never chat or introduce your work.
          `.trim(),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      },
    );

    if (!openRouterResponse.ok) {
      throw new Error(
        `OpenRouter responded with status ${openRouterResponse.status}`,
      );
    }

    const data = await openRouterResponse.json();
    let rawAIResponse = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean up any rogue LLM filler text
    rawAIResponse = rawAIResponse
      .replace(
        /^(here is|here's|optimized summary:|enhanced summary:)[^\n]*\n*/gi,
        "",
      )
      .replace(/\*\*/g, "")
      .trim();

    res.json({
      success: true,
      enhancedSummary: rawAIResponse,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Summary optimization failed" });
  }
});

// To score the resume based on various categories
app.post("/resume-score", upload.single("resume"), async (req, res) => {
  try {
    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Resume file is required",
      });
    }

    console.log("Resume received:", {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });

    let resumeText = "";

    // Currently support PDF
    if (req.file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } else {
      return res.status(400).json({
        success: false,
        error: "Currently only PDF resumes are supported.",
      });
    }

    resumeText = resumeText.trim();

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text from the resume.",
      });
    }

    console.log("Extracted resume text length:", resumeText.length);

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
            {
              role: "system",

              content: `
You are an expert ATS resume evaluator and career advisor.

Analyze the candidate's resume and calculate a realistic resume quality score.

Evaluate ONLY the information present in the resume.

Do NOT invent:
- Experience
- Skills
- Achievements
- Metrics
- Certifications
- Qualifications
- Responsibilities

Return ONLY valid JSON.
Do not use markdown.
Do not include any explanation outside the JSON.

The overall score must be between 0 and 100.

Evaluate these categories:

1. ATS Compatibility
2. Professional Summary
3. Work Experience
4. Skills
5. Achievements and Impact
6. Resume Structure and Clarity

Use this exact JSON structure:

{
  "score": 0,
  "analysis": "Short overall analysis of the resume.",
  "categoryScores": {
    "atsCompatibility": 0,
    "professionalSummary": 0,
    "workExperience": 0,
    "skills": 0,
    "achievementsAndImpact": 0,
    "structureAndClarity": 0
  },
  "strengths": [
    "string"
  ],
  "improvements": [
    "string"
  ],
  "recommendations": [
    "string"
  ]
}

Scoring guidelines:

90-100 = Excellent
80-89 = Very Good
70-79 = Good
60-69 = Needs Improvement
Below 60 = Significant Improvement Needed

Provide 2-4 concise strengths.
Provide 2-4 concise improvements.
Provide 2-4 concise recommendations.
              `.trim(),
            },

            {
              role: "user",

              content: `
Analyze the following resume:

${resumeText}
              `.trim(),
            },
          ],

          temperature: 0.1,
        }),
      },
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();

      throw new Error(
        `OpenRouter responded with status ${openRouterResponse.status}: ${errorText}`,
      );
    }

    const data = await openRouterResponse.json();

    let rawAIResponse = data.choices?.[0]?.message?.content?.trim() || "";

    // Remove markdown code fences if the model adds them
    rawAIResponse = rawAIResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let scoreResult;

    try {
      scoreResult = JSON.parse(rawAIResponse);
    } catch (parseError) {
      console.error("Failed to parse AI score response:", rawAIResponse);

      throw new Error("AI returned an invalid score response");
    }

    // Validate score
    if (
      typeof scoreResult.score !== "number" ||
      scoreResult.score < 0 ||
      scoreResult.score > 100
    ) {
      throw new Error("AI returned an invalid resume score");
    }

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
      error: "Resume scoring failed",
    });
  }
});

// ... (keep your app.listen)

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
