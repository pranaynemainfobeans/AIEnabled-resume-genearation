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
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tailorResume, TailoredResumeData } from '../services/resumeApi';
import { generateAtsHtml } from '../utils/pdfTemplate';

type AIResumeFlowScreenProps = {
  onBack: () => void;
};

export default function AIResumeFlowScreen({
  onBack,
}: AIResumeFlowScreenProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] =
    useState<DocumentPickerResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Score & Keyword Meta State
  const [metaData, setMetaData] = useState<{
    initialMatchScore: number;
    projectedAtsScore: number;
    keyKeywordsAdded: string[];
  } | null>(null);

  // Editable Form State (Pre-filled by AI Output)
  const [editableData, setEditableData] = useState<
    TailoredResumeData['tailoredResume'] | null
  >(null);

  const pickResume = async () => {
    try {
      const file = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });
      setSelectedFile(file);
      setError('');
    } catch (pickerError) {
      if (!DocumentPicker.isCancel(pickerError)) {
        Alert.alert('Error', 'Failed to select PDF file.');
      }
    }
  };

  const processAndTailor = async () => {
    if (!selectedFile?.uri || !selectedFile.name) {
      Alert.alert(
        'Missing Input',
        'Please upload an existing candidate PDF resume.',
      );
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert('Missing Input', 'Please paste the client/job requirements.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setMetaData(null);
    setEditableData(null);

    try {
      const response = await tailorResume(
        {
          name: selectedFile.name,
          type: selectedFile.type || 'application/pdf',
          uri: selectedFile.fileCopyUri || selectedFile.uri,
        },
        jobDescription,
      );

      // Save meta analytics
      setMetaData({
        initialMatchScore: response.initialMatchScore ?? 0,
        projectedAtsScore: response.projectedAtsScore ?? 90,
        keyKeywordsAdded: response.keyKeywordsAdded || [],
      });

      // Hydrate editable fields with AI response
      setEditableData(response.tailoredResume);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Automation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Field change handlers
  const handleContactChange = (
    field: keyof TailoredResumeData['tailoredResume']['contactInfo'],
    value: string,
  ) => {
    if (!editableData) return;
    setEditableData({
      ...editableData,
      contactInfo: {
        ...editableData.contactInfo,
        [field]: value,
      },
    });
  };

  const handleExperienceChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    if (!editableData) return;
    const updatedExp = [...editableData.experience];
    updatedExp[index] = { ...updatedExp[index], [field]: value };
    setEditableData({ ...editableData, experience: updatedExp });
  };

  const exportPdf = async () => {
    if (!editableData) return;
    try {
      const htmlContent = generateAtsHtml(editableData);
      const name = editableData.name || 'Candidate';
      const fileName = `${name.replace(/\s+/g, '_')}_Tailored_Resume`;
      const file = await generatePDF({
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',
      });
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
      });
    } catch {
      Alert.alert('Error', 'Could not generate or export PDF.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>AUTOMATED ATS OPTIMIZER</Text>
        <Text style={styles.title}>Tailor Resume to Requirement</Text>
        <Text style={styles.subtitle}>
          Upload a resume, enter client requirements, review & edit the AI
          suggestions, and export your updated PDF.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>1. Upload Candidate Resume (PDF)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
            <Text style={styles.uploadBtnText}>
              {selectedFile
                ? `Selected: ${selectedFile.name}`
                : 'Choose Candidate Resume PDF'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>2. Client / Job Requirements</Text>
          <TextInput
            placeholder="Paste client job requirements, desired skills, and target responsibilities..."
            style={styles.jdInput}
            multiline
            value={jobDescription}
            onChangeText={setJobDescription}
          />

          <TouchableOpacity
            disabled={isProcessing}
            style={[
              styles.primaryButton,
              isProcessing && styles.disabledButton,
            ]}
            onPress={processAndTailor}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Automate & Optimize Resume
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {metaData && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Optimization Impact</Text>

            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreNumber}>
                  {metaData.initialMatchScore}
                </Text>
                <Text style={styles.scoreLabel}>Initial Score</Text>
              </View>
              <Text style={styles.arrow}>➔</Text>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreNumber, { color: '#047857' }]}>
                  {metaData.projectedAtsScore}+
                </Text>
                <Text style={styles.scoreLabel}>Target Score</Text>
              </View>
            </View>

            {metaData.keyKeywordsAdded.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Keywords Added:</Text>
                <View style={styles.tagContainer}>
                  {metaData.keyKeywordsAdded.map((kw, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>+ {kw}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {editableData && (
          <View style={styles.editorContainer}>
            <Text style={styles.editorMainTitle}>
              Review & Edit Tailored Content
            </Text>
            <Text style={styles.editorSubTitle}>
              Feel free to adjust any text below before exporting.
            </Text>

            {/* Candidate Header Details */}
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editableData.name}
                onChangeText={text =>
                  setEditableData({ ...editableData, name: text })
                }
              />

              <Text style={styles.fieldLabel}>Target Role Title</Text>
              <TextInput
                style={styles.input}
                value={editableData.jobTitle}
                onChangeText={text =>
                  setEditableData({ ...editableData, jobTitle: text })
                }
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editableData.contactInfo?.email}
                    onChangeText={text => handleContactChange('email', text)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={editableData.contactInfo?.phone}
                    onChangeText={text => handleContactChange('phone', text)}
                  />
                </View>
              </View>
            </View>

            {/* Professional Summary */}
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>Professional Summary</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                multiline
                value={editableData.summary}
                onChangeText={text =>
                  setEditableData({ ...editableData, summary: text })
                }
              />
            </View>

            {/* Core Skills */}
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>
                Core Skills (Comma Separated)
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { height: 70 }]}
                multiline
                value={
                  typeof editableData.skills === 'string'
                    ? editableData.skills
                    : (editableData.skills || []).join(', ')
                }
                onChangeText={text =>
                  setEditableData({ ...editableData, skills: text })
                }
              />
            </View>

            {/* Professional Experience */}
            <View style={styles.editSection}>
              <Text style={styles.sectionHeader}>Work Experience</Text>
              {(editableData.experience || []).map((exp, index) => (
                <View key={index} style={styles.experienceBlock}>
                  <Text style={styles.expIndexTitle}>Role #{index + 1}</Text>

                  <Text style={styles.fieldLabel}>Job Title / Role</Text>
                  <TextInput
                    style={styles.input}
                    value={exp.role}
                    onChangeText={text =>
                      handleExperienceChange(index, 'role', text)
                    }
                  />

                  <Text style={styles.fieldLabel}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    value={exp.company}
                    onChangeText={text =>
                      handleExperienceChange(index, 'company', text)
                    }
                  />

                  <Text style={styles.fieldLabel}>
                    Description / Bullet Points
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.multilineInput,
                      { height: 110 },
                    ]}
                    multiline
                    value={exp.description}
                    onChangeText={text =>
                      handleExperienceChange(index, 'description', text)
                    }
                  />
                </View>
              ))}
            </View>

            {/* Education */}
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TextInput
                style={styles.input}
                value={editableData.education}
                onChangeText={text =>
                  setEditableData({ ...editableData, education: text })
                }
              />
            </View>

            {/* Export PDF Button */}
            <TouchableOpacity style={styles.exportButton} onPress={exportPdf}>
              <Text style={styles.primaryButtonText}>
                Generate PDF of Updated Resume
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { padding: 16 },
  back: { color: '#4F46E5', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  eyebrow: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { color: '#111827', fontSize: 26, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#6B7280', fontSize: 14, marginTop: 6, marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 16 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
    marginBottom: 6,
  },
  uploadBtn: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  uploadBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  jdInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: { backgroundColor: '#A5B4FC' },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  errorCard: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 13 },
  resultCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 14,
  },
  scoreBox: { alignItems: 'center' },
  scoreNumber: { fontSize: 28, fontWeight: '800', color: '#DC2626' },
  scoreLabel: { fontSize: 12, color: '#047857', marginTop: 2 },
  arrow: { fontSize: 20, color: '#059669' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 6,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { color: '#065F46', fontSize: 12, fontWeight: '600' },
  editorContainer: { marginTop: 20 },
  editorMainTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  editorSubTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  editSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#111827',
  },
  multilineInput: { height: 90, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row' },
  experienceBlock: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    pt: 10,
    marginTop: 10,
  },
  expIndexTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  exportButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
});
