import { authService } from "@/src/services/authService";
import { RegisterRequest } from "@/src/types/auth";
import { router } from "expo-router";
import {
  Briefcase,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
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
  KeyboardTypeOptions,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

type FieldKey = keyof RegisterRequest;
type FieldErrors = Partial<Record<FieldKey, string>>;

const FIELD_KEYS: FieldKey[] = [
  "fullName",
  "email",
  "password",
  "businessName",
  "location",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form: RegisterRequest): FieldErrors {
  const errors: FieldErrors = {};
  if (form.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name (at least 2 characters).";
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email, like name@example.com.";
  }
  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (form.businessName.trim().length < 2) {
    errors.businessName = "Enter your business name (at least 2 characters).";
  }
  if (form.location.trim().length < 2) {
    errors.location = "Enter your store's city or address.";
  }
  return errors;
}

interface ServerProblem {
  message: string;
  field?: FieldKey;
}

/** Turns whatever the API/network threw into a readable message and the field it belongs to. */
function parseServerProblem(error: unknown): ServerProblem {
  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: { message?: string; title?: string; field?: string };
    };
  };
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status && status >= 500) {
    return {
      message:
        "Our server had a problem creating your account (error " +
        status +
        "). Please try again in a moment.",
    };
  }
  if (!err?.response && err?.message?.toLowerCase().includes("network")) {
    return {
      message: "Can't reach the server. Check your internet connection and try again.",
    };
  }

  let message =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.title === "string" && data.title) ||
    (error instanceof Error ? error.message : "") ||
    "Registration failed. Please check your details and try again.";

  if (/^request failed with status code/i.test(message)) {
    message = "Registration failed. Please check your details and try again.";
  }

  let field: FieldKey | undefined = FIELD_KEYS.find((key) => key === data?.field);
  if (!field) {
    const lower = message.toLowerCase();
    if (lower.includes("email")) field = "email";
    else if (lower.includes("password")) field = "password";
    else if (lower.includes("business")) field = "businessName";
  }
  return { message, field };
}

interface RegisterInputProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly placeholder: string;
  readonly hint: string;
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly onBlur?: () => void;
  readonly error?: string;
  readonly secure?: boolean;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

const RegisterInput = ({
  icon: Icon,
  label,
  placeholder,
  hint,
  value,
  onChange,
  onBlur,
  error,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "none",
}: RegisterInputProps): ReactElement => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<boolean>(false);

  const borderClass = error
    ? "border-red-500 bg-red-50"
    : isFocused
      ? "border-blue-600 bg-white"
      : "border-transparent bg-slate-50";

  return (
    <View className="mb-4">
      <Text className="text-slate-700 text-sm font-bold mb-1.5 ml-2">
        {label}
      </Text>
      <View
        className={`flex-row items-center h-18 px-6 rounded-3xl border-2 ${borderClass}`}
      >
        <Icon
          size={22}
          color={error ? "#dc2626" : isFocused ? "#2563eb" : "#94a3b8"}
          strokeWidth={2.5}
        />
        <TextInput
          className="flex-1 ml-4 text-slate-900 text-lg font-bold"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          value={value}
          onChangeText={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={10}
          >
            {revealed ? (
              <EyeOff size={20} color="#94a3b8" />
            ) : (
              <Eye size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text className="text-red-600 text-sm font-semibold mt-1.5 ml-2">
          {error}
        </Text>
      ) : (
        <Text className="text-slate-500 text-xs mt-1.5 ml-2">{hint}</Text>
      )}
    </View>
  );
};

