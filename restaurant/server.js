const express = require('express');
const Promise = require('bluebird');
const session = require('express-session');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
app.use(express.static('public'));

app.use(session({
  secret: 'topsecret',
  cookie: {
    maxAge: 600000000
  }
}));


var db = pgp({
    host: "127.0.0.1",
    database: "restaurant",
});


app.use(function printIt(req, res, next){
  fs.appendFile('./test.txt',(`Method: $1 \n path: $2 \n`, req.method, req.path), function(err){
    next();
  });
});

app.use(function(req, resp, next) {
  resp.locals.session = req.session;
  next();
});

app.get('/login', function(request, res, next) {
  res.render('login.hbs',{
    title: "Login"
  });
});

app.post('/submit_login',function(req, res, next){
  req.session.user = req.body.username;
  req.session.pass = req.body.Password;
  db.one(`select password from reviewer where name = '${req.session.user}'`)
    .then(function(results){

      if (results.password == req.session.pass){
        req.session.login = true;

        res.redirect('/search');
      }

    })
    .catch(next);

});
app.get('/', function(req, resp) {
  resp.render('search.hbs');
});


app.get('/search', function(request, res, next) {
  res.render('home.hbs')
    var search = request.query.search;
    console.log(`select name, id from restaurant where name ilike '%${search}%'`);
    db.one(`select name, id from restaurant where name ilike '%${search}%'`)
    .then(function(results) {
      console.log('yep.')
      res.render('search_results.hbs', {
          results: results
      });
    })
    .catch(next);
});

app.get('/search_results', function(req,res,next){
  res.render('search_results.hbs', {
      results: results
  })
  .catch(next);
})



app.get('/restaurant/:id', function(request, res, next) {
    var id = request.params.id;
    db.any("select name,address,category from restaurant where id = $1;",id)
      .then(function(result1){
        return[result1, db.any("select distinct(review.id) stars, title, review from review, restaurant where review.restaurant_id = $1;",id)]
      })
      .spread(function(restaurantData, reviewData){
        res.render('restaurant.hbs', {
            restaurants: restaurantData,
            reviews: reviewData
        });
      })
      .catch(next);
});
// res.render('submitReview.hbs', {
//        title: "Review Submission"
//    })


app.get('/submitReview', function(request, res, next){
  res.render('submitReview.hbs', {
         title: "Review Submission"
     })
})
app.post('/submit_review/:id', function(req, res, next) {
  var restaurantId = req.params.id;
  // console.log('restaurant ID',restaurantId);
  // console.log('from the form', req.body);
  db.none("insert into review values(default, NULL, $1, $2, $3, $4)",req.body.stars, req.body.title, req.body.review, restaurantId)
  .then(function() {
    resp.redirect('/restaurant/$1', restaurant_id);
  })
  .catch(next);


});

app.listen(3000, function() {
    console.log('Listening on port 3000.');
});
