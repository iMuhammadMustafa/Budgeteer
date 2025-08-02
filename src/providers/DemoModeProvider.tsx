import React, { createContext, useContext, useState, ReactNode } from "react";

type DemoModeContextType = {
  isDemo: boolean;
  setDemo: (value: boolean) => void;
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);

  return <DemoModeContext.Provider value={{ isDemo, setDemo: setIsDemo }}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) throw new Error("useDemoMode must be used within a DemoModeProvider");
  return context;
}
