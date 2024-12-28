const { User, Provider } = require("../models/index");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const LocalStrategy = require("passport-local").Strategy;
const passportLocal = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    //Xác thực email và password có tồn tại trong database hay không?
    const [provider, created] = await Provider.findOrCreate({
      where: { name: "email" },
      defaults: {
        name: "email",
      },
    });
    const user = await User.findOne({
      where: {
        email: email,
        provider_id: provider.id,
      },
    });
    if (!user) {
      return done(null, false, { message: "email không tồn tại" });
    }
    const passwordHash = user.password;
    const result = bcrypt.compareSync(password, passwordHash);
    if (result) {
      return done(null, user); //Lưu user vào session
    }

    done(null, false, {
      message: "Mật khẩu không chính xác",
    });
  }
);
module.exports = passportLocal;
