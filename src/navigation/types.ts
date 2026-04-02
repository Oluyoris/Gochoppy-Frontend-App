// src/types/navigation.ts
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ── Customer ────────────────────────────────────────────────
export type CustomerTabParamList = {
  Home: undefined;
  Categories: undefined;
  Activities: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  Cart: undefined;
  Notifications: undefined;
  ItemDetail: { itemId: number };
  Checkout: undefined;
  OrderSuccess: { 
    orderId: number; 
    deliveryCode: string; 
    grandTotal: string; 
    address: string 
  };
  OrderTracking: { orderId: number };
  OrderDetails: { orderId: number };
  VendorsByCategory: { category: string };
  VendorItems: { vendorId: number; vendorName: string };
};

export type CustomerNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

// ── Vendor ──────────────────────────────────────────────────

// 1. Bottom tabs (the main vendor screens at the bottom)
export type VendorTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  'Menu Requests': undefined;
  Wallet: undefined;
  Profile: undefined;
};

// 2. Stack screens that can be pushed on top of the tabs
export type VendorStackParamList = {
  VendorTabs: undefined;                           // ← entry point for tabs
  VendorOrderDetails: { orderId: number | string }; // ← this was missing
  // You can add more stack screens later, e.g.:
  // MenuRequestDetail: { requestId: number };
  // VendorSettings: undefined;
};

// 3. Combined navigation prop — allows navigating to tabs AND stack screens
export type VendorNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<VendorTabParamList>,
  NativeStackNavigationProp<VendorStackParamList>
>;

// ── Dispatcher ──────────────────────────────────────────────
export type DispatcherTabParamList = {
  Dashboard: undefined;
  Pickups: undefined;
  Trips: undefined;
  Wallet: undefined;
};

export type DispatcherNavigationProp = BottomTabNavigationProp<DispatcherTabParamList>;