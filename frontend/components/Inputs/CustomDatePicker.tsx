import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { CustomText } from "../CustomText";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/theme/colors";
import i18n from "@/i18n";

interface CustomDatePickerProps {
  value: Date;
  /** Called with the date the user picked (not when they dismiss the picker) */
  onChange: (date: Date) => void;
  label: string;
  disabled?: boolean;
  mode?: "date" | "time";
  minimumDate?: Date;
  testID?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  mode = "date",
  minimumDate,
  testID,
}) => {
  // On Android the picker is a dialog that opens as soon as it is rendered,
  // so it is only rendered after the button is pressed
  const isAndroid = Platform.OS === "android";
  const [open, setOpen] = useState(false);
  const formatted =
    mode === "date"
      ? value.toLocaleDateString(i18n.language)
      : value.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });

  const handleValueChange = (_event: unknown, date: Date) => {
    if (isAndroid) setOpen(false);
    onChange(date);
  };

  return (
    <View style={styles.rowInputContainer}>
      <CustomText variant="labelLarge">{label}:</CustomText>
      {isAndroid && (
        <Button
          mode="outlined"
          onPress={() => setOpen(true)}
          disabled={disabled}
          accessibilityLabel={`${label}: ${formatted}`}
        >
          {formatted}
        </Button>
      )}
      {(!isAndroid || open) && (
        <DateTimePicker
          testID={testID}
          value={value}
          mode={mode}
          accentColor={colors.khaki}
          display="default"
          onValueChange={handleValueChange}
          onDismiss={() => setOpen(false)}
          disabled={disabled}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
