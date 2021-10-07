import express from "express";
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import session from 'express-session';
import passport from 'passport'
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

dotenv.config();

const app = express();

mongoose.connect(`
    ${process.env.START_MONGODB}
    ${process.env.MONGODB_USERNAME}:
    ${process.env.MONGODB_PASSWORD}
    ${process.env.END_MONGODB}`, {
}, () => {
  console.log("connected to mongoose successfully!");
})

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
  return done(null, user);
})

passport.deserializeUser((user: any, done: any) => {
  return done(null, user);
})

// First name
// Last name
// ID of OAuth system 

passport.use(new GoogleStrategy({
  clientID:    `${process.env.GOOGLE_CLIENT_ID}`, 
  clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
  callbackURL: "/auth/google/callback",
  // passReqToCallback   : true
},
function(_accessToken: any, _refreshToken: any, profile: any, cb: any) {
  // successfull login
  // insert into db
  console.log("profile is: ", profile);
  cb(null, profile);
}
));

passport.use(new TwitterStrategy({
  consumerKey: `${process.env.TWITTER_CLIENT_ID}`, 
  consumerSecret: `${process.env.TWITTER_CLIENT_SECRET}`,
  callbackURL: "http://localhost:4000/auth/twitter/callback"
},
function(_accessToken: any, _refreshToken: any, profile: any, cb: any) {
  // successfull login
  // insert into db
  console.log("profile is: ", profile);
  cb(null, profile);
}
));

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [  'profile' ] }
));

app.get('/auth/google/callback',
    passport.authenticate( 'google', {
        failureRedirect: '/login' }),
    function(_req, res) {
      res.redirect('http://localhost:3000/');
    });

app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(_req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000/');
  });

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/getuser", (req, res) => {
  console.log("req.user is: ", req.user);
  res.send(req.user);
});

app.listen(4000, () => console.log("Example app listening on port 4000!"));
