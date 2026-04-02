import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const { width, height } = Dimensions.get('window');

// ── Brand Colors ──────────────────────────────────────
const ORANGE       = '#FF6200';
const ORANGE_LIGHT = '#FF8533';
const TEAL         = '#00897B';
const WHITE        = '#FFFFFF';
const BG           = '#FFFFFF';
const INPUT_BG     = '#F5F5F5';
const BORDER       = '#E8E8E8';
const TEXT_DARK    = '#111111';
const TEXT_MID     = '#555555';
const TEXT_LIGHT   = '#AAAAAA';

type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  Home: undefined;
};

type BusStop = {
  id: string;
  name: string;
};

export default function RegistrationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [phone, setPhone]                     = useState('');
  const [address, setAddress]                 = useState('');
  const [state, setState]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [popularBusStopId, setPopularBusStopId] = useState<string>('');
  const [popularBusStopName, setPopularBusStopName] = useState<string>('Select nearest bus stop');

  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loadingBusStops, setLoadingBusStops] = useState(true);
  const [showBusStopModal, setShowBusStopModal] = useState(false);

  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch Popular Bus Stops on screen load
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchBusStops();
  }, []);

  const fetchBusStops = async () => {
    try {
      const response = await api.get('/popular-bus-stops');
      if (response.data.success) {
        setBusStops(response.data.data);
      }
    } catch (error) {
      console.log('Failed to fetch bus stops:', error);
      Alert.alert('Connection Error', 'Could not load bus stops. Please check your internet.');
    } finally {
      setLoadingBusStops(false);
    }
  };

  const selectBusStop = (id: string, name: string) => {
    setPopularBusStopId(id);
    setPopularBusStopName(name);
    setShowBusStopModal(false);
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !phone || !address || !state || !password || !confirmPassword || !popularBusStopId) {
      Alert.alert('Missing Fields', 'Please fill all fields and select your nearest Popular Bus Stop');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/register', {
        name: `${firstName} ${lastName}`,
        username,
        email,
        phone,
        address,
        state,
        password,
        password_confirmation: confirmPassword,
        role: 'customer',
        popular_bus_stop_id: popularBusStopId,
      });

      const { token, user } = response.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', user.role);

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Home') },
      ]);
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        if (Array.isArray(firstError)) errorMessage = firstError[0];
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

            {/* Logo & Headline - unchanged */}
            <View style={styles.logoWrap}>
              <View style={styles.logoBox}>
                <Image source={require('../../../assets/onlogo1.png')} style={styles.logoImg} resizeMode="contain" />
              </View>
            </View>

            <Text style={styles.headline}>Sign up, Your meal{'\n'}awaits</Text>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.signinLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="John" placeholderTextColor={TEXT_LIGHT} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
                <Ionicons name="person-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="Doe" placeholderTextColor={TEXT_LIGHT} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
                <Ionicons name="person-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="Gladys" placeholderTextColor={TEXT_LIGHT} value={username} onChangeText={setUsername} autoCapitalize="none" />
                <Ionicons name="at" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="gladys@domain.com" placeholderTextColor={TEXT_LIGHT} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <Ionicons name="mail-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="08012345678" placeholderTextColor={TEXT_LIGHT} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Ionicons name="call-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Delivery address</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="12 Broad Street, Lagos" placeholderTextColor={TEXT_LIGHT} value={address} onChangeText={setAddress} autoCapitalize="sentences" />
                <Ionicons name="location-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="e.g. Lagos" placeholderTextColor={TEXT_LIGHT} value={state} onChangeText={setState} autoCapitalize="words" />
                <Ionicons name="map-outline" size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
              </View>
            </View>

            {/* Popular Bus Stop Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Popular Bus Stop</Text>
              <Text style={styles.helperText}>Pick the nearest popular area to your address</Text>
              
              <TouchableOpacity 
                style={styles.busStopSelector}
                onPress={() => setShowBusStopModal(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.input, { color: popularBusStopId ? TEXT_DARK : TEXT_LIGHT, flex: 1 }]}>
                  {popularBusStopName}
                </Text>
                <Ionicons name="chevron-down" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            </View>

            {/* Password Fields */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="Min. 6 characters" placeholderTextColor={TEXT_LIGHT} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'lock-closed-outline'} size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor={TEXT_LIGHT} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'lock-closed-outline'} size={17} color={TEXT_LIGHT} style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              <Text style={styles.signUpBtnText}>
                {loading ? 'CREATING ACCOUNT…' : 'SIGN UP'}
              </Text>
            </TouchableOpacity>

            {/* Divider and Social Buttons (unchanged) */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or connect with...</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={18} color={TEXT_DARK} />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.termsWrap}>
              <Text style={styles.termsText}>By signing up, you have agreed to our </Text>
              <TouchableOpacity>
                <Text style={styles.termsLink}>Terms & Privacy policy</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bus Stop Modal */}
      <Modal visible={showBusStopModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Popular Bus Stop</Text>
            
            {loadingBusStops ? (
              <ActivityIndicator size="large" color={TEAL} style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                data={busStops}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalItem}
                    onPress={() => selectBusStop(item.id, item.name)}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBusStopModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles (added new styles for bus stop and modal)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: height * 0.06, paddingBottom: 40 },

  logoWrap: { alignItems: 'flex-start', marginBottom: 28 },
  logoBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 32, height: 32, tintColor: WHITE },

  headline: { fontSize: 30, fontWeight: '900', color: TEXT_DARK, lineHeight: 38, letterSpacing: -0.5, marginBottom: 14 },

  signinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  signinText: { fontSize: 14, color: TEXT_MID },
  signinLink: { fontSize: 14, fontWeight: '800', color: ORANGE },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 7 },
  helperText: { fontSize: 12.5, color: TEAL, marginBottom: 8, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, color: TEXT_DARK },

  busStopSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: INPUT_BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, height: 52,
  },

  inputIcon: { marginLeft: 8 },

  signUpBtn: {
    backgroundColor: ORANGE, borderRadius: 10, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 28,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  signUpBtnDisabled: { backgroundColor: ORANGE_LIGHT },

  signUpBtnText: { fontSize: 15, fontWeight: '900', color: WHITE, letterSpacing: 1.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500' },

  socialRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE,
  },
  googleG: { fontSize: 16, fontWeight: '900', color: ORANGE },
  socialBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },

  termsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  termsText: { fontSize: 12, color: TEXT_LIGHT },
  termsLink: { fontSize: 12, fontWeight: '700', color: TEAL, textDecorationLine: 'underline' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: height * 0.7 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 15, color: TEXT_DARK },
  modalItem: { paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalItemText: { fontSize: 16.5, color: TEXT_DARK },
  modalCloseBtn: { marginTop: 15, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
});