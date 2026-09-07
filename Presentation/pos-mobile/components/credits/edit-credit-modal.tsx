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

interface EditCreditModalProps {
  credit: CustomerCredit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, contact: string) => Promise<void>;
}

export function EditCreditModal({
  credit,
  isOpen,
  onClose,
  onConfirm,
}: EditCreditModalProps) {
  const font = useInter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (credit) {
      setName(credit.customerName);
      setContact(credit.contactInfo || "");
    }
  }, [credit, isOpen]);

  const handleSubmit = async () => {
    if (!credit || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(name, contact);
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !isSubmitting && name.trim().length > 0;

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
                    Customer details
                  </Text>
                  <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
                    Name and contact
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.close}
                  accessibilityLabel="Close customer details"
                >
                  <X size={18} color={INK} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, typeface(font.medium, "500")]}>
                Full name
              </Text>
              <TextInput
                style={[styles.input, typeface(font.medium, "500")]}
                placeholder="Enter customer name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.label, typeface(font.medium, "500")]}>
                Contact
              </Text>
              <TextInput
                style={[styles.input, typeface(font.medium, "500")]}
                placeholder="Phone or email"
                placeholderTextColor="#94A3B8"
                value={contact}
                onChangeText={setContact}
              />

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
                    Save
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
  input: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    paddingHorizontal: 14,
    fontSize: 15,
    color: INK,
    marginBottom: 14,
  },
  submit: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitOff: {
    backgroundColor: "#CBD5E1",
  },
  submitText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
