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
  border: '#C8EDEA',
  borderLight: '#E5F5F3',
};

export default function Pickups() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dispatch/pickups');
      setOrders(res.data.orders || []);
    } catch (error) {
      console.log('Pickups fetch error:', error);
      Alert.alert('Error', 'Failed to load pickups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPickups();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => (navigation as any).navigate('PickupDetails', { orderId: item.id })}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube-outline" size={22} color={C.tealDeep} />
        </View>
        <View>
          <Text style={styles.orderNumber}>Order #{item.order_number}</Text>
          <Text style={styles.vendor}>{item.vendor?.name || 'Vendor'}</Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString('en-NG')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={C.tealMid} style={styles.center} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.tealDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Pickups</Text>
        <TouchableOpacity onPress={fetchPickups}>
          <Ionicons name="refresh" size={22} color={C.tealDeep} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={60} color={C.tealLight} />
            <Text style={styles.emptyText}>No pickups available right now</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
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
  list: { padding: 12 },
  orderCard: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumber: { fontSize: 15, fontWeight: '700', color: C.tealDeep },
  vendor: { fontSize: 13, color: C.inkLight, marginTop: 2 },
  time: { fontSize: 11, color: '#999', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: C.inkLight, marginTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});