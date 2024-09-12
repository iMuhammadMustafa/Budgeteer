import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";

const CalculatorButton = ({ title, onPress, color = "#f0f0f0" }) => (
  <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export default function CalculatorModal() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [display, setDisplay] = useState("");

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handlePress = value => {
    setDisplay(display + value);
  };

  const handleClear = () => setDisplay("");

  const handleDelete = () => setDisplay(display.slice(0, -1));

  const handleCalculate = () => {
    try {
      // Using eval here for simplicity. In a production app, you'd want to use a safer alternative.
      const result = eval(display);
      setDisplay(result.toString());
    } catch (error) {
      setDisplay("Error");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.openButton} onPress={toggleModal}>
        <Text style={styles.openButtonText}>Open Calculator</Text>
      </TouchableOpacity>

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modalContent}>
          <Text style={styles.display}>{display.length > 0 ? display : 0}</Text>
          <View style={styles.buttonContainer}>
            <View style={styles.row}>
              <CalculatorButton title="C" onPress={handleClear} color="#ff9999" />
              <CalculatorButton title="<" onPress={handleDelete} color="#ff9999" />
              <CalculatorButton title="(" onPress={() => handlePress("(")} />
              <CalculatorButton title=")" onPress={() => handlePress(")")} />
            </View>
            <View style={styles.row}>
              <CalculatorButton title="7" onPress={() => handlePress("7")} />
              <CalculatorButton title="8" onPress={() => handlePress("8")} />
              <CalculatorButton title="9" onPress={() => handlePress("9")} />
              <CalculatorButton title="/" onPress={() => handlePress("/")} color="#ffcc99" />
            </View>
            <View style={styles.row}>
              <CalculatorButton title="4" onPress={() => handlePress("4")} />
              <CalculatorButton title="5" onPress={() => handlePress("5")} />
              <CalculatorButton title="6" onPress={() => handlePress("6")} />
              <CalculatorButton title="*" onPress={() => handlePress("*")} color="#ffcc99" />
            </View>
            <View style={styles.row}>
              <CalculatorButton title="1" onPress={() => handlePress("1")} />
              <CalculatorButton title="2" onPress={() => handlePress("2")} />
              <CalculatorButton title="3" onPress={() => handlePress("3")} />
              <CalculatorButton title="-" onPress={() => handlePress("-")} color="#ffcc99" />
            </View>
            <View style={styles.row}>
              <CalculatorButton title="0" onPress={() => handlePress("0")} />
              <CalculatorButton title="." onPress={() => handlePress(".")} />
              <CalculatorButton title="=" onPress={handleCalculate} color="#99ff99" />
              <CalculatorButton title="+" onPress={() => handlePress("+")} color="#ffcc99" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  openButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  openButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  display: {
    fontSize: 24,
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    width: "100%",
    textAlign: "right",
  },
  buttonContainer: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 20,
  },
});
