// components/OverlayBranding.tsx

import { View, Text, Image, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

type Props = {
  containerWidth?: number;
  containerHeight?: number;
};

export default function OverlayBranding({ containerWidth, containerHeight }: Props) {
  const { settings } = useSettings();

  if (!settings.showBranding) return null;

  return (
    <View style={styles.branding} pointerEvents="none">
      {/* Image — phía trên */}
      {/* <Image source={require('../assets/images/brandLogo.webp')} style={styles.image} /> */}

      
    </View>
  );
}

const styles = StyleSheet.create({
  branding: {
    position: 'absolute',
    right: 12,
    bottom: 70, // 👈 để nằm trên footer
    alignItems: 'flex-end', // 👈 căn phải toàn bộ nội dung
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 7,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});