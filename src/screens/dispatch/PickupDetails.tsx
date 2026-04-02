import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useRoute, useNavigation } from '@react-navigation/native';

const C = {
  bg: '#EAF6F4',
  surface: '#FFFFFF',
  tealDeep: '#0D6E63',
  tealMid: '#17A898',
  tealLight: '#C8EDEA',
  tealGlow: '#E2F7F5',
  ink: '#0A2724',
  inkLight: '#7AA8A3',
  green: '#1A9060',
  greenLight: '#E2F5EC',
  amber: '#E8821A',
  amberLight: '#FEF0E0',
  border: '#C8EDEA',
  borderLight: '#E5F5F3',
  blue: '#2672C8',
  blueLight: '#E5F0FC',
};

export default function PickupDetails() {
  const route = useRoute<any>();
  const { orderId } = route.params;
  const navigation = useNavigation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dispatch/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.alert('Accept Pickup', `Accept Order #${order?.order_number}?`, [
      { text: 'Cancel' },
      { text: 'Yes, Accept', onPress: async () => {
        try {
          setUpdating(true);
          await api.patch(`/dispatch/pickups/${orderId}/accept`);
          await fetchOrder();
          Alert.alert('Success', 'Pickup accepted!');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to accept');
        } finally {
          setUpdating(false);
        }
      }}
    ]);
  };

  const handleEnroute = async () => {
    Alert.alert('Mark Enroute', `Mark Order #${order?.order_number} as enroute?`, [
      { text: 'Cancel' },
      { text: 'Yes, Enroute', onPress: async () => {
        try {
          setUpdating(true);
          await api.patch(`/dispatch/orders/${orderId}/enroute`);
          await fetchOrder();
          Alert.alert('Success', 'Order marked as enroute!');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to mark enroute');
        } finally {
          setUpdating(false);
        }
      }}
    ]);
  };

  const handleVerifyCode = async () => {
    if (!deliveryCode || deliveryCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setUpdating(true);
      await api.post(`/dispatch/orders/${orderId}/verify-code`, { code: deliveryCode });
      await fetchOrder();
      Alert.alert('Success', 'Delivery verified – order completed!');
      setDeliveryCode('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid code or failed to verify');
    } finally {
      setUpdating(false);
    }
  };

  const status = (order?.status || '').toLowerCase();
  const isReady = ['packaged', 'ready'].includes(status);
  const isPickedUp = status === 'picked_up';
  const isEnroute = status === 'enroute';
  const isDelivered = status === 'delivered';

  let statusColor = C.amber;
  let statusBg = C.amberLight;
  let statusText = 'Ready for Pickup';
  let statusIcon: keyof typeof Ionicons.glyphMap = 'cube-outline';

  if (isPickedUp) { statusColor = C.tealMid; statusBg = C.tealGlow; statusText = 'Picked Up'; statusIcon = 'bicycle-outline'; }
  else if (isEnroute) { statusColor = C.blue; statusBg = C.blueLight; statusText = 'Enroute'; statusIcon = 'navigate-outline'; }
  else if (isDelivered) { statusColor = C.green; statusBg = C.greenLight; statusText = 'Delivered'; statusIcon = 'checkmark-circle-outline'; }

  if (loading && !order) {
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
        <Text style={styles.headerTitle}>Pickup Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Ionicons name={statusIcon} size={16} color={statusColor} style={{ marginRight: 8 }} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        {isPickedUp && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
            <Text style={styles.acceptedText}>You have accepted this pickup</Text>
          </View>
        )}

        {/* Vendor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup From</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Store</Text>
            <Text style={styles.value}>{order?.vendor?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{order?.vendor?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{order?.vendor?.address || 'N/A'}</Text>
          </View>
        </View>

        {/* Deliver To - FULLY UPDATED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliver To</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{order?.customer?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{order?.phone || order?.customer?.phone || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{order?.customer_address || 'N/A'}</Text>
          </View>

          {/* Nearest Bus Stop */}
          {order?.user_bus_stop && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nearest Bus Stop</Text>
              <Text style={[styles.value, { color: C.tealMid, fontWeight: '700' }]}>
                {order.user_bus_stop.name}
              </Text>
            </View>
          )}

          {/* Notes from Checkout Page */}
          {order?.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items to Pick Up</Text>
          {order?.items?.length > 0 ? (
            order.items.map((item: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.item_name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  ₦{Number(item.subtotal || item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items listed</Text>
          )}
        </View>

        {/* Action Buttons */}
        {isReady && (
          <TouchableOpacity style={[styles.actionBtn, updating && styles.disabled]} onPress={handleAccept} disabled={updating}>
            {updating ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>ACCEPT PICKUP</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isPickedUp && (
          <TouchableOpacity style={[styles.actionBtn, styles.enrouteBtn, updating && styles.disabled]} onPress={handleEnroute} disabled={updating}>
            {updating ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="navigate-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>MARK AS ENROUTE</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isEnroute && (
          <View style={styles.verifySection}>
            <Text style={styles.verifyTitle}>Enter Delivery Code</Text>
            <Text style={styles.verifySub}>Ask customer for the 6-digit code</Text>

            <TextInput
              style={styles.codeInput}
              value={deliveryCode}
              onChangeText={setDeliveryCode}
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />

            <TouchableOpacity style={[styles.actionBtn, styles.verifyBtn, updating && styles.disabled]} onPress={handleVerifyCode} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.actionText}>VERIFY & COMPLETE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isDelivered && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done-circle" size={32} color={C.green} />
            <Text style={styles.completedText}>Order Delivered Successfully</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... your original styles (unchanged)
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.tealDeep },
  scroll: { flex: 1, padding: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, margin: 12, borderRadius: 12 },
  statusText: { fontSize: 16, fontWeight: '700' },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.greenLight, padding: 12, marginHorizontal: 12, marginBottom: 12, borderRadius: 12, gap: 8 },
  acceptedText: { fontSize: 14, fontWeight: '600', color: C.green },
  section: { backgroundColor: C.surface, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.borderLight },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.tealDeep, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  label: { fontSize: 13, color: '#666', fontWeight: '600' },
  value: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemPrice: { fontSize: 14, color: C.tealDeep, fontWeight: '700' },
  noItems: { fontSize: 14, color: '#888', textAlign: 'center', padding: 20 },
  actionBtn: { backgroundColor: C.tealMid, margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  enrouteBtn: { backgroundColor: C.amber },
  verifyBtn: { backgroundColor: '#6B52D4' },
  disabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  verifySection: { backgroundColor: C.surface, margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.borderLight },
  verifyTitle: { fontSize: 16, fontWeight: '700', color: C.tealDeep, marginBottom: 8 },
  verifySub: { fontSize: 13, color: '#666', marginBottom: 16 },
  codeInput: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 16, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 16 },
  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenLight, padding: 20, margin: 16, borderRadius: 12, gap: 10 },
  completedText: { fontSize: 16, fontWeight: '700', color: C.green },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
});