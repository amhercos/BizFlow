import { formatPHP } from "@/src/lib/math";
import { UnitType, type Product } from "@/src/types/sale";
import { Box, Check, Package } from "lucide-react-native";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UnitSelectorProps {
  product: Product;
  onClose: () => void;
  onConfirm: (product: Product, unitType: UnitType) => void;
}

interface UnitOptionProps {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  detail: string;
  price: string;
  hint?: string;
  onPress: () => void;
}

const UnitOption = memo(function UnitOption({
  selected,
  icon,
  label,
  detail,
  price,
  hint,
  onPress,
}: UnitOptionProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        {icon}
      </View>

      <View style={styles.optionCopy}>
        <Text
          style={[styles.optionLabel, selected && styles.optionLabelSelected]}
        >
          {label}
        </Text>
        <Text style={styles.optionDetail}>{detail}</Text>
        {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
      </View>

      <View style={styles.optionRight}>
        <Text
          style={[styles.optionPrice, selected && styles.optionPriceSelected]}
        >
          {price}
        </Text>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Check size={12} color="#ffffff" strokeWidth={3} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export const UnitSelector = memo(function UnitSelector({
  product,
  onClose,
  onConfirm,
}: UnitSelectorProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(UnitType.Piece);

  useEffect(() => {
    setSelectedUnit(UnitType.Piece);
  }, [product.id]);

  const packCount = useMemo(
    () => Math.floor(product.stock / Math.max(product.piecesPerPack, 1)),
    [product.stock, product.piecesPerPack],
  );

  const packPerPiece = useMemo(
    () =>
      product.piecesPerPack > 0
        ? product.packPrice / product.piecesPerPack
        : product.packPrice,
    [product.packPrice, product.piecesPerPack],
  );

  const selectedPrice =
    selectedUnit === UnitType.Pack ? product.packPrice : product.price;
  const confirmLabel =
    selectedUnit === UnitType.Pack ? "Add pack" : "Add piece";

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text numberOfLines={2} style={styles.title}>
            {product.name}
          </Text>
          <Text style={styles.subtitle}>Choose how to sell this item</Text>

          <View style={styles.options}>
            <UnitOption
              selected={selectedUnit === UnitType.Piece}
              icon={
                <Box
                  size={18}
                  color={selectedUnit === UnitType.Piece ? "#ffffff" : "#64748b"}
                  strokeWidth={2.2}
                />
              }
              label="Piece"
              detail="Sold individually"
              price={formatPHP(product.price)}
              hint={`${product.stock} pcs available`}
              onPress={() => setSelectedUnit(UnitType.Piece)}
            />

            <UnitOption
              selected={selectedUnit === UnitType.Pack}
              icon={
                <Package
                  size={18}
                  color={selectedUnit === UnitType.Pack ? "#ffffff" : "#64748b"}
                  strokeWidth={2.2}
                />
              }
              label="Pack"
              detail={`${product.piecesPerPack} pcs per pack`}
              price={formatPHP(product.packPrice)}
              hint={
                packCount > 0
                  ? `${packCount} pack${packCount === 1 ? "" : "s"} · ${formatPHP(packPerPiece)}/pc`
                  : "Not enough stock for a pack"
              }
              onPress={() => setSelectedUnit(UnitType.Pack)}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onConfirm(product, selectedUnit)}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmText}>
              {confirmLabel} · {formatPHP(selectedPrice)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: "#FAFBFD",
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 1,
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 18,
  },
  options: {
    gap: 10,
    marginBottom: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: "#FFFFFF",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: "#2563EB",
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  optionLabelSelected: {
    color: "#0f172a",
  },
  optionDetail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  optionHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  optionRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  optionPriceSelected: {
    color: "#0f172a",
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  confirmBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: 14,
  },
});
