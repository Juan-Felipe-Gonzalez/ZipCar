import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch, useSelector } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import store from "./src/redux/store/store";
import { auth, db } from "./src/config/firebase";
import { setUser, logoutUser } from "./src/redux/slices/authSlice";
import { normalizeGender, normalizeLanguage } from "./src/i18n/translations";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import TabNavigator from "./src/navigation/TabNavigator";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data();

            dispatch(
              setUser({
                uid: firebaseUser.uid,
                photoUri: data.photoUri || "",
                name: data.name || "",
                lastname: data.lastname || "",
                fullName: data.fullName || "",
                email: data.email || firebaseUser.email || "",
                phone: data.phone || "",
                gender: normalizeGender(data.gender),
                language: normalizeLanguage(data.language),
                role: data.role || "client",
              }),
            );
          } else {
            dispatch(
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                language: "es",
                role: "client",
              }),
            );
          }
        } catch (error) {
          console.log("AUTH STATE ERROR:", error.code, error.message);

          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              language: "es",
              role: "client",
            }),
          );
        }
      } else {
        dispatch(logoutUser());
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  if (typeof window !== "undefined") {
    window.crypto = {
      getRandomValues: (arr) => {
        if (arr) {
          for (let i = 0; i < arr.byteLength; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
        }
        return arr;
      },
    };
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
