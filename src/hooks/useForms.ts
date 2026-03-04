import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { OnboardingForm, FormSubmission, FormField, FormFieldType } from '../types';
import { generateId } from '../utils/helpers';

export function useForms() {
  const [forms, setForms] = useLocalStorage<OnboardingForm[]>('embark-forms', []);
  const [submissions, setSubmissions] = useLocalStorage<FormSubmission[]>('embark-form-submissions', []);

  const addForm = useCallback((name: string, description?: string): OnboardingForm => {
    const form: OnboardingForm = {
      id: generateId(),
      name,
      description,
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setForms(prev => [...prev, form]);
    return form;
  }, [setForms]);

  const updateForm = useCallback((id: string, updates: Partial<Omit<OnboardingForm, 'id' | 'createdAt'>>) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f));
  }, [setForms]);

  const deleteForm = useCallback((id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
  }, [setForms]);

  const getFormById = useCallback((id: string): OnboardingForm | undefined => {
    return forms.find(f => f.id === id);
  }, [forms]);

  const addSubmission = useCallback((submission: Omit<FormSubmission, 'id' | 'submittedAt'>): FormSubmission => {
    const s: FormSubmission = {
      ...submission,
      id: generateId(),
      submittedAt: new Date().toISOString(),
    };
    setSubmissions(prev => [...prev, s]);
    return s;
  }, [setSubmissions]);

  const getSubmissionsForForm = useCallback((formId: string): FormSubmission[] => {
    return submissions.filter(s => s.formId === formId);
  }, [submissions]);

  return {
    forms,
    submissions,
    addForm,
    updateForm,
    deleteForm,
    getFormById,
    addSubmission,
    getSubmissionsForForm,
  };
}

export function createField(type: FormFieldType, label: string, order: number): FormField {
  return {
    id: generateId(),
    type,
    label,
    required: false,
    order,
  };
}
