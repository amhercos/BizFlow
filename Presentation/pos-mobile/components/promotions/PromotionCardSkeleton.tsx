import { Skeleton } from "moti/skeleton";
import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

const PromotionCardSkeleton: FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton colorMode="light" width={64} height={16} radius={8} />
      <View style={styles.gap} />
      <Skeleton colorMode="light" width="70%" height={18} radius={6} />
      <View style={styles.small} />
      <Skeleton colorMode="light" width="40%" height={12} radius={6} />
      <View style={styles.rule} />
      <Skeleton colorMode="light" width="50%" height={22} radius={6} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  gap: {
    height: 10,
  },
  small: {
    height: 6,
  },
  rule: {
    height: 14,
  },
});

export default PromotionCardSkeleton;
