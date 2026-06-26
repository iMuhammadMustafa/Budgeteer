/**
 * useCalculator — the calculator's logic layer, UI-free. Replaces the legacy
 * `eval()` with a small recursive-descent parser (parentheses > * / > + -, with
 * unary +/-). `sqrt` / `%` apply immediately to the current value, and
 * `toggleSign` flips a leading minus on the whole expression — preserving the
 * legacy behaviour (`50 + ±` → `-50 + `).
 *
 * `press(key)` takes the button `name` (see BUTTON_ROWS); operator/digit names
 * are appended using their display label so the expression reads naturally.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

export interface CalcButtonDef {
  name: string;
  label: string;
}

export const BUTTON_ROWS: CalcButtonDef[][] = [
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
    { name: "multiply", label: "×" },
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

const LABEL_BY_NAME = new Map(BUTTON_ROWS.flat().map(b => [b.name, b.label]));

const KEY_TO_NAME: Record<string, string> = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
  "(": "openBracket",
  ")": "closeBracket",
  ".": "dot",
  "%": "percentage",
};

/** Normalize the display expression to plain arithmetic for the parser. */
function normalize(expr: string): string {
  return expr
    .replace(/(\d|\))\s*(?=\()/g, "$1*") // implicit multiply before "("
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/x/g, "*");
}

/** Safe recursive-descent evaluator. Throws on malformed input. */
export function evaluateExpression(raw: string): number {
  const s = normalize(raw);
  let i = 0;
  const skip = () => {
    while (s[i] === " ") i++;
  };

  const parseExpr = (): number => {
    let left = parseTerm();
    skip();
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
      skip();
    }
    return left;
  };
  const parseTerm = (): number => {
    let left = parseFactor();
    skip();
    while (s[i] === "*" || s[i] === "/") {
      const op = s[i++];
      const right = parseFactor();
      left = op === "*" ? left * right : left / right;
      skip();
    }
    return left;
  };
  const parseFactor = (): number => {
    skip();
    if (s[i] === "+") {
      i++;
      return parseFactor();
    }
    if (s[i] === "-") {
      i++;
      return -parseFactor();
    }
    if (s[i] === "(") {
      i++;
      const v = parseExpr();
      skip();
      if (s[i] !== ")") throw new Error("Unbalanced parentheses");
      i++;
      return v;
    }
    const start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    if (i === start) throw new Error("Expected number");
    const num = parseFloat(s.slice(start, i));
    if (Number.isNaN(num)) throw new Error("Invalid number");
    return num;
  };

  const result = parseExpr();
  skip();
  if (i !== s.length) throw new Error("Unexpected token");
  if (!Number.isFinite(result)) throw new Error("Not finite");
  return result;
}

export interface UseCalculatorReturn {
  expression: string;
  result: string;
  history: string[];
  error: string | null;
  press: (key: string) => void;
  clear: () => void;
  /** Evaluate and return the result string; sets `error` and returns "" on failure. */
  submit: () => string;
  handleSubmit: () => void;
  handleClose: () => void;
  useSheet: boolean;
  visible: boolean;
  setVisible: (value: boolean) => void;
}

export function useCalculator(onSubmit: (value: string) => void, initialValue?: number): UseCalculatorReturn {
  const initial = initialValue ? initialValue.toString() : "0";
  const [expression, setExpression] = useState(initial);
  const [result, setResult] = useState(initial);
  const [history, setHistory] = useState<string[]>([]);
  const [lastOperation, setLastOperation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const clear = useCallback(() => {
    setExpression("0");
    setResult("0");
    setHistory([]);
    setLastOperation("");
    setError(null);
  }, []);

  const compute = useCallback((expr: string): string => {
    try {
      const value = evaluateExpression(expr);
      setError(null);
      return value.toString();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return "";
    }
  }, []);

  const submit = useCallback((): string => {
    try {
      const value = evaluateExpression(expression);
      setError(null);
      return value.toString();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return "";
    }
  }, [expression]);

  const handleSubmit = useCallback(() => {
    const value = submit();
    if (value !== "") {
      onSubmit(value);
      clear();
      setVisible(false);
    }
  }, [submit, onSubmit, clear]);

  const handleClose = useCallback(() => {
    clear();
    setVisible(false);
  }, [clear]);

  const press = useCallback(
    (name: string) => {
      setError(null);
      switch (name) {
        case "clear":
          clear();
          return;
        case "equals": {
          const value = compute(expression);
          if (value !== "") {
            setHistory(prev => [`${expression} = ${value}`, ...prev]);
            setResult(value);
            setExpression(value);
            setLastOperation("equals");
          } else {
            setResult("Error");
          }
          return;
        }
        case "clearLastOperation":
          setExpression(prev => {
            const next = prev.replace(/[-+×÷x/*]?[^-+×÷x/*]*$/, "") || "0";
            setResult(compute(next) || "0");
            return next;
          });
          setLastOperation("");
          return;
        case "backspace":
          setExpression(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
          setLastOperation("");
          return;
        case "toggleSign":
          // Flip a leading minus on the whole expression (legacy behaviour).
          setExpression(prev => (prev.startsWith("-") ? prev.slice(1) : "-" + prev));
          return;
        case "percentage":
          setExpression(prev => {
            const v = parseFloat(prev);
            return Number.isNaN(v) ? prev : (v / 100).toString();
          });
          setLastOperation("percentage");
          return;
        case "sqrt":
          setExpression(prev => {
            const v = parseFloat(prev);
            return Number.isNaN(v) || v < 0 ? prev : Math.sqrt(v).toString();
          });
          setLastOperation("sqrt");
          return;
        default: {
          const label = LABEL_BY_NAME.get(name) ?? name;
          const isDigit = /^[0-9]$/.test(label);
          if (lastOperation === "equals" && isDigit) {
            setExpression(label);
            setResult("0");
          } else {
            setExpression(prev => (prev === "0" && isDigit ? label : prev + label));
          }
          setLastOperation(name);
        }
      }
    },
    [expression, lastOperation, clear, compute],
  );

  const { width } = useWindowDimensions();
  const useSheet = width < 768;
  const resultRef = useRef(result);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (/^[0-9]$/.test(key)) press(key);
      else if (KEY_TO_NAME[key]) press(KEY_TO_NAME[key]);
      else if (key === "Enter") press("equals");
      else if (key === "Backspace") press("backspace");
      else if (key === "Escape") handleClose();
      else if (key === "c" && (event.ctrlKey || event.metaKey)) navigator.clipboard?.writeText(resultRef.current);
      else if (key === "v" && (event.ctrlKey || event.metaKey))
        navigator.clipboard?.readText().then(text => text && press(text));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, press, handleClose]);

  return {
    expression,
    result,
    history,
    error,
    press,
    clear,
    submit,
    handleSubmit,
    handleClose,
    useSheet,
    visible,
    setVisible,
  };
}
