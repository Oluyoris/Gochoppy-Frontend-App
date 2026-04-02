import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

// ── Brand Colors ──────────────────────────────────────
const TEAL        = '#00897B';
const TEAL_DARK   = '#00695C';
const TEAL_BG     = '#E0F2F1';
const TEAL_BORDER = '#B2DFDB';
const ORANGE      = '#FF6200';
const ORANGE_SOFT = '#FFF3EC';
const WHITE       = '#FFFFFF';
const BG          = '#F7F9F8';
const CARD        = '#FFFFFF';
const TEXT_DARK   = '#1A2E2B';
const TEXT_MID    = '#4A6360';
const TEXT_SOFT   = '#8AA09E';
const BORDER      = '#EEF3F2';
const GREEN       = '#2E7D32';
const GREEN_BG    = '#E8F5E9';
const RED         = '#C62828';
const RED_BG      = '#FFEBEE';

export default function DispatchProfile() {
  // ── ALL ORIGINAL STATE (untouched) ───────────────
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── ALL ORIGINAL LOGIC (untouched) ───────────────
  useEffect(() => {
    fetchDispatcherProfile();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchDispatcherProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dispatch/profile');
      console.log('Dispatch Profile Response:', JSON.stringify(res.data, null, 2));
      const data = res.data.data || res.data.profile || res.data;
      setProfile(data);
    } catch (error: any) {
      console.log('Dispatcher Profile fetch error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={s.loadingText}>Loading rider profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty / Error ─────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <View style={s.errorWrap}>
          <View style={s.errorIconCircle}>
            <Ionicons name="sad-outline" size={36} color={TEXT_SOFT} />
          </View>
          <Text style={s.errorTitle}>Failed to load profile</Text>
          <Text style={s.errorSub}>Check your connection and try again.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchDispatcherProfile} activeOpacity={0.88}>
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasAvatar = !imgError && (profile.avatar || profile.dispatcherProfile?.avatar);
  const displayName = profile.full_name || profile.name || 'Dispatcher';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = profile.is_active;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        style={{ opacity: fadeAnim }}
      >

        {/* ── Hero section ─────────────────────────── */}
        <View style={s.hero}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            {hasAvatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={s.avatar}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}

            {/* Active status dot — bottom-right of avatar */}
            <View style={[s.activeDot, { backgroundColor: isActive ? GREEN : RED }]} />
          </View>

          {/* Name + plate */}
          <Text style={s.heroName}>{displayName}</Text>

          {profile.plate_number ? (
            <View style={s.platePill}>
              <Ionicons name="bicycle" size={13} color={TEAL_DARK} />
              <Text style={s.platePillText}>{profile.plate_number}</Text>
            </View>
          ) : null}

          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: isActive ? GREEN_BG : RED_BG }]}>
            <View style={[s.statusDot, { backgroundColor: isActive ? GREEN : RED }]} />
            <Text style={[s.statusText, { color: isActive ? GREEN : RED }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* ── Personal Information ─────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconBox, { backgroundColor: TEAL_BG }]}>
              <Ionicons name="person-outline" size={14} color={TEAL_DARK} />
            </View>
            <Text style={s.sectionTitle}>Personal information</Text>
          </View>

          <View style={s.card}>
            <InfoRow
              icon="call-outline"
              label="Phone number"
              value={profile.phone || 'Not provided'}
            />
            <InfoRow
              icon="mail-outline"
              label="Email address"
              value={profile.email || 'Not provided'}
              last
            />
            <InfoRow
              icon="location-outline"
              label="Address"
              value={profile.address || 'No address provided'}
              last
            />
          </View>
        </View>

        {/* ── Vehicle & Documents ──────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconBox, { backgroundColor: ORANGE_SOFT }]}>
              <Ionicons name="bicycle" size={14} color={ORANGE} />
            </View>
            <Text style={s.sectionTitle}>Vehicle & documents</Text>
          </View>

          <View style={s.card}>
            <InfoRow
              icon="bicycle"
              label="Plate number"
              value={profile.plate_number || 'Not provided'}
            />
            <InfoRow
              icon="card-outline"
              label="NIN"
              value={profile.nin_number || 'Not uploaded'}
            />
            <InfoRow
              icon="people-outline"
              label="Grantor name"
              value={profile.grantor_name || 'Not provided'}
              last
            />
          </View>
        </View>

        {/* ── Bank Information ─────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="business-outline" size={14} color={GREEN} />
            </View>
            <Text style={s.sectionTitle}>Bank information</Text>
          </View>

          <View style={s.card}>
            <InfoRow
              icon="business-outline"
              label="Bank name"
              value={profile.bank_name || 'Not provided'}
            />
            <InfoRow
              icon="card-outline"
              label="Account number"
              value={profile.account_number || 'Not provided'}
            />
            <InfoRow
              icon="person-outline"
              label="Account name"
              value={profile.account_name || 'Not provided'}
              last
            />
          </View>
        </View>

        {/* ── Edit Profile Button ───────────────────── */}
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
          activeOpacity={0.88}
        >
          <Ionicons name="create-outline" size={18} color={WHITE} />
          <Text style={s.editBtnText}>Edit profile</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable InfoRow component ────────────────────────
function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ir.row, !last && ir.rowBorder]}>
      <View style={ir.iconWrap}>
        <Ionicons name={icon as any} size={16} color={TEAL} />
      </View>
      <View style={ir.textWrap}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}
const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: TEAL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SOFT,
    letterSpacing: 0.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    lineHeight: 19,
  },
});

// ── Styles ────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  scroll:      { paddingHorizontal: 20, paddingTop: 24 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: TEXT_SOFT },

  // Error
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  errorIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  errorSub:   { fontSize: 13, color: TEXT_SOFT, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TEAL, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12,
  },
  retryText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  // Hero
  hero: {
    alignItems: 'center',
    paddingBottom: 28,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: WHITE,
  },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: TEAL_BG,
    borderWidth: 3, borderColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 30, fontWeight: '800', color: TEAL_DARK,
  },
  // Small status dot pinned to avatar bottom-right
  activeDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2.5, borderColor: WHITE,
  },
  heroName: {
    fontSize: 22, fontWeight: '800', color: TEXT_DARK,
    letterSpacing: -0.3, marginBottom: 8, textAlign: 'center',
  },
  platePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: TEAL_BG, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: TEAL_BORDER,
  },
  platePillText: { fontSize: 13, fontWeight: '700', color: TEAL_DARK },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  // Section
  section:       { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIconBox:{
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: TEXT_MID,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Card
  card: {
    backgroundColor: CARD, borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Edit button
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: TEAL_DARK,
    paddingVertical: 15, borderRadius: 16, marginTop: 8,
    shadowColor: TEAL_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  editBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});