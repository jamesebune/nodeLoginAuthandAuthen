const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const argon2 = require("argon2"); //password hashing algorithm
//const argon2 = require('"@node-rs/argon2"');
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./passportConfig");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

//middlewares

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});
app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});
app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.name });
});
app.get("/users/logout", function (req, res, next) {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You have logged out");
    res.redirect("/users/login");
  });
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, confirm_password } = req.body;
  console.log({ name, email, password, confirm_password });

  //form validation
  let errors = [];
  if (!name || !email || !password || !confirm_password) {
    errors.push({ message: "Please enter all fields" });
  }
  if (password.length < 6) {
    errors.push({ message: "Password should be at least 6 characters" });
  }
  if (password != confirm_password) {
    errors.push({ message: "Passwords do not match" });
  }
  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    //form validation has passed, hash password
    //const hashedPassword = await argon2.hash("password");
    let hashedPassword = await bcrypt.hash(password, 10);

    //checking Db email matches
    pool.query(
      `SELECT * FROM users
        WHERE email=$1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        //console.log(results.rows);

        if (results.rows.length > 0) {
          errors.push({ message: "Email already registered" });
          res.render("register", { errors });
        } else {
          pool.query(
            `INSERT INTO users(name,email,password)
            VALUES($1,$2,$3) RETURNING id,PASSWORD`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              } else {
                //console.log(results.rows);
                req.flash(
                  "success_msg",
                  "You are now registered, please login"
                );
                res.redirect("/users/login");
              }
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
