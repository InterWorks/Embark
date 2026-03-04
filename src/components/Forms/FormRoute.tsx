import { useEffect, useState } from 'react';
import type { OnboardingForm } from '../../types';
import { FormPublicView } from './FormPublicView';

interface FormRouteProps {
  children: React.ReactNode;
}

export function FormRoute({ children }: FormRouteProps) {
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#form\/([^/]+)/);
      if (match) {
        const formId = match[1];
        try {
          const raw = localStorage.getItem('embark-forms');
          const forms: OnboardingForm[] = raw ? JSON.parse(raw) : [];
          const found = forms.find(f => f.id === formId);
          if (found) {
            setForm(found);
          } else {
            setNotFound(true);
          }
        } catch {
          setNotFound(true);
        }
      } else {
        setForm(null);
        setNotFound(false);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="glass rounded-3xl p-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Form not found</h2>
          <p className="text-gray-500 mt-2">This intake form link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (form) {
    return <FormPublicView form={form} />;
  }

  return <>{children}</>;
}
