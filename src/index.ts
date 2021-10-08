import express from "express";
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import session from 'express-session';
import passport from 'passport'
import User from "./User";
import { IMongoDBUser } from "./types";
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GithubStrategy = require('passport-github').Strategy;

dotenv.config();

const app = express();

// const { MongoClient } = require('mongodb');
// const uri = "mongodb+srv://qiang:qiangli2@cluster0.n4wrt.mongodb.net/oauth?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   console.log(err);
//   const collection = client.db("oauth").collection("devices");
//   console.log(collection);
//   // perform actions on the collection object
//   client.close();
// });
mongoose.connect(`${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`, {}, () => {
// mongoose.connect("mongodb+srv://qiang:qiangli2@cluster0.n4wrt.mongodb.net/oauth?retryWrites=true&w=majority", {}, () => {
  console.log(mongoose.connection.readyState)
  console.log("connected to mongoose successfully!");
})

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))


app.set("trust proxy", 1);

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "none",
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user:any, done:any) => {
  return done(null, user._id);
})

passport.deserializeUser((id: string, done: any) => {
  User.findById(id, (err:Error, doc: IMongoDBUser) => {
    return done(err, doc);
  })
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
  User.findOne({googleId: profile.id}, async(err:Error, doc: IMongoDBUser) => {
    if (err){
      return cb(err, null);
    }
    if (!doc) {
      const newUser = new User({
        googleId: profile.id,
        username: profile.name.givenName
      });
      await newUser.save();
      cb(null, newUser);
    }
    cb(null, doc);
  });

}
));

passport.use(new TwitterStrategy({
  consumerKey: `${process.env.TWITTER_CLIENT_ID}`, 
  consumerSecret: `${process.env.TWITTER_CLIENT_SECRET}`,
  callbackURL: "/auth/twitter/callback"
},
function(_accessToken: any, _refreshToken: any, profile: any, cb: any) {
  // successfull login
  // insert into db
  console.log("insdie call back");
  console.log("profile Id is: ", profile.id );
  User.findOne({twitterId: profile.id}, async(err:Error, doc: IMongoDBUser) => {
    console.log("inside find one", doc);
    if (err){
      console.log("error is", err);
      return cb(err, null);
    }
    if (!doc){
      // create new user
      const newUser = new User({
        twitterId: profile.id,
        username: profile.username,
      });
      await newUser.save();
      cb(null, newUser);
    }
    cb(null, doc);
  });
}
));

passport.use(new GithubStrategy({
  clientID: `${process.env.GITHUB_CLIENT_ID}`,
  clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
  callbackURL: "/auth/github/callback"
},
function(_accessToken: any, _refreshToken: any, profile: any, cb: any) {
  // successfull login
  // insert into db
  User.findOne({githubId: profile.id}, async(err:Error, doc: IMongoDBUser) => {
    if (err){
      return cb(err, null);
    }
    if (!doc){
      // create new user
      const newUser = new User({
        githubId: profile.id,
        username: profile.username,
      });
      await newUser.save();
      cb(null, newUser);
    }
    cb(null, doc);
  });
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

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(_req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000/');
  });

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/getuser", (req, res) => {
  // console.log("req.user is: ", req.user);
  res.send(req.user);
});

app.get("/auth/logout", (req, res) => {
  if (req.user){
    req.logout();
    res.send("Done");
  }
})

app.listen(process.env.PORT || 4000, () => console.log("Example app listening on port 4000!"));
