import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateChallengeScreen from './src/screens/CreateChallengeScreen';

// Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <NavigationContainer>
        <StatusBar style="light" />
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
            component={HomeScreen}
            options={{ title: 'Challenge Stake' }}
          />
          <Stack.Screen 
            name="Feed" 
            component={FeedScreen}
            options={{ title: 'Лента' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Профиль' }}
          />
          <Stack.Screen 
            name="CreateChallenge" 
            component={CreateChallengeScreen}
            options={{ title: 'Создать челлендж' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ConvexProvider>
  );
}
