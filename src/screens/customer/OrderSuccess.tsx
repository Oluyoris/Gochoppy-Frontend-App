import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView, // ← added for scrollability
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE     = '#FF6200';
const TEAL       = '#00897B';
const WHITE      = '#FFFFFF';
const BG         = '#F7F9F8';
const TEXT_DARK  = '#1A2E2B';
const TEXT_MID   = '#4A6360';
const TEXT_LIGHT = '#8AA09E';
const BORDER     = '#EEF3F2';

export default function OrderSuccess({ route, navigation }: any) {
  // ── ALL ORIGINAL LOGIC ────────────────────────────
  const { orderId, deliveryCode, grandTotal, address } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Make everything scrollable ── */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* ── Success Icon ── */}
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="checkmark-circle" size={72} color={TEAL} />
            </View>
          </View>

          {/* ── Title ── */}
          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.message}>Thank you for your order 🎉{'\n'}We're getting it ready for you.</Text>

          {/* ── Order Details Card ── */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="receipt-outline" size={15} color={ORANGE} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>#{orderId}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="cash-outline" size={15} color={ORANGE} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Total Paid</Text>
                <Text style={styles.detailValue}>₦{grandTotal}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="location-outline" size={15} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Delivering to</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{address}</Text>
              </View>
            </View>
          </View>

          {/* ── Delivery Code Box ── */}
          <View style={styles.codeBox}>
            <View style={styles.codeTopRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={styles.codeLabel}>Delivery Code</Text>
            </View>
            <Text style={styles.deliveryCode}>{deliveryCode}</Text>
            <Text style={styles.codeNote}>
              Show this code to the dispatcher when they arrive.
            </Text>
          </View>

          {/* ── Buttons ── (now fully visible and scrollable) */}
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('OrderTracking', { orderId })}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate-outline" size={18} color={WHITE} />
            <Text style={styles.btnText}>Track My Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.88}
          >
            <Ionicons name="storefront-outline" size={18} color={ORANGE} />
            <Text style={styles.moreBtnText}>Order More</Text>
          </TouchableOpacity>

          {/* Extra bottom padding so last button isn't too close to edge */}
          <View style={{ height: 40 }} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // ── Icon ──
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#C8EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Heading ──
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT_DARK,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: TEXT_MID,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // ── Details Card ──
  detailsCard: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  detailDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 10,
  },

  // ── Delivery Code ──
  codeBox: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  codeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEAL,
    letterSpacing: 0.3,
  },
  deliveryCode: {
    fontSize: 36,
    fontWeight: '900',
    color: TEXT_DARK,
    letterSpacing: 6,
    marginBottom: 10,
  },
  codeNote: {
    fontSize: 12,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Buttons ──
  trackBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL,
    borderRadius: 14,
    height: 54,
    marginBottom: 12,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  moreBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderRadius: 14,
    height: 54,
    borderWidth: 1.5,
    borderColor: ORANGE,
  },
  btnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  moreBtnText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});