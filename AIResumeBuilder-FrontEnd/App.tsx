import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FeatureActionCard from './src/components/FeatureActionCard';
import AIResumeFlowScreen from './src/screens/AIResumeFlowScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import { AppRoute } from './src/navigation/routes';

function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('resume');

  if (activeRoute === 'aiResumeFlow') {
    return (
      <SafeAreaProvider>
        <AIResumeFlowScreen onBack={() => setActiveRoute('resume')} />
      </SafeAreaProvider>
    );
  }

  if (activeRoute === 'score') {
    return (
      <SafeAreaProvider>
        <ScoreScreen onBack={() => setActiveRoute('resume')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>AI Resume Builder</Text>
          <View style={styles.actions}>
            <FeatureActionCard
              description="Tailor your resume to a target job in a few steps."
              icon="✦"
              onPress={() => setActiveRoute('aiResumeFlow')}
              testID="generate-ai-resume"
              title="Generate AI Resume"
            />
            <FeatureActionCard
              description="Get a quick review of your resume's strengths and gaps."
              icon="✓"
              onPress={() => setActiveRoute('score')}
              testID="check-resume-score"
              title="Check Resume Score"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 16, backgroundColor: '#F3F4F6' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  actions: { marginBottom: 8 },
});

export default App;
