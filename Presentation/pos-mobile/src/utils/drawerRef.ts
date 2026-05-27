import { DrawerNavigationProp } from "@react-navigation/drawer";
import { ParamListBase } from "@react-navigation/native";
import { createRef, RefObject } from "react";

export interface NavigationBridge {
  dispatch: DrawerNavigationProp<ParamListBase>["dispatch"];
  navigate: (name: string, params?: object) => void;
  closeDrawer: () => void;
}

export const drawerNavigationRef: RefObject<NavigationBridge | null> =
  createRef<NavigationBridge | null>();

export const setDrawerNavigation = (nav: NavigationBridge | null): void => {
  type Writeable<T> = { -readonly [P in keyof T]: T[P] };
  (drawerNavigationRef as Writeable<typeof drawerNavigationRef>).current = nav;
};
