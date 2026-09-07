import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useMemo } from "react";
import type { TextStyle } from "react-native";

export type AppFonts = {
  regular?: string;
  medium?: string;
  semibold?: string;
  bold?: string;
};

export function typeface(
  family: string | undefined,
  fallbackWeight: TextStyle["fontWeight"],
): TextStyle {
  return family ? { fontFamily: family } : { fontWeight: fallbackWeight };
}

export function useInter(): AppFonts {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return useMemo(
    () =>
      loaded
        ? {
            regular: "Inter_400Regular",
            medium: "Inter_500Medium",
            semibold: "Inter_600SemiBold",
            bold: "Inter_700Bold",
          }
        : {},
    [loaded],
  );
}
