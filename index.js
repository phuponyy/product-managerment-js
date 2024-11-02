require("dotenv").config();
const express = require("express");
const database = require("./config/database");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

database.connect();

const route = require("./api/v1/routes");

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(cookieParser());

// parser application/json
app.use(bodyParser.json());

route(app);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
