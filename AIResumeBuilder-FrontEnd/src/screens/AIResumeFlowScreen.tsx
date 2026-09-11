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
  const [tailoredData, setTailoredData] = useState<TailoredResumeData | null>(
    null,
  );
  const [error, setError] = useState('');

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
    setTailoredData(null);

    try {
      const response = await tailorResume(
        {
          name: selectedFile.name,
          type: selectedFile.type || 'application/pdf',
          uri: selectedFile.fileCopyUri || selectedFile.uri,
        },
        jobDescription,
      );
      setTailoredData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Automation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportPdf = async () => {
    if (!tailoredData?.tailoredResume) return;
    try {
      const htmlContent = generateAtsHtml(tailoredData.tailoredResume);
      const name = tailoredData.tailoredResume.name || 'Candidate';
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

  const keywordsList = tailoredData?.keyKeywordsAdded || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>AUTOMATED ATS OPTIMIZER</Text>
        <Text style={styles.title}>Tailor Resume to Requirement</Text>
        <Text style={styles.subtitle}>
          Upload a resume, enter client requirements, and let AI generate a 90+
          ATS optimized PDF.
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

        {tailoredData && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Optimization Impact</Text>

            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreNumber}>
                  {tailoredData.initialMatchScore ?? 0}
                </Text>
                <Text style={styles.scoreLabel}>Initial Score</Text>
              </View>
              <Text style={styles.arrow}>➔</Text>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreNumber, { color: '#047857' }]}>
                  {tailoredData.projectedAtsScore ?? 90}+
                </Text>
                <Text style={styles.scoreLabel}>Target Score</Text>
              </View>
            </View>

            {keywordsList.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Keywords Added:</Text>
                <View style={styles.tagContainer}>
                  {keywordsList.map((kw, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>+ {kw}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.exportButton} onPress={exportPdf}>
              <Text style={styles.primaryButtonText}>
                Export 90+ ATS Resume PDF
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
    height: 120,
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
  primaryButtonText: { color: '#FFF', fontWeight: '700' },
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { color: '#065F46', fontSize: 12, fontWeight: '600' },
  exportButton: {
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});
