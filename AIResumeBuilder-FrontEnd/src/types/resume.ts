export type Experience = {
  role: string;
  company: string;
  location: string;
  duration: string;
  description: string;
};

export type ResumeDraft = {
  name: string;
  phone: string;
  email: string;
  city: string;
  summary: string;
  skills: string;
  education: string;
  jobTitle: string;
  address: string;
  linkedin: string;
  languages: string;
  awards: string;
  experience: Experience[];
};
