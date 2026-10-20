import React from "react";
import { StyleSheet, View } from "react-native";
import { CustomDatePicker } from "@/components";

interface WalkTimeFieldsProps {
  value: Date;
  onChange: (value: Date) => void;
}

/** A walk's date and time, picked separately; each picker changes only its part */
export const WalkTimeFields: React.FC<WalkTimeFieldsProps> = ({ value, onChange }) => {
  const handleDateChange = (picked: Date) => {
    const next = new Date(value);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    onChange(next);
  };

  const handleTimeChange = (picked: Date) => {
    const next = new Date(value);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <CustomDatePicker
        testID="group-walk-date"
        label="Date"
        value={value}
        onChange={handleDateChange}
        minimumDate={new Date()}
      />
      <CustomDatePicker
        testID="group-walk-time"
        mode="time"
        label="Time"
        value={value}
        onChange={handleTimeChange}
      />
    </View>
  );
};

/** The check both forms make before saving; the backend checks it too */
export const futureTimeError = (value: Date): string | null =>
  value.getTime() <= Date.now() ? "Pick a time in the future." : null;

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
