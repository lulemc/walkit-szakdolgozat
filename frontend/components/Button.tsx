import React, { ReactNode } from "react";
import { Button, ButtonProps } from "react-native-paper";

interface PrimaryButtonProps extends ButtonProps {
  children: ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  style,
  contentStyle,
  ...props
}) => {
  return (
    <Button
      mode="contained"
      style={[style]}
      contentStyle={[{ paddingVertical: 8 }, contentStyle]}
      {...props}
    >
      {children}
    </Button>
  );
};
