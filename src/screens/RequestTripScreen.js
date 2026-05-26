import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, globalStyles } from "../styles/globalStyles";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { decodePolyline } from "../utils/decodePolyline";
import { fetchDirections } from "../utils/directionsApi";
import {
  VEHICLE_OPTIONS,
  calculateBaseFare,
  calculateVehicleFare,
  formatFare,
} from "../utils/fareUtils";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

export default function RequestTripScreen() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [originAddress, setOriginAddress] = useState("");
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [tripInProgress, setTripInProgress] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("economico");
  const [directionsRoute, setDirectionsRoute] = useState([]);
  const [timeAndDistance, setTimeAndDistance] = useState(null);
  const [baseFare, setBaseFare] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Permiso de ubicación denegado");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation.coords);
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
    setTripInProgress(false);

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
      GOOGLE_PLACES_API_KEY
    );

    if (!result?.encodedPolyline) {
      alert("No se pudo obtener la ruta. Verifica origen y destino.");
      return null;
    }

    const coordinates = decodePolyline(result.encodedPolyline);
    setDirectionsRoute(coordinates);

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
          GOOGLE_PLACES_API_KEY
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

  const handleConfirmTrip = () => {
    setShowVehicleModal(false);
    setTripInProgress(true);
  };

  const handleCloseVehicleModal = () => {
    setShowVehicleModal(false);
    setDirectionsRoute([]);
    setTimeAndDistance(null);
    setBaseFare(null);
  };

  const getVehicleFare = (multiplier) => {
    if (baseFare == null) return null;
    return calculateVehicleFare(baseFare, multiplier);
  };

  const selectedVehicleOption = VEHICLE_OPTIONS.find(
    (v) => v.id === selectedVehicle
  );

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

    const address =
      details?.formatted_address ?? data?.description ?? "";

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

  const showSearchCard = !tripInProgress && !showVehicleModal;

  if (!location) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={globalStyles.emptyText}>Cargando ubicación...</Text>
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

      {tripInProgress && (
        <View style={globalStyles.tripBottomCard}>
          <Text style={globalStyles.cardTitle}>Viaje en curso</Text>
          <Text style={globalStyles.bodyText}>
            Vehículo: {selectedVehicleOption?.label}
          </Text>
          <Text style={globalStyles.bodyText}>Origen: {originAddress}</Text>
          <Text style={globalStyles.bodyText}>
            Destino: {destinationAddress}
          </Text>
          {timeAndDistance && (
            <Text style={globalStyles.bodyText}>
              {timeAndDistance.distance} · {timeAndDistance.duration}
              {baseFare != null &&
                selectedVehicleOption &&
                ` · ${formatFare(getVehicleFare(selectedVehicleOption.multiplier))}`}
            </Text>
          )}
          <Text style={globalStyles.bodyText}>
            Tu conductor se está aproximando en tiempo real.
          </Text>
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
