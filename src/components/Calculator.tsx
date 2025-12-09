import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Modal, Platform, Pressable, Text, View } from "react-native";

import * as Haptics from "expo-haptics";
import MyIcon from "./elements/MyIcon";

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

export default function CalculatorComponent({
  onSubmit,
  currentValue,
}: {
  onSubmit: (value: string) => void;
  currentValue: number;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExpression, setCurrentExpression] = useState("0");
  const [result, setResult] = useState("0");
  const [history, setHistory] = useState<string[]>([]);
  const [lastOperation, setLastOperation] = useState("");
  const lastClickedButton = useRef(null);
  const resultRef = useRef(result);

  const handleButtonPress = useCallback(
    (buttonName: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      switch (buttonName) {
        case "clear":
          handleClear();
          break;
        case "equals":
          try {
            const preparedExpression = prepareExpression(currentExpression);
            const evalResult = eval(preparedExpression);

            setResult(evalResult.toString());
            setCurrentExpression(evalResult.toString());

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
          setCurrentExpression(prev => {
            if (prev.length === 1) {
              return "0";
            } else {
              return prev.slice(0, -1);
            }
          });
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
          if (lastOperation === "equals" && !isNaN(parseInt(buttonName))) {
            setCurrentExpression(buttonName);
            setResult("0");
          } else {
            setCurrentExpression(prev => {
              const button = buttonRows.flat().find(b => b.name === buttonName)?.label || buttonName;
              {
                if (prev === "0" && !isNaN(parseInt(button))) {
                  return button;
                } else {
                  return prev + button;
                }
              }
            });
          }
          setLastOperation(buttonName);
      }
      if (Platform.OS === "web") {
        document.getElementById("equals")?.focus();
      }
    },
    [currentExpression, history, lastOperation, onSubmit],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (modalVisible) {
        const key = event.key;

        if (/^[0-9+\-*/().%]$/.test(key)) {
          handleButtonPress(key);
        } else if (key === "Enter") {
          handleButtonPress("equals");
          return;
        } else if (key === "Backspace") {
          handleButtonPress("backspace");
        } else if (key === "v" && event.ctrlKey) {
          navigator.clipboard.readText().then(text => {
            setCurrentExpression(prev => prev + text);
          });
        } else if (key === "c" && event.ctrlKey) {
          navigator.clipboard.writeText(resultRef.current);
        } else if (key === "Escape") {
          setModalVisible(false);
        }
        lastClickedButton.current = null; // Reset last clicked button on any key press
      }
    },
    [modalVisible, handleButtonPress],
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      document.getElementById("equals")?.focus();
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [modalVisible, handleKeyDown]);

  useEffect(() => {
    if (currentValue) {
      setCurrentExpression(currentValue.toString());
    }
  }, [currentValue]);

  useEffect(() => {
    // Keep ref updated with the latest state
    resultRef.current = result;
  }, [result]);

  const handleClear = () => {
    setCurrentExpression("0");
    setResult("0");
    setHistory([]);
    setLastOperation("");
  };

  const prepareExpression = (expr: string) => {
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
      <Pressable
        className="bg-white border border-muted rounded-md mx-2 p-1.5 mt-5 justify-center items-center"
        onPress={() => setModalVisible(true)}
      >
        <MyIcon name="Calculator" size={30} className="text-black" />
      </Pressable>

      {modalVisible && (
        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <Pressable
            onPressOut={() => {
              handleButtonPress("clear");
              setModalVisible(false);
            }}
            className="bg-black/50 flex-1 justify-center items-center"
          >
            <View className="m-auto p-4 rounded-md border border-muted flex-grow-0 max-w-xs overflow-x-hidden bg-card">
              <History history={history} />
              <Display currentExpression={currentExpression} result={result} />
              <Buttons handleButtonPress={handleButtonPress} />
              <FormActionButtons handleButtonPress={handleButtonPress} setModalVisible={setModalVisible} />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
const History = ({ history }: any) => {
  return (
    <View className="min-h-24 max-h-24 h-24 rounded-md overflow-hidden">
      <FlatList
        data={history}
        renderItem={({ item }) => (
          <Text selectable={false} className={`text-foreground text-base mb-1`}>
            {item}
          </Text>
        )}
        keyExtractor={(item, index) => index.toString()}
        className="max-h-24 mb-2 flex-1 bg-card border border-muted rounded-md p-2 custom-scrollbar"
      />
    </View>

    // <ScrollView className="max-h-24 mb-2 flex-1 bg-card border border-muted rounded-md p-2 custom-scrollbar">
    //   {history &&
    //     history.map((item: any, index: number) => (
    //       <Text selectable={false} key={index} className={`text-base mb-1`}>
    //         {item}
    //       </Text>
    //     ))}
    // </ScrollView>
  );
};
const Display = ({ currentExpression, result }: any) => {
  return (
    <View className="rounded-md bg-card border border-muted px-4">
      <View className="items-end">
        <Text selectable={false} className="text-foreground text-xl">
          {currentExpression}
        </Text>
      </View>
      <View className="items-end">
        <Text selectable={false} className="text-foreground text-2xl font-bold">
          {result}
        </Text>
      </View>
    </View>
  );
};
const Buttons = ({ handleButtonPress }: any) => {
  return (
    <View className="flex-col bg-card border border-muted p-2 my-1 m-auto">
      {buttonRows.map((row, rowIndex) => (
        <View key={rowIndex} className={`flex-row gap-2 mb-2`}>
          {row.map(button => (
            <Button key={button.name} button={button} handleButtonPress={handleButtonPress} />
          ))}
        </View>
      ))}
    </View>
  );
};
const Button = ({
  button,
  handleButtonPress,
}: {
  button: { name: string; label: string };
  handleButtonPress: (buttonName: string) => void;
}) => {
  return (
    <Pressable
      key={button.name}
      id={button.name}
      className={`w-14 h-14 justify-center items-center bg-gray-200 rounded-lg`}
      onPress={() => handleButtonPress(button.name)}
    >
      <Text selectable={false} className={`text-xl`}>
        {button.label}
      </Text>
    </Pressable>
  );
};
const FormActionButtons = ({
  handleButtonPress,
  setModalVisible,
}: {
  handleButtonPress: (buttonName: string) => void;
  setModalVisible: (visible: boolean) => void;
}) => {
  return (
    <View className="flex-row justify-center items-center gap-5 mt-4">
      <Pressable
        className={`bg-danger-300 rounded-md p-4 `}
        onPress={() => {
          handleButtonPress("clear");
          setModalVisible(false);
        }}
      >
        <Text selectable={false} className={`text-white font-bold text-center`}>
          Close
        </Text>
      </Pressable>
      <Pressable
        className={`bg-primary rounded-md p-4`}
        onPress={() => {
          handleButtonPress("submit");
        }}
      >
        <Text selectable={false} className={`text-white font-bold text-center`}>
          Submit
        </Text>
      </Pressable>
    </View>
  );
};
