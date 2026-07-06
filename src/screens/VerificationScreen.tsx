import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormScreen } from '../generators/FormScreen';
import { http } from '../lib/http';
import { ApiResponse } from '../types';

export default function VerificationScreen() {
  const { t } = useTranslation();

  const sections = [
    {
      titleKey: 'Email Verification',
      fields: [
        {
          name: 'token',
          labelKey: 'Verification Code',
          type: 'text' as const,
          required: true,
          placeholder: 'Enter verification code sent to your email',
        },
      ],
    },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    await http.post<ApiResponse<any>>('/api/user/auth/verify-email', values);
  };

  const handleResendCode = async () => {
    await http.post<ApiResponse<any>>('/api/user/auth/request-verification', {});
    Alert.alert(t('Success'), t('Verification code has been resent'));
  };

  return (
    <FormScreen
      sections={sections}
      onSubmit={handleSubmit}
      submitLabelKey="Verify Email"
      loadingLabelKey="Verifying..."
      successMessageKey="Email verified successfully"
      errorMessageKey="Verification failed"
    />
  );
}
