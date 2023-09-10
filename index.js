const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const stripeRoutes = require("./routes/stripeRoutes");
const subscribeRoutes = require("./routes/subscribeRoutes");
const { twilioHook } = require("./utils/twilio");
const { checkCheckout } = require("./controller/stripeControler");
const {
  assignNumbersToAll,
  findLatest,
  correctEndDate,
  assignKeyToAll,
} = require("./controller/assignController");
require("colors");
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to API");
});

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 5000;

app.use("/stripe", stripeRoutes);
app.use("/subscribe", subscribeRoutes);
app.post("/twilio-hook", twilioHook);
app.get("/checkout/:id", checkCheckout);
app.get("/assign", assignNumbersToAll);
app.get("/assign-key", assignKeyToAll);
app.get("/test-ip", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  res.send(ip);
});
mongoose.set("strictQuery", false);

mongoose
  .connect(CONNECTION_URL)
  .then((conn) => {
    console.log(`MongoDB Conencted: ${conn.connection.host}`.yellow.bold);
    app.listen(PORT, () => {
      console.log(`Server running on port : ${PORT}`.yellow.bold);
      console.log(
        `Server Link: `.green + `http://localhost:${PORT}`.green.underline
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });
