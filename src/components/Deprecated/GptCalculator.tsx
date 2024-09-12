import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Modal from "react-native-modal";

export default function GptCalculator() {
  const [display, setDisplay] = useState(""); // For showing the labels
  const [operations, setOperations] = useState(""); // For handling the operations based on the name
  const [result, setResult] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const buttons = [
    { name: "(", label: "(" },
    { name: ")", label: ")" },
    { name: "clearEntry", label: "CE" },
    { name: "backspace", label: "DEL", className: "bg-error-200" },
    { name: "7", label: "7" },
    { name: "8", label: "8" },
    { name: "9", label: "9" },
    { name: "divide", label: "÷", className: "bg-warning-200" },
    { name: "4", label: "4" },
    { name: "5", label: "5" },
    { name: "6", label: "6" },
    { name: "multiply", label: "x", className: "bg-warning-200" },
    { name: "1", label: "1" },
    { name: "2", label: "2" },
    { name: "3", label: "3" },
    { name: "add", label: "+", className: "bg-warning-200" },
    { name: "dot", label: "." },
    { name: "0", label: "0" },
    { name: "toggleSign", label: "±" },
    { name: "subtract", label: "-", className: "bg-warning-200" },
    { name: "percentage", label: "%", className: "bg-warning-200" },
    { name: "clear", label: "C" },
    { name: "equals", label: "=", className: "bg-success-500" },
    { name: "symmetricBtn", label: "√", className: "bg-warning-200" }, // Symmetry button
  ];

  const handleClick = button => {
    const { name, label } = button;

    switch (name) {
      case "clear":
        clearAll();
        break;
      case "clearEntry":
        handleClearEntry();
        break;
      case "backspace":
        handleBackspace();
        break;
      case "equals":
        calculateResult();
        break;
      case "toggleSign":
        toggleSign();
        break;
      default:
        appendToDisplay(label, name);
        break;
    }
  };

  const appendToDisplay = (label, name) => {
    setDisplay(prev => prev + label);
    setOperations(prev => prev + name); // Append the operation based on the name
  };

  const clearAll = () => {
    setDisplay("");
    setOperations("");
    setResult("");
  };

  const handleBackspace = () => {
    setDisplay(display.slice(0, -1));
    setOperations(operations.slice(0, -1));
  };

  const handleClearEntry = () => {
    const operators = ["+", "-", "x", "÷"];

    // Find the last operator or number
    let lastOperatorIndex = -1;
    operators.forEach(op => {
      const index = operations.lastIndexOf(op);
      if (index > lastOperatorIndex) lastOperatorIndex = index;
    });

    // If no operators are found, clear the last number or part of the number
    if (lastOperatorIndex === -1) {
      setDisplay(display.slice(0, -1));
      setOperations(operations.slice(0, -1));
    } else {
      const newOperations = operations.substring(0, lastOperatorIndex + 1);
      const newDisplay = display.substring(0, lastOperatorIndex + 1);

      setOperations(newOperations);
      setDisplay(newDisplay);

      recalculateResult(newOperations);
    }
  };

  const calculateResult = () => {
    try {
      const sanitizedOperations = operations
        .replace("÷", "/")
        .replace("x", "*")
        .replace("percentage", "/100")
        .replace("symmetricBtn", "Math.sqrt");

      // Prevent issues from leading zeros like '002+2'
      const cleanOperations = sanitizedOperations.replace(/(^|[-+*/(])0+(?=\d)/g, "$1");

      const evalResult = eval(cleanOperations); // Warning: Avoid eval in production
      setResult(evalResult.toString());
    } catch (error) {
      setResult("Error");
    }
  };

  const toggleSign = () => {
    if (operations.startsWith("-")) {
      setDisplay(display.substring(1));
      setOperations(operations.substring(1));
    } else {
      setDisplay("-" + display);
      setOperations("-" + operations);
    }
  };

  const handleKeyboardInput = e => {
    const { key } = e;
    if (key === "Enter") {
      calculateResult();
    } else if (key === "Backspace") {
      handleBackspace();
    } else if (!isNaN(key) || ["+", "-", "*", "/", "(", ")", "%", "."].includes(key)) {
      appendToDisplay(key, key); // Treat keyboard input like buttons
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      window.addEventListener("keydown", handleKeyboardInput);
    }
    return () => {
      if (Platform.OS === "web") {
        window.removeEventListener("keydown", handleKeyboardInput);
      }
    };
  }, [display, operations]);

  const recalculateResult = newOperations => {
    try {
      const sanitizedOperations = newOperations
        .replace("÷", "/")
        .replace("x", "*")
        .replace("percentage", "/100")
        .replace("symmetricBtn", "Math.sqrt");

      const cleanOperations = sanitizedOperations.replace(/(^|[-+*/(])0+(?=\d)/g, "$1");

      const evalResult = eval(cleanOperations); // Warning: Avoid eval in production
      setResult(evalResult.toString());
    } catch (error) {
      setResult("");
    }
  };

  return (
    <View className="m-2">
      <TouchableOpacity className="bg-gray-200 p-3 rounded" onPress={() => setModalVisible(true)}>
        <Text className="text-lg text-black">Open Calculator</Text>
      </TouchableOpacity>

      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          clearAll();
          setModalVisible(false);
        }}
      > */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => {
          clearAll();
          setModalVisible(false);
        }}
      >
        <View className="justify-center items-center m-auto bg-background-0 p-5">
          <Text className="text-2xl mb-5">Calculator</Text>

          <View className="w-full p-2 bg-gray-100 rounded mb-2 justify-end">
            <Text className="text-4xl text-right">{display.length > 0 ? display : "0"}</Text>
            <Text className="text-2xl text-red-600 text-right">{result.length > 0 ? result : 0}</Text>
          </View>

          <View className={`${Platform.OS === "web" ? "grid grid-cols-4" : "flex flex-wrap flex-row"}`}>
            {buttons.map(btn => (
              <TouchableOpacity
                key={btn.name}
                className={`p-5 items-center justify-center rounded m-1 ${btn.className ?? ""}`}
                onPress={() => handleClick(btn)}
              >
                <Text className={`text-lg ${btn.name === "equals" ? "text-white" : "text-black"}`}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* <TouchableOpacity className="mt-5 bg-gray-200 p-3 rounded" onPress={() => setModalVisible(false)}>
            <Text className="text-lg text-black">Close</Text>
          </TouchableOpacity> */}
        </View>
      </Modal>
    </View>
  );
}
