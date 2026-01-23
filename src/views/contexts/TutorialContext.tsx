import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api";

type TutorialStep =
  | "welcome"
  | "members"
  | "books"
  | "inventory"
  | "checkout"
  | "complete";

interface TutorialContextType {
  isActive: boolean;
  toggleTutorial: () => void;
  currentStep: TutorialStep;
  setStep: (step: TutorialStep) => void;
  checkDataState: () => Promise<void>;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep>("welcome");

  // Check if the system is empty to auto-start the tutorial
  const checkDataState = async () => {
    try {
      const [users, books] = await Promise.all([
        apiRequest<any[]>("/users"),
        apiRequest<any[]>("/books"),
      ]);

      if (users.length === 0 && books.length === 0) {
        setIsActive(true);
        setCurrentStep("welcome");
      }
    } catch (error) {
      console.error("Tutorial check failed", error);
    }
  };

  useEffect(() => {
    checkDataState();
  }, []);

  const toggleTutorial = () => {
    if (!isActive) {
      // If turning on manually, reset to welcome
      setCurrentStep("welcome");
    }
    setIsActive(!isActive);
  };

  const setStep = (step: TutorialStep) => {
    setCurrentStep(step);
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        toggleTutorial,
        currentStep,
        setStep,
        checkDataState,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
