import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customizeResume, optimizeSummary } from '../services/resumeApi';
import { Experience, ResumeDraft } from '../types/resume';

type AIResumeFlowScreenProps = {
  onBack: () => void;
};

type InputProps = {
  placeholder: string;
  value: string;
  setValue: (text: string) => void;
  multiline?: boolean;
};

const initialExperience: Experience = {
  role: 'Senior Software Engineer',
  company: 'Infobeans',
  location: 'Indore',
  duration: '3 years',
  description: 'Worked on multiple projects',
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function Input({
  placeholder,
  value,
  setValue,
  multiline = false,
}: InputProps) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={setValue}
      multiline={multiline}
      style={[styles.input, multiline && styles.multilineInput]}
    />
  );
}

export default function AIResumeFlowScreen({
  onBack,
}: AIResumeFlowScreenProps) {
  const [name, setName] = useState('Pranay Nema');
  const [phone, setPhone] = useState('1231231231');
  const [email, setEmail] = useState('asd@m.com');
  const [city, setCity] = useState('indore');
  const [summary, setSummary] = useState(
    'Overall, my 6 years of experience as a React Native mobile app developer have enabled me to develop a robust skill set and a deep understanding of the field.',
  );
  const [skills, setSkills] = useState('React,React Native,Redux');
  const [education, setEducation] = useState(
    "Acropolis Institute of Research and Technology Indore - Bachelor's Degree, Computer Engineering (2012 - 2016)",
  );
  const [jobTitle, setJobTitle] = useState('Senior Developer');
  const [address, setAddress] = useState('M.G. Road, Indore');
  const [linkedin, setLinkedin] = useState('linkedin.com/in/pranay');
  const [languages, setLanguages] = useState('Hindi,English');
  const [awards, setAwards] = useState('ABCD Award');
  const [jobDescription, setJobDescription] = useState('');
  const [newExp, setNewExp] = useState<Experience>(initialExperience);
  const [experience, setExperience] = useState<Experience[]>([
    initialExperience,
  ]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [optimizedSummary, setOptimizedSummary] = useState('');
  const [optimizedExperience, setOptimizedExperience] = useState<Experience[]>(
    [],
  );

  const resumeDraft: ResumeDraft = {
    name,
    phone,
    email,
    city,
    summary,
    skills,
    education,
    jobTitle,
    address,
    linkedin,
    languages,
    awards,
    experience,
  };

  const enhanceSummaryWithAI = async () => {
    if (!summary.trim()) {
      Alert.alert('Error', 'Please write a draft profile summary first.');
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert(
        'Error',
        'Please provide a target Job Description to match keywords.',
      );
      return;
    }

    setIsEnhancingSummary(true);
    try {
      setSummary(await optimizeSummary(summary, jobDescription));
      Alert.alert('Success', 'Profile summary optimized!');
    } catch (requestError) {
      Alert.alert(
        'AI Error',
        requestError instanceof Error
          ? requestError.message
          : 'Could not optimize profile summary.',
      );
    } finally {
      setIsEnhancingSummary(false);
    }
  };

  const enhanceDescriptionWithAI = async () => {
    if (!newExp.description.trim()) {
      Alert.alert('Error', 'Please enter your work description first.');
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert(
        'Error',
        'Please provide a Job Description to match ATS keywords.',
      );
      return;
    }

    setIsEnhancing(true);
    try {
      const enhancedText = await customizeResume(
        newExp.description,
        jobDescription,
      );
      setNewExp(previous => ({ ...previous, description: enhancedText }));
      Alert.alert('Success', 'Description optimized with ATS keywords!');
    } catch (requestError) {
      Alert.alert(
        'AI Error',
        requestError instanceof Error
          ? requestError.message
          : 'Could not optimize experience description.',
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const addExperience = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) {
      Alert.alert('Error', 'Please enter at least a Job Title and Company.');
      return;
    }
    setExperience(previous => [...previous, { ...newExp }]);
    setNewExp({
      role: '',
      company: '',
      location: '',
      duration: '',
      description: '',
    });
  };

  const generateResume = async () => {
    if (!jobDescription.trim()) {
      setError('Add a target job description before generating your resume.');
      return;
    }
    if (!resumeDraft.summary.trim() && resumeDraft.experience.length === 0) {
      setError(
        'Add a summary or work experience before generating your resume.',
      );
      return;
    }

    setError('');
    setIsGenerating(true);
    try {
      const summaryPromise = resumeDraft.summary.trim()
        ? optimizeSummary(resumeDraft.summary, jobDescription)
        : Promise.resolve('');
      const experiencePromise = Promise.all(
        resumeDraft.experience.map(async resumeExperience => ({
          ...resumeExperience,
          description: resumeExperience.description.trim()
            ? await customizeResume(
                resumeExperience.description,
                jobDescription,
              )
            : resumeExperience.description,
        })),
      );
      const [summaryResult, experienceResult] = await Promise.all([
        summaryPromise,
        experiencePromise,
      ]);
      setOptimizedSummary(summaryResult);
      setOptimizedExperience(experienceResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not generate an optimized resume.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const applyChanges = () => {
    if (!optimizedSummary && optimizedExperience.length === 0) {
      setError('Generate your AI resume before applying changes.');
      return;
    }
    if (optimizedSummary) {
      setSummary(optimizedSummary);
    }
    if (optimizedExperience.length > 0) {
      setExperience(optimizedExperience);
    }
    setError('');
    setOptimizedSummary('');
    setOptimizedExperience([]);
  };

  const generatePDFNew = async () => {
    try {
      const skillList = skills
        .split(',')
        .map(skill => `<li>${escapeHtml(skill.trim())}</li>`)
        .join('');
      const langList = languages
        .split(',')
        .map(
          language =>
            `<span class="lang">${escapeHtml(language.trim())}</span>`,
        )
        .join(' ');
      const awardsList = awards
        .split('\n')
        .map(award => `<p>&bull; ${escapeHtml(award.trim())}</p>`)
        .join('');
      const experienceList = experience
        .map(
          job => `<div class="job">
  <div class="job-role">${escapeHtml(job.role)}</div>
  <div class="job-meta">${escapeHtml(job.company)} | ${escapeHtml(
            job.location,
          )} | ${escapeHtml(job.duration)}</div>
  <div class="job-desc">${escapeHtml(job.description).replaceAll(
    '\n',
    '<br />',
  )}</div>
</div>`,
        )
        .join('');

      const htmlContent = `
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
    <div class="contact">${escapeHtml(address)} | ${escapeHtml(
        city,
      )} | ${escapeHtml(email)} | ${escapeHtml(phone)} | ${escapeHtml(
        linkedin,
      )}</div>
  </div>
  <div class="section"><div class="section-title">PROFILE</div><p>${escapeHtml(
    summary,
  )}</p></div>
  <div class="section"><div class="section-title">PROFESSIONAL EXPERIENCE</div>${experienceList}</div>
  <div class="section"><div class="section-title">EDUCATION</div><p>${escapeHtml(
    education,
  )}</p></div>
  <div class="section"><div class="section-title">SKILLS</div><ul>${skillList}</ul></div>
  <div class="section"><div class="section-title">LANGUAGES</div><p>${langList}</p></div>
  <div class="section"><div class="section-title">AWARDS</div>${awardsList}</div>
</body>
</html>`;

      const file = await generatePDF({
        html: htmlContent,
        fileName: 'Resume',
        directory: 'Documents',
      });
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
      });
    } catch {
      Alert.alert('Error', 'Could not generate or share resume PDF.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBack}
          testID="back-to-resume"
        >
          <Text style={styles.back}>‹ Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>AI RESUME FLOW</Text>
        <Text style={styles.title}>Create your tailored resume</Text>
        <Text style={styles.subtitle}>
          Add your details, tailor them to a target role, and export the
          finished resume.
        </Text>

        <View style={styles.form}>
          <Text style={styles.heading}>Target Job Details</Text>
          <TextInput
            accessibilityLabel="Target job description"
            placeholder="Paste the target Job Description here (Required for AI features)"
            style={[styles.input, styles.descriptionInput]}
            multiline
            value={jobDescription}
            onChangeText={setJobDescription}
          />
        </View>

        <Input placeholder="Full Name" value={name} setValue={setName} />
        <Input placeholder="Phone" value={phone} setValue={setPhone} />
        <Input placeholder="Email" value={email} setValue={setEmail} />
        <Input placeholder="City" value={city} setValue={setCity} />

        <View style={styles.form}>
          <Text style={styles.heading}>Professional Summary</Text>
          <TextInput
            placeholder="Write a brief professional overview..."
            style={[styles.input, styles.multilineInput]}
            multiline
            value={summary}
            onChangeText={setSummary}
          />
          <TouchableOpacity
            style={[
              styles.aiButton,
              isEnhancingSummary && styles.disabledButton,
            ]}
            onPress={enhanceSummaryWithAI}
            disabled={isEnhancingSummary}
          >
            {isEnhancingSummary ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>AI Enhance Summary</Text>
            )}
          </TouchableOpacity>
        </View>

        <Input
          placeholder="Skills (comma separated)"
          value={skills}
          setValue={setSkills}
          multiline
        />

        <View style={styles.form}>
          <Text style={styles.heading}>Add Professional Experience</Text>
          <Input
            placeholder="Job Title"
            value={newExp.role}
            setValue={role => setNewExp({ ...newExp, role })}
          />
          <Input
            placeholder="Company"
            value={newExp.company}
            setValue={company => setNewExp({ ...newExp, company })}
          />
          <Input
            placeholder="Location"
            value={newExp.location}
            setValue={location => setNewExp({ ...newExp, location })}
          />
          <Input
            placeholder="Duration (Jan 2022 - Present)"
            value={newExp.duration}
            setValue={duration => setNewExp({ ...newExp, duration })}
          />
          <TextInput
            placeholder="Describe your work"
            style={[styles.input, styles.descriptionInput]}
            multiline
            value={newExp.description}
            onChangeText={description => setNewExp({ ...newExp, description })}
          />
          <TouchableOpacity
            style={[styles.aiButton, isEnhancing && styles.disabledButton]}
            onPress={enhanceDescriptionWithAI}
            disabled={isEnhancing}
          >
            {isEnhancing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>AI Enhance Description</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={addExperience}>
            <Text style={styles.buttonText}>Add Experience</Text>
          </TouchableOpacity>
        </View>

        {experience.length > 0 && (
          <View style={styles.resumeSection}>
            <Text style={styles.sectionTitle}>Added Experience</Text>
            {experience.map((job, index) => (
              <View
                key={`${job.company}-${job.role}-${index}`}
                style={styles.jobBlock}
              >
                <Text style={styles.jobRole}>{job.role}</Text>
                <Text style={styles.jobMeta}>
                  {job.company}
                  {job.location ? ` | ${job.location}` : ''}
                  {job.duration ? ` | ${job.duration}` : ''}
                </Text>
                {!!job.description && (
                  <Text style={styles.jobDesc}>{job.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Input
          placeholder="Education"
          value={education}
          setValue={setEducation}
          multiline
        />
        <Input
          placeholder="Job Title"
          value={jobTitle}
          setValue={setJobTitle}
        />
        <Input placeholder="Address" value={address} setValue={setAddress} />
        <Input placeholder="Linkedin" value={linkedin} setValue={setLinkedin} />
        <Input
          placeholder="Languages (comma separated)"
          value={languages}
          setValue={setLanguages}
        />
        <Input
          placeholder="Awards (one per line)"
          value={awards}
          setValue={setAwards}
          multiline
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={isGenerating}
          onPress={generateResume}
          style={[styles.primaryButton, isGenerating && styles.disabledButton]}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate AI Resume</Text>
          )}
        </TouchableOpacity>

        {!!error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {(optimizedSummary || optimizedExperience.length > 0) && (
          <View style={styles.result}>
            <Text style={styles.resultLabel}>AI REVIEW</Text>
            <Text style={styles.resultTitle}>Review optimized content</Text>
            {!!optimizedSummary && (
              <>
                <Text style={styles.resultHeading}>Professional summary</Text>
                <Text style={styles.resultText}>{optimizedSummary}</Text>
              </>
            )}
            {optimizedExperience.map((optimizedJob, index) => (
              <View
                key={`${optimizedJob.company}-${optimizedJob.role}-${index}`}
              >
                <Text style={styles.resultHeading}>{optimizedJob.role}</Text>
                <Text style={styles.resultText}>
                  {optimizedJob.description}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={applyChanges}
              style={styles.applyButton}
            >
              <Text style={styles.primaryButtonText}>
                Apply Changes to Resume
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={generatePDFNew}>
          <Text style={styles.buttonText}>Generate Resume PDF</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { padding: 16 },
  back: { color: '#4F46E5', fontSize: 15, fontWeight: '600', marginBottom: 20 },
  eyebrow: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { color: '#111827', fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  descriptionInput: { height: 80, textAlignVertical: 'top' },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 10,
    padding: 15,
  },
  heading: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 6,
    marginTop: 10,
    padding: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 7,
    marginTop: 12,
    padding: 14,
  },
  aiButton: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 6,
    marginTop: 5,
    padding: 12,
  },
  disabledButton: { backgroundColor: '#A5B4FC' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  resumeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 12,
    padding: 15,
  },
  sectionTitle: {
    borderBottomWidth: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobBlock: { marginBottom: 15 },
  jobRole: { fontSize: 15, fontWeight: 'bold' },
  jobMeta: { color: '#444444', fontStyle: 'italic', marginBottom: 4 },
  jobDesc: { fontSize: 13, lineHeight: 18, textAlign: 'justify' },
  error: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginTop: 14,
    padding: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
  result: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    marginTop: 14,
    padding: 16,
  },
  resultLabel: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultTitle: {
    color: '#065F46',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  resultHeading: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },
  resultText: { color: '#047857', fontSize: 14, lineHeight: 20, marginTop: 6 },
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 7,
    marginTop: 18,
    padding: 14,
  },
  spacer: { height: 50 },
});
