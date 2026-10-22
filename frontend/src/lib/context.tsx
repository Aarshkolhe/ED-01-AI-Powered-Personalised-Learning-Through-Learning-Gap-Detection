import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  t: (en: string, hi: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeStudentId, setActiveStudentId] = useState<string>('student_alex');

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  return (
    <AppContext.Provider value={{ language, setLanguage, activeStudentId, setActiveStudentId, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
