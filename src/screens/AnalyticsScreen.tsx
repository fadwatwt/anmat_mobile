import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { AdminAnalytics } from './analytics/AdminAnalytics';
import { SubscriberAnalytics } from './analytics/SubscriberAnalytics';
import { EmployeeAnalytics } from './analytics/EmployeeAnalytics';
import { spacing } from '../theme';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const content = () => {
    switch (user?.type) {
      case 'Admin':
        return <AdminAnalytics />;
      case 'Subscriber':
        return <SubscriberAnalytics />;
      case 'Employee':
        return <EmployeeAnalytics />;
      default:
        return <EmptyState title={t('Analytics')} message={t('Unknown user type')} icon="❓" />;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {content()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
});
