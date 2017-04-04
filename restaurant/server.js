let Promise = require('bluebird');
let express = require('express');
let hbs = require('hbs');

const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')({ promiseLib: Promise });

app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

var db = pgp({
    host: "127.0.0.1",
    database: "restaurant",
});

app.get('/', function(request, response, next) {
    response.render('home.hbs', {
        title: "Restaurant Search"
    })
});

app.get('/search', function(request, response, next) {
    var search = request.query.search;
    db.any("select name, id from restaurant where name ilike '%$1%'" ,search)
        .then(function(results) {
            response.render('search_results.hbs', {
                results: results
            });
        })
        .catch(next);
});

app.get('/restaurant/:id', function(request, response, next) {
    var id = request.params.id;
    db.any(`select name,address,category from restaurant where id = $1;`,id)
      .then(function(result1){
        return[result1, db.any("select distinct(review.id) stars, title, review from review, restaurant where review.restaurant_id = $1;",id)]
      })
      .spread(function(restaurantData, reviewData){
        response.render('restaurant.hbs', {
            restaurants: restaurantData,
            reviews: reviewData
        });
      })
      .catch(next);
});
// response.render('submitReview.hbs', {
//        title: "Review Submission"
//    })


app.get('/submitReview', function(request, response, next){
  // response.render('submitReview.hbs', {
  //        title: "Review Submission"
  //    })
})
app.post('/submit_review/:id', function(req, res, next) {
  var restaurantId = req.params.id;
  console.log('restaurant ID',restaurantId);
  console.log('from the form', req.body);
  db.none('insert into review values(default, NULL, $1, $2, $3, $4)',req.body.stars, req.body.title, req.body.review, restaurantId)
  .then(function() {
    resp.redirect('/restaurant/$1', restaurant_id);
  })
  .catch(next);


});

app.listen(3000, function() {
    console.log('Listening on port 3000.');
});
