require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

app.get("/", (req, res) => {
  res.json({
    message: "ZipCar backend is running",
  });
});

app.post("/create-payment-preference", async (req, res) => {
  try {
    const {
      title = "ZipCar Ride",
      description = "Solicitud de viaje ZipCar",
      price = 15000,
      quantity = 1,
      userEmail = "test_user@test.com",
      origin = "Ubicación actual",
      destination = "Destino seleccionado",
      vehicleType = "Económico",
    } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title,
            description,
            quantity: Number(quantity),
            currency_id: "COP",
            unit_price: Number(price),
          },
        ],
        payer: {
          email: userEmail,
        },
        metadata: {
          origin,
          destination,
          vehicleType,
        },
        back_urls: {
          success: "https://www.mercadopago.com.co/",
          failure: "https://www.mercadopago.com.co/",
          pending: "https://www.mercadopago.com.co/",
        },
        auto_return: "approved",
        external_reference: `zipcar_${Date.now()}`,
        statement_descriptor: "ZIPCAR",
      },
    });

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Mercado Pago error:", error);

    return res.status(500).json({
      error: "Could not create payment preference",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`ZipCar backend running on http://localhost:${PORT}`);
});