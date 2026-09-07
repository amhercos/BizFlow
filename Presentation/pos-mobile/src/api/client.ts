import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { router } from "expo-router";
import { showToast } from "../utils/toast";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const HEALTH_URL = process.env.EXPO_PUBLIC_HEALTH_URL;

const TOKEN_KEY = "bizflow_token";
const USER_KEY = "bizflow_user";

if (!BASE_URL) {
  console.warn("[System] EXPO_PUBLIC_API_URL is not defined in .env");
}

let isRedirecting = false;

interface BackendErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface BizFlowRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const pingHealthCheck = async (): Promise<void> => {
  if (!HEALTH_URL) return;

  try {
    console.log(`[System] Pinging health check at: ${HEALTH_URL}`);
    await axios.get(HEALTH_URL, {
      timeout: 15000,
    });
  } catch {
    console.log("[System] Health check ping finished.");
  }
};

apiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError<BackendErrorResponse>): Promise<AxiosResponse> => {
    const config = error.config as BizFlowRequestConfig | undefined;
    const status = error.response?.status;
    const errorData = error.response?.data;

    const isNetworkError =
      error.code === "ECONNABORTED" ||
      error.message === "Network Error" ||
      !error.response;

    const MAX_RETRIES = 3;

    // Network Retries Logic
    if (isNetworkError && config && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      const delay = (config._retryCount ?? 1) * 2000;

      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log(
        `Connection weak. Retrying... (Attempt ${config._retryCount})`,
      );

      return apiClient(config);
    }

    const isHealthCheck = config?.url === HEALTH_URL;

    // Persistent Network Failures
    if (isNetworkError && !isHealthCheck) {
      showToast.error(
        "Connection Error",
        "Check your internet connection or backend status.",
      );
    }

    // 401 Unauthorized Logic
    if (status === 401 && !config?.url?.toLowerCase().includes("/auth/")) {
      if (!isRedirecting) {
        isRedirecting = true;
        showToast.error("Session Expired", "Please sign in again.");

        await Promise.all([
          AsyncStorage.removeItem(TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
        ]).catch(() => null);

        router.replace("/");

        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
      return Promise.reject(new Error("Session expired."));
    }

    // 400/500 Errors with Backend Messages
    if (status && status >= 400 && !isHealthCheck) {
      const errorMessage =
        errorData?.message || "An unexpected error occurred.";
      showToast.error(`Error ${status}`, errorMessage);
    }

    return Promise.reject(error);
  },
);
