// components/OverlayQR.tsx

import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSettings } from '../context/SettingsContext';
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';

type Props = {
  coords: { lat: number; lng: number } | null;
  time: Date;
  containerWidth: number;
};

export default function OverlayQR({ coords, time, containerWidth }: Props) {
  const { settings } = useSettings();
  const [ deviceId, setDeviceId ] = useState<string>("unknown");

  // const data = JSON.stringify({
  //   lat: coords.lat,
  //   lng: coords.lng,
  //   time: time.toISOString(),
  // });

  useEffect(() => {
    const getId = async () => {
      try {
        if (Application.getAndroidId()) {
          setDeviceId(Application.getAndroidId());
        } 
        else if (Application.getIosIdForVendorAsync) {
          const iosId = await Application.getIosIdForVendorAsync();
          setDeviceId(iosId || "unknown");
        }
      } catch (err) {
        console.log("DeviceId error:", err);
        setDeviceId("unknown");
      }
    };

    getId();
  }, []);

  if (!settings.showQR || !coords) return null;

  const data = `http://192.168.1.33:3000/?points=${coords.lat},${coords.lng},${time.toISOString()},1,${deviceId}`;

  return (
    // Thêm style cho view để cố định vị trí góc dưới bên phải
    <View style={[styles.container, { right: 12, bottom: 72 }]}>
      <View style = {styles.qrWrapper}>
        <QRCode
          value={data}
          size={containerWidth * 0.18}
          backgroundColor="white"
          quietZone = {2}
        />
      </View>
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
  qrWrapper: {
    backgroundColor: '#fff', // Màu nền trắng tạo viền
    padding: 6,             // Độ dày của viền trắng
    borderRadius: 8,        // Bo góc nhẹ cho viền trông hiện đại hơn
    // Đổ bóng để QR nổi bật trên nền ảnh (tùy chọn)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
