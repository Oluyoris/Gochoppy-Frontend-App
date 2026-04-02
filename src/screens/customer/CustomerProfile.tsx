import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import { CustomerNavigationProp } from '../../navigation/types';

// ─── Design Tokens ────────────────────────────────────────────────
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const C = {
  bg:          '#EDF8F6',
  surface:     '#FFFFFF',
  tealDeep:    '#0D6E63',
  tealMid:     '#17A898',
  tealLight:   '#C8EDEA',
  tealGlow:    '#E2F7F5',
  ink:         '#0A2724',
  inkMid:      '#2D5550',
  inkLight:    '#7AA8A3',
  amber:       '#E8821A',
  amberLight:  '#FEF0E0',
  violet:      '#6B3FA0',
  violetLight: '#F0E8FA',
  blue:        '#3B72E8',
  blueLight:   '#E8F0FE',
  red:         '#D93030',
  redLight:    '#FDECEC',
  green:       '#1A9060',
  greenLight:  '#E2F5EC',
  border:      '#D4EDEA',
  borderLight: '#EAF5F3',
  white:       '#FFFFFF',
};

export default function Profile() {
  // ─── ALL ORIGINAL LOGIC UNTOUCHED ────────────────────────────
  const [user, setUser]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [address, setAddress]     = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const navigation = useNavigation<CustomerNavigationProp>();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        setFirstName(u.name?.split(' ')[0] || '');
        setLastName(u.name?.split(' ').slice(1).join(' ') || '');
        setPhone(u.phone || '');
        setAddress(u.address || '');
        setAvatarUri(u.avatar || null);
      }
    } catch (error) {
      console.log('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('name', `${firstName} ${lastName}`.trim());
      formData.append('phone', phone);
      formData.append('address', address);
      if (avatarUri && !avatarUri.startsWith('http')) {
        const filename = avatarUri.split('/').pop();
        formData.append('avatar', { uri: avatarUri, name: filename, type: 'image/jpeg' } as any);
      }
      const res = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        Alert.alert('Success', 'Profile updated!');
        setEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.log('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userRole']);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  // ─── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.tealDeep} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tealMid} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── ERROR ────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.emptyCircle}>
            <Ionicons name="person-circle-outline" size={40} color={C.tealMid} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load profile</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile} activeOpacity={0.88}>
            <Ionicons name="refresh-outline" size={15} color={C.white} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${firstName} ${lastName}`.trim() || 'User';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.tealDeep} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── HERO BANNER ─────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroDecor3} />

          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.88}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={12} color={C.white} />
            </View>
          </TouchableOpacity>

          {editing ? (
            <View style={styles.heroEditRow}>
              <TextInput
                style={styles.heroInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TextInput
                style={styles.heroInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          ) : (
            <>
              <Text style={styles.heroName}>{fullName}</Text>
              <Text style={styles.heroEmail}>{user.email}</Text>
            </>
          )}

          {!editing ? (
            <TouchableOpacity style={styles.editPill} onPress={() => setEditing(true)} activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={12} color={C.tealDeep} />
              <Text style={styles.editPillText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.heroBtnRow}>
              <TouchableOpacity style={styles.cancelPill} onPress={() => setEditing(false)} activeOpacity={0.85}>
                <Text style={styles.cancelPillText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.savePill} onPress={saveProfile} activeOpacity={0.88}>
                <Ionicons name="checkmark" size={13} color={C.white} />
                <Text style={styles.savePillText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── ACCOUNT INFO ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: C.tealGlow }]}>
              <Ionicons name="mail-outline" size={16} color={C.tealDeep} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color={C.green} style={{ marginRight: 3 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: C.amberLight }]}>
              <Ionicons name="call-outline" size={16} color={C.amber} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              {editing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor={C.inkLight}
                />
              ) : (
                <Text style={styles.infoValue}>{phone || 'Not set'}</Text>
              )}
            </View>
            {editing && <Ionicons name="create-outline" size={15} color={C.inkLight} />}
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: C.violetLight }]}>
              <Ionicons name="location-outline" size={16} color={C.violet} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              {editing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter delivery address"
                  placeholderTextColor={C.inkLight}
                />
              ) : (
                <Text style={styles.infoValue}>{address || 'Not set'}</Text>
              )}
            </View>
            {editing && <Ionicons name="create-outline" size={15} color={C.inkLight} />}
          </View>
        </View>

        {/* ── SECURITY ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => Alert.alert('Change Password', 'This feature will be added soon.')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: C.blueLight }]}>
              <Ionicons name="lock-closed-outline" size={16} color={C.blue} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Password</Text>
              <Text style={styles.infoValue}>••••••••••</Text>
            </View>
            <View style={styles.arrowChip}>
              <Ionicons name="chevron-forward" size={13} color={C.inkLight} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.88}>
            <View style={[styles.iconBox, { backgroundColor: C.redLight }]}>
              <Ionicons name="log-out-outline" size={16} color={C.red} />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <Ionicons name="chevron-forward" size={14} color={C.red} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 32 },

  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 12, paddingHorizontal: 32,
  },
  loadingText: { fontSize: 13, color: C.inkLight, fontWeight: '500' },
  emptyCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.tealLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.ink },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.tealDeep, paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 12, marginTop: 4,
  },
  retryBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },

  // Hero
  hero: {
    backgroundColor: C.tealDeep,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 24 : 24,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -50, right: -30,
  },
  heroDecor2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: -20,
  },
  heroDecor3: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: 30,
  },

  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarFallback: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: C.tealMid, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarInitials: {
    fontSize: 26, fontWeight: '900', color: C.white, letterSpacing: -0.5,
  },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.amber, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
  },

  heroName: {
    fontSize: 19, fontWeight: '900', color: C.white,
    letterSpacing: -0.4, marginBottom: 3,
  },
  heroEmail: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)',
    marginBottom: 16, fontWeight: '500',
  },

  heroEditRow: {
    flexDirection: 'row', gap: 8, width: '82%',
    marginBottom: 14, marginTop: 6,
  },
  heroInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: C.white, fontWeight: '600',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
  },

  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  editPillText: { fontSize: 12, fontWeight: '800', color: C.tealDeep },
  heroBtnRow: { flexDirection: 'row', gap: 8 },
  cancelPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  cancelPillText: { fontSize: 12, fontWeight: '700', color: C.white },
  savePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.tealMid, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, shadowColor: C.tealDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  savePillText: { fontSize: 12, fontWeight: '800', color: C.white },

  // Section
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 9, fontWeight: '800', color: C.inkLight,
    letterSpacing: 2, marginBottom: 8, marginLeft: 2,
  },

  // Info card
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1,
    borderColor: C.borderLight, gap: 11,
    shadowColor: C.tealDeep, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: {
    fontSize: 10, color: C.inkLight, fontWeight: '600', letterSpacing: 0.2,
  },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.ink },
  inlineInput: {
    fontSize: 13, fontWeight: '600', color: C.ink,
    paddingVertical: 2, borderBottomWidth: 1.5, borderBottomColor: C.tealMid,
  },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.greenLight, paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: '#A8DDB5',
  },
  verifiedText: { fontSize: 9, fontWeight: '800', color: C.green },
  arrowChip: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.tealGlow, justifyContent: 'center', alignItems: 'center',
  },

  // Logout
  logoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: '#FAD9D9',
    shadowColor: C.red, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 11,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: C.red },
});