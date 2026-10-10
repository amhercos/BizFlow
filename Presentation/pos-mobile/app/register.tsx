import { authService } from "@/src/services/authService";
import { RegisterRequest } from "@/src/types/auth";
import { router } from "expo-router";
import {
  Briefcase,
  Check,
  ChevronLeft,
  Lock,
  LucideIcon,
  Mail,
  MapPin,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

interface RegisterInputProps {
  readonly icon: LucideIcon;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly secure?: boolean;
}

const RegisterInput = ({
  icon: Icon,
  placeholder,
  value,
  onChange,
  secure = false,
}: RegisterInputProps): ReactElement => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <View className="mb-4">
      <View
        className={`flex-row items-center h-18 px-6 rounded-3xl border-2 bg-slate-50 ${
          isFocused ? "border-blue-600 bg-white" : "border-transparent"
        }`}
      >
        <Icon
          size={22}
          color={isFocused ? "#2563eb" : "#94a3b8"}
          strokeWidth={2.5}
        />
        <TextInput
          className="flex-1 ml-4 text-slate-900 text-lg font-bold"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={secure}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

export default function RegisterScreen(): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [termsModalVisible, setTermsModalVisible] = useState<boolean>(false);

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    location: "",
  });

  const handleInputChange = useCallback(
    (key: keyof RegisterRequest, value: string): void => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, []);

  const handleRegister = async (): Promise<void> => {
    if (!acceptedTerms) {
      Alert.alert("Terms & Conditions", "Please accept the Terms and Conditions to proceed.");
      return;
    }

    if (Object.values(formData).some((val) => !val.trim())) {
      Alert.alert("Incomplete", "Please provide all merchant profile details.");
      return;
    }
    setIsLoading(true);
    try {
      await authService.register(formData);
      Alert.alert("Success", "Merchant account established.", [
        { text: "Login", onPress: () => router.replace("/") },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Registration failed.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1 px-8"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            layout={LinearTransition.springify().damping(15)}
            className="flex-1 py-14"
          >
            <TouchableOpacity
              onPress={handleBack}
              className="mb-10 w-14 h-14 bg-slate-50 rounded-[22px] items-center justify-center"
            >
              <ChevronLeft size={28} color="#0f172a" strokeWidth={3} />
            </TouchableOpacity>

            <View className="mb-10">
              <Text className="text-6xl font-black text-slate-950 tracking-tighter">
                Join.
              </Text>
              <Text className="text-slate-800 mt-2 text-2xl font-bold tracking-tight">
                Create your merchant identity.
              </Text>
            </View>

            <View>
              <RegisterInput
                icon={User}
                placeholder="Enter Full Name"
                value={formData.fullName}
                onChange={(t) => handleInputChange("fullName", t)}
              />
              <RegisterInput
                icon={Mail}
                placeholder="Account Email Address"
                value={formData.email}
                onChange={(t) => handleInputChange("email", t)}
              />
              <RegisterInput
                icon={Lock}
                placeholder="Secure Password"
                secure
                value={formData.password}
                onChange={(t) => handleInputChange("password", t)}
              />
              <RegisterInput
                icon={Briefcase}
                placeholder="Registered Business Name"
                value={formData.businessName}
                onChange={(t) => handleInputChange("businessName", t)}
              />
              <RegisterInput
                icon={MapPin}
                placeholder="Primary Store Location"
                value={formData.location}
                onChange={(t) => handleInputChange("location", t)}
              />
            </View>

            {/* Terms and Conditions Checkbox */}
            <View className="flex-row items-center my-4 px-1">
              <TouchableOpacity
                onPress={() => setAcceptedTerms((prev) => !prev)}
                activeOpacity={0.8}
                className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                  acceptedTerms ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                }`}
              >
                {acceptedTerms && <Check size={16} color="white" strokeWidth={3} />}
              </TouchableOpacity>
              <View className="flex-1 flex-row flex-wrap items-center">
                <Text className="text-slate-600 text-base font-medium">I agree to the </Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                  <Text className="text-blue-600 text-base font-bold underline">
                    Terms and Conditions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                void handleRegister();
              }}
              disabled={isLoading || !acceptedTerms}
              activeOpacity={0.85}
              className={`h-16 rounded-[24px] justify-center items-center mt-4 shadow-2xl ${
                isLoading || !acceptedTerms ? "bg-slate-300 opacity-60" : "bg-slate-950 shadow-blue-200"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black text-xl">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[80%] p-6">
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
              <Text className="text-2xl font-bold text-slate-950">
                Terms and Conditions
              </Text>
              <TouchableOpacity
                onPress={() => setTermsModalVisible(false)}
                className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={20} color="#0f172a" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView className="my-4" showsVerticalScrollIndicator={false}>
              <Text className="text-slate-700 text-base leading-6 mb-4">
                By using BizFlow, the user agrees to use the application only for its intended purpose of managing inventory, credits, sales, and other store-related records. Users are responsible for entering correct and accurate information into the system.
              </Text>
              <Text className="text-slate-700 text-base leading-6 mb-4">
                BizFlow should not be used for illegal activities or in any way that may damage, misuse, or disrupt the application. The system may be updated or improved when necessary to provide better performance and additional features.
              </Text>
              <Text className="text-slate-700 text-base leading-6 mb-4">
                Users are also responsible for keeping their account information and password secure. Any records entered into the application should be reviewed carefully to avoid incorrect business information.
              </Text>
              <Text className="text-slate-700 text-base leading-6 font-semibold">
                By continuing to use BizFlow, the user accepts these terms and conditions.
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setAcceptedTerms(true);
                setTermsModalVisible(false);
              }}
              className="bg-blue-600 h-14 rounded-2xl items-center justify-center mt-2"
            >
              <Text className="text-white font-bold text-base">Accept & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}