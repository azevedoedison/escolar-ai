import { Stack } from 'expo-router';
import { theme } from '../lib/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.bg },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tatá IA' }} />
      <Stack.Screen name="(auth)" options={{ title: 'Tatá IA' }} />
    </Stack>
  );
}
