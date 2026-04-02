// src/navigation/AppNavigator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

// Customer Screens
import CustomerHome from '../screens/customer/CustomerHome';
import Categories from '../screens/customer/Categories';
import Activities from '../screens/customer/Activities';
import CustomerProfile from '../screens/customer/CustomerProfile';
import Cart from '../screens/customer/Cart';
import Notifications from '../screens/customer/Notifications';
import ItemDetail from '../screens/customer/ItemDetail';
import Checkout from '../screens/customer/Checkout';
import OrderSuccess from '../screens/customer/OrderSuccess';
import OrderTracking from '../screens/customer/OrderTracking';
import OrderDetails from '../screens/customer/OrderDetails';
import VendorsByCategory from '../screens/customer/VendorsByCategory';
import VendorItems from '@/screens/customer/VendorItems';
import AddFunds from '../screens/customer/AddFunds';
import CustomerWallet from '../screens/customer/CustomerWallet';
import CustomerCoupon from '@/screens/customer/CustomerCoupon';

// Vendor Screens
import VendorDashboard from '../screens/vendor/VendorDashboard';
import VendorOrders from '../screens/vendor/VendorOrders';
import VendorOrderDetails from '../screens/vendor/VendorOrderDetails';
import VendorProfile from '../screens/vendor/VendorProfile';
import MenuRequests from '../screens/vendor/MenuRequests';
import VendorWallet from '../screens/vendor/VendorWallet';

// Dispatcher Screens
import DispatchDashboard from '../screens/dispatch/DispatchDashboard';
import Pickups from '../screens/dispatch/Pickups';
import Trips from '../screens/dispatch/Trips';
import DispatchWallet from '../screens/dispatch/DispatchWallet';
import PickupDetails from '../screens/dispatch/PickupDetails';
import DispatchProfile from '@/screens/dispatch/DispatchProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PILL_H = 60;
const PILL_W = 290;

type TabMeta = {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
};

const CUSTOMER_TABS: TabMeta[] = [
  { name: 'Home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { name: 'Categories', label: 'Categories', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  { name: 'Activities', label: 'History', activeIcon: 'time', inactiveIcon: 'time-outline' },
];

function AnimatedTabItem({
  meta,
  focused,
  onPress,
}: {
  meta: TabMeta;
  focused: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 5,
    }).start();
  }, [focused]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tabItem}>
      <Animated.View style={[styles.tabItemInner, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={focused ? meta.activeIcon : meta.inactiveIcon}
          size={22}
          color={focused ? '#FF6200' : '#AAAAAA'}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: focused ? '#FF6200' : '#AAAAAA', fontWeight: focused ? '800' : '700' },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors: themeColors } = useTheme();

  return (
    <View style={styles.tabBarOuter} pointerEvents="box-none">
      <View style={[styles.pill, { backgroundColor: themeColors.surface }]}>
        {CUSTOMER_TABS.map((meta, index) => {
          const focused = state.index === index;
          return (
            <AnimatedTabItem
              key={meta.name}
              meta={meta}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[index].key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(state.routes[index].name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// Shared vendor/dispatcher tab options (dynamic background)
const getVendorTabStyle = (themeColors: any) => ({
  position: 'absolute' as const,
  bottom: Platform.OS === 'ios' ? 28 : 18,
  left: 0,
  right: 0,
  marginHorizontal: 20,
  backgroundColor: themeColors.surface,
  borderRadius: 30,
  height: PILL_H,
  borderTopWidth: 0,
  elevation: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 16,
  overflow: 'hidden' as const,
});

function VTabIcon({ name, focused, label }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; label: string }) {
  return (
    <View style={styles.tabItemInner}>
      <Ionicons name={name} size={22} color={focused ? '#FF6200' : '#AAAAAA'} />
      <Text
        style={[styles.tabLabel, { color: focused ? '#FF6200' : '#AAAAAA', fontWeight: focused ? '800' : '700' }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

// ====================== CUSTOMER ======================
function CustomerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomerTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={CustomerHome} />
      <Tab.Screen name="Categories" component={Categories} />
      <Tab.Screen name="Activities" component={Activities} />
    </Tab.Navigator>
  );
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="ItemDetail" component={ItemDetail} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="VendorsByCategory" component={VendorsByCategory} />
      <Stack.Screen name="VendorItems" component={VendorItems} />
      <Stack.Screen name="AddFunds" component={AddFunds} />
      <Stack.Screen name="CustomerCoupon" component={CustomerCoupon} />
      <Stack.Screen name="CustomerWallet" component={CustomerWallet} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfile} />
    </Stack.Navigator>
  );
}

// ====================== VENDOR ======================
function VendorTabs() {
  const { colors: themeColors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: getVendorTabStyle(themeColors),
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={VendorDashboard}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'speedometer' : 'speedometer-outline'} focused={focused} label="Dashboard" /> }}
      />
      <Tab.Screen
        name="Orders"
        component={VendorOrders}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'cart' : 'cart-outline'} focused={focused} label="Orders" /> }}
      />
      <Tab.Screen
        name="Menu Requests"
        component={MenuRequests}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'restaurant' : 'restaurant-outline'} focused={focused} label="Menu" /> }}
      />
      <Tab.Screen
        name="Wallet"
        component={VendorWallet}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} label="Wallet" /> }}
      />
    </Tab.Navigator>
  );
}

function VendorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
      <Stack.Screen name="VendorOrderDetails" component={VendorOrderDetails} />
      <Stack.Screen name="VendorProfile" component={VendorProfile} />
    </Stack.Navigator>
  );
}

// ====================== DISPATCHER ======================
function DispatcherTabs() {
  const { colors: themeColors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: getVendorTabStyle(themeColors),
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DispatchDashboard}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'speedometer' : 'speedometer-outline'} focused={focused} label="Dashboard" /> }}
      />
      <Tab.Screen
        name="Pickups"
        component={Pickups}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'location' : 'location-outline'} focused={focused} label="Pickups" /> }}
      />
      <Tab.Screen
        name="Trips"
        component={Trips}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'car' : 'car-outline'} focused={focused} label="Trips" /> }}
      />
      <Tab.Screen
        name="Wallet"
        component={DispatchWallet}
        options={{ tabBarIcon: ({ focused }) => <VTabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} label="Wallet" /> }}
      />
    </Tab.Navigator>
  );
}

function DispatcherStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DispatcherTabs" component={DispatcherTabs} />
      <Stack.Screen name="PickupDetails" component={PickupDetails} />
      <Stack.Screen name="DispatchProfile" component={DispatchProfile} />
    </Stack.Navigator>
  );
}

// ====================== MAIN APP NAVIGATOR ======================
export default function AppNavigator() {
  const [role, setRole] = useState<string | null>(null);
  const { colors: themeColors } = useTheme();

  useEffect(() => {
    const loadRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem('userRole');
        setRole(userRole);
      } catch (error) {
        console.error('Error loading role:', error);
      }
    };
    loadRole();
  }, []);

  if (!role) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border || '#334155' }]}>
          <ActivityIndicator size="large" color="#FF6200" />
          <Text style={[styles.loadingText, { color: themeColors.textPrimary }]}>
            Loading your dashboard...
          </Text>
        </View>
      </View>
    );
  }

  if (role === 'customer') return <CustomerStack />;
  if (role === 'vendor') return <VendorStack />;
  if (role === 'dispatcher') return <DispatcherStack />;

  return <CustomerStack />;
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    height: PILL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 44,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});