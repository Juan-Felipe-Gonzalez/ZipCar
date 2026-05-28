// historial de viajes
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faCarSide,
  faLocationDot,
  faClock,
  faCar,
} from "@fortawesome/free-solid-svg-icons";
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
      where("userId", "==", user.uid),
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
              getDateMillis(b.completedAt) - getDateMillis(a.completedAt),
          );

        setTrips(completedTrips);
        setLoading(false);
      },
      (error) => {
        console.log("TRIP HISTORY ERROR:", error.message);
        setLoading(false);
      },
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
              <View style={[globalStyles.card, globalStyles.cardRelative]}>
                <View style={globalStyles.cardHeaderRow}>
                  <FontAwesomeIcon icon={faCarSide} size={28} color="#1D9E75" />
                  <Text
                    style={[
                      globalStyles.cardTitle,
                      globalStyles.cardTitleHighlight,
                    ]}
                  >
                    Destino: {item.destination.slice(0, 48)}...
                  </Text>
                </View>
                <View style={globalStyles.infoRow}>
                  <View style={globalStyles.infoItem}>
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      size={14}
                      color="#1D9E75"
                      style={{ marginTop: 6 }}
                    />

                    <Text
                      style={[globalStyles.bodyText, globalStyles.infoText]}
                    >
                      {item.distance}
                    </Text>
                  </View>
                  <View style={globalStyles.infoItem}>
                    <FontAwesomeIcon
                      icon={faClock}
                      size={14}
                      color="#1D9E75"
                      style={{ marginTop: 6 }}
                    />
                    <Text
                      style={[globalStyles.bodyText, globalStyles.infoText]}
                    >
                      {item.duration}
                    </Text>
                  </View>
                  <View style={globalStyles.infoItem}>
                    <FontAwesomeIcon
                      icon={faCar}
                      size={14}
                      color="#1D9E75"
                      style={{ marginTop: 6 }}
                    />
                    <Text
                      style={[globalStyles.bodyText, globalStyles.infoText]}
                    >
                      {item.vehicleType}
                    </Text>
                  </View>
                </View>
                <Text style={globalStyles.bodyText}>Estado: completado</Text>
                <Text style={[globalStyles.bodyText, globalStyles.cardPrice]}>
                  {formatFare(item.price)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
