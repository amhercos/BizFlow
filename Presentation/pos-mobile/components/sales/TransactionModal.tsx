import { type CustomerCredit } from "@/src/types/credit";
import type { AppliedPromoLine } from "@/src/types/promotion";
import { PaymentType, UnitType, type BasketItem } from "@/src/types/sale";
import React, { Dispatch, SetStateAction } from "react";
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { TransactionContent } from "./TransactionContent";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  basket: BasketItem[];
  activePayment: PaymentType;
  setActivePayment: (p: PaymentType) => void;
  cashReceived: number;
  setCashReceived: Dispatch<SetStateAction<number>>;
  isSubmitting: boolean;
  handleCheckout: () => void;
  updateQuantity: (
    productId: string,
    unitType: UnitType,
    nextQty: number,
  ) => void;
  removeItem: (productId: string, unitType: UnitType) => void;
  clearBasket: () => void;
  credits: CustomerCredit[];
  selectedCreditId: string;
  setSelectedCreditId: (s: string) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (b: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (s: string) => void;
  newCustomerContact: string;
  setNewCustomerContact: (s: string) => void;
  totals: {
    originalTotal: number;
    cashTotal: number;
    creditTotal: number;
    savings: number;
    promotionsApplied: AppliedPromoLine[];
  };
}

export const TransactionModal: React.FC<TransactionModalProps> = (props) => {
  const { width, height } = useWindowDimensions();
  const isLandscapeOrTablet = width > height || width >= 768;

  return (
    <Modal
      visible={props.isOpen}
      animationType="slide"
      presentationStyle={isLandscapeOrTablet ? "overFullScreen" : "pageSheet"}
      onRequestClose={props.onClose}
      supportedOrientations={["portrait", "landscape"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <TransactionContent
          {...props}
          isTablet={isLandscapeOrTablet}
          onClose={props.onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
});
