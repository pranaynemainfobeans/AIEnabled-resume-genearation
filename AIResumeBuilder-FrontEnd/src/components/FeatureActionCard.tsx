import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FeatureActionCardProps = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  testID?: string;
};

export default function FeatureActionCard({
  icon,
  title,
  description,
  onPress,
  testID,
}: FeatureActionCardProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.card}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  icon: { color: '#4F46E5', fontSize: 20 },
  copy: { flex: 1, marginLeft: 12 },
  title: { color: '#111827', fontSize: 16, fontWeight: '700' },
  description: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 3 },
  arrow: { color: '#9CA3AF', fontSize: 28, marginLeft: 8 },
});
