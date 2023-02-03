//jshint esversion:6
//jshint esversion:8

const express = require('express');
const app = express();
require('dotenv').config();
app.set("view engine", "ejs");
app.use(express.static('public'));
const bodyParser = require('body-parser');
var multer = require('multer');
var path = require("path");
var cloudinary = require('cloudinary');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');
var flash = require('connect-flash');
const DatauriParser = require('datauri/parser');
const swal = require('sweetalert');
const fetch = require('node-fetch');

//cloudinary i.e cloud storage of images
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID,
  api_secret: process.env.API_SECRET
});

//multer for images
var Storage = multer.memoryStorage();
// var Storage = multer.diskStorage({
//   destination: "public/images/",
//   filename: function (req, file, cb) {
//     let extArray = file.mimetype.split("/");
//     let extension = extArray[extArray.length - 1];
//     cb(null, file.fieldname + '-' + Date.now()+ '.' +extension);
//   }
// });
const uploadFilter = function(req, file, cb) {
  // filter rules here
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|bmp|BMP|jfif|JFIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!,go back and try again';
    return cb(new Error('Only image files are allowed!,go back and try again'), false);
  }
  cb(null, true);
};




var upload = multer({
  storage: Storage,
  fileFilter: uploadFilter
}).array('file', 3);


app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//mongoose connection
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/regDb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

// user schema
const regSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
});

regSchema.plugin(passportLocalMongoose);
regSchema.plugin(findOrCreate);


var user = new mongoose.model('user', regSchema);

//passport config
passport.use(new LocalStrategy(user.authenticate()));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    user.findOrCreate({
      fname: profile.name.givenName,
      lname: profile.name.familyName,
      username: profile.emails[0].value
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

// college schema
const colSchema = new mongoose.Schema({
  cname: {
    type: String,
    required: true
  },
  ccity: {
    type: String,
    required: true
  },
  cutoff: {
    type: Number,
    required: true
  },
  ratings: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  image: [{
    type: String
  }]

});

var college = mongoose.model('college', colSchema);


//server start
const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.get('/reg.html', (req, res) => {
  res.render('reg', {
    err: ""
  });

});

// routes handling
// edu=>intial page   ;   home=>option slection page   ;  admin=>admin page    ; reg=>registration page
app.get('/', (req, res) => {
  res.render("edu", {
    neww: ''
  });

});

app.post('/reg.html', (req, res) => {
  const fn = req.body.first_name;
  const ln = req.body.last_name;
  const e = req.body.email;
  const p = req.body.password;


  user.register({
    fname: fn,
    lname: ln,
    username: e
  }, req.body.password, function(err, user) {
    if (err) {
      req.flash('message', 'User Already Exist');
      res.render('reg', {
        err: req.flash('message')
      });
      console.log(err);
    } else {
      res.render("edu", {
        neww: ''
      });
    }

  });

});


app.post('/edu.html', (req, res) => {
  if (req.body.username == process.env.ADMIN_UN && req.body.password == process.env.ADMIN_PW) {
    var mysort = {cutoff: -1};
    college.find((err, docs) => {
      if (err) {
        console.log(err);
      } else {

        res.render('admin', {
          list: docs
        });
      }
    }).sort(mysort);
  } else {
    const user1 = new user({
      username: req.body.username,
      password: req.body.password
    });
    if (!req.body.username) {
      res.json({
        success: false,
        message: "Username was not given"
      });
    } else {

      if (!req.body.password) {
        res.json({
          success: false,
          message: "Password was not given"
        });
      } else {
        passport.authenticate('local', function(err, user1, info) {
          if (err) {
            res.json({
              success: false,
              message: err
            });
          } else {
            if (!user1) {
              req.flash('message', 'Username/Password INCORRECT');
              res.render('edu', {
                neww: req.flash('message')
              });
              //  res.json({success: false, message: 'username or password incorrect'});
            } else {

              req.login(user1, function(err) {
                if (err) {
                  res.json({
                    success: false,
                    message: err
                  });
                } else {

                  res.redirect("/home.html");
                }
              });
            }
          }
        })(req, res);
      }
    }
  }
});

app.get('/home.html', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(__dirname + '/home.html');
  } else {
    res.render("edu", {
      neww: ''
    });
  }
});

