import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CustomDatePicker } from "@/components";
import i18n from "@/i18n";

interface WalkTimeFieldsProps {
  value: Date;
  onChange: (value: Date) => void;
}

/** A walk's date and time, picked separately; each picker changes only its part */
export const WalkTimeFields: React.FC<WalkTimeFieldsProps> = ({ value, onChange }) => {
  const { t } = useTranslation("social");
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
        label={t("form.date")}
        value={value}
        onChange={handleDateChange}
        minimumDate={new Date()}
      />
      <CustomDatePicker
        testID="group-walk-time"
        mode="time"
        label={t("form.time")}
        value={value}
        onChange={handleTimeChange}
      />
    </View>
  );
};

/** The check both forms make before saving; the backend checks it too */
export const futureTimeError = (value: Date): string | null =>
  value.getTime() <= Date.now() ? i18n.t("social:form.futureTime") : null;

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
