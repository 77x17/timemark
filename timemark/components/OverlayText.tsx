// components/OverlayText.tsx
// Fix: maxWidth tính động = containerWidth - posX - margin
// → text luôn wrap trong phạm vi container dù kéo gần mép phải

import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import DraggableOverlay from './DraggableOverlay';

// Phải khớp với FOOTER_OVERLAY_HEIGHT trong settings.tsx
const FOOTER_OVERLAY_HEIGHT = 64;
const MARGIN = 8; // khoảng cách tối thiểu cách mép phải

type Props = {
  time: Date;
  address: string;
  editable?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  maxY?: number;
};

export default function OverlayText({
  time,
  address,
  editable,
  containerWidth = 0,
  containerHeight = 0,
  maxY,
}: Props) {
  const { settings, updateSettings } = useSettings();

  if (!settings.showTime && !settings.showAddress) return null;

  const pos = settings.position ?? { x: 20, y: 100 };

  // maxWidth động: từ vị trí x hiện tại đến mép phải container trừ margin
  // → khi kéo sang phải, text tự wrap lại thay vì tràn ra ngoài
  const maxWidth = undefined;

  const formatTime = (d: Date) => {
    if (settings.use24h) {
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      const ss = d.getSeconds().toString().padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${mm}:${ss} ${ampm}`;
  };

  const formatDate = (d: Date) => {
    const dd = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mo}/${yyyy}`;
  };

  return (
    <DraggableOverlay
      position={pos}
      editable={editable}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      maxY={maxY}
      onRelease={(p) => updateSettings({ ...settings, position: p })}
    >
      <View style={[styles.box, maxWidth ? { maxWidth } : undefined]}>
        {settings.showTime && (
          <Text style={styles.time} numberOfLines={1}>
            {formatTime(time)}
          </Text>
        )}
        {settings.showTime && (
          <Text style={styles.date} numberOfLines={1}>
            {formatDate(time)}
          </Text>
        )}
        {settings.showAddress && (
          <Text style={styles.address}>
            {address}
          </Text>
        )}
      </View>
    </DraggableOverlay>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  time: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 1,
  },
  address: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 16,
  },
});