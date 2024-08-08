import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from "react-native";

interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
  fields: { [K in keyof T]: { label: string; type?: "text" | "number" } };
}

function Form<T>({ initialValues, onSubmit, fields }: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (key: keyof T, value: string) => {
    setValues({ ...values, [key]: value as any });
  };

  return (
    <View style={styles.container}>
      {Object.entries(fields).map(([key, field]) => (
        <View key={key} style={styles.fieldContainer}>
          <Text className="text-foreground">{field.label}</Text>
          <TextInput
            style={styles.input}
            className="text-foreground dark:bg-muted"
            value={values[key as keyof T] as unknown as string}
            onChangeText={text => handleChange(key as keyof T, text)}
            keyboardType={field.type === "number" ? "numeric" : "default"}
          />
        </View>
      ))}
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
