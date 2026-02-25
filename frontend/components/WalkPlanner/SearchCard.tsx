import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { CustomTextInput } from "@/components/Inputs/CustomTextInput";
import type { PlaceSuggestion } from "@/types/walkPlanner";
import SuggestionItem from "./SuggestionItem";

interface SearchCardProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  suggestions: PlaceSuggestion[];
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
  onCancel: () => void;
  isSearching: boolean;
}

export default function SearchCard({
  value,
  onChangeText,
  onClear,
  suggestions,
  onSelectSuggestion,
  onCancel,
  isSearching,
}: SearchCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.inputContainer}>
        <CustomTextInput
          label="Search for a place"
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter address, place name..."
          autoFocus
          style={styles.input}
        />
        {value.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <CustomText
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              ✕
            </CustomText>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && (
        <CustomText variant="bodySmall" style={styles.searchingText}>
          Searching...
        </CustomText>
      )}

      {suggestions.length > 0 && (
        <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.placeId}
              suggestion={suggestion}
              onPress={() => onSelectSuggestion(suggestion)}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          Cancel
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    fontSize: 16,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  searchingText: {
    opacity: 0.7,
    fontStyle: "italic",
  },
  suggestionsList: {
    maxHeight: 200,
  },
  cancelButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
