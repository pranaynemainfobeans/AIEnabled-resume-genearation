const API_BASE_URL = 'http://localhost:3000';

type ApiErrorResponse = { message?: string; error?: string };

export type ResumeScoreFile = {
  uri: string;
  name: string;
  type: string;
};

export type ResumeScoreResult = {
  score: number;
  analysis: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  categoryScores: {
    atsCompatibility: number;
    professionalSummary: number;
    workExperience: number;
    skills: number;
    achievementsAndImpact: number;
    structureAndClarity: number;
  };
};

export type TailoredResumeResponse = {
  initialMatchScore: number;
  projectedAtsScore: number;
  missingKeywordsFound: string[];
  tailoredResume: {
    name: string;
    jobTitle: string;
    contact: { email: string; phone: string; city: string; linkedin: string };
    summary: string;
    skills: string[];
    experience: Array<{
      role: string;
      company: string;
      duration: string;
      location: string;
      bulletPoints: string[];
    }>;
    education: string[];
    certifications: string[];
  };
};

export async function tailorResume(
  file: ResumeScoreFile,
  jobDescription: string
): Promise<TailoredResumeResponse> {
  const formData = new FormData();
  formData.append('resume', {
    uri: file.uri,
    name: file.name,
    type: file.type || 'application/pdf',
  } as unknown as Blob);
  formData.append('jobDescription', jobDescription);

  const response = await fetch(`${API_BASE_URL}/tailor-resume`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate tailored resume.');
  }

  return data.data;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiErrorResponse;
  if (!response.ok) {
    throw new Error(data.message || data.error || 'The resume service failed.');
  }
  return data;
}

export async function customizeResume(
  resumeText: string,
  jobDescription: string,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/customize-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  const data = await parseResponse<{ enhancedText?: string; text?: string }>(
    response,
  );
  const enhancedText = data.enhancedText || data.text;
  if (!enhancedText?.trim()) {
    throw new Error('The service returned an empty optimized description.');
  }
  return enhancedText;
}

export async function optimizeSummary(
  resumeText: string,
  jobDescription: string,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/optimize-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  const data = await parseResponse<{ enhancedSummary?: string; summary?: string }>(
    response,
  );
  const enhancedSummary = data.enhancedSummary || data.summary;
  if (!enhancedSummary?.trim()) {
    throw new Error('The service returned an empty optimized summary.');
  }
  return enhancedSummary;
}

export async function scoreResume(
  file: ResumeScoreFile,
): Promise<ResumeScoreResult> {
  const formData = new FormData();
  formData.append('resume', {
    uri: file.uri,
    name: file.name,
    type: file.type || 'application/octet-stream',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/resume-score`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseResponse<Partial<ResumeScoreResult> & { result?: Partial<ResumeScoreResult> }>(
    response,
  );
  const result = data.result || data;
  if (typeof result.score !== 'number') {
    throw new Error('The service returned an invalid resume score.');
  }

  return {
    score: result.score,
    analysis: result.analysis || '',
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    recommendations: result.recommendations || [],
    categoryScores: {
      atsCompatibility: result.categoryScores?.atsCompatibility || 0,
      professionalSummary: result.categoryScores?.professionalSummary || 0,
      workExperience: result.categoryScores?.workExperience || 0,
      skills: result.categoryScores?.skills || 0,
      achievementsAndImpact: result.categoryScores?.achievementsAndImpact || 0,
      structureAndClarity: result.categoryScores?.structureAndClarity || 0,
    },
  };
}
