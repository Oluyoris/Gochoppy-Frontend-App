import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { DevSettings } from 'react-native';

type DispatchNavigationProp = NavigationProp<{
  Pickups: undefined;
  Trips: undefined;
  DispatchProfile: undefined;
}>;

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const C = {
  bg: '#EAF6F4',
  surface: '#FFFFFF',
  tealDeep: '#0D6E63',
  tealMid: '#17A898',
  tealLight: '#C8EDEA',
  tealGlow: '#E2F7F5',
  ink: '#0A2724',
  inkMid: '#2D5550',
  inkLight: '#7AA8A3',
  amber: '#E8821A',
  amberLight: '#FEF0E0',
  green: '#1A9060',
  greenLight: '#E2F5EC',
  border: '#C8EDEA',
  borderLight: '#E5F5F3',
  white: '#FFFFFF',
  cardShadow: '#0A2724',
};

export default function DispatchDashboard() {
  const navigation = useNavigation<DispatchNavigationProp>();

  const [dispatcherName, setDispatcherName] = useState('Dispatcher');
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingPickups, setPendingPickups] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const profileRes = await api.get('/profile');
      setDispatcherName(profileRes.data.user?.name || 'Dispatcher');

      const dashboardRes = await api.get('/dispatch/dashboard');
      const data = dashboardRes.data.dashboard || {};

      setTotalDeliveries(data.total_deliveries || 0);
      setTodayDeliveries(data.today_deliveries || 0);
      setWalletBalance(data.wallet_balance || 0);
      setPendingPickups(data.pending_pickups || 0);
    } catch (error: any) {
      console.log('Dispatch dashboard error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['userToken', 'userRole']);
            DevSettings.reload();
          } catch (error) {
            Alert.alert('Error', 'Could not log out');
          }
        },
      },
    ]);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = dispatcherName.split(' ')[0] || 'Rider';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.dispatcherName}>{firstName}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={18} color={C.tealDeep} />
          </TouchableOpacity>

          {/* Hamburger Menu - FIXED to match Vendor style */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() =>
              Alert.alert('Menu', '', [
                {
                  text: 'My Profile',
                  onPress: () => navigation.getParent()?.navigate('DispatchProfile')   // ← This is how Vendor does it
                },
                { 
                  text: 'Logout', 
                  onPress: handleLogout, 
                  style: 'destructive' 
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <Ionicons name="menu" size={18} color={C.tealDeep} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
      >
        {/* Wallet Balance Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardDecor} />
          <View style={styles.heroCardDecor2} />
          <Text style={styles.heroLabel}>WALLET BALANCE</Text>
          <Text style={styles.heroAmount}>₦{walletBalance.toLocaleString()}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="wallet-outline" size={12} color={C.tealLight} />
              <Text style={styles.heroBadgeText}>Available funds</Text>
            </View>
          </View>
        </View>

        {/* Delivery Stats */}
        <Text style={styles.sectionLabel}>DELIVERY OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardTeal]}>
            <View style={styles.statIconWrap}>
              <Ionicons name="checkmark-done-outline" size={16} color={C.tealMid} />
            </View>
            <Text style={styles.statValue}>{totalDeliveries.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>

          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={[styles.statIconWrap, { backgroundColor: C.greenLight }]}>
              <Ionicons name="today-outline" size={16} color={C.green} />
            </View>
            <Text style={[styles.statValue, { color: C.green }]}>{todayDeliveries.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Deliveries</Text>
          </View>
        </View>

        {/* Pending Pickups */}
        <Text style={styles.sectionLabel}>CURRENT TASKS</Text>
        <TouchableOpacity
          style={styles.pickupCard}
          onPress={() => navigation.navigate('Pickups')}
          activeOpacity={0.8}
        >
          <View style={styles.pickupLeft}>
            <View style={styles.pickupIconWrap}>
              <Ionicons name="location-outline" size={20} color={C.white} />
            </View>
            <View>
              <Text style={styles.pickupTitle}>Packages to Pick Up</Text>
              <Text style={styles.pickupSub}>Tap to view & accept</Text>
            </View>
          </View>
          <View style={styles.pickupRight}>
            <View style={styles.pickupBadge}>
              <Text style={styles.pickupBadgeNum}>{pendingPickups}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.inkLight} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Pickups')}
          >
            <View style={[styles.actionIcon, { backgroundColor: C.tealGlow }]}>
              <Ionicons name="location-outline" size={20} color={C.tealDeep} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionLabel}>Pickups</Text>
              <Text style={styles.actionSub}>Accept ready orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.inkLight} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Trips')}
          >
            <View style={[styles.actionIcon, { backgroundColor: C.amberLight }]}>
              <Ionicons name="car-outline" size={20} color={C.amber} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionLabel}>My Trips</Text>
              <Text style={styles.actionSub}>Ongoing deliveries</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.inkLight} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          {/* Profile Button - Matching Vendor Style */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.getParent()?.navigate('DispatchProfile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: C.tealGlow }]}>
              <Ionicons name="person-outline" size={20} color={C.tealDeep} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionLabel}>My Profile</Text>
              <Text style={styles.actionSub}>View and edit your profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.inkLight} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FDECEC' }]}>
              <Ionicons name="log-out-outline" size={20} color="#D93030" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionLabel, { color: '#D93030' }]}>Logout</Text>
              <Text style={styles.actionSub}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EFA8A8" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: C.inkLight, fontWeight: '500' },

  header: {
    backgroundColor: C.tealDeep,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 10,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { gap: 1 },
  greeting: { fontSize: 11, color: C.tealLight, fontWeight: '600', letterSpacing: 0.3 },
  dispatcherName: { fontSize: 20, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 120 },

  heroCard: {
    backgroundColor: C.tealMid,
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardDecor: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: -30,
  },
  heroCardDecor2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
  },
  heroLabel: { fontSize: 10, fontWeight: '700', color: C.tealLight, letterSpacing: 1.8, marginBottom: 6 },
  heroAmount: { fontSize: 34, fontWeight: '900', color: C.white, letterSpacing: -1, marginBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 11, color: C.tealLight, fontWeight: '600' },

  sectionLabel: { fontSize: 9, fontWeight: '800', color: C.inkLight, letterSpacing: 2, marginTop: 4, marginBottom: 10, marginLeft: 2 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  statCardTeal: { borderColor: C.border },
  statCardGreen: { borderColor: C.greenLight },
  statIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.tealGlow, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: C.tealDeep, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: C.inkLight, fontWeight: '500' },

  pickupCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18,
  },
  pickupLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickupIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.tealDeep, justifyContent: 'center', alignItems: 'center' },
  pickupTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  pickupSub: { fontSize: 11, color: C.inkLight, marginTop: 2, fontWeight: '500' },
  pickupRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickupBadge: {
    backgroundColor: C.amber,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  pickupBadgeNum: { fontSize: 12, fontWeight: '900', color: C.white },

  actionsCol: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    overflow: 'hidden',
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  actionDivider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  actionTextWrap: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 2 },
  actionSub: { fontSize: 11, color: C.inkLight, fontWeight: '500' },
});