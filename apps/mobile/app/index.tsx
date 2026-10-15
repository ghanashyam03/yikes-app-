import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '../src/features/auth/useSession';

export default function RootIndex(): React.JSX.Element {
  const { profile } = useSession();

  if (!profile) {
    return <Redirect href="/(onboarding)/intro" />;
  }

  return <Redirect href="/(tabs)" />;
}
