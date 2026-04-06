// components/OverlayQR.tsx

import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSettings } from '../context/SettingsContext';

type Props = {
  coords: { lat: number; lng: number } | null;
  time: Date;
  containerWidth: number;
};

export default function OverlayQR({ coords, time, containerWidth }: Props) {
  const { settings } = useSettings();

  if (!settings.showQR || !coords) return null;

  const data = JSON.stringify({
    lat: coords.lat,
    lng: coords.lng,
    time: time.toISOString(),
  });

  return (
    // Thêm style cho view để cố định vị trí góc dưới bên phải
    <View style={[styles.container, { right: 12, bottom: 72 }]}>
      <QRCode
        value={data}
        size={containerWidth * 0.18}
        backgroundColor="white"
      />
      <Text style={styles.text} numberOfLines={1}>
        {'100% Chân thực'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // align các phần tử con (QR và Text) sát lề phải của container
    alignItems: 'flex-end', 
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    // Căn văn bản sang bên phải
    textAlign: 'right', 
    marginTop: 6,
    // Đảm bảo text không bị tràn rộng hơn QR nếu cần
    maxWidth: '100%',
  },
});
