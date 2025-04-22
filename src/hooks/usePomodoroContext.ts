import { useContext } from 'react';
import { PomodoroContext, PomodoroContextType } from '@/context/PomodoroContext';

export const usePomodoroContext = (): PomodoroContextType => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
};
