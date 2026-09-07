import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { CustomerCredit } from "@/src/types/credit";
import { X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const AMBER = "#B45309";

interface PayCreditModalProps {
  credit: CustomerCredit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amountPaid: number) => Promise<void>;
}

export function PayCreditModal({
  credit,
  isOpen,
  onClose,
  onConfirm,
}: PayCreditModalProps) {
  const font = useInter();
  const [amountPaid, setAmountPaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setAmountPaid("");
  }, [isOpen]);

  const handleSubmit = async () => {
    const numAmount = Number(amountPaid);
    if (!credit || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(numAmount);
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverpaying = credit ? Number(amountPaid) > credit.creditAmount : false;
  const canSubmit = !isSubmitting && Number(amountPaid) > 0;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.identity}>
                  <Text style={[styles.title, typeface(font.bold, "700")]}>
                    Record payment
                  </Text>
                  <Text
                    style={[styles.subtitle, typeface(font.medium, "500")]}
                    numberOfLines={1}
                  >
                    {credit?.customerName ?? "Customer"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.close}
                  accessibilityLabel="Close payment"
                >
                  <X size={18} color={INK} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, typeface(font.medium, "500")]}>
                Amount
              </Text>
              <View
                style={[styles.field, isOverpaying && styles.fieldWarn]}
              >
                <Text style={[styles.prefix, typeface(font.semibold, "600")]}>
                  ₱
                </Text>
                <TextInput
                  style={[styles.input, typeface(font.semibold, "600")]}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  autoFocus
                />
              </View>

              {credit ? (
                <View style={styles.hintRow}>
                  <Text style={[styles.hint, typeface(font.medium, "500")]}>
                    Balance {formatPHP(credit.creditAmount)}
                  </Text>
                  {isOverpaying ? (
                    <Text style={[styles.warn, typeface(font.semibold, "600")]}>
                      Overpayment
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  void handleSubmit();
                }}
                disabled={!canSubmit}
                style={[styles.submit, !canSubmit && styles.submitOff]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.submitText, typeface(font.semibold, "600")]}>
                    Confirm {amountPaid ? formatPHP(Number(amountPaid)) : "₱0.00"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    zIndex: 1,
  },
  card: {
    backgroundColor: "#FAFBFD",
    borderRadius: 22,
    padding: 22,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  identity: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    paddingHorizontal: 14,
  },
  fieldWarn: {
    backgroundColor: "#FDE6D4",
  },
  prefix: {
    fontSize: 18,
    color: MUTED,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: INK,
  },
  hintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 18,
  },
  hint: {
    fontSize: 12,
    color: MUTED,
  },
  warn: {
    fontSize: 12,
    color: AMBER,
  },
  submit: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  submitOff: {
    backgroundColor: "#CBD5E1",
  },
  submitText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
