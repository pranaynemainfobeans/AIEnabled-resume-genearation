// src/utils/pdfTemplate.ts
import { TailoredResumeData } from '../services/resumeApi';

export function escapeHtml(value: string = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function generateAtsHtml(data: TailoredResumeData['tailoredResume']) {
  const skillsList = (data.skills || '')
    .split(',')
    .map(skill => `<span class="skill-tag">${escapeHtml(skill.trim())}</span>`)
    .join(' • ');

  const experienceList = (data.experience || [])
    .map(
      job => `
    <div class="job">
      <div class="job-header">
        <span class="job-role">${escapeHtml(job.role)}</span>
        <span class="job-company">${escapeHtml(job.company)}</span>
      </div>
      <div class="job-meta">${escapeHtml(job.location || '')} | ${escapeHtml(job.duration || '')}</div>
      <div class="job-desc">${escapeHtml(job.description || '').replaceAll('\n', '<br />')}</div>
    </div>`,
    )
    .join('');

  return `
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 30px 40px; color: #111; line-height: 1.4; }
    .header { text-align: center; margin-bottom: 16px; }
    .name { font-size: 26px; font-weight: bold; text-transform: uppercase; }
    .title { font-size: 15px; font-weight: bold; margin-top: 2px; color: #333; }
    .contact { margin-top: 6px; font-size: 11px; color: #444; }
    .section { margin-top: 16px; }
    .section-title { font-size: 13px; font-weight: bold; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    p { margin: 4px 0; font-size: 12px; line-height: 1.5; }
    .job { margin-bottom: 12px; }
    .job-header { display: flex; justify-content: space-between; font-weight: bold; }
    .job-role { font-size: 13px; font-weight: bold; }
    .job-company { font-size: 13px; font-weight: normal; font-style: italic; }
    .job-meta { font-size: 11px; color: #555; margin-bottom: 4px; font-style: italic; }
    .job-desc { font-size: 11.5px; line-height: 1.5; text-align: justify; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(data.name)}</div>
    <div class="title">${escapeHtml(data.jobTitle)}</div>
    <div class="contact">
      ${escapeHtml(data.contactInfo?.email || '')} | 
      ${escapeHtml(data.contactInfo?.phone || '')} | 
      ${escapeHtml(data.contactInfo?.city || '')} | 
      ${escapeHtml(data.contactInfo?.linkedin || '')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p>${escapeHtml(data.summary)}</p>
  </div>

  <div class="section">
    <div class="section-title">Core Competencies & Technical Skills</div>
    <p>${skillsList}</p>
  </div>

  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${experienceList}
  </div>

  ${data.education ? `<div class="section"><div class="section-title">Education</div><p>${escapeHtml(data.education)}</p></div>` : ''}
  ${data.awards ? `<div class="section"><div class="section-title">Certifications & Awards</div><p>${escapeHtml(data.awards)}</p></div>` : ''}
</body>
</html>`;
}