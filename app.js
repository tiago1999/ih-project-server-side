const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const app = express();

// ---- CONFIGURING HELPERS ----

const response = require("./helpers/response");
const configurePassport = require("./helpers/passport");

// --- CONNECT TO MONGOOSE ---
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});

// ---- APP SETUP ----

app.use(cors({
  credentials: true,
  origin: [process.env.CLIENT_URL]
}));

app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  }),
  secret: "todo-app",
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// ---- CONFIGURING ROUTES ----

const auth = require("./routes/auth");
const restaurants = require("./routes/restaurants");
// const business = require("./routes/business");

app.use("/auth", auth);
app.use("/", restaurants);
// app.use("/", business);

// ---- ERROR HANDLING ----

// catch 404 and forward to error handler
app.use((req, res) => {
  response.notFound(req, res);
});

// error handler
app.use((err, req, res, next) => {
  console.error("error", req.method, req.path, err);

  // return the error page
  if (!res.headersSent) {
    response.unexpectedError(req, res);
  }
});

module.exports = app;
