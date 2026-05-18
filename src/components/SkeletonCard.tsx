import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { COLORS, SHADOW_MD } from '@/constants';

function SkeletonBase({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={{ opacity: anim }}>{children}</Animated.View>;
}

function Bone({ w, h, r = 8, style }: { w: number | `${number}%`; h: number; r?: number; style?: object }) {
  return (
    <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: COLORS.borderLight }, style]} />
  );
}

export function JobCardSkeleton() {
  return (
    <SkeletonBase>
      <View style={styles.card}>
        <View style={styles.row}>
          <Bone w={42} h={42} r={12} />
          <View style={{ flex: 1, gap: 7 }}>
            <Bone w="75%" h={13} />
            <Bone w="45%" h={11} />
          </View>
          <Bone w={72} h={22} r={10} />
        </View>
        <Bone w="100%" h={11} style={{ marginBottom: 5 }} />
        <Bone w="65%" h={11} style={{ marginBottom: 14 }} />
        <Bone w="100%" h={40} r={10} />
      </View>
    </SkeletonBase>
  );
}

export function WorkerCardSkeleton() {
  return (
    <SkeletonBase>
      <View style={styles.card}>
        <View style={[styles.row, { marginBottom: 14 }]}>
          <Bone w={64} h={64} r={32} />
          <View style={{ flex: 1, gap: 9 }}>
            <Bone w="68%" h={15} />
            <Bone w="50%" h={12} />
            <Bone w="40%" h={11} />
          </View>
        </View>
        <View style={styles.row}>
          <Bone w="32%" h={38} r={11} />
          <Bone w="64%" h={38} r={11} style={{ flex: 1 }} />
        </View>
      </View>
    </SkeletonBase>
  );
}

export function ChatRowSkeleton() {
  return (
    <SkeletonBase>
      <View style={styles.chatCard}>
        <View style={styles.row}>
          <Bone w={52} h={52} r={26} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w="55%" h={14} />
              <Bone w="12%" h={11} />
            </View>
            <Bone w="40%" h={11} />
            <Bone w="72%" h={11} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
              <Bone w={64} h={20} r={10} />
              <Bone w={72} h={20} r={10} />
            </View>
          </View>
        </View>
      </View>
    </SkeletonBase>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    marginBottom: 10,
    ...SHADOW_MD,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  chatCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    marginBottom: 10,
    ...SHADOW_MD,
  },
});
