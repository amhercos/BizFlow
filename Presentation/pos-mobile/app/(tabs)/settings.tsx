import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/hooks/use-settings";
import { typeface, useInter } from "@/src/theme/typography";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  LucideIcon,
  Store,
  User,
} from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, { memo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const LINE = "rgba(15, 23, 42, 0.08)";

function roleLabel(role?: string) {
  if (role === "StoreOwner") return "Store owner";
  if (role === "Cashier") return "Cashier";
  if (role === "Admin") return "Admin";
  return "Staff";
}

const SettingRow = memo(function SettingRow({
  icon: Icon,
  label,
  value,
  onPress,
  isLast = false,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const font = useInter();
  return (
    <View>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.rowIcon}>
          <Icon size={16} color={TINT} strokeWidth={1.8} />
        </View>
        <Text style={[styles.rowLabel, typeface(font.semibold, "600")]}>
          {label}
        </Text>
        {value ? (
          <Text
            style={[styles.rowValue, typeface(font.medium, "500")]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
        <ChevronRight size={16} color="#94A3B8" />
      </Pressable>
      {!isLast ? <View style={styles.hairline} /> : null}
    </View>
  );
});

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  const font = useInter();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, typeface(font.medium, "500")]}>
        {label}
      </Text>
      <TextInput
        style={[styles.fieldInput, typeface(font.medium, "500")]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { user } = useAuth();
  const {
    isLoading,
    editableProfile,
    setEditableProfile,
    editableStoreSettings,
    setEditableStoreSettings,
    isProfileDirty,
    isStoreDirty,
    updateProfile,
    updateStoreSettings,
  } = useSettings();

  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"menu" | "profile" | "store">(
    "menu",
  );

  const title =
    viewMode === "profile"
      ? "Profile"
      : viewMode === "store"
        ? "Store"
        : "Settings";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        {viewMode === "menu" ? (
          <DrawerMenuButton />
        ) : (
          <TouchableOpacity
            onPress={() => setViewMode("menu")}
            style={styles.backBtn}
            accessibilityLabel="Back to settings"
          >
            <ChevronLeft size={20} color={INK} />
          </TouchableOpacity>
        )}
        <View style={styles.identity}>
          <Text style={[styles.title, typeface(font.bold, "700")]}>{title}</Text>
          <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
            {viewMode === "menu"
              ? roleLabel(user?.role)
              : viewMode === "profile"
                ? "Your account"
                : "Store preferences"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 22, marginTop: 12 }}>
          <Skeleton colorMode="light" width="100%" height={88} radius={16} />
          <View style={{ height: 16 }} />
          <Skeleton colorMode="light" width="100%" height={160} radius={16} />
        </View>
      ) : viewMode === "profile" ? (
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <EditField
            label="Full name"
            value={editableProfile?.fullName || ""}
            onChangeText={(t) =>
              setEditableProfile((p) => (p ? { ...p, fullName: t } : null))
            }
            placeholder="Enter full name"
          />
          <EditField
            label="Username"
            value={editableProfile?.userName || ""}
            onChangeText={(t) =>
              setEditableProfile((p) => (p ? { ...p, userName: t } : null))
            }
            placeholder="Enter username"
          />
          <TouchableOpacity
            disabled={!isProfileDirty}
            onPress={() => {
              if (editableProfile) {
                updateProfile(editableProfile);
                setViewMode("menu");
              }
            }}
            style={[styles.saveBtn, !isProfileDirty && styles.saveBtnOff]}
          >
            <Text style={[styles.saveText, typeface(font.semibold, "600")]}>
              Save
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : viewMode === "store" ? (
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <EditField
            label="Store name"
            value={editableStoreSettings?.storeName || ""}
            onChangeText={(t) =>
              setEditableStoreSettings((p) =>
                p ? { ...p, storeName: t } : null,
              )
            }
            placeholder="Enter store name"
          />
          <EditField
            label="Location"
            value={editableStoreSettings?.location || ""}
            onChangeText={(t) =>
              setEditableStoreSettings((p) =>
                p ? { ...p, location: t } : null,
              )
            }
            placeholder="Store location"
          />
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <EditField
                label="Low stock"
                value={
                  editableStoreSettings?.lowStockThreshold?.toString() || "0"
                }
                onChangeText={(t) =>
                  setEditableStoreSettings((p) =>
                    p ? { ...p, lowStockThreshold: parseInt(t) || 0 } : null,
                  )
                }
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldHalf}>
              <EditField
                label="Expiry notice"
                value={
                  editableStoreSettings?.nearExpiryAlertDays?.toString() || "0"
                }
                onChangeText={(t) =>
                  setEditableStoreSettings((p) =>
                    p
                      ? { ...p, nearExpiryAlertDays: parseInt(t) || 0 }
                      : null,
                  )
                }
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity
            disabled={!isStoreDirty}
            onPress={() => {
              if (editableStoreSettings) {
                updateStoreSettings(editableStoreSettings);
                setViewMode("menu");
              }
            }}
            style={[styles.saveBtn, !isStoreDirty && styles.saveBtnOff]}
          >
            <Text style={[styles.saveText, typeface(font.semibold, "600")]}>
              Save
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, typeface(font.bold, "700")]}>
                {editableProfile?.fullName?.charAt(0) ||
                  user?.userName?.charAt(0) ||
                  "?"}
              </Text>
            </View>
            <Text
              style={[styles.displayName, typeface(font.bold, "700")]}
              numberOfLines={1}
            >
              {editableProfile?.fullName || "BizFlow"}
            </Text>
            <View style={styles.rolePill}>
              <Text style={[styles.roleText, typeface(font.medium, "500")]}>
                {roleLabel(user?.role)}
              </Text>
            </View>
          </View>

          <Text style={[styles.section, typeface(font.bold, "700")]}>
            Account
          </Text>
          <View style={styles.group}>
            <SettingRow
              icon={User}
              label="Personal details"
              value={editableProfile?.userName}
              onPress={() => setViewMode("profile")}
              isLast
            />
          </View>

          {user?.role === "StoreOwner" ? (
            <>
              <Text style={[styles.section, typeface(font.bold, "700")]}>
                Business
              </Text>
              <View style={styles.group}>
                <SettingRow
                  icon={Store}
                  label="Store settings"
                  value={editableStoreSettings?.storeName ?? undefined}
                  onPress={() => setViewMode("store")}
                  isLast
                />
              </View>
            </>
          ) : null}

          <Text style={[styles.section, typeface(font.bold, "700")]}>
            Security
          </Text>
          <View style={styles.group}>
            <SettingRow
              icon={Lock}
              label="Change password"
              onPress={() => setPwModalVisible(true)}
            />
            <SettingRow
              icon={Info}
              label="About BizFlow"
              isLast
              onPress={() => {}}
            />
          </View>

          <Text style={[styles.foot, typeface(font.medium, "500")]}>
            BizFlow v1.0
          </Text>
        </ScrollView>
      )}

      <ChangePasswordModal
        visible={pwModalVisible}
        onClose={() => setPwModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    marginLeft: 12,
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
  body: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  form: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    borderRadius: 22,
    paddingVertical: 22,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  displayName: {
    marginTop: 12,
    fontSize: 18,
    color: INK,
    letterSpacing: -0.3,
  },
  rolePill: {
    marginTop: 8,
    backgroundColor: "#DCEBFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 12,
    color: TINT,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  group: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#DCEBFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: INK,
  },
  rowValue: {
    maxWidth: 120,
    marginRight: 8,
    fontSize: 13,
    color: MUTED,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 58,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },
  fieldInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    paddingHorizontal: 14,
    fontSize: 15,
    color: INK,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnOff: {
    backgroundColor: "#CBD5E1",
  },
  saveText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  foot: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
  },
});
