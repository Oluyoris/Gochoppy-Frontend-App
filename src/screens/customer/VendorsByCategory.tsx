import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CustomerNavigationProp } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

// ── Brand Colors ──────────────────────────────────────
const ORANGE     = '#FF6200';
const TEAL       = '#00897B';
const WHITE      = '#FFFFFF';
const BG         = '#F7F9F8';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#1A2E2B';
const TEXT_MID   = '#4A6360';
const TEXT_LIGHT = '#8AA09E';
const BORDER     = '#EEF3F2';

// ── Category accent map ───────────────────────────────
const categoryConfig: { [key: string]: { color: string; bg: string; icon: any } } = {
  kitchen:     { color: ORANGE,    bg: '#FFF0E8', icon: 'restaurant-outline'  },
  pharmacy:    { color: '#7B1FA2', bg: '#F3E5F5', icon: 'medical-outline'      },
  supermarket: { color: TEAL,      bg: '#E8F5F3', icon: 'basket-outline'       },
};
const fallbackCfg = { color: '#1E88E5', bg: '#E3F2FD', icon: 'storefront-outline' };

export default function VendorsByCategory() {
  // ── ALL ORIGINAL LOGIC ────────────────────────────
  const route = useRoute<any>();
  const { category } = route.params || { category: '' };
  const navigation = useNavigation<CustomerNavigationProp>();

  const [vendors, setVendors]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (category) fetchVendors();
  }, [category]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/home/items');
      console.log('Full items response:', res.data);

      const allItems = res.data.items || [];
      const vendorMap = new Map<number, any>();

      allItems.forEach((item: any) => {
        const vendor = item?.vendor;
        if (vendor && vendor.id) {
          const vendorType = vendor.type || vendor.vendor_type;
          if (vendorType?.toLowerCase() === category.toLowerCase()) {
            if (!vendorMap.has(vendor.id)) {
              vendorMap.set(vendor.id, {
                id: vendor.id,
                name: vendor.name || vendor.company_name || 'Vendor',
                logo: vendor.logo || null,
                type: vendorType,
              });
            }
          }
        }
      });

      const filteredVendors = Array.from(vendorMap.values());
      console.log(`Vendors for ${category}:`, filteredVendors);
      setVendors(filteredVendors);
    } catch (err: any) {
      console.error(`Failed to load ${category} vendors:`, err);
      setError(`Could not load ${category} vendors`);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorPress = (vendor: any) => {
    navigation.navigate('VendorItems', {
      vendorId: vendor.id,
      vendorName: vendor.name,
    });
  };

  // ── HELPERS ───────────────────────────────────────
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const cfg      = categoryConfig[category?.toLowerCase()] || fallbackCfg;

  // ── VENDOR CARD ───────────────────────────────────
  const renderVendor = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => handleVendorPress(item)}
      activeOpacity={0.88}
    >
      {/* Logo / Placeholder */}
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.vendorImage} />
      ) : (
        <View style={[styles.placeholderBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={40} color={cfg.color} />
        </View>
      )}

      {/* Type badge overlaid on image */}
      <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}>
        <Ionicons name={cfg.icon} size={10} color={WHITE} />
        <Text style={styles.typeBadgeText}>{item.type || category}</Text>
      </View>

      {/* Card footer */}
      <View style={styles.vendorFooter}>
        <Text style={styles.vendorName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.vendorMeta}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.vendorMetaText}>Top Rated</Text>
          <Ionicons name="chevron-forward" size={13} color={TEXT_LIGHT} style={{ marginLeft: 'auto' }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{catLabel} Vendors</Text>
          {!loading && vendors.length > 0 && (
            <Text style={styles.headerSub}>{vendors.length} available</Text>
          )}
        </View>
        {/* Category icon badge */}
        <View style={[styles.headerIconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={17} color={cfg.color} />
        </View>
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Finding vendors…</Text>
        </View>

      /* ── Error ── */
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color={ORANGE} />
          </View>
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchVendors} activeOpacity={0.88}>
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>

      /* ── Empty ── */
      ) : vendors.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={48} color={cfg.color} />
          </View>
          <Text style={styles.emptyTitle}>No vendors in {catLabel}</Text>
          <Text style={styles.emptySubText}>Check back soon — more vendors are joining!</Text>
        </View>

      /* ── Grid ── */
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendor}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '600',
    marginTop: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },

  // ── States ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  errorIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ORANGE,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  retryBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Grid ──
  list: {
    padding: 18,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // ── Vendor Card ──
  vendorCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },
  placeholderBox: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Type badge (top-right overlay)
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: WHITE,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  // Card footer
  vendorFooter: {
    padding: 10,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorMetaText: {
    fontSize: 11,
    color: TEXT_MID,
    fontWeight: '600',
  },
});