if(process.env.NODE_ENV != "production"){
    require('dotenv').config({ silent: true });
}
const express = requirconste("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Utilities and Errors
const ExpressError = require("./utils/ExpressError.js");

// Routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

//  MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl = process.env.ATLASDB_URL;


main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dburl);//dburl
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dburl,//dburl
    crypto:{
        secret:process.env.SECERT,
    },
    touchAfter: 24*3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE",err);

});

const sessionOptions = {
    store,
    secret: process.env.SECERT,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// // Root Route
// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// });

// Use Routers
app.use("/listings", listingRouter);
// Note: Review routes are mounted to /listings/:id/reviews
app.use("/listings/:id/reviews", reviewRouter); 
app.use("/", userRouter);

//Redirect root to /listings
app.get("/", (req,res) => {
    res.redirect("/listings");
});

// Error Handling Routes
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went Wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});