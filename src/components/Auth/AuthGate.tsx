import { useState, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    return showRegister
      ? <RegisterPage onShowLogin={() => setShowRegister(false)} />
      : <LoginPage onShowRegister={() => setShowRegister(true)} />;
  }

  return <>{children}</>;
}