app.post('/home.html', function(req, res) {
  var a = Number(req.body.physics);
  var b = Number(req.body.chemistry);
  var c = Number(req.body.maths);
  const d = Number((a + b + c) / 3);
  const per = d;
var mysort = {cutoff: -1};

  college.find({
    cutoff: {
      $lt: per
    }
  }, function(err, college) {
    if (err) {
      console.log(err);
    } else {


      res.render("find", {
        percen: per,
        list: college
      });
    }

  }).sort(mysort);

});


// handle add data request
app.post('/adminadd', upload, async function(req, res) {

  var u2 = new college({
    cname: req.body.cname,
    ccity: req.body.ccity,
    cutoff: req.body.cutoff,
    ratings: req.body.ratings,
    fees: req.body.fees,
  });
  for (var i = 0; i < 3; i++) {
    const parser = new DatauriParser();
    const buffer = req.files[i].buffer;
    parser.format('.png', buffer);
    var result = await cloudinary.uploader.upload(parser.content);
    var image = result.secure_url;
    u2.image.push(image);
  }
  await u2.save();
  college.find((err, docs) => {
    if (err) {
      console.log(err);
    } else {

      res.render('admin', {
        list: docs
      });
    }
  }).sort({cutoff: -1});
  });

// handles update data
app.get('/adminupdate/:id', (req, res) => {
  college.findById(req.params.id, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      console.log(docs);
      res.render('adminedit', {
        cdata: docs
      });
    }
  }).sort({cutoff: -1});
});
app.post('/eset', async(req, res) => {
  console.log(req.body._id);
  await college.findOneAndUpdate({_id: req.body._id},req.body,{new:true} ,(err, doc) => {
    if (err) {
      console.log(err);
      }
    else {

      college.find((err, docs) => {
        if (err) {
          console.log(err);
        } else {

          res.render('admin', {
            list: docs
          });
        }
      }).sort({cutoff: -1});

    }
  });
});

// route protection alternative
app.get('/admincancel', (req, res) => {
  req.flash('message', 'You Are Logged Out');
  res.render('edu', {
    neww: req.flash('message')
  });
});

// handles data delete
app.get('/admindelete/:id', async (req, res) => {
  console.log(req.params.id);
  await college.findByIdAndRemove(req.params.id, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.render('admin',{list:docs});
      //res.redirect('/admincancel');
    }
  });
});

// authentication
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile']
  }));

app.get('/auth/google/home',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  function(req, res) {
    // Successful authentication, redirect home.i.e. main page
    res.redirect('/home.html');
  });

app.get('/logout', (req, res) => {
  req.logout();
  res.render("edu", {
    neww: ''
  });

});


// handles near by request
app.post('/nearb',async(req,res)=>{
  let place = req.body.place;
  const category = req.body.category;
  if(place=='Parul Institute Of Technology,vadodara'){
    lat=22.289325;
    lng=73.363822;
  }
  else if (place=='The Maharaja Sayajirao University of Baroda') {
    lat=22.298041;
    lng=73.196995;
  }
  else if (place=='Sardar Vallabhbhai Patel Institute of Technology') {
    lat=22.468938;
    lng=73.076251;
  }
  else if (place=='Babaria Institute of Technology,vadodara') {
    lat=22.187696;
    lng=73.187851;
  }
  else if (place=='ITM Universe, Vadodara') {
    lat=22.450739;
    lng=73.354765;
  }
  else if (place=='Neotech Institute of Technology Vadodara') {
    lat=22.403477;
    lng=73.220829;
  }
  else if (place=='K. J. Institute of Engineering & Technology') {
    lat=22.565264;
    lng=73.243309;
  }
  else if (place=='Vadodara Institute of Engineering') {
    lat=22.407053;
    lng=73.306968;
  }
  else{
    lat=22.325011;
    lng=73.280850;
  }
      var requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

 fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&category=${category}&location=${lng},${lat}&outFields=Place_addr, PlaceName,Phone, Type&maxLocations=15`, requestOptions)
  .then(response => response.json())
  .then(result => {console.log(result);
    res.render('nearby',{list:result.candidates,lat:lat,lng:lng});
  })
  .catch(error => {console.log('error', error);
      res.redirect('/home.html');
      });
});
