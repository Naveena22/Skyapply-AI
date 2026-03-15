import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    suggestedRoles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Top 5 roles the user can apply for",
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extracted hard and soft skills",
    },
    tools: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extracted software tools and technologies",
    },
    experienceSummary: {
      type: Type.STRING,
      description: "A brief summary of professional experience",
    },
    atsScore: {
      type: Type.INTEGER,
      description: "ATS Strength Score (0-100)",
    },
    atsAnalysis: {
      type: Type.OBJECT,
      properties: {
        keywordDensity: { type: Type.STRING },
        quantificationStrength: { type: Type.STRING },
        formattingClarity: { type: Type.STRING },
        actionVerbStrength: { type: Type.STRING },
        alignmentPotential: { type: Type.STRING },
      },
      required: ["keywordDensity", "quantificationStrength", "formattingClarity", "actionVerbStrength", "alignmentPotential"],
    },
    classification: {
      type: Type.STRING,
      description: "Excellent (85+), Strong (70-84), Moderate (50-69), Weak (<50)",
    },
    missingElements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["suggestedRoles", "skills", "tools", "experienceSummary", "atsScore", "atsAnalysis", "classification", "missingElements", "recommendations"],
};

export const jobMatchSchema = {
  type: Type.OBJECT,
  properties: {
    matchPercentage: { type: Type.INTEGER },
    category: { type: Type.STRING, description: "Great Match (80%+), Good Match (60-79%), Bad Match (<60%)" },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    seniorityMismatch: { type: Type.BOOLEAN },
    requiredKeywordsMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
    atsCompatibility: { type: Type.STRING },
  },
  required: ["matchPercentage", "category", "missingSkills", "seniorityMismatch", "requiredKeywordsMissing", "atsCompatibility"],
};

export const tailoringSchema = {
  type: Type.OBJECT,
  properties: {
    tailoredSummary: { type: Type.STRING },
    optimizedBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    reorderedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    coverLetter: { type: Type.STRING },
  },
  required: ["tailoredSummary", "optimizedBullets", "reorderedSkills", "coverLetter"],
};

export async function analyzeResume(resumeText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this resume and provide a structured ATS analysis: ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeAnalysisSchema,
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function matchJob(resumeData: any, jobDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Compare this resume data: ${JSON.stringify(resumeData)} with this job description: ${jobDescription}. Provide a match analysis.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: jobMatchSchema,
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function tailorApplication(resumeText: string, jobDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Tailor this resume for this job description. Do not fabricate experience. Resume: ${resumeText}. Job Description: ${jobDescription}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: tailoringSchema,
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function generateWeeklyReport(applications: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze these job applications and provide strategic insights: ${JSON.stringify(applications)}`,
    config: {
      systemInstruction: "You are a career strategy expert. Provide insights on application patterns, success rates, and improvement areas.",
    },
  });
  return response.text;
}
