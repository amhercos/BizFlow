import { typeface, useInter } from "@/src/theme/typography";
import React, { ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  variant = "danger",
}: ConfirmationModalProps): ReactElement {
  const font = useInter();
  const confirmColor =
    variant === "danger" ? "#E11D48" : variant === "warning" ? "#D97706" : "#2563EB";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, typeface(font.bold, "700")]}>{title}</Text>
          <Text style={[styles.body, typeface(font.regular, "400")]}>
            {description}
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} hitSlop={8} style={styles.action}>
              <Text style={[styles.cancel, typeface(font.medium, "500")]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable onPress={onConfirm} hitSlop={8} style={styles.action}>
              <Text
                style={[
                  styles.confirm,
                  { color: confirmColor },
                  typeface(font.semibold, "600"),
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FAFBFD",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 18,
    marginTop: 18,
  },
  action: {
    paddingVertical: 12,
  },
  cancel: {
    fontSize: 15,
    color: "#64748B",
  },
  confirm: {
    fontSize: 15,
  },
});
