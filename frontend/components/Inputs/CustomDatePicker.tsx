import { StyleSheet, View } from "react-native";
import { CustomText } from "../CustomText";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/theme/colors";

interface CustomDatePickerProps {
  value: Date;
  onChange: (event: any, selectedDate?: Date) => void;
  label: string;
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <View style={styles.rowInputContainer}>
      <CustomText variant="labelLarge">{label}:</CustomText>
      <DateTimePicker
        value={value}
        mode="date"
        accentColor={colors.khaki}
        display="default"
        onChange={onChange}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  inputContainer: {
    marginTop: 10,
  },
  rowInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
