import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateChallengeScreen from './src/screens/CreateChallengeScreen';

// Convex client
const convex = new ConvexReactClient('https://lovable-mongoose-763.convex.cloud');

const Stack = createNativeStackNavigator();

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem('userId');
      setUserId(savedUserId);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newUserId: string) => {
    setUserId(newUserId);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    setUserId(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1612' }}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <NavigationContainer>
        <StatusBar style="light" />
        {!userId ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#0a1612',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              options={{ title: 'Challenge Stake' }}
            >
              {(props) => <HomeScreen {...props} userId={userId} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen 
              name="Feed" 
              component={FeedScreen}
              options={{ title: 'Лента' }}
            />
            <Stack.Screen 
              name="Profile" 
              options={{ title: 'Профиль' }}
            >
              {(props) => <ProfileScreen {...props} userId={userId} />}
            </Stack.Screen>
            <Stack.Screen 
              name="CreateChallenge"
              options={{ title: 'Создать челлендж' }}
            >
              {(props) => <CreateChallengeScreen {...props} userId={userId} />}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </ConvexProvider>
  );
}
