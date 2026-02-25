import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { CustomText } from "@/components/CustomText";
import { CustomTextInput } from "@/components/Inputs/CustomTextInput";
import { formatDuration, calculateWalkDuration } from "@/utils/timeUtils";

interface DistanceSelectorProps {
  value: number;
  onChange: (distance: number) => void;
  min?: number;
  max?: number;
}

export default function DistanceSelector({
  value,
  onChange,
  min = 0.5,
  max = 30,
}: DistanceSelectorProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(value.toString());

  const handleSliderChange = (newValue: number) => {
    const roundedValue = Math.round(newValue * 10) / 10;
    onChange(roundedValue);
    setInputValue(roundedValue.toString());
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <CustomTextInput
          label="Distance (km)"
          value={inputValue}
          onChangeText={handleInputChange}
          keyboardType="number-pad"
          maxLength={5}
          style={styles.input}
        />
      </View>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabels}>
          <CustomText variant="bodySmall" style={styles.labelText}>
            {min} km
          </CustomText>
          <CustomText variant="bodySmall" style={styles.labelText}>
            {max} km
          </CustomText>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={0.1}
          value={value}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surfaceVariant}
          thumbTintColor={theme.colors.primary}
        />

        <View
          style={[
            styles.valueDisplay,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <CustomText variant="titleMedium" style={styles.valueText}>
            {value.toFixed(1)} km
          </CustomText>
          <CustomText variant="bodySmall" style={styles.durationText}>
            ~{formatDuration(calculateWalkDuration(value))}
          </CustomText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  inputContainer: {
    maxWidth: 200,
  },
  input: {
    fontSize: 16,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelText: {
    opacity: 0.7,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  valueDisplay: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  valueText: {
    fontWeight: "600",
  },
  durationText: {
    opacity: 0.7,
    marginTop: 4,
  },
});
