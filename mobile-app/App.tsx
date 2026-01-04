import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateChallengeScreen from './src/screens/CreateChallengeScreen';
import AddReportScreen from './src/screens/AddReportScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ChallengeDetailScreen from './src/screens/ChallengeDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AddBalanceScreen from './src/screens/AddBalanceScreen';

// Icons
import { FeedIcon, ProfileIcon, PlusIcon } from './src/components/Icons';

// Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const FeedStack = createNativeStackNavigator();
const AddReportStack = createNativeStackNavigator();

// Feed Stack Navigator (для навигации внутри ленты)
function FeedStackScreen({ userId, scrollToTop }: { userId: string; scrollToTop?: boolean }) {
  const feedScreenRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (scrollToTop && feedScreenRef.current?.scrollToTop) {
      feedScreenRef.current.scrollToTop();
    }
  }, [scrollToTop]);

  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedMain">
        {(props) => <FeedScreen {...props} userId={userId} ref={feedScreenRef} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="UserProfile">
        {(props) => <UserProfileScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="ChallengeDetail">
        {(props) => <ChallengeDetailScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="Notifications">
        {(props) => <NotificationsScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="AddBalance">
        {(props) => <AddBalanceScreen {...props} />}
      </FeedStack.Screen>
    </FeedStack.Navigator>
  );
}

// Profile Stack Navigator (для навигации внутри профиля)
function ProfileStackScreen({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain">
        {(props) => <ProfileScreen {...props} userId={userId} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="CreateChallenge">
        {(props) => <CreateChallengeScreen {...props} userId={userId} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Settings">
        {(props) => <SettingsScreen {...props} onLogout={onLogout} route={{ params: { userId } }} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="EditProfile">
        {(props) => <EditProfileScreen {...props} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Privacy">
        {(props) => <PrivacyScreen {...props} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="ChallengeDetail">
        {(props) => <ChallengeDetailScreen {...props} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Notifications">
        {(props) => <NotificationsScreen {...props} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="AddBalance">
        {(props) => <AddBalanceScreen {...props} />}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

// AddReport Stack Navigator (для навигации из экрана добавления отчёта)
function AddReportStackScreen({ userId }: { userId: string }) {
  return (
    <AddReportStack.Navigator screenOptions={{ headerShown: false }}>
      <AddReportStack.Screen name="AddReportMain">
        {(props) => <AddReportScreen {...props} userId={userId} />}
      </AddReportStack.Screen>
      <AddReportStack.Screen name="CreateChallenge">
        {(props) => <CreateChallengeScreen {...props} userId={userId} />}
      </AddReportStack.Screen>
    </AddReportStack.Navigator>
  );
}

// Bottom Tab Navigator Component
function MainTabs({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [feedScrollToTop, setFeedScrollToTop] = React.useState(false);

  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 46, 39, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#84cc16',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        listeners={{
          tabPress: (e) => {
            setFeedScrollToTop(prev => !prev);
          },
        }}
        options={{
          tabBarLabel: 'Лента',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
        }}
      >
        {() => <FeedStackScreen userId={userId} scrollToTop={feedScrollToTop} />}
      </Tab.Screen>
      <Tab.Screen
        name="AddReport"
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: focused ? '#d4af37' : '#84cc16',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: '#84cc16',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <PlusIcon />
            </View>
          ),
        }}
      >
        {() => <AddReportStackScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      >
        {() => <ProfileStackScreen userId={userId} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
          <MainTabs userId={userId} onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </ConvexProvider>
  );
}
