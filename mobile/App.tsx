import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { ForgotPasswordScreen } from "./src/screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { RegisterScreen } from "./src/screens/auth/RegisterScreen";
import { VerifyEmailScreen } from "./src/screens/auth/VerifyEmailScreen";
import { CartScreen } from "./src/screens/buyer/CartScreen";
import { CheckoutScreen } from "./src/screens/buyer/CheckoutScreen";
import { HomeScreen } from "./src/screens/buyer/HomeScreen";
import { OrdersScreen } from "./src/screens/buyer/OrdersScreen";
import { ProductDetailsScreen } from "./src/screens/buyer/ProductDetailsScreen";
import { ProductListScreen } from "./src/screens/buyer/ProductListScreen";
import { ProfileScreen } from "./src/screens/buyer/ProfileScreen";
import { ChatbotWidget } from "./src/components/ChatbotWidget";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  MainTabs: undefined;
  ProductDetails: { id: string };
  Checkout: undefined;
};

export type TabParamList = {
  Home: undefined;
  Browse: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const queryClient = new QueryClient();

const PRIMARY = "#fe424d";
const INACTIVE = "#9ca3af";

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f1f5f9",
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { filled: string; outline: string }> = {
            Home: { filled: "home", outline: "home-outline" },
            Browse: { filled: "search", outline: "search-outline" },
            Cart: { filled: "cart", outline: "cart-outline" },
            Orders: { filled: "receipt", outline: "receipt-outline" },
            Profile: { filled: "person", outline: "person-outline" },
          };
          const set = icons[route.name] ?? icons.Home;
          const name = focused ? set.filled : set.outline;
          return <Ionicons name={name as "home"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Browse" component={ProductListScreen} options={{ title: "Browse" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Cart" }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { bootstrapping, user } = useAuth();

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        )}
      </Stack.Navigator>
      {user && <ChatbotWidget />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
