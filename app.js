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


app.use(function (req, res,next){
  res.locals.currentUser = req.user;
  next();
})

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
  if (req.isAuthenticated()) {
    res.render('changepass', { message:" " });
  } else {
    res.redirect("login");
  }
 
});
app.get("/tc", function (req, res) {
  res.render('tc');
});
app.get("/tcbook", function (req, res) {
  res.render('tcupload');
});
app.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
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
    });
    
  } else {
    res.redirect("login");
  }
  
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
 const author = req.user ? req.user.username : 'Anonymous';
 var date= new Date().toLocaleDateString();
  const com = new Comment({
    title: req.body.ctitle,
    comment: req.body.cbody,
    author: author,
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
  const author = req.user ? req.user.username : 'Anonymous';
  const rat = new Rating({
    value: req.body.rating,
    author: author

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
  const author = req.user ? req.user.username : 'Anonymous';
  if (author1 === author) {
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
  }else{
    res.redirect('back');
  }
});
app.post("/book", async function (req, res) {
  var loc = __dirname + "/public/books/" + req.body.bname + ".pdf";
  const book = new Book({
    btitle: req.body.bname,
    bauthor: req.body.author,
    buploader:req.user.username,
    genre: req.body.genre,
    bdes: req.body.booksum,
    TC: req.body.tc,
    bloc: loc
  });
  await book.save();
  
  if (req.files) {
    var file = req.files.bookfile
    var filename = req.body.bname + ".pdf"
  
    file.mv('./public/books/' + filename, async function (err) {
      if (err) {
        console.log(err)
      } else {
        
      try {
          const books = await Book.find({});
          res.render("bdisplay", {
            books: books,
            message: 'Book Uploaded Successfully'
          });
        } catch (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        }
    }});
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
// app.get("/bdisplay", function (req, res) {
//   if (req.isAuthenticated()) {
//     Book.find({})
//       .then(books => {
//         res.render("bdisplay", {
//           books: books,
//           message: ' '
//         });
//       })
//       .catch(err => {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//       });
//   } else {
//     res.redirect("login");
//   }
// });

app.get("/bdisplay", function (req, res) {
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