export default function RegisterScreen(): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [termsModalVisible, setTermsModalVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>("");

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    location: "",
  });

  const handleInputChange = useCallback(
    (key: FieldKey, value: string): void => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
      setFormError("");
    },
    [],
  );

  const handleFieldBlur = (key: FieldKey): void => {
    if (!formData[key]) return;
    setErrors((prev) => ({ ...prev, [key]: validate(formData)[key] }));
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, []);

  const handleRegister = async (): Promise<void> => {
    if (!acceptedTerms) {
      Alert.alert(
        "Terms & Conditions",
        "Please accept the Terms and Conditions to proceed.",
      );
      return;
    }

    const found = validate(formData);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setFormError("");
    setIsLoading(true);
    try {
      await authService.register({
        ...formData,
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        businessName: formData.businessName.trim(),
        location: formData.location.trim(),
      });
      Alert.alert("Success", "Merchant account established.", [
        { text: "Login", onPress: () => router.replace("/") },
      ]);
    } catch (error: unknown) {
      const problem = parseServerProblem(error);
      setFormError(problem.message);
      if (problem.field) {
        setErrors((prev) => ({ ...prev, [problem.field as FieldKey]: problem.message }));
      }
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

            <View className="mb-8">
              <Text className="text-6xl font-black text-slate-950 tracking-tighter">
                Join.
              </Text>
              <Text className="text-slate-800 mt-2 text-2xl font-bold tracking-tight">
                Create your merchant identity.
              </Text>
            </View>

            {formError ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                <Text className="text-red-700 text-sm font-semibold">
                  {formError}
                </Text>
              </View>
            ) : null}

            <View>
              <RegisterInput
                icon={User}
                label="Full name"
                placeholder="e.g. Juan Dela Cruz"
                hint="Your name as the store owner."
                autoCapitalize="words"
                value={formData.fullName}
                error={errors.fullName}
                onBlur={() => handleFieldBlur("fullName")}
                onChange={(t) => handleInputChange("fullName", t)}
              />
              <RegisterInput
                icon={Mail}
                label="Email"
                placeholder="name@example.com"
                hint="You will log in with this email. It must not be registered yet."
                keyboardType="email-address"
                value={formData.email}
                error={errors.email}
                onBlur={() => handleFieldBlur("email")}
                onChange={(t) => handleInputChange("email", t)}
              />
              <RegisterInput
                icon={Lock}
                label="Password"
                placeholder="Create a password"
                hint="At least 6 characters. Mixing upper and lower case letters, a number and a symbol is safest."
                secure
                value={formData.password}
                error={errors.password}
                onBlur={() => handleFieldBlur("password")}
                onChange={(t) => handleInputChange("password", t)}
              />
              <RegisterInput
                icon={Briefcase}
                label="Business name"
                placeholder="e.g. Aling Nena's Store"
                hint="Must be unique. This becomes your store's name."
                autoCapitalize="words"
                value={formData.businessName}
                error={errors.businessName}
                onBlur={() => handleFieldBlur("businessName")}
                onChange={(t) => handleInputChange("businessName", t)}
              />
              <RegisterInput
                icon={MapPin}
                label="Store location"
                placeholder="e.g. Taguig City"
                hint="City or street address of your main store."
                autoCapitalize="words"
                value={formData.location}
                error={errors.location}
                onBlur={() => handleFieldBlur("location")}
                onChange={(t) => handleInputChange("location", t)}
              />
            </View>

            {/* Terms and Conditions Checkbox */}
            <View className="flex-row items-center my-4 px-1">
              <TouchableOpacity
                onPress={() => setAcceptedTerms((prev) => !prev)}
                activeOpacity={0.8}
                className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                  acceptedTerms
                    ? "bg-blue-600 border-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {acceptedTerms && (
                  <Check size={16} color="white" strokeWidth={3} />
                )}
              </TouchableOpacity>
              <View className="flex-1 flex-row flex-wrap items-center">
                <Text className="text-slate-600 text-base font-medium">
                  I agree to the{" "}
                </Text>
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
                isLoading || !acceptedTerms
                  ? "bg-slate-300 opacity-60"
                  : "bg-slate-950 shadow-blue-200"
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
              <Text className="text-white font-bold text-base">
                Accept & Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}