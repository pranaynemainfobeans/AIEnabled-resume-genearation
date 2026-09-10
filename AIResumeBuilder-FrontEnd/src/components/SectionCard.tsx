import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.form}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 10,
    borderRadius: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
