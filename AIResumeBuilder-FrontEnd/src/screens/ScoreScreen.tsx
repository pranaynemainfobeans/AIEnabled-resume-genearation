import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scoreResume } from '../services/resumeApi';
import { ResumeScoreResult } from '../services/resumeApi';

type ScoreScreenProps = { onBack: () => void };

export default function ScoreScreen({ onBack }: ScoreScreenProps) {
  const [selectedFile, setSelectedFile] =
    useState<DocumentPickerResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScoreResult | null>(
    null,
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState('');

  const selectResume = async () => {
    setError('');
    setScoreResult(null);
    setIsSelecting(true);
    try {
      const file = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
        copyTo: 'cachesDirectory',
      });
      if (!file.name || !file.uri) {
        setError(
          'The selected file could not be read. Please choose another file.',
        );
        return;
      }
      const fileName = file.name.toLowerCase();
      const supportedType =
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const supportedExtension = /\.(pdf|doc|docx)$/.test(fileName);
      if (!supportedType && !supportedExtension) {
        setError('Choose a PDF, DOC, or DOCX resume.');
        return;
      }
      setSelectedFile(file);
    } catch (pickerError) {
      if (!DocumentPicker.isCancel(pickerError)) {
        setError('Could not select the resume. Please try again.');
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const checkScore = async () => {
    if (!selectedFile?.name || !selectedFile.uri) {
      setError('Select a PDF, DOC, or DOCX resume first.');
      return;
    }

    setError('');
    setIsScoring(true);
    try {
      const result = await scoreResume({
        name: selectedFile.name,
        type: selectedFile.type || 'application/octet-stream',
        uri: selectedFile.fileCopyUri || selectedFile.uri,
      });
      setScoreResult(result);
    } catch (scoreError) {
      setError(
        scoreError instanceof Error
          ? scoreError.message
          : 'Could not score this resume. Please try again.',
      );
    } finally {
      setIsScoring(false);
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
          <Text style={styles.back}>‹ Back to Resume</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>RESUME SCORE</Text>
        <Text style={styles.title}>See how ready your resume is</Text>
        <Text style={styles.subtitle}>
          Upload your resume to receive an AI-powered score and actionable
          feedback.
        </Text>

        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>Upload your resume</Text>
          <Text style={styles.supported}>
            Supported formats: PDF, DOC, DOCX
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isSelecting}
            onPress={selectResume}
            style={styles.secondaryButton}
          >
            {isSelecting ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {selectedFile
                  ? 'Choose a different file'
                  : 'Select resume file'}
              </Text>
            )}
          </TouchableOpacity>
          {!!selectedFile?.name && (
            <Text style={styles.fileName} numberOfLines={2}>
              {selectedFile.name}
            </Text>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isScoring || !selectedFile}
            onPress={checkScore}
            style={[
              styles.primaryButton,
              (isScoring || !selectedFile) && styles.disabled,
            ]}
          >
            {isScoring ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Check Resume Score</Text>
            )}
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {scoreResult && (
          <View style={styles.resultCard}>
            <Text style={styles.scoreSectionTitle}>Resume Score</Text>
            <ScoreCircle score={scoreResult.score} overall />
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            <View style={styles.categoryGrid}>
              <CategoryScore
                label="ATS Compatibility"
                score={scoreResult.categoryScores?.atsCompatibility}
              />
              <CategoryScore
                label="Professional Summary"
                score={scoreResult.categoryScores?.professionalSummary}
              />
              <CategoryScore
                label="Work Experience"
                score={scoreResult.categoryScores?.workExperience}
              />
              <CategoryScore
                label="Skills"
                score={scoreResult.categoryScores?.skills}
              />
              <CategoryScore
                label="Achievements & Impact"
                score={scoreResult.categoryScores?.achievementsAndImpact}
              />
              <CategoryScore
                label="Structure & Clarity"
                score={scoreResult.categoryScores?.structureAndClarity}
              />
            </View>
            {!!scoreResult.analysis && (
              <Text style={styles.analysis}>{scoreResult.analysis}</Text>
            )}
            {!!scoreResult.strengths.length && (
              <ScoreList
                title="Strengths"
                items={scoreResult.strengths}
                positive
              />
            )}
            {!!scoreResult.improvements.length && (
              <ScoreList
                title="Improvements needed"
                items={scoreResult.improvements}
              />
            )}
            {!!scoreResult.recommendations.length && (
              <ScoreList
                title="Recommendations"
                items={scoreResult.recommendations}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ScoreListProps = { title: string; items: string[]; positive?: boolean };

type ScoreCircleProps = { score?: number; overall?: boolean };

function getScoreColor(score = 0) {
  if (score >= 90) {
    return '#047857';
  }
  if (score >= 80) {
    return '#0F766E';
  }
  if (score >= 70) {
    return '#2563EB';
  }
  if (score >= 60) {
    return '#D97706';
  }
  return '#DC2626';
}

function ScoreCircle({ score = 0, overall = false }: ScoreCircleProps) {
  const normalizedScore = Number.isFinite(score) ? score : 0;
  const color = getScoreColor(normalizedScore);

  return (
    <View
      accessibilityLabel={`${normalizedScore} out of 100`}
      accessibilityRole="text"
      style={[
        overall ? styles.scoreCircle : styles.categoryCircle,
        { borderColor: color },
      ]}
    >
      <Text style={[overall ? styles.score : styles.categoryScore, { color }]}>
        {normalizedScore}
      </Text>
      {overall && <Text style={styles.outOf}>/ 100</Text>}
    </View>
  );
}

type CategoryScoreProps = { label: string; score?: number };

function CategoryScore({ label, score }: CategoryScoreProps) {
  return (
    <View
      accessibilityLabel={`${label}: ${score ?? 0} out of 100`}
      accessibilityRole="text"
      style={styles.categoryItem}
    >
      <ScoreCircle score={score} />
      <Text style={styles.categoryLabel}>{label}</Text>
    </View>
  );
}

function ScoreList({ title, items, positive = false }: ScoreListProps) {
  return (
    <View style={styles.list}>
      <Text style={styles.listTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text
          key={`${item}-${index}`}
          style={[styles.listItem, positive && styles.positive]}
        >
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F3F4F6', flex: 1 },
  container: { padding: 20 },
  back: { color: '#4F46E5', fontSize: 15, fontWeight: '600', marginBottom: 28 },
  eyebrow: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { color: '#111827', fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#6B7280', fontSize: 15, lineHeight: 22, marginTop: 10 },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 24,
    padding: 16,
  },
  cardTitle: { color: '#111827', fontSize: 17, fontWeight: '700' },
  supported: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#C7D2FE',
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  secondaryButtonText: { color: '#4F46E5', fontWeight: '700' },
  fileName: { color: '#374151', fontSize: 14, marginTop: 12 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 7,
    marginTop: 14,
    padding: 14,
  },
  disabled: { backgroundColor: '#A5B4FC' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  error: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginTop: 14,
    padding: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 14,
    padding: 20,
  },
  scoreSectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    borderRadius: 68,
    borderWidth: 10,
    height: 136,
    justifyContent: 'center',
    width: 136,
    alignSelf: 'center',
    marginTop: 12,
  },
  score: { fontSize: 40, fontWeight: '800' },
  outOf: { color: '#6B7280', fontSize: 13 },
  breakdownTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginBottom: 18,
    width: '31%',
  },
  categoryCircle: {
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: 6,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  categoryScore: { fontSize: 21, fontWeight: '800' },
  categoryLabel: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  analysis: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 18,
    textAlign: 'center',
  },
  list: { alignSelf: 'stretch', marginTop: 18 },
  listTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  listItem: { color: '#B45309', fontSize: 14, lineHeight: 21, marginBottom: 5 },
  positive: { color: '#047857' },
});
