// components/OverlayIcon.tsx

import { Image, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import DraggableOverlay from './DraggableOverlay';

type Props = {
  editable?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  maxY?: number;
};

export default function OverlayIcon({ editable, containerWidth, containerHeight, maxY }: Props) {
  const { settings, updateSettings } = useSettings();

  if (!settings.showIcon || !settings.iconUri) return null;

  return (
    <DraggableOverlay
      position={settings.iconPosition}
      editable={editable}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      maxY={maxY}
      onRelease={(pos) => updateSettings({ ...settings, iconPosition: pos })}
    >
      <Image source={{ uri: settings.iconUri }} style={styles.icon} />
    </DraggableOverlay>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
});