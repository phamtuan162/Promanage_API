require("dotenv").config();
const { User } = require("./models/index");
// const cron = require("node-cron");
// const blacklist_token = require("./cronjobs/blacklist_tokens");
// const card = require("./cronjobs/card");
// const mission = require("./cronjobs/mission");
// const column = require("./cronjobs/column");
var createError = require("http-errors");
var express = require("express");

var cookieParser = require("cookie-parser");
var path = require("path");
var logger = require("morgan");
var compression = require("compression");
var helmet = require("helmet");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const passport = require("passport");
const googlePassport = require("./passports/google.passport");
const githubPassport = require("./passports/github.passport");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiRouter = require("./routes/api/index");

const whitelist = require("./utils/cors");

//Cors
const cors = require("cors");
const corsOptions = {
  origin: (origin, callback) => {
    // Kiểm tra nếu origin có trong whitelist, cho phép hoặc từ chối
    if (whitelist.includes(origin) || !origin) {
      // (!origin && process.env.NODE_ENV === "development")

      // Nếu origin hợp lệ hoặc không có origin (ví dụ, đối với các yêu cầu từ localhost)
      callback(null, true);
    } else {
      // Nếu origin không hợp lệ
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true, // Cho phép cookie và xác thực
  optionsSuccessStatus: 200, // Trả về 200 cho các yêu cầu preflight
};

var app = express();

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));

// Middleware xóa cache HTTP
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// const session = require("express-session");
// const RedisStore = require("connect-redis")(session);
// const redisClient = require("redis").createClient();

// app.use(
//   session({
//     store: new RedisStore({ client: redisClient }),
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false }, // true nếu sử dụng HTTPS
//   })
// );

app.use(
  session({
    secret: "Pham Tuan",
    resave: false,
    saveUninitialized: true,
  })
);

// Cấu hình passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});

passport.use("google", googlePassport);

passport.use("github", githubPassport);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1", apiRouter);
app.use("/", indexRouter);
app.use("/users", usersRouter);

// cron.schedule("* 0 * * *", () => {
//   blacklist_token.delete();
// });

// cron.schedule("0 0 * * *", () => {
//   card.delete();
// });

// cron.schedule("0 1 * * *", () => {
//   column.delete();
// });

// cron.schedule("0 * * * *", () => {
//   card.HandleExpired();
// });

// cron.schedule("0 * * * *", () => {
//   mission.HandleExpired();
// });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
