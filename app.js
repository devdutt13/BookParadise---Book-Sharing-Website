//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const upload = require('express-fileupload');
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bcrypt = require('bcryptjs');
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const LocalStrategy = require('passport-local').Strategy;
const port = process.env.PORT || 3000; 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(flash());
app.use(upload());
app.use(session({
  secret: "This is IWP Project",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  phoneno:  Number,
  TC: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model("User", userSchema);

passport.use('local-login', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, function (req, username, password, done) {
  // Check the user in the database using promise syntax
  User.findOne({ username: username })
    .then(user => {
      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      return done(null, user);
    })
    .catch(err => {
      return done(err);
    });
}));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

// var LocalStrategy    = require('passport-local').Strategy
// passport.use('local-login', new LocalStrategy({
//     passReqToCallback : true 
// },
// function(req, username, password, done) {
//     User.findOne({ 'username' :  username }, function(err, user) {
//         if (err)
//             return done(err);
//         if (!user)
//             return done(null, false,{message: 'User  not Found'}); 
//         if (user.password!=password)
//             return done(null, false, {message: 'Incorrect Password'}); 
//         return done(null, user);
//     });
//   }
// ));
app.use(function (req, res,next){
  res.locals.currentUser = req.user;
  next();
})
function isLoggedIn(req,res,next) {
  if(req.isAuthenticated()){
      return next();
  }
  res.redirect("/login");
}
const commentSchema = new mongoose.Schema({
  title: String,
  author: String,
  comment: String,
  date: String

});
const Comment = mongoose.model("Comment", commentSchema);
const ratingSchema = new mongoose.Schema({
  value: Number,
  author: String
});
const Rating = mongoose.model("Rating", ratingSchema);
const bookSchema = new mongoose.Schema({
  btitle: String,
  bauthor: String,
  buploader:String,
  genre: String,
  bdes: String,
  comments: [commentSchema],
  ratings: [ratingSchema],
  TC: String,
  bloc: String
});
const Book = mongoose.model("Book", bookSchema);
app.get("/home", function (req, res) {
  res.render('home');
})

app.get("/register", function (req, res) {
  res.render('register', { message:" " });
});
app.get("/about", function (req, res) {
  res.render('about');
});
app.get("/author", function (req, res) {
  res.render('author');
});
app.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/home');
  });
});
app.get("/book", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("book");
  } else {
    res.redirect("login");
  }
});
app.get("/login", function (req, res) {
  res.render('login', { message:" " });
});
app.get("/forgot", function (req, res) {
  res.render('forgot', { message:" " });
});
app.get("/changepass", function (req, res) {
  res.render('changepass', { message:" " });
});
app.get("/tc", function (req, res) {
  res.render('tc');
});
app.get("/tcbook", function (req, res) {
  res.render('tcupload');
});
app.get("/profile", function (req, res) {
  Book.find({buploader:req.user.username}). then(books => {
    res.render("pdisplay", {
      books: books,
      pass: '***********',
      pshow:'Show',
      message:''
    });
  }).catch(err => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });;
});
app.get("/passdisplay/:pshw", function (req, res) {
  pshow1=req.params.pshw
  if(pshow1=='Show'){
    Book.find({buploader:req.user.username}, function (err, books) {
      res.render("pdisplay", {
        books: books,
        pass: req.user.password,
        pshow:'Hide',
        message:''
      });
    });
  }
  else{
    Book.find({buploader:req.user.username}, function (err, books) {
      res.render("pdisplay", {
        books: books,
        pass: '***********',
        pshow:'Show',
        message:''
      });
    });

  }
  
});
// app.post("/register", function (req, res) {
//   User.findOne({ username: req.body.username }, function (err, regUser) {
//     if (err) {
//       console.log(err);
//     } else if (regUser) {
//       res.render('register', { message: 'Username Exists' });
//     }
//     else if (req.body.password != req.body.cpassword) {
//       res.render('register', { message: 'Password Mismatch' });
//     }
//     else {
//       const reg = new User({
//         name: req.body.name,
//         username: req.body.username,
//         password: req.body.password,
//         phoneno:req.body.phoneno,
//         TC: req.body.tc
//       });
//       reg.save();
//       res.render('login',{ message: 'Registration Successful! Please Login to continue'});
//     }
//   });

// });
// app.post("/register", async function (req, res) {
//   try {
//     const regUser = await User.findOne({ username: req.body.username });

//     if (regUser) {
//       return res.render('register', { message: 'Username Exists' });
//     }

//     if (req.body.password !== req.body.cpassword) {
//       return res.render('register', { message: 'Password Mismatch' });
//     }

//     const reg = new User({
//       name: req.body.name,
//       username: req.body.username,
//       password: req.body.password,
//       phoneno: req.body.phoneno,
//       TC: req.body.tc
//     });

