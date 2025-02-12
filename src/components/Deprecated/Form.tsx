import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from "react-native";
import DropdownField from "../DropdownField";

interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
  fields: { [K in keyof T]: { label: string; type?: "text" | "number" } };
  children?: React.ReactNode;
}

function Form<T>({ initialValues, onSubmit, fields, children }: FormProps<T>) {
  const [values, setValues] = useState({ ...initialValues });

  useEffect(() => {
    setValues({ ...initialValues });
  }, [initialValues]);

  const handleChange = (key: keyof T, value: string) => {
    setValues({ ...values, [key]: value as any });
  };

  return (
    <View style={styles.container}>
      {Object.entries(fields).map(([key, field]) => (
        <View key={key} style={styles.fieldContainer}>
          {field.type !== "dropdown" && (
            <>
              <Text className="text-foreground">{field.label}</Text>
              <TextInput
                style={styles.input}
                className="text-foreground dark:bg-muted"
                value={(values[key as keyof T] as unknown as string) ?? ""}
                onChangeText={text => handleChange(key as keyof T, text)}
                keyboardType={field.type === "number" ? "numeric" : "default"}
              />
            </>
          )}
          {/* {field.type === "dropdown" && (
            <DropdownField
              label={field.label}
              value={values[key as keyof T] as any}
              list={field.list}
              onChange={value => handleChange(key as keyof T, value)}
            />
          )} */}
        </View>
      ))}
      {children}
      <TouchableOpacity onPress={() => onSubmit(values)} className="bg-primary border text-lg p-2 rounded-md">
        <Text className="text-foreground text-center">Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
});

export default Form;
