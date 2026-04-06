// context/SettingsContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';

type Settings = {
  showTime: boolean;
  showAddress: boolean;
  use24h: boolean;
  position: { x: number; y: number };

  showWatermark: boolean;
  watermarkText: string;
  watermarkPosition: { x: number; y: number };

  showIcon: boolean;
  iconUri: string | null;
  iconPosition: { x: number; y: number };

  showFooter: boolean;
  footerName: string;
  footerPhone: string;

  showAvatar: boolean;
  avatarUri: string | null;

  showBranding: boolean;

  showQR: boolean;
};

function makeDefaults(): Settings {
  const { width, height } = Dimensions.get('screen');

  return {
    showTime: true,
    showAddress: true,
    use24h: true,
    // Góc dưới phải
    position: {
      x: 20,
      y: 100
    },

    showWatermark: false,
    watermarkText: 'Watermark',
    // Chính giữa
    watermarkPosition: {
      x: 20,
      y: 200
    },

    showIcon: false,
    iconUri: null,
    // Góc dưới trái
    iconPosition: {
      x: 20,
      y: 300
    },

    showFooter: true,
    footerName: '',
    footerPhone: '',

    showAvatar: true,
    avatarUri: null,

    showBranding: true,

    showQR: true,
  };
}

const SettingsContext = createContext<any>(null);

export const SettingsProvider = ({ children }: any) => {
  const [settings, setSettings] = useState<Settings>(makeDefaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Nếu storage thiếu field mới (người dùng cũ) thì merge với defaults
        setSettings({ ...makeDefaults(), ...parsed });
      }
      setLoaded(true);
    })();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  };

  if (!loaded) return null;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);