//     await reg.save();

//     res.render('login', { message: 'Registration Successful! Please Login to continue' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });
app.post("/register", async function (req, res) {
  try {
    const regUser = await User.findOne({ username: req.body.username });

    if (regUser) {
      return res.render('register', { message: 'Username Exists' });
    }

    if (req.body.password !== req.body.cpassword) {
      return res.render('register', { message: 'Password Mismatch' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const reg = new User({
      name: req.body.name,
      username: req.body.username,
      password: hashedPassword,
      phoneno: req.body.phoneno,
      TC: req.body.tc
    });

    await reg.save();

    res.render('login', { message: 'Registration Successful! Please Login to continue' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/reset", async function (req, res) {
  try {
    const regUser = await User.findOne({ username: req.body.username, phoneno: req.body.phoneno });

    if (!regUser) {
      throw new Error('Username or Phone Number did not match. Try Again');
    }

    if (req.body.password !== req.body.cpassword) {
      throw new Error('Password Mismatch');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await User.findOneAndUpdate({ username: req.body.username }, { password: hashedPassword });

    res.render('login', { message: 'Password Successfully Reset. Login to Continue' });
  } catch (err) {
    console.error(err);
    res.render('forgot', { message: err.message || 'Internal Server Error' });
  }
});


app.post("/changepass", async function (req, res) {
  const hashedPassword = await bcrypt.hash(req.body.npassword, 10);

  // Find the user based on some identifier like username or user ID
  User.findOne({ username: req.user.username })
    .then((regUser) => {
      if (!regUser) {
        // User not found
        return res.status(404).send('User not found');
      }

      // Assuming the user is found, check if the entered current password is correct
      bcrypt.compare(req.body.password, regUser.password, function (err, result) {
        if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
        }

        if (result) {
          // Current password is correct, update the password
          User.findOneAndUpdate(
            { username: req.user.username },
            { password: hashedPassword },
            { new: true } // To return the updated document
          )
            .then((updatedUser) => {
              // Logout and render login page with success message
              req.logout(function (err) {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Internal Server Error');
                }
                res.render('login', { message: 'Password Successfully Changed. Login to Continue' });
              });
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Internal Server Error');
            });
        } else {
          // Current password is incorrect
          res.render('changepass', { message: 'Current Password is Incorrect' });
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

// app.post("/changepass", function (req, res) {
//   User.findOne({ password: req.body.password}, function (err, regUser) {
//     if (err) {
//       console.log(err);
//     } else if (regUser) {
//       if(req.body.npassword===req.body.cpassword){
//         User.findOneAndUpdate({password: req.user.password },  
//           {password:req.body.npassword}, null, function (err) { 
//           if (err){ 
//               console.log(err) 
//           } else{
//             req.logout();
//             res.render('login', { message: 'Password Successfully Changed. Login to Continue' });
      
//           }
//         });
//       }else{
//         res.render('changepass', { message: 'Check Confirm Password Again' });
      
//     }  
//   }else{
//     res.render('changepass', { message: 'Wrong Current Password' });
//   }
//   });
// });

// app.post('/login', function(req, res, next) {
//   passport.authenticate('local-login', function(err, user, info) {
//     if (err) { return next(err) }
//     if (!user) {
//       return res.render('login', { message: info.message })
//     }
//     req.logIn(user, function(err) {
//       if (err) { 
//         return next(err); }
//       return res.redirect('/home');
//     });
//   })(req, res, next);
// });

// const authenticateAsync = (req, res, next) => {
//   return new Promise((resolve, reject) => {
//     passport.authenticate('local-login', (err, user, info) => {
//       if (err) {
//         reject(err);
//       }
//       if (!user) {
//         res.render('login', { message: info.message });
//         resolve(); // Resolving the promise since rendering is complete
//       } else {
//         req.logIn(user, (err) => {
//           if (err) {
//             reject(err);
//           } else {
//             res.redirect('/home');
//             resolve(); // Resolving the promise since redirecting is complete
//           }
//         });
//       }
//     })(req, res, next);
//   });
// };

app.post('/login', function (req, res, next) {
  passport.authenticate('local-login', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('login', { message: info.message });
    }

    // Use the promise syntax for findOne
    User.findOne({ _id: user._id })
      .then(foundUser => {
        // Process the foundUser object
        req.logIn(foundUser, function (err) {
          if (err) {
            return next(err);
          }
          return res.redirect('/home');
        });
      })
      .catch(err => {
        // Handle error
        return next(err);
      });
  })(req, res, next);
});



app.post("/bsearch", function (req, res) {
  var search = req.body.searchquery;
  var count;

  // Use promise with Book.countDocuments
  const countPromise = Book.countDocuments({ $or:[ {'btitle':search}, {'buploader':search},{'genre':search},{'bauthor':search}] });

  countPromise
    .then(c => {
      count = c;

      // Use promise with Book.find
      return Book.find({ $or:[
        {'btitle': { $regex: search, $options: 'i' }},
        {'buploader': { $regex: search, $options: 'i' }},
        {'genre': { $regex: search, $options: 'i' }},
        {'bauthor': { $regex: search, $options: 'i' }}
      ]});
    })
    .then(books => {
      if (count > 0) {
        res.render("bdisplay", {
          books: books,
          message: count + ' Book(s) Found for the search ' + '"' + search + '"'
        });
      } else {
        res.render("bdisplay", {
          books: books,
          message: 'No Book(s) Found for the search ' + '"' + search + '"'
        });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

 app.post("/com/:bid", function (req, res) {
 var date= new Date().toLocaleDateString();
  const com = new Comment({
    title: req.body.ctitle,
    comment: req.body.cbody,
    author: req.user.username,
    date: date

  });
  com.save();
  var bid = req.params.bid;
  Book.findOneAndUpdate(
    { _id: bid },
    { $push: { comments: com } },
   ).then(success =>{
    res.redirect('back');
   }).catch(err =>{
    console.log(err);
    res.status(500).send('Internal Server Error');
   })
 
});
app.post("/rat/:bid", function (req, res) {
  const rat = new Rating({
    value: req.body.rating,
    author: req.user.username

  });
  rat.save();
  var bid = req.params.bid;
  Book.findOneAndUpdate({ _id: bid }, { $push: { ratings: rat } })
  .then(success => {
    // Handle success
    res.redirect('back');
  })
  .catch(err => {
    // Handle error
    console.log(err);
    res.status(500).send('Internal Server Error');
  });
});
app.get("/del/:bid/:cid/:author", function (req, res) {
  var bid1 = req.params.bid;
  var cid1 = req.params.cid;
  var author1 = req.params.author;
  if (author1 === req.user.username) {
    Book.findOneAndUpdate(
      { _id: bid1 },
      { $pull: { comments: { _id: cid1 } } },
      { new: true }
    )
      .then(updatedBook => {
        // Handle the updated book if needed
        console.log("Book updated:", updatedBook);
  
        // Now, delete the comment
        return Comment.deleteOne({ _id: cid1 });
      })
      .then(deletedComment => {
        // Handle the deleted comment if needed
        console.log("Comment deleted:", deletedComment);
  
        // Redirect back after both operations are completed
        res.redirect('back');
      })
      .catch(err => {
        console.log(err);
        res.status(500).send('Internal Server Error');
      });
  }
});
app.post("/book", function (req, res) {
  var loc = __dirname + "/books/" + req.body.bname + ".pdf";
  const book = new Book({
    btitle: req.body.bname,
    bauthor: req.body.author,
    buploader:req.user.username,
    genre: req.body.genre,
    bdes: req.body.booksum,
    TC: req.body.tc,
    bloc: loc
  });
  book.save();
  
  if (req.files) {
    var file = req.files.bookfile
    var filename = req.body.bname + ".pdf"
  
    file.mv('./books/' + filename, function (err) {
      if (err) {
        console.log(err)
      } else {
        
        Book.find({})
        .then(books => {
          res.render("bdisplay", {
            books: books,
            message: 'Book Uploaded Successfully'
          });
        }).catch(err => {
          console.error(err);
          res.status(500).send('Internal Server Error');
        });
      }
    });
  }
});
app.get("/book", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("book");
  } else {
    res.redirect("login");
  }
});
app.get("/del/:bid", function (req, res) {
  var bid1 = req.params.bid;
     Book.deleteOne({ _id: bid1 }).then(success => {
      res.redirect('back');
    }).catch(err =>{
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
  
});
app.get("/booktemplate/:bid", async (req, res) => {
  var bid1 = req.params.bid;
  Book.findOne({ _id: bid1 })
  .then(book => {
      var c = 0;
      var ratsum = 0;
          book.ratings.forEach(function (rating) {
            ratsum = ratsum + rating.value;
            c = c + 1;  
        });
      
      var avR = ratsum / c;
     
      avR=avR.toFixed(1);
      res.render("booktemplate", {
        book: book,
        comments: book.comments,
        rating: avR,
        num:c
      });
    }).catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});
app.get("/bdisplay", function (req, res) {
  if (req.isAuthenticated()) {
    Book.find({})
      .then(books => {
        res.render("bdisplay", {
          books: books,
          message: ' '
        });
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
  } else {
    res.redirect("login");
  }
});


app.get("/downld/:btitle", async (req, res) => {
  var title = req.params.btitle + ".pdf";
  var path = __dirname + "/public/books/" + title;
  res.download(path, title, function (err) {
    if (err) {
      console.log(err);
    }
  });
});
app.listen(port, function () {
  console.log("Server started on port 3000");
});
