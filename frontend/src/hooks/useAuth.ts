import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import type { AuthContextValue } from '../types';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 