import { StyleSheet } from "react-native";

export const COLORS = {
  primary: "#00C853",
  primaryDark: "#00A844",

  background: "#000000",
  surface: "#FFFFFF",

  textPrimary: "#FFFFFF",
  textSecondary: "#BDBDBD",

  textDark: "#111111",

  border: "#E5E7EB",

  error: "#DC2626",
  success: "#00C853",
  warning: "#F59E0B",

  disabled: "#9CA3AF",
};

export const globalStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
    backgroundColor: COLORS.background,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    marginBottom: 10,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
  },

  eyeButton: {
    paddingHorizontal: 14,
  },

  authContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    width: 200,
    height: 150,
    marginBottom: -10,
    resizeMode: "contain",
    alignSelf: "center",
  },

  logoText: {
    fontSize: 40,
    fontWeight: "900",
    color: "white",
    
  },

  logoTextGreen: {
    color: COLORS.primary,
  },

  profileLogoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },

  profileLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  profileLogoSmall: {
    width: 58,
    height: 42,
    resizeMode: "contain",
    marginRight: 8,
  },

  profilePhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },

  subtitle: {
    color: "#CFCFCF",
    fontSize: 15,
    textAlign: "center",
    marginTop: 5,
  },

  formCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 22,

    padding: 22,

    shadowColor: "#00C853",

    shadowOffset: {
      width: 0,
      height: 0,
    },

    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 6,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 18,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#DADADA",

    borderRadius: 12,

    paddingHorizontal: 16,
    paddingVertical: 14,

    marginBottom: 10,

    fontSize: 15,
    color: "#111111",
  },

  inputError: {
    borderColor: COLORS.error,
  },

  fieldGroup: {
    marginBottom: 10,
  },

  fieldLabel: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 4,
  },

  dropdownButton: {
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    color: "#111111",
    fontSize: 15,
    flex: 1,
  },

  dropdownPlaceholder: {
    color: "#777777",
  },

  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },

  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  dropdownOptionText: {
    color: "#111111",
    fontSize: 15,
  },

  photoPicker: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingVertical: 14,
  },

  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E9FBEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  photoPreview: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 8,
  },

  photoPickerText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "800",
  },

  error: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 4,
  },

  button: {
    backgroundColor: COLORS.primary,

    borderRadius: 12,

    paddingVertical: 15,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: "#111111",

    borderRadius: 12,

    paddingVertical: 15,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 12,
  },

  link: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
    fontSize: 15,
  },

  linkText: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 16,

    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  bodyText: {
    color: "#555555",
    fontSize: 14,
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  screenPadding: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#BDBDBD",
    fontSize: 16,
    marginTop: 12,
  },
  tripBottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 70,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    elevation: 8,
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  locationBox: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    backgroundColor: "#F9FAFB",
  },

  locationLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
    marginBottom: 4,
  },

  
  locationPlaceholder: {
    fontSize: 15,
    color: "#777",
    fontWeight: "500",
  },
  placeAutocomplete: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "gray",
    padding: 5,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  vehicleModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },

  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  vehicleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0FFF4",
  },

  vehicleOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  vehicleOptionPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },

  vehicleOptionMeta: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
});
