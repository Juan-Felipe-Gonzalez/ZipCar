import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, globalStyles } from "../styles/globalStyles";
import { db } from "../config/firebase";
import {
  clearActiveTrip,
  markTripPaidInProgress,
  setActiveTrip,
} from "../redux/slices/tripSlice";
import { createPaymentPreference } from "../services/paymentService";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { decodePolyline } from "../utils/decodePolyline";
import { fetchDirections } from "../utils/directionsApi";
import {
  VEHICLE_OPTIONS,
  calculateBaseFare,
  calculateVehicleFare,
  formatFare,
} from "../utils/fareUtils";
import { useDriverSimulation } from "./../utils/useDriverSimultaion";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function RequestTripScreen({ navigation }) {
  const dispatch = useDispatch();
  const activeTrip = useSelector((state) => state.trip.activeTrip);
  const user = useSelector((state) => state.auth.user);
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [originAddress, setOriginAddress] = useState("");
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("economico");
  const [directionsRoute, setDirectionsRoute] = useState([]);
  const [encodedPolyline, setEncodedPolyline] = useState(null);
  const [timeAndDistance, setTimeAndDistance] = useState(null);
  const [baseFare, setBaseFare] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [paying, setPaying] = useState(false);
  const [finishingTrip, setFinishingTrip] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!driverPosition || !mapRef.current) return;
    mapRef.current.animateCamera({
      center: driverPosition,
      heading: driverHeading,
      pitch: 45, // vista inclinada tipo Waze
      zoom: 17,
      duration: 1000, // debe coincidir con el intervalMs del hook
    });
  }, [driverPosition]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      setPermissionDenied(false);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    } catch (error) {
      console.log("LOCATION ERROR:", error.message);
      setPermissionDenied(true);
    }
  };

  const openLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert(
        "No se pudo abrir la configuración",
        "Abre los ajustes de la app para permitir el acceso a la ubicación.",
      );
    }
  };

  const handleRequestTrip = async () => {
    if (!originAddress || !destinationAddress) {
      alert("Selecciona origen y destino antes de continuar.");
      return;
    }

    if (!originLocation || !destinationLocation) {
      alert("Selecciona origen y destino válidos antes de continuar.");
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      alert("Falta la clave de Google Maps en la configuración.");
      return;
    }

    setLoadingRoute(true);
    setDirectionsRoute([]);
    setTimeAndDistance(null);
    setBaseFare(null);
    setShowVehicleModal(false);
    dispatch(clearActiveTrip());

    try {
      const directionsResult = await loadRoute();
      if (!directionsResult) return;

      setShowVehicleModal(true);
      await handleGetTimeAndDistance(directionsResult);
    } finally {
      setLoadingRoute(false);
    }
  };

  const loadRoute = async () => {
    const result = await fetchDirections(
      originLocation,
      destinationLocation,
      GOOGLE_PLACES_API_KEY,
    );

    if (!result?.encodedPolyline) {
      alert("No se pudo obtener la ruta. Verifica origen y destino.");
      return null;
    }

    const coordinates = decodePolyline(result.encodedPolyline);
    setDirectionsRoute(coordinates);
    setEncodedPolyline(result.encodedPolyline);

    if (coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 280, left: 40 },
        animated: true,
      });
    }

    return result;
  };

  const handleGetTimeAndDistance = async (directionsResult) => {
    if (!originLocation || !destinationLocation) return;

    setLoadingEstimate(true);

    try {
      const result =
        directionsResult ??
        (await fetchDirections(
          originLocation,
          destinationLocation,
          GOOGLE_PLACES_API_KEY,
        ));

      if (!result?.distance || !result?.duration) {
        alert("No se pudo calcular el tiempo y la distancia del viaje.");
        return;
      }

      setTimeAndDistance({
        distance: result.distance.text,
        duration: result.duration.text,
        distanceMeters: result.distance.value,
        durationSeconds: result.duration.value,
      });

      setBaseFare(calculateBaseFare(result.distance.value));
    } finally {
      setLoadingEstimate(false);
    }
  };

  const getVehicleFare = (multiplier) => {
    if (baseFare == null) return null;
    return calculateVehicleFare(baseFare, multiplier);
  };

  const selectedVehicleOption = VEHICLE_OPTIONS.find(
    (v) => v.id === selectedVehicle,
  );

  const resetTripForm = () => {
    setOriginAddress("");
    setOriginLocation(null);
    setDestinationAddress("");
    setDestinationLocation(null);
    setDirectionsRoute([]);
    setEncodedPolyline(null);
    setTimeAndDistance(null);
    setBaseFare(null);
    setSelectedVehicle("economico");
    setShowVehicleModal(false);
  };

  const handleConfirmTrip = () => {
    if (!selectedVehicleOption || !timeAndDistance || baseFare == null) {
      alert("No se pudo crear el viaje. Intenta calcular la ruta de nuevo.");
      return;
    }

    const price = Math.round(getVehicleFare(selectedVehicleOption.multiplier));

    dispatch(
      setActiveTrip({
        origin: originAddress,
        destination: destinationAddress,
        vehicleType: selectedVehicleOption.label,
        distance: timeAndDistance.distance,
        duration: timeAndDistance.duration,
        price,
        status: "requested",
        paymentStatus: "pending",
        createdAt: Date.now(),
      }),
    );
    setShowVehicleModal(false);
  };

  const tripActive =
    activeTrip?.status === "requested" || activeTrip?.status === "in_progress";
  const { driverPosition, driverHeading, arrived } = useDriverSimulation(
    originLocation,
    tripActive,
    GOOGLE_PLACES_API_KEY,
  );

  const handleCloseVehicleModal = () => {
    setShowVehicleModal(false);
    setDirectionsRoute([]);
    setEncodedPolyline(null);
    setTimeAndDistance(null);
    setBaseFare(null);
  };

  const handlePayTrip = async () => {
    if (!activeTrip || paying) return;

    setPaying(true);

    try {
      const preference = await createPaymentPreference({
        title: "Viaje ZipCar",
        description: `Viaje de ${activeTrip.origin} a ${activeTrip.destination}`,
        price: activeTrip.price,
        quantity: 1,
        userEmail: user?.email || "test_user@test.com",
        origin: activeTrip.origin,
        destination: activeTrip.destination,
        vehicleType: activeTrip.vehicleType,
      });

      const paymentUrl =
        preference?.sandbox_init_point || preference?.init_point;

      if (!paymentUrl) {
        throw new Error("No se recibio una URL de pago de Mercado Pago.");
      }

      await WebBrowser.openBrowserAsync(paymentUrl);
      dispatch(markTripPaidInProgress());
    } catch (error) {
      console.log("PAYMENT ERROR:", error.message);
      Alert.alert(
        "Pago no disponible",
        error.message ||
          "No se pudo abrir Mercado Pago. Verifica que el backend Express este activo.",
      );
    } finally {
      setPaying(false);
    }
  };

  const handleFinishTrip = async () => {
    if (!activeTrip || finishingTrip) return;

    if (!user?.uid) {
      Alert.alert("Sesion requerida", "Inicia sesion para guardar el viaje.");
      return;
    }

    setFinishingTrip(true);

    try {
      await addDoc(collection(db, "trips"), {
        userId: user.uid,
        origin: activeTrip.origin,
        destination: activeTrip.destination,
        vehicleType: activeTrip.vehicleType,
        distance: activeTrip.distance,
        duration: activeTrip.duration,
        price: activeTrip.price,
        status: "completed",
        paymentStatus: "paid",
        createdAt: activeTrip.createdAt
          ? new Date(activeTrip.createdAt)
          : serverTimestamp(),
        completedAt: serverTimestamp(),
      });

      Alert.alert("Viaje exitoso");
      dispatch(clearActiveTrip());
      resetTripForm();
      navigation.getParent()?.navigate("HistoryTab");
    } catch (error) {
      console.log("FINISH TRIP ERROR:", error.message);
      Alert.alert(
        "No se pudo finalizar",
        "Intenta de nuevo para guardar el viaje en el historial.",
      );
    } finally {
      setFinishingTrip(false);
    }
  };

  const moveCameraToLocation = (latitude, longitude) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const handleGetPlaceDetails = (data, details, isOrigin) => {
    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;

    if (lat == null || lng == null) {
      alert("No se pudieron obtener los detalles del lugar.");
      return;
    }

    const address = details?.formatted_address ?? data?.description ?? "";

    const coords = { latitude: lat, longitude: lng };

    if (isOrigin) {
      setOriginAddress(address);
      setOriginLocation(coords);
      moveCameraToLocation(lat, lng);
    } else {
      setDestinationAddress(address);
      setDestinationLocation(coords);
    }
  };

  const showSearchCard = !activeTrip && !showVehicleModal;

  if (!location) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.emptyState}>
          {permissionDenied ? (
            <>
              <Text style={globalStyles.emptyText}>
                Necesitamos acceso a tu ubicación para mostrar el mapa.
              </Text>
              <TouchableOpacity
                style={[globalStyles.button, { marginTop: 20 }]}
                onPress={getCurrentLocation}
              >
                <Text style={globalStyles.buttonText}>Reintentar permiso</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  { marginTop: 12, backgroundColor: COLORS.primaryDark },
                ]}
                onPress={openLocationSettings}
              >
                <Text style={globalStyles.buttonText}>Abrir ajustes</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={globalStyles.emptyText}>Cargando la ubicación...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={globalStyles.container}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.16,
          longitudeDelta: 0.16,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {originLocation && (
          <Marker coordinate={originLocation} title="Origen" pinColor="green" />
        )}
        {destinationLocation && (
          <Marker
            coordinate={destinationLocation}
            title="Destino"
            pinColor="red"
          />
        )}
        {driverPosition?.latitude != null &&
          driverPosition?.longitude != null && (
            <Marker
              coordinate={driverPosition}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
            >
              <Ionicons name="car-sport" size={28} color="#1D9E75" />
            </Marker>
          )}
        {directionsRoute.length > 0 && (
          <Polyline
            coordinates={directionsRoute}
            strokeWidth={5}
            strokeColor={COLORS.primary}
          />
        )}
      </MapView>

      {showSearchCard && (
        <View style={globalStyles.tripBottomCard}>
          <Text style={globalStyles.cardTitle}>Solicita tu viaje</Text>

          <GooglePlacesAutocomplete
            styles={{ container: globalStyles.placeAutocomplete }}
            placeholder="Punto de partida"
            fetchDetails
            onPress={(data, details) =>
              handleGetPlaceDetails(data, details, true)
            }
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: "es",
            }}
            debounce={200}
          />

          <GooglePlacesAutocomplete
            styles={{ container: globalStyles.placeAutocomplete }}
            placeholder="Destino"
            fetchDetails
            onPress={(data, details) =>
              handleGetPlaceDetails(data, details, false)
            }
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: "es",
            }}
            debounce={200}
          />

          <TouchableOpacity
            style={globalStyles.button}
            onPress={handleRequestTrip}
            disabled={loadingRoute}
          >
            {loadingRoute ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={globalStyles.buttonText}>Buscar destino</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTrip && (
        <View style={globalStyles.tripBottomCard}>
          <Text style={globalStyles.cardTitle}>
            {activeTrip.status === "in_progress"
              ? "Viaje en progreso"
              : "Viaje solicitado"}
          </Text>
          <Text style={globalStyles.bodyText}>
            Vehiculo: {activeTrip.vehicleType}
          </Text>
          <Text style={globalStyles.bodyText}>Origen: {activeTrip.origin}</Text>
          <Text style={globalStyles.bodyText}>
            Destino: {activeTrip.destination}
          </Text>
          <Text style={globalStyles.bodyText}>
            {activeTrip.distance} · {activeTrip.duration} ·{" "}
            {formatFare(activeTrip.price)}
          </Text>

          {activeTrip.status === "in_progress" ? (
            <>
              <Text style={globalStyles.bodyText}>
                Tu conductor se esta aproximando en tiempo real.
              </Text>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={handleFinishTrip}
                disabled={finishingTrip}
              >
                {finishingTrip ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={globalStyles.buttonText}>Finalizar viaje</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={globalStyles.button}
              onPress={handlePayTrip}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={globalStyles.buttonText}>Pagar</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseVehicleModal}
      >
        <Pressable
          style={globalStyles.modalOverlay}
          onPress={handleCloseVehicleModal}
        >
          <Pressable
            style={globalStyles.vehicleModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={globalStyles.cardTitle}>Elige tu vehículo</Text>

            {loadingEstimate ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginVertical: 16 }}
              />
            ) : timeAndDistance ? (
              <Text style={globalStyles.bodyText}>
                {timeAndDistance.distance} · {timeAndDistance.duration}
              </Text>
            ) : null}

            {VEHICLE_OPTIONS.map((vehicle) => {
              const fare = getVehicleFare(vehicle.multiplier);
              const isSelected = selectedVehicle === vehicle.id;
              const surchargeLabel =
                vehicle.multiplier === 1
                  ? "Tarifa estándar"
                  : vehicle.multiplier === 1.15
                    ? "+15% sobre tarifa base"
                    : "+30% sobre tarifa base";

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    globalStyles.vehicleOption,
                    isSelected && globalStyles.vehicleOptionSelected,
                  ]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <View>
                    <Text style={globalStyles.vehicleOptionLabel}>
                      {vehicle.label}
                    </Text>
                    <Text style={globalStyles.vehicleOptionMeta}>
                      {surchargeLabel}
                    </Text>
                  </View>
                  <Text style={globalStyles.vehicleOptionPrice}>
                    {fare != null ? formatFare(fare) : "—"}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[globalStyles.button, { marginTop: 20 }]}
              onPress={handleConfirmTrip}
              disabled={loadingEstimate || baseFare == null}
            >
              <Text style={globalStyles.buttonText}>Solicitar viaje</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
