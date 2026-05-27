import axios from "axios";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://two-kids-unite.loca.lt";

export const createPaymentPreference = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/create-payment-preference`,
      paymentData
    );

    return response.data;
  } catch (error) {
    const backendMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    throw new Error(backendMessage);
  }
};
