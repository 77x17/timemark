// app/settings.tsx

import {
  View, Text, Switch, StyleSheet, Image,
  TextInput, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import OverlayText from '../components/OverlayText';
import OverlayWatermark from '../components/OverlayWatermark';
import OverlayFooter from '../components/OverlayFooter';
import OverlayBranding from '../components/OverlayBranding';
import OverlayQR from '../components/OverlayQR';
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';

const CONTROLS_HEIGHT = 110;

// Chiều cao footer overlay (phải khớp với OverlayFooter)
const FOOTER_OVERLAY_HEIGHT = 64;

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();

  // Kích thước previewBox — chỉ set sau khi đã đo xong layout (không set 0,0)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const [panelVisible, setPanelVisible] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const togglePanel = () => {
    const toValue = panelVisible ? 0 : 1;
    Animated.spring(panelAnim, { toValue, useNativeDriver: true, bounciness: 5 }).start();
    setPanelVisible(!panelVisible);
  };

  const pickIcon = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      updateSettings({ ...settings, iconUri: result.assets[0].uri });
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      updateSettings({ ...settings, avatarUri: result.assets[0].uri });
    }
  };

  const [previewTime] = useState(() => new Date());

  function getDefaultPositions() {
    return {
      time:      { x: 20, y: 100 },
      watermark: { x: 20, y: 200 },
      icon:      { x: 20, y: 300 },
    };
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.root}>

        {/* ── Vùng preview — flex:1 phía trên controls ── */}
        <View
          style={styles.previewBox}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            // Chỉ cập nhật khi có kích thước thực (tránh flash với 0,0)
            if (width > 0 && height > 0) {
              setSize({ width, height });
            }
          }}
        >
          {/* Nền đen giữ chỗ — hiển thị ngay lập tức, không bị giật */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111' }]} />

          {/* Ảnh preview — chỉ render sau khi đã có kích thước */}
          {size && (
            <Image
              source={{ uri: `https://picsum.photos/seed/timemark/${Math.round(size.width)}/${Math.round(size.height)}` }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              // fadeDuration=0 tránh animation fade làm giật layout
              fadeDuration={0}
            />
          )}

          {/* Overlays — chỉ render khi đã đo xong kích thước thực */}
          {size && (
            <>
              <OverlayText
                time={previewTime}
                address={`Tọa độ: 10.776112, 106.695812\nVõ Văn Kiệt, Quận 1, TP.HCM`}
                editable={!panelVisible}
                containerWidth={size.width}
                containerHeight={size.height}
                // Giới hạn kéo: không cho kéo xuống dưới footer
                maxY={size.height - FOOTER_OVERLAY_HEIGHT - 80}
              />
              <OverlayWatermark
                editable={!panelVisible}
                containerWidth={size.width}
                containerHeight={size.height}
                maxY={size.height - FOOTER_OVERLAY_HEIGHT - 30}
              />
              <OverlayFooter
                containerWidth={size.width}
                containerHeight={size.height}
              />
              {/* <OverlayBranding
                containerWidth={size.width}
                containerHeight={size.height}
              /> */}
              <OverlayQR
                coords={{ lat: 10.727957, lng: 106.624801}}
                time={previewTime}
                containerWidth={size.width}
              />
            </>
          )}

          {/* Panel cài đặt — absolute bên trong previewBox */}
          <Animated.View
            style={[
              styles.panel,
              {
                transform: [
                  {
                    translateY: panelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [800, 0],
                    }),
                  },
                ],
                pointerEvents: panelVisible ? 'auto' : 'none',
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <SectionTitle title="🕐 Thời gian & Địa chỉ" />
              <Row label="Hiển thị thời gian">
                <Switch value={settings.showTime} onValueChange={(v) => updateSettings({ ...settings, showTime: v })} />
              </Row>
              <Row label="Hiển thị địa chỉ">
                <Switch value={settings.showAddress} onValueChange={(v) => updateSettings({ ...settings, showAddress: v })} />
              </Row>
              <Row label="Format 24h">
                <Switch value={settings.use24h} onValueChange={(v) => updateSettings({ ...settings, use24h: v })} />
              </Row>
              <ResetButton label="Reset vị trí" onPress={() => updateSettings({ ...settings, position: getDefaultPositions().time })} />

              <Divider />

              <SectionTitle title="💧 Watermark" />
              <Row label="Hiển thị watermark">
                <Switch value={settings.showWatermark} onValueChange={(v) => updateSettings({ ...settings, showWatermark: v })} />
              </Row>
              {settings.showWatermark && (
                <>
                  <FieldLabel label="Nội dung" />
                  <TextInput
                    style={styles.input}
                    value={settings.watermarkText}
                    onChangeText={(t) => updateSettings({ ...settings, watermarkText: t })}
                    placeholder="Nhập watermark..."
                    placeholderTextColor="#888"
                  />
                  <ResetButton label="Reset vị trí" onPress={() => updateSettings({ ...settings, watermarkPosition: getDefaultPositions().watermark })} />
                </>
              )}

              <Divider />

              <SectionTitle title="▣ QR" />
              <Row label="Hiển thị QR">
                <Switch value={settings.showQR} onValueChange={(v) => updateSettings({ ...settings, showQR: v })} />
              </Row>

              <Divider />

              <SectionTitle title="📋 Footer" />
              <Row label="Hiển thị footer">
                <Switch value={settings.showFooter} onValueChange={(v) => updateSettings({ ...settings, showFooter: v })} />
              </Row>
              {settings.showFooter && (
                <>
                  <FieldLabel label="Họ tên người chụp" />
                  <TextInput
                    style={styles.input}
                    value={settings.footerName}
                    onChangeText={(t) => updateSettings({ ...settings, footerName: t })}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#888"
                  />
                  <FieldLabel label="Số điện thoại" />
                  <TextInput
                    style={styles.input}
                    value={settings.footerPhone}
                    onChangeText={(t) => updateSettings({ ...settings, footerPhone: t })}
                    placeholder="0901 234 567"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                  />

                  <SectionTitle title="🖼️ Icon" />
                  <Row label="Hiển thị icon">
                    <Switch value={settings.showIcon} onValueChange={(v) => updateSettings({ ...settings, showIcon: v })} />
                  </Row>
                  {settings.showIcon && (
                    <>
                      <View style={styles.iconRow}>
                        <TouchableOpacity style={styles.pickBtn} onPress={pickIcon}>
                          <Text style={{ color: '#fff', fontSize: 13 }}>
                            {settings.iconUri ? '🔄 Đổi ảnh' : '📂 Chọn ảnh'}
                          </Text>
                        </TouchableOpacity>
                        {settings.iconUri && (
                          <Image source={{ uri: settings.iconUri }} style={styles.iconPreview} />
                        )}
                      </View>
                    </>
                  )}

                  <SectionTitle title="🖼️ Avatar" />
                  <Row label="Hiển thị avatar">
                    <Switch value={settings.showAvatar} onValueChange={(v) => updateSettings({ ...settings, showAvatar: v })} />
                  </Row>
                  {settings.showAvatar && (
                    <>
                      <View style={styles.iconRow}>
                        <TouchableOpacity style={styles.pickBtn} onPress={pickAvatar}>
                          <Text style={{ color: '#fff', fontSize: 13 }}>
                            {settings.avatarUri ? '🔄 Đổi ảnh' : '📂 Chọn ảnh'}
                          </Text>
                        </TouchableOpacity>
                        {settings.avatarUri && (
                          <Image source={{ uri: settings.avatarUri }} style={styles.iconPreview} />
                        )}
                      </View>
                    </>
                  )}
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>

        {/* ── Thanh điều khiển — height cố định, luôn nhấn được ── */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutterBtn, panelVisible && styles.shutterBtnActive]}
            onPress={togglePanel}
            activeOpacity={0.8}
          >
            <Text style={styles.shutterBtnText}>{panelVisible ? '✕' : '⚙️'}</Text>
          </TouchableOpacity>

          <View style={styles.iconBtn} />
        </View>
      </View>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={sectionStyles.title}>{title}</Text>;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={fieldStyles.label}>{label}</Text>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 }} />;
}

function ResetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={resetStyles.btn} onPress={onPress}>
      <Text style={resetStyles.text}>↺ {label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: '#fff', flex: 1, fontSize: 14 },
});

const sectionStyles = StyleSheet.create({
  title: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 10, letterSpacing: 0.4 },
});

const fieldStyles = StyleSheet.create({
  label: { color: '#aaa', fontSize: 12, marginBottom: 4 },
});

const resetStyles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10,
  },
  text: { color: '#ccc', fontSize: 12 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#000',
  },

  previewBox: {
    flex: 1,
    overflow: 'hidden',
  },

  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9,
  },

  controls: {
    height: CONTROLS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 44,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: { fontSize: 22, color: '#fff' },

  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shutterBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  shutterBtnText: { fontSize: 26 },

  input: {
    borderWidth: 1, borderColor: '#555', borderRadius: 8,
    color: '#fff', padding: 9, marginBottom: 10, fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  pickBtn: {
    borderWidth: 1, borderColor: '#777', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  iconPreview: { width: 44, height: 44, borderRadius: 6 },
});