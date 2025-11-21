import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="goals" />
      <Stack.Screen name="wait" />
      <Stack.Screen name="active" />
      <Stack.Screen name="request-exit" />
      <Stack.Screen name="pending-exit" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
