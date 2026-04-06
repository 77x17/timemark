import { Animated, PanResponder, StyleSheet } from 'react-native';
import { useRef, useEffect, useState, ReactNode } from 'react';

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(val, max));

type Props = {
  position: { x: number; y: number };
  editable?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  maxY?: number;
  onRelease?: (pos: { x: number; y: number }) => void;
  children: ReactNode;
};

export default function DraggableOverlay({
  position,
  editable,
  containerWidth,
  containerHeight,
  maxY,
  onRelease,
  children,
}: Props) {
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  const boxSizeRef = useRef(boxSize);
  const containerRef = useRef({ width: containerWidth ?? 0, height: containerHeight ?? 0 });
  const editableRef = useRef(editable);
  const onReleaseRef = useRef(onRelease);
  const maxYRef = useRef(maxY);           // ← ref để panResponder luôn đọc được giá trị mới nhất

  const isDraggingRef = useRef(false);

  useEffect(() => { editableRef.current = editable; }, [editable]);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);
  useEffect(() => { boxSizeRef.current = boxSize; }, [boxSize]);
  useEffect(() => { maxYRef.current = maxY; }, [maxY]);   // ← sync maxY vào ref
  useEffect(() => {
    containerRef.current = { width: containerWidth ?? 0, height: containerHeight ?? 0 };
  }, [containerWidth, containerHeight]);

  const pan = useRef(new Animated.ValueXY()).current;

  const prevXRef = useRef<number | null>(null);
  const prevYRef = useRef<number | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    if (prevXRef.current === position.x && prevYRef.current === position.y) return;
    prevXRef.current = position.x;
    prevYRef.current = position.y;
    pan.setValue({ x: position.x, y: position.y });
  }, [position.x, position.y]);

  // Clamp lại khi boxSize / container / maxY thay đổi
  useEffect(() => {
    if (!containerWidth || !containerHeight || !boxSize.width || !boxSize.height) return;

    const curX = (pan.x as any)._value;
    const curY = (pan.y as any)._value;

    const maxAllowedY = maxY !== undefined
      ? Math.min(maxY, containerHeight - boxSize.height)   // ← tôn trọng maxY
      : containerHeight - boxSize.height;

    const x = clamp(curX, 0, Math.max(0, containerWidth - boxSize.width));
    const y = clamp(curY, 0, Math.max(0, maxAllowedY));

    if (x !== curX || y !== curY) {
      pan.setValue({ x, y });
      if (editableRef.current) {
        onReleaseRef.current?.({ x, y });
      }
    }
  }, [boxSize, containerWidth, containerHeight, maxY]);   // ← thêm maxY vào deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editableRef.current === true,

      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gestureState) => {
        const { width: cW, height: cH } = containerRef.current;
        const { width: bW, height: bH } = boxSizeRef.current;
        const offsetX = (pan.x as any)._offset;
        const offsetY = (pan.y as any)._offset;

        // ← maxY từ ref, fallback về cH - bH nếu không có
        const maxAllowedY = maxYRef.current !== undefined
          ? Math.min(maxYRef.current, cH - bH)
          : cH - bH;

        const clampedX = clamp(offsetX + gestureState.dx, 0, Math.max(0, cW - bW));
        const clampedY = clamp(offsetY + gestureState.dy, 0, Math.max(0, maxAllowedY));

        pan.x.setValue(clampedX - offsetX);
        pan.y.setValue(clampedY - offsetY);
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();
        const { width: cW, height: cH } = containerRef.current;
        const { width: bW, height: bH } = boxSizeRef.current;

        // ← maxY từ ref khi release
        const maxAllowedY = maxYRef.current !== undefined
          ? Math.min(maxYRef.current, cH - bH)
          : cH - bH;

        const x = clamp((pan.x as any)._value, 0, Math.max(0, cW - bW));
        const y = clamp((pan.y as any)._value, 0, Math.max(0, maxAllowedY));

        pan.setValue({ x, y });

        prevXRef.current = x;
        prevYRef.current = y;
        isDraggingRef.current = false;

        onReleaseRef.current?.({ x, y });
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },
    })
  ).current;

  return (
    <Animated.View
      onLayout={(e) =>
        setBoxSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
      style={[styles.container, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute' },
});