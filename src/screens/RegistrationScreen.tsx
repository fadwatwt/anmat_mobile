import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { FormScreen } from '../generators/FormScreen';
import { http } from '../lib/http';
import { ApiResponse } from '../types';

export default function RegistrationScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const sections = [
    {
      titleKey: 'Account Information',
      fields: [
        {
          name: 'email',
          labelKey: 'Email',
          type: 'email' as const,
          required: true,
          placeholder: 'Enter your email',
        },
        {
          name: 'password',
          labelKey: 'Password',
          type: 'password' as const,
          required: true,
          placeholder: 'Create a password',
        },
        {
          name: 'confirmPassword',
          labelKey: 'Confirm Password',
          type: 'password' as const,
          required: true,
          placeholder: 'Confirm your password',
          validate: (value: string, values: Record<string, any>) =>
            value !== values.password ? t('Passwords do not match') : undefined,
        },
      ],
    },
    {
      titleKey: 'Organization Details',
      fields: [
        {
          name: 'organizationName',
          labelKey: 'Organization Name',
          type: 'text' as const,
          required: true,
          placeholder: 'Enter your organization name',
        },
        {
          name: 'industry',
          labelKey: 'Industry',
          type: 'text' as const,
          placeholder: 'Enter your industry',
        },
        {
          name: 'phone',
          labelKey: 'Phone',
          type: 'phone' as const,
          placeholder: 'Enter your phone number',
        },
      ],
    },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    const { confirmPassword, organizationName, industry, ...registerData } = values;
    const res = await http.post<ApiResponse<any>>('/api/user/auth/register/subscriber/email', registerData);
    if (res.data.status === 'success') {
      const accountRes = await http.post<ApiResponse<any>>('/api/user/auth/register/subscriber/account', {
        ...registerData,
        organization_name: organizationName,
        industry,
      });
      if (accountRes.data.status === 'success' && accountRes.data.data?.access_token) {
        await login(accountRes.data.data.access_token);
      }
    }
  };

  return (
    <FormScreen
      sections={sections}
      onSubmit={handleSubmit}
      submitLabelKey="Register"
      loadingLabelKey="Registering..."
      successMessageKey="Registration successful"
      errorMessageKey="Registration failed"
    />
  );
}
