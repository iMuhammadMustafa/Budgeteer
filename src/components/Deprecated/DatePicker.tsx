import React, { useEffect, useRef, ReactElement } from "react";
import { TextInput } from "react-native";

interface Props {
  minimumDate: Date;
  maximumDate: Date;
  value: string;
  onChange: (value: string) => void;
  // ...more
}

function DateInput(props: Props): ReactElement {
  const { minimumDate, maximumDate, ...moreProps } = props;

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef?.current?.setNativeProps({
        type: "date",
        min: format(minimumDate, "yyyy-MM-dd"),
        max: format(maximumDate, "yyyy-MM-dd"),
        pattern: "d{4}-d{2}-d{2}",
      });
    }
  }, [inputRef?.current]);

  return <TextInput ref={inputRef} type="date" {...moreProps} />;
}

export default DateInput;
