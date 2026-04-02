// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';

import OnboardingScreen from './src/screens/onboarding/Onboarding';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegistrationScreen from './src/screens/auth/RegistrationScreen';
import AppNavigator from './src/navigation/AppNavigator';

// Import ThemeProvider
import { ThemeProvider } from './src/theme/ThemeContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingAndAuth = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
          setInitialRoute('MainTabs');
        } else if (hasSeen === 'true') {
          setInitialRoute('Login');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (e) {
        console.warn('Auth check error:', e);
        setInitialRoute('Onboarding');
      }
    };

    checkOnboardingAndAuth();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />

          {/* Main app with tabs */}
          <Stack.Screen name="MainTabs" component={AppNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}