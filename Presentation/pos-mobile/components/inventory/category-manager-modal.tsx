import { ConfirmationModal } from "@/components/ConfirmationModal";
import { typeface, useInter } from "@/src/theme/typography";
import type { Category } from "@/src/types/inventory";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onAdd,
  onRename,
  onDelete,
}: CategoryManagerProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    "add" | "rename" | "delete" | null
  >(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const selectedCategory = categories.find((category) => category.id === editingId);
  const isPrimaryButtonDisabled = !categoryNameInput.trim();
  const isRenameSaveDisabled =
    !editingName.trim() ||
    (!!editingId && selectedCategory?.name === editingName.trim());

  const handlePrimaryAction = async () => {
    const trimmedName = categoryNameInput.trim();
    if (!trimmedName) return;
    setLoadingAction("add");
    try {
      await onAdd(trimmedName);
      setCategoryNameInput("");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveRename = async () => {
    if (!editingId) return;
    const trimmedName = editingName.trim();
    if (!trimmedName) return;
    setLoadingAction("rename");
    try {
      await onRename(editingId, trimmedName);
      setEditingId(null);
      setEditingName("");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setLoadingAction("delete");
    try {
      await onDelete(categoryToDelete.id);
      setCategoryToDelete(null);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.backdrop}
        >
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={styles.header}>
              <View style={styles.identity}>
                <Text style={[styles.title, typeface(font.bold, "700")]}>
                  Categories
                </Text>
                <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
                  {categories.length} group{categories.length === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={8}>
                <X size={18} color={INK} />
              </TouchableOpacity>
            </View>

            <View style={styles.addRow}>
              <TextInput
                placeholder="New category"
                placeholderTextColor="#94A3B8"
                value={categoryNameInput}
                onChangeText={setCategoryNameInput}
                style={[styles.addInput, typeface(font.medium, "500")]}
              />
              <TouchableOpacity
                onPress={handlePrimaryAction}
                disabled={isPrimaryButtonDisabled || loadingAction !== null}
                style={[
                  styles.addBtn,
                  isPrimaryButtonDisabled && styles.addBtnOff,
                ]}
              >
                {loadingAction === "add" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.addBtnText, typeface(font.semibold, "600")]}>
                    Add
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {categories.length === 0 ? (
                <Text style={[styles.empty, typeface(font.regular, "400")]}>
                  No categories yet
                </Text>
              ) : (
                categories.map((category, index) => (
                  <View key={category.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    {editingId === category.id ? (
                      <View style={styles.editRow}>
                        <TextInput
                          autoFocus
                          value={editingName}
                          onChangeText={setEditingName}
                          style={[styles.editInput, typeface(font.medium, "500")]}
                        />
                        <Pressable
                          onPress={handleSaveRename}
                          disabled={
                            isRenameSaveDisabled || loadingAction === "rename"
                          }
                        >
                          <Text
                            style={[
                              styles.link,
                              isRenameSaveDisabled && styles.linkOff,
                              typeface(font.semibold, "600"),
                            ]}
                          >
                            {loadingAction === "rename" ? "…" : "Save"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          <Text style={[styles.mutedLink, typeface(font.medium, "500")]}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.row}>
                        <View style={styles.rowBody}>
                          <Text
                            style={[styles.name, typeface(font.semibold, "600")]}
                          >
                            {category.name}
                          </Text>
                          <Text style={[styles.meta, typeface(font.medium, "500")]}>
                            {category.productCount} item
                            {category.productCount === 1 ? "" : "s"}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                          }}
                          hitSlop={8}
                        >
                          <Text style={[styles.link, typeface(font.medium, "500")]}>
                            Rename
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setCategoryToDelete(category)}
                          hitSlop={8}
                        >
                          <Text style={[styles.danger, typeface(font.medium, "500")]}>
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal
        visible={!!categoryToDelete}
        title="Delete category"
        description={
          categoryToDelete?.productCount && categoryToDelete.productCount > 0
            ? `"${categoryToDelete.name}" has ${categoryToDelete.productCount} items. They will move to Uncategorized.`
            : `Delete "${categoryToDelete?.name}"?`
        }
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

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
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
  },
  identity: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: INK,
  },
  addBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnOff: {
    backgroundColor: "#CBD5E1",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  list: {
    maxHeight: 360,
    paddingHorizontal: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: INK,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  link: {
    fontSize: 13,
    color: TINT,
  },
  linkOff: {
    color: "#CBD5E1",
  },
  mutedLink: {
    fontSize: 13,
    color: MUTED,
  },
  danger: {
    fontSize: 13,
    color: "#E11D48",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#EEF1F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 15,
    color: INK,
  },
  empty: {
    paddingVertical: 20,
    fontSize: 14,
    color: MUTED,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
});
