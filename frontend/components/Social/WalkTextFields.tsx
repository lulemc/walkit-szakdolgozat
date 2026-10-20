import React from "react";
import { View } from "react-native";
import { CustomTextInput } from "@/components";

// Same limits as the backend
const TITLE_MAX_LENGTH = 80;
const NOTE_MAX_LENGTH = 500;

interface WalkTextFieldsProps {
  title: string;
  note: string;
  onTitleChange: (title: string) => void;
  onNoteChange: (note: string) => void;
}

/** A group walk's optional title and note */
export const WalkTextFields: React.FC<WalkTextFieldsProps> = ({
  title,
  note,
  onTitleChange,
  onNoteChange,
}) => (
  <View>
    <CustomTextInput
      label="Title (optional)"
      accessibilityLabel="Title (optional)"
      value={title}
      onChangeText={onTitleChange}
      maxLength={TITLE_MAX_LENGTH}
      autoCapitalize="sentences"
    />
    <CustomTextInput
      label="Note (optional)"
      accessibilityLabel="Note (optional)"
      value={note}
      onChangeText={onNoteChange}
      maxLength={NOTE_MAX_LENGTH}
      autoCapitalize="sentences"
      multiline
    />
  </View>
);
