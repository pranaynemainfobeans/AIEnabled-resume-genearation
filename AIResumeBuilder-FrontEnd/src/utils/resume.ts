import {Experience} from '../types/resume';

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildResumeHtml(params: {
  name: string;
  jobTitle: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  experience: Experience[];
  education: string;
  skills: string;
  languages: string;
  awards: string;
}) {
  const {
    name,
    jobTitle,
    address,
    city,
    email,
    phone,
    linkedin,
    summary,
    experience,
    education,
    skills,
    languages,
    awards,
  } = params;

  const skillList = skills
    .split(',')
    .map(skill => `<li>${escapeHtml(skill.trim())}</li>`)
    .join('');
  const langList = languages
    .split(',')
    .map(language => `<span class="lang">${escapeHtml(language.trim())}</span>`)
    .join(' ');
  const awardsList = awards
    .split('\n')
    .map(award => `<p>&bull; ${escapeHtml(award.trim())}</p>`)
    .join('');
  const experienceList = experience
    .map(
      job => `<div class="job">
  <div class="job-role">${escapeHtml(job.role)}</div>
  <div class="job-meta">
    ${escapeHtml(job.company)} | ${escapeHtml(job.location)} | ${escapeHtml(
        job.duration,
      )}
  </div>
  <div class="job-desc">${escapeHtml(job.description).replaceAll('\n', '<br />')}</div>
</div>`,
    )
    .join('');

  return `
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 32px 42px; color: #111; }
    .header { text-align: center; margin-bottom: 18px; }
    .name { font-size: 32px; font-weight: bold; }
    .title { font-size: 18px; margin-top: 4px; }
    .contact { margin-top: 10px; font-size: 13px; }
    .section { margin-top: 20px; }
    .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
    ul { margin: 6px 0 0 18px; }
    li { margin-bottom: 6px; }
    .lang { display: inline-block; margin-right: 12px; }
    p { margin: 4px 0; line-height: 1.5; }
    .job { margin-bottom: 14px; }
    .job-role { font-size: 16px; font-weight: bold; }
    .job-meta { color: #444; margin-bottom: 6px; font-style: italic; }
    .job-desc { font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(name)}</div>
    <div class="title">${escapeHtml(jobTitle)}</div>
    <div class="contact">
      ${escapeHtml(address)} | ${escapeHtml(city)} | ${escapeHtml(email)} | ${escapeHtml(phone)} | ${escapeHtml(linkedin)}
    </div>
  </div>
  <div class="section">
    <div class="section-title">PROFILE</div>
    <p>${escapeHtml(summary)}</p>
  </div>
  <div class="section">
    <div class="section-title">PROFESSIONAL EXPERIENCE</div>
    ${experienceList}
  </div>
  <div class="section">
    <div class="section-title">EDUCATION</div>
    <p>${escapeHtml(education)}</p>
  </div>
  <div class="section">
    <div class="section-title">SKILLS</div>
    <ul>${skillList}</ul>
  </div>
  <div class="section">
    <div class="section-title">LANGUAGES</div>
    <p>${langList}</p>
  </div>
  <div class="section">
    <div class="section-title">AWARDS</div>
    ${awardsList}
  </div>
</body>
</html>`;
}
