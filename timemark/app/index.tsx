// app/index.tsx

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Text,
  ActivityIndicator, Animated,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { Stack, useRouter } from 'expo-router';

import OverlayText from '../components/OverlayText';
import OverlayWatermark from '../components/OverlayWatermark';
import OverlayFooter from '../components/OverlayFooter';
import OverlayBranding from '../components/OverlayBranding';
import OverlayQR from '../components/OverlayQR';

const CONTROLS_HEIGHT = 110;

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);

  // ViewShot nằm NGOÀI màn hình (top: -9999) — không đè lên bất kỳ lớp nào
  const viewShotRef = useRef<ViewShot>(null);

  const [address, setAddress] = useState('Đang xác định vị trí...');
  const [now, setNow] = useState(new Date());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedTime, setCapturedTime] = useState(new Date());

  const imageLoadedResolveRef = useRef<(() => void) | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [cameraReady, setCameraReady] = useState(false);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Đồng hồ mỗi giây
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Quyền + vị trí
  useEffect(() => {
    (async () => {
      await requestPermission();
      await requestMediaPermission();
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;
      const loc = await Location.getCurrentPositionAsync({});
      reverseGeocode(loc);
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        reverseGeocode,
      );
    })();
  }, []);

  const reverseGeocode = async (loc: Location.LocationObject) => {
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;

    setCoords({ lat, lng });

    try {
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      setAddress(
        `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n` +
        `${addr?.name || ''}, ${addr?.street || ''}, ${addr?.city || ''}`,
      );
    } catch {
      setAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const waitForImageLoad = (): Promise<void> =>
    new Promise((resolve) => {
      imageLoadedResolveRef.current = resolve;
      setTimeout(() => {
        if (imageLoadedResolveRef.current) {
          imageLoadedResolveRef.current = null;
          resolve();
        }
      }, 2000);
    });

  const handleImageLoaded = () => {
    imageLoadedResolveRef.current?.();
    imageLoadedResolveRef.current = null;
  };

  const takePhoto = async () => {
    if (!cameraRef.current || saving || !cameraReady) return;
    setSaving(true);
    try {
      // 1. Chụp ảnh thô từ camera
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.95 });
      triggerFlash();

      // 2. Đưa URI vào ViewShot (đang render ngoài màn hình)
      setCapturedTime(new Date());
      setCapturedUri(photo.uri);

      // 3. Chờ <Image> bên trong ViewShot load xong thật sự
      await waitForImageLoad();

      // 4. Thêm 1 frame để overlay kịp paint
      await new Promise((r) => setTimeout(r, 50));

      // 5. Capture — ViewShot ngoài màn hình, không ảnh hưởng UI
      const composited = await viewShotRef.current!.capture!();

      // 6. Lưu vào thư viện
      await MediaLibrary.saveToLibraryAsync(composited);

      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        setCapturedUri(null);
      }, 1500);
    } catch (e) {
      console.error('Lỗi khi lưu ảnh:', e);
      setCapturedUri(null);
    } finally {
      setSaving(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Cần quyền truy cập camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ color: '#fff' }}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/*
        ══════════════════════════════════════════════════════
        ViewShot đặt HOÀN TOÀN NGOÀI màn hình.
        - Không thuộc cây con của frameArea hay controls
        - Không đè lên camera, overlay, hay nút bấm nào
        - Kích thước = containerSize để ghép ảnh đúng tỉ lệ
        - pointerEvents="none" để chắc chắn không nhận touch
        ══════════════════════════════════════════════════════
      */}
      {containerSize.width > 0 && (
        <ViewShot
          ref={viewShotRef}
          // pointerEvents="none"
          style={[
            styles.offscreenShot,
            { width: containerSize.width, height: containerSize.height },
          ]}
          options={{ format: 'jpg', quality: 0.95 }}
        >
          {capturedUri ? (
            <>
              <Image
                source={{ uri: capturedUri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                fadeDuration={0}
                onLoad={handleImageLoaded}
              />
              <OverlayText
                time={capturedTime}
                address={address}
                editable={false}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
              <OverlayWatermark
                editable={false}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
              <OverlayFooter
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
              <OverlayBranding
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
              <OverlayQR
                coords={coords}
                time={capturedTime}
                containerWidth={containerSize.width}
              />
              
            </>
          ) : (
            // Placeholder rỗng — ViewShot luôn mount sẵn, không re-mount khi chụp
            <View style={StyleSheet.absoluteFillObject} />
          )}
        </ViewShot>
      )}

      <View style={styles.root}>

        {/* ── Vùng camera + overlay live ── */}
        <View
          style={styles.frameArea}
          onLayout={(e) =>
            setContainerSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
        >
          {/* Lớp 1: Camera live */}
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Lớp 2: Overlays live */}
          <OverlayText
            time={now}
            address={address}
            editable={false}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
          <OverlayWatermark
            editable={false}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
          <OverlayFooter
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
          <OverlayBranding
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
          <OverlayQR
            coords={coords}
            time={capturedTime}
            containerWidth={containerSize.width}
          />

          {/* Lớp 3: Flash — pointerEvents="none" */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.flash, { opacity: flashAnim }]}
          />

          {/* Badge lưu thành công */}
          {savedMsg && (
            <View style={styles.savedBadge} pointerEvents="none">
              <Text style={styles.savedText}>✓ Đã lưu vào thư viện</Text>
            </View>
          )}
        </View>

        {/* ── Thanh điều khiển — lớp độc lập, không liên quan frameArea ── */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.75}
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutter, saving && styles.shutterDisabled]}
            onPress={takePhoto}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <View style={styles.shutterInner} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/gallery-upload")}
            activeOpacity={0.75}
          >
            <Text style={styles.iconBtnText}>🖼️</Text>
          </TouchableOpacity>
        </View>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#000',
  },

  frameArea: {
    flex: 1,
    overflow: 'hidden',
    // Chỉ chứa: CameraView + overlays live + flash + savedBadge
    // KHÔNG có ViewShot → không có lớp nào đè lên lớp nào
  },

  // ViewShot nằm hoàn toàn ngoài vùng nhìn thấy
  // position: 'absolute' + top: -9999 → ẩn khỏi màn hình
  // không thuộc cây con của frameArea hay controls
  offscreenShot: {
    position: 'absolute',
    top: -9999,
    left: 0,
    backgroundColor: '#000',
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
  iconBtnText: { fontSize: 22 },

  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: { opacity: 0.45 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  flash: {
    backgroundColor: '#fff',
    zIndex: 99,
  },

  savedBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  savedText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  center: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  permBtn: {
    borderWidth: 1, borderColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
});