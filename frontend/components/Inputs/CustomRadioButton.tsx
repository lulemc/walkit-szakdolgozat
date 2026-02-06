import React from "react";
import { View } from "react-native";
import { RadioButton, RadioButtonProps } from "react-native-paper";
import { CustomText } from "../CustomText";

interface CustomRadioButtonProps extends RadioButtonProps {
  options: { label: string; value: string }[];
  value: string;
  label: string;
  onValueChange: (value: string) => void;
}

export const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({
  options,
  value,
  onValueChange,
  label,
  ...props
}) => {
  return (
    <View>
      <CustomText variant="labelLarge">{label}:</CustomText>
      <RadioButton.Group
        onValueChange={(value) => onValueChange(value)}
        value={value}
      >
        {options.map((option) => (
          <RadioButton.Item
            key={option.value}
            label={option.label}
            value={option.value}
          />
        ))}
      </RadioButton.Group>
    </View>
  );
};
