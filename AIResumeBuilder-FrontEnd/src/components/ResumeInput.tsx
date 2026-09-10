import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

type ResumeInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
};

export default function ResumeInput({
  placeholder,
  value,
  onChangeText,
  multiline = false,
}: ResumeInputProps) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      style={[styles.input, multiline && styles.multilineInput]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});
