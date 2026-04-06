// app/_layout.tsx

import { Stack } from 'expo-router';
import { SettingsProvider } from '../context/SettingsContext';
import { Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Layout() {
  const router = useRouter();

  return (
    <SettingsProvider>
      <Stack>
        <Stack.Screen 
          name="index"
          options={{ 
            title: 'Camera',
            headerRight: () => (
              <Button
                onPress={() => router.push('/settings')}
                title="⚙️"
                color="#000" // màu chữ, có thể thay đổi theo theme
              />
            ),
          }}
        />

        <Stack.Screen 
          name="settings"
          options={{ title: 'Settings' }}
        />
      </Stack>
    </SettingsProvider>
  );
}