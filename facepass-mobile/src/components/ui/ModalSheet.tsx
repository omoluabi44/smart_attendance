import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { X } from "lucide-react-native";

export interface ModalSheetProps {
  visible: boolean;
  badge?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalSheet({
  visible,
  badge,
  title,
  subtitle,
  onClose,
  children,
}: ModalSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-obsidian-950/70 justify-end sm:justify-center p-0 sm:p-4"
      >
        <Pressable className="flex-1 sm:hidden" onPress={onClose} />
        <View className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 w-full max-w-lg self-center max-h-[90%] shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="px-6 pt-6 pb-3 border-b border-slate-100 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              {badge ? (
                <Text className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  {badge}
                </Text>
              ) : null}
              <Text className="text-lg font-bold text-slate-900">{title}</Text>
              {subtitle ? (
                <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="flex-row items-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-xl"
              activeOpacity={0.7}
            >
              <X size={14} color="#64748B" />
              <Text className="text-xs font-semibold text-slate-600">
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            className="px-6 py-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
            <View className="h-6" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
