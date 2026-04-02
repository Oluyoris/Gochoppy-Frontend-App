import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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
  tealBorder: '#B2DFDB',
  ink: '#0A2724',
  inkMid: '#2D5550',
  inkLight: '#7AA8A3',
  orange: '#FF6200',
  orangeLight: '#FFF3EC',
  orangeMid: '#FFD4B8',
  border: '#E5F5F3',
  white: '#FFFFFF',
  shadow: '#0A2724',
};

export default function VendorProfile() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // 1. Fetch basic user profile
      const userRes = await api.get('/profile');
      const user = userRes.data.user || {};

      // 2. Fetch vendor-specific profile
      const vendorRes = await api.get('/vendor/profile');
      console.log('Vendor API full response:', JSON.stringify(vendorRes.data, null, 2)); // ← VERY IMPORTANT: Check this log!

      // Get the flat data object (from new backend structure)
      const data = vendorRes.data.data || {};

      // 3. Set profile
      setProfile({
        ...user,
        company_name: data.company_name || user.name || 'Vendor',
        type: data.type || 'Not set',
        logo: data.logo || null, // backend already gives full URL
        address: data.address || user.address || 'Not set',
        bank_name: data.bank_name || 'Not set',
        account_number: data.account_number
          ? `****${String(data.account_number).slice(-4)}`
          : 'Not set',
        account_name: data.account_name || 'Not set',
        is_verified: !!data.is_verified, // this should now show correctly
      });
    } catch (error) {
      console.log('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.orange} />
          <Text style={styles.loadingText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (profile.company_name || profile.name || 'V')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasLogo = !!profile.logo && !imgError;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Hero with Logo + Verified Icon */}
        <View style={styles.avatarContainer}>
          {hasLogo ? (
            <Image
              source={{ uri: profile.logo }}
              style={styles.avatar}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="business-outline" size={60} color={C.orange} />
            </View>
          )}

          <Text style={styles.companyName}>
            {profile.company_name || profile.name || 'Vendor'}
          </Text>

          <Text style={styles.typeBadge}>{profile.type.toUpperCase()}</Text>

          {/* Verified Icon - right below logo */}
          <View style={styles.verifiedRow}>
            <Ionicons
              name={profile.is_verified ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={profile.is_verified ? '#34C759' : '#FF9500'}
            />
            <Text style={[
              styles.verifiedText,
              { color: profile.is_verified ? '#34C759' : '#FF9500' }
            ]}>
              {profile.is_verified ? 'Verified Vendor' : 'Not Verified'}
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile.email || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile.phone || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{profile.address || 'Not set'}</Text>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{profile.bank_name || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{profile.account_number || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Name</Text>
            <Text style={styles.infoValue}>{profile.account_name || 'Not set'}</Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert('Coming Soon', 'Edit profile coming soon')}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A2E2B' },
  scroll: { padding: 16 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FF6200' },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF620020',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6200',
  },
  companyName: { fontSize: 22, fontWeight: 'bold', marginTop: 12, color: '#1A2E2B' },
  typeBadge: {
    backgroundColor: '#FF6200',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    fontWeight: '600',
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  verifiedText: { fontSize: 14, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1A2E2B' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'right', flex: 1 },
  editButton: {
    backgroundColor: '#FF6200',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});