const express = require('express');
const Promise = require('bluebird');
const session = require('express-session');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const bcrypt = require('bcrypt');
app.use(express.static('public'));

app.use(session({
  secret: 'topsecret',
  cookie: {
    maxAge: 600000000
  }
}));

app.use(function myMiddleware(request, response, next) {
  console.log(request.method, request.path);
  var contents = request.method + ' ' + request.path + '\n';
  fs.appendFile('log.txt', contents, function(err) {
    next();
  });
});

app.use(bodyParser.urlencoded({ extended: false }));

const db = pgp({
  database: 'restaurant'
});

app.use(function(req, resp, next) {
  resp.locals.session = req.session;
  next();
});

app.get('/login', function(req, resp) {
  resp.render('login.hbs');
});


app.post('/submit_login', function(req, resp) {
  var username = req.body.username;
  var password = req.body.password;


  console.log(username, password);
  db.one(`
    select * from reviewer where
    name = $1
  `, [username])
    .then(function(results) {
      console.log(results.password)
      bcrypt.compare(password, results.password)
        .then(function(matched){
          console.log('matched',matched)
          req.session.loggedInUser = username;
          resp.redirect('/');
        })
        .catch(function(err){
          resp.redirect('/login');
        })
    })
    .catch(function(err){
      console.log(err.message);
    });
});

app.post('/create_account', function(req, resp, next){
  console.log('test1');
  var username = req.body.newusername;
  var password = req.body.newpassword;
  var email = req.body.newemail;

  bcrypt.hash(password, 10)
    .then(function(encryptedPassword){
      password = encryptedPassword;
      console.log('test2');
      db.none(`insert into reviewer values(default, $1, $2, 1, $3)`,[username, email, password])
      .then(function(){
        resp.redirect('/login');
      })
      .catch(next);
    })
    .catch(next);
});

app.get('/', function(req, resp) {
  resp.render('search_form.hbs');
});

app.get('/search', function(req, resp, next) {
  let term = req.query.searchTerm;
  //console.log('Term:', term);
  db.any(`
    select * from restaurant
    where restaurant.name ilike $1
    `, `%${term}%`)
    .then(function(resultsArray) {
      //console.log('results', resultsArray);
      resp.render('search_results.hbs', {
        results: resultsArray
      });
    })
    .catch(next);
});

app.get('/restaurant/:id', function(req, resp, next) {
  let id = req.params.id;
  let sql = `
    select
      reviewer.name as reviewer_name,
      review.title,
      review.stars,
      review.review
    from
      restaurant
    inner join
      review on review.restaurant_id = restaurant.id
    left outer join
      reviewer on review.reviewer_id = reviewer.id
    where restaurant.id = $1
  `;
  //console.log(sql);
  db.any(sql, id)
    .then(function(reviews) {
      return [
        reviews,
        db.one(`
          select name as restaurant_name, * from restaurant
          where id = $1`, id)
      ];
    })
    .spread(function(reviews, restaurant) {
      resp.render('restaurant.hbs', {
        restaurant: restaurant,
        reviews: reviews
      });
    })
    .catch(next);
});

app.use(function authentication(req, resp, next) {
  if (req.session.loggedInUser) {
    next();
  } else {
    resp.redirect('/login');
  }
});

app.post('/submit_review/:id', function(req, resp, next) {
  var restaurantId = req.params.id;
  db.none(`insert into review values
    (default, NULL, $1, $2, $3, $4)`,
    [restaurantId, req.body.stars, req.body.title, req.body.review])
    .then(function() {
      resp.redirect(`/restaurant/${restaurantId}`);
    })
    .catch(next);
});




// app.post('/new_account', function(req,res,next){
//   var username = req.body.username;
//   var password = req.body.password;
//
//
// });
app.listen(3000, function() {
  console.log('Listening on port 3000.');
});
