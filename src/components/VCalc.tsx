import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal as ReactModal, ScrollView, Platform } from "react-native";
import Modal from "react-native-modal";
import Icon from "../lib/IonIcons";

const buttonRows = [
  [
    { name: "openBracket", label: "(" },
    { name: "closeBracket", label: ")" },
    { name: "clearLastOperation", label: "CE" },
    { name: "backspace", label: "⌫" },
  ],
  [
    { name: "7", label: "7" },
    { name: "8", label: "8" },
    { name: "9", label: "9" },
    { name: "divide", label: "÷" },
  ],
  [
    { name: "4", label: "4" },
    { name: "5", label: "5" },
    { name: "6", label: "6" },
    { name: "multiply", label: "x" },
  ],
  [
    { name: "1", label: "1" },
    { name: "2", label: "2" },
    { name: "3", label: "3" },
    { name: "add", label: "+" },
  ],
  [
    { name: "dot", label: "." },
    { name: "0", label: "0" },
    { name: "toggleSign", label: "±" },
    { name: "subtract", label: "-" },
  ],
  [
    { name: "percentage", label: "%" },
    { name: "clear", label: "C" },
    { name: "equals", label: "=" },
    { name: "sqrt", label: "√" },
  ],
];

export default function VCalc({ onSubmit, currentValue }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExpression, setCurrentExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [lastOperation, setLastOperation] = useState("");
  const lastClickedButton = useRef(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleKeyDown = event => {
        if (modalVisible) {
          const key = event.key;
          if (/^[0-9+\-*/().%]$/.test(key)) {
            handleButtonPress(key);
          } else if (key === "Enter") {
            handleButtonPress("equals");
            return;
          } else if (key === "Backspace") {
            handleButtonPress("backspace");
          } else if (key === "Escape") {
            setModalVisible(false);
          }
          lastClickedButton.current = null; // Reset last clicked button on any key press
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [modalVisible]);

  useEffect(() => {
    if (currentValue) {
      setCurrentExpression(currentValue);
    }
  }, [currentValue]);

  const handleClear = () => {
    setCurrentExpression("");
    setResult("");
    setHistory([]);
    setLastOperation("");
  };

  const handleButtonPress = buttonName => {
    switch (buttonName) {
      case "clear":
        handleClear();
        break;
      case "equals":
        try {
          const preparedExpression = prepareExpression(currentExpression);
          const evalResult = eval(preparedExpression);
          setResult(evalResult.toString());
          setHistory([`${currentExpression} = ${evalResult}`, ...history]);
          setLastOperation("equals");
        } catch (error) {
          setResult("Error");
        }
        break;
      case "submit":
        try {
          const preparedExpression = prepareExpression(currentExpression);
          const evalResult = eval(preparedExpression);
          onSubmit(evalResult.toString());
          setModalVisible(false);
          handleClear();
        } catch (error) {
          setResult("Error");
        }
        break;
      case "clearLastOperation":
        setCurrentExpression(prev => {
          const newExpression = prev.replace(/[-+x÷]?[^-+x÷]*$/, "");
          try {
            const preparedExpression = prepareExpression(newExpression);
            const newResult = eval(preparedExpression);
            setResult(newResult.toString());
          } catch (error) {
            setResult("");
          }
          return newExpression;
        });
        break;
      case "backspace":
        setCurrentExpression(prev => prev.slice(0, -1));
        break;
      case "toggleSign":
        setCurrentExpression(prev => {
          if (prev.startsWith("-")) {
            return prev.slice(1);
          } else {
            return "-" + prev;
          }
        });
        break;
      case "percentage":
        setCurrentExpression(prev => {
          const value = parseFloat(prev);
          return (value / 100).toString();
        });
        break;
      case "sqrt":
        setCurrentExpression(prev => {
          const value = parseFloat(prev);
          return Math.sqrt(value).toString();
        });
        break;
      default:
        if (lastOperation === "equals" && !isNaN(buttonName)) {
          setCurrentExpression(buttonName);
          setResult("");
        } else {
          setCurrentExpression(
            prev => prev + (buttonRows.flat().find(b => b.name === buttonName)?.label || buttonName),
          );
        }
        setLastOperation(buttonName);
    }
  };

  const prepareExpression = expr => {
    // Handle implicit multiplication and numbers with leading zeros
    return expr
      .replace(/(\d+|\))(?=\()/g, "$1*")
      .replace(/÷/g, "/")
      .replace(/x/g, "*")
      .replace(/\b0+(\d+)/g, "$1") // Remove leading zeros
      .replace(/([+\-*/]|^)0+(?=\d)/g, "$1"); // Remove leading zeros after operators or at the start
  };

  return (
    <>
      <TouchableOpacity className={`bg-grey-500 rounded-full p-4`} onPress={() => setModalVisible(true)}>
        <Icon name="Calculator" />
        {/* <Text className={`text-white font-bold text-center`}>Open Calculator</Text> */}
      </TouchableOpacity>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => {
          handleButtonPress("clear");
          setModalVisible(false);
        }}
      >
        <View className={`flex-1 bg-white p-4`}>
          <ScrollView className={`max-h-32 mb-2`}>
            {history.map((item, index) => (
              <Text key={index} className={`text-base mb-1`}>
                {item}
              </Text>
            ))}
          </ScrollView>
          <View className={`items-end mb-2`}>
            <Text className={`text-2xl`}>{currentExpression.length > 0 ? currentExpression : 0}</Text>
          </View>
          <View className={`items-end mb-4`}>
            <Text className={`text-4xl font-bold`}>{result.length > 0 ? result : 0}</Text>
          </View>
          <View className={`flex-col m-auto`}>
            {buttonRows.map((row, rowIndex) => (
              <View key={rowIndex} className={`flex-row gap-2 mb-2`}>
                {row.map(button => (
                  <TouchableOpacity
                    key={button.name}
                    className={`w-14 h-14 justify-center items-center bg-gray-200 rounded-lg`}
                    onPress={() => handleButtonPress(button.name)}
                  >
                    <Text className={`text-xl`}>{button.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          <View className="flex-row justify-center items-center gap-5">
            <TouchableOpacity
              className={`bg-blue-500 rounded-full p-4 mt-4`}
              onPress={() => {
                handleButtonPress("clear");
                setModalVisible(false);
              }}
            >
              <Text className={`text-white font-bold text-center`}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`bg-blue-500 rounded-full p-4 mt-4`}
              onPress={() => {
                handleButtonPress("submit");
              }}
            >
              <Text className={`text-white font-bold text-center`}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
