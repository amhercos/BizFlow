import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProductCardProps {
  name: string;
  pricePiece: number;
  stockQty: number;
  lowStock: number;
  pricePack?: number;
  itemsPerPack?: number;
  width: number;
  disabled: boolean;
  onPress: () => void;
}

export const ProductCard = memo(function ProductCard({
  name,
  pricePiece,
  stockQty,
  lowStock,
  pricePack,
  itemsPerPack,
  width,
  disabled,
  onPress,
}: ProductCardProps) {
  const font = useInter();
  const scale = useSharedValue(1);
  const flash = useSharedValue(0);
  const out = disabled;
  const stockTint = out
    ? "#E11D48"
    : stockQty <= lowStock
      ? "#D97706"
      : "#15803D";

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const handlePressIn = useCallback(() => {
    if (out) return;
    scale.value = withTiming(0.97, {
      duration: 40,
      easing: Easing.out(Easing.quad),
    });
  }, [out, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: 70,
      easing: Easing.out(Easing.quad),
    });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (out) return;
    flash.value = withSequence(
      withTiming(1, { duration: 35 }),
      withTiming(0, { duration: 120 }),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [flash, onPress, out]);

  return (
    <AnimatedPressable
      disabled={out}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.card,
        width > 0 ? { width } : styles.cardFlex,
        out && styles.cardOff,
        cardStyle,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[styles.cardName, typeface(font.semibold, "600")]}
      >
        {name}
      </Text>
      <View style={styles.cardMeta}>
        <Text
          style={[styles.cardPrice, typeface(font.semibold, "600")]}
          numberOfLines={1}
        >
          {formatPHP(pricePiece)}
        </Text>
        <Text
          style={[
            styles.cardStock,
            { color: stockTint },
            typeface(font.medium, "500"),
          ]}
        >
          {out ? "Out" : `${stockQty}`}
        </Text>
      </View>
      {pricePack && itemsPerPack && itemsPerPack > 1 ? (
        <Text style={[styles.cardPack, typeface(font.medium, "500")]}>
          {formatPHP(pricePack)} / {itemsPerPack}pk
        </Text>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardFlex: {
    flex: 1,
  },
  cardOff: {
    opacity: 0.38,
  },
  cardName: {
    fontSize: 14,
    color: INK,
    lineHeight: 19,
    minHeight: 38,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  cardPrice: {
    flex: 1,
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
  cardStock: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  cardPack: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(37, 99, 235, 0.18)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: TINT,
  },
});
