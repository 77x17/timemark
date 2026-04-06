// components/OverlayFooter.tsx

import { View, Text, Image, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

type Props = {
  containerWidth?: number;
  containerHeight?: number;
};

export default function OverlayFooter({ containerWidth, containerHeight }: Props) {
  const { settings } = useSettings();

  if (!settings.showFooter) return null;

  return (
    <View style={styles.footer} pointerEvents="none">
      {/* Avatar — góc trái  */}
      {settings.showAvatar && settings.avatarUri ? (
        <Image source={{ uri: settings.avatarUri }} style={styles.avatar} />
      ) : null}

      {/* Thông tin người chụp — góc trái  */}
      <View style={styles.info}>
        {settings.footerName ? (
          <Text style={styles.name} numberOfLines={1}>
            {settings.footerName}
          </Text>
        ) : null}
        {settings.footerPhone ? (
          <Text style={styles.phone} numberOfLines={1}>
            {settings.footerPhone}
          </Text>
        ) : null}
      </View>

      {/* Icon — góc phải */}
      {settings.showIcon && settings.iconUri ? (
        <Image source={{ uri: settings.iconUri }} style={styles.icon} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  info: {
    flex: 1,
    marginRight: 10,
    marginLeft: 10,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  phone: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});