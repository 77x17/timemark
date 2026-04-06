import { Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import DraggableOverlay from './DraggableOverlay';

type Props = {
  editable?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  maxY?: number;
};

export default function OverlayWatermark({ editable, containerWidth, containerHeight, maxY }: Props) {
  const { settings, updateSettings } = useSettings();

  if (!settings.showWatermark || !settings.watermarkText) return null;

  return (
    <DraggableOverlay
      position={settings.watermarkPosition}
      editable={editable}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      maxY={maxY}
      onRelease={(pos) => updateSettings({ ...settings, watermarkPosition: pos })}
    >
      <Text style={styles.text}>{settings.watermarkText}</Text>
    </DraggableOverlay>
  );
}

const styles = StyleSheet.create({
  text: {
    // color: 'white',
    color: 'rgba(255, 255, 255, 0.54)',
    // backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 6,
    fontSize: 20,
    fontStyle: 'italic',
  },
});