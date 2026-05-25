import axios from "axios";

const API_URL = "https://tidy-crews-like.loca.lt";

export const createPaymentPreference = async (paymentData) => {
  const response = await axios.post(
    `${API_URL}/create-payment-preference`,
    paymentData
  );

  return response.data;
};