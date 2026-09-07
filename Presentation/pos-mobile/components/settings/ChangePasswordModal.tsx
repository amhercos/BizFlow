import { typeface, useInter } from "@/src/theme/typography";
import { Eye, EyeOff, X } from "lucide-react-native";
import React, { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../../src/hooks/use-settings";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

const PasswordInput = memo(function PasswordInput({
  label,
  value,
  onChangeText,
}: PasswordInputProps) {
  const font = useInter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, typeface(font.medium, "500")]}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          secureTextEntry={!showPassword}
          style={[styles.input, typeface(font.medium, "500")]}
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.eye}
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff size={18} color="#94A3B8" />
          ) : (
            <Eye size={18} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const ChangePasswordModal = memo(function ChangePasswordModal({
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { changePassword } = useSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdate = useCallback(async (): Promise<void> => {
    if (form.newPassword !== form.confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "New passwords do not match",
      });
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onClose();
    } catch {
      // Catch block without identifier to satisfy "no-unused-vars"
    } finally {
      setLoading(false);
    }
  }, [form, changePassword, onClose]);

  const canSubmit: boolean =
    form.currentPassword.length > 0 &&
    form.newPassword.length >= 6 &&
    form.newPassword === form.confirmPassword;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.identity}>
                <Text style={[styles.title, typeface(font.bold, "700")]}>
                  Change password
                </Text>
                <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
                  Update credentials
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.close}
                accessibilityLabel="Close password"
              >
                <X size={18} color={INK} />
              </TouchableOpacity>
            </View>

            <PasswordInput
              label="Current password"
              value={form.currentPassword}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, currentPassword: t }))
              }
            />
            <PasswordInput
              label="New password"
              value={form.newPassword}
              onChangeText={(t) => setForm((f) => ({ ...f, newPassword: t }))}
            />
            <PasswordInput
              label="Confirm password"
              value={form.confirmPassword}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, confirmPassword: t }))
              }
            />

            <TouchableOpacity
              disabled={loading || !canSubmit}
              onPress={() => {
                void handleUpdate();
              }}
              style={[styles.submit, !canSubmit && styles.submitOff]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[styles.submitText, typeface(font.semibold, "600")]}
                >
                  Update password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    backgroundColor: "#FAFBFD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  identity: {
    flex: 1,
    marginRight: 12,
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
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    paddingLeft: 14,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: INK,
  },
  eye: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submit: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitOff: {
    backgroundColor: "#CBD5E1",
  },
  submitText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
