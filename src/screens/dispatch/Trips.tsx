import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';

const C = {
  bg: '#EAF6F4',
  surface: '#FFFFFF',
  tealDeep: '#0D6E63',
  tealMid: '#17A898',
  tealLight: '#C8EDEA',
  tealGlow: '#E2F7F5',
  ink: '#0A2724',
  inkLight: '#7AA8A3',
  amber: '#E8821A',
  green: '#1A9060',
  border: '#C8EDEA',
  borderLight: '#E5F5F3',
};

export default function Trips() {
  const navigation = useNavigation();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'processing' | 'completed'>('processing');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dispatch/trips');
      setTrips(res.data.trips || []);
    } catch (error) {
      console.log('Trips fetch error:', error);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  // Filter trips
  const processingTrips = trips.filter(t => ['picked_up', 'enroute'].includes(t.status));
  const completedTrips = trips.filter(t => t.status === 'delivered');

  const displayedTrips = activeTab === 'processing' ? processingTrips : completedTrips;

  const renderTrip = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('PickupDetails', { orderId: item.id })}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="bicycle-outline" size={24} color={C.tealDeep} />
        </View>
        <View>
          <Text style={styles.orderNum}>#{item.order_number}</Text>
          <Text style={styles.vendor}>{item.vendor?.name || 'Vendor'}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.tealDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity onPress={fetchTrips}>
          <Ionicons name="refresh" size={22} color={C.tealDeep} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'processing' && styles.tabActive]}
          onPress={() => setActiveTab('processing')}
        >
          <Text style={[styles.tabText, activeTab === 'processing' && styles.tabTextActive]}>
            Processing ({processingTrips.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed ({completedTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && displayedTrips.length === 0 ? (
        <ActivityIndicator size="large" color={C.tealMid} style={styles.center} />
      ) : (
        <FlatList
          data={displayedTrips}
          renderItem={renderTrip}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={60} color={C.tealLight} />
              <Text style={styles.emptyText}>
                {activeTab === 'processing' ? 'No active trips' : 'No completed trips yet'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.tealDeep },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: { backgroundColor: C.tealGlow },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: C.tealDeep, fontWeight: '700' },
  list: { padding: 12 },
  tripCard: {
    backgroundColor: C.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNum: { fontSize: 15, fontWeight: '700', color: C.tealDeep },
  vendor: { fontSize: 13, color: C.inkLight, marginTop: 2 },
  date: { fontSize: 11, color: '#999', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: C.inkLight, marginTop: 16, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});