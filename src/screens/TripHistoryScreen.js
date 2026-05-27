// historial de viajes
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useSelector } from "react-redux";

import { db } from "../config/firebase";
import { COLORS, globalStyles } from "../styles/globalStyles";
import { formatFare } from "../utils/fareUtils";

const getDateMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime();
};

export default function TripHistoryScreen() {
  const user = useSelector((state) => state.auth.user);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setTrips([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const tripsQuery = query(
      collection(db, "trips"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const completedTrips = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((trip) => trip.status === "completed")
          .sort(
            (a, b) =>
              getDateMillis(b.completedAt) - getDateMillis(a.completedAt)
          );

        setTrips(completedTrips);
        setLoading(false);
      },
      (error) => {
        console.log("TRIP HISTORY ERROR:", error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={[globalStyles.container, globalStyles.screenPadding]}>
        <Text style={[globalStyles.title, { color: COLORS.textPrimary }]}>
          Historial de viajes
        </Text>

        {loading ? (
          <View style={globalStyles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : trips.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>
              Aún no tienes viajes realizados
            </Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View style={globalStyles.card}>
                <Text style={globalStyles.cardTitle}>
                  Destino: {item.destination}
                </Text>
                <Text style={globalStyles.bodyText}>
                  Vehiculo: {item.vehicleType}
                </Text>
                <Text style={globalStyles.bodyText}>
                  Distancia: {item.distance}
                </Text>
                <Text style={globalStyles.bodyText}>
                  Duracion: {item.duration}
                </Text>
                <Text style={globalStyles.bodyText}>
                  Precio: {formatFare(item.price)}
                </Text>
                <Text style={globalStyles.bodyText}>
                  Estado: completado
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
