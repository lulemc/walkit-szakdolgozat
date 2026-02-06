import { useState } from "react";

interface UseTextInputOptions {
  initialValue?: string;
}

export const useTextInput = ({ initialValue = "" }: UseTextInputOptions = {}) => {
  const [value, setValue] = useState(initialValue);
  const onChangeText = (text: string) => {
    setValue(text);
  };

  const reset = () => setValue("");

  return {
    value,
    onChangeText,
    setValue,
    reset,
  };
};
