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
    db.any("select name, id from restaurant where name ilike '%" + search + "%';")
        .then(function(results) {
            response.render('search_results.hbs', {
                results: results
            });
        })
        .catch(next);
});

app.get('/restaurant/:id', function(request, response, next) {
    var id = request.params.id;
    db.any("select name,address,category from restaurant where id = " + id + ";")
      .then(function(result1){
        return[result1, db.any("select distinct(review.id) stars, title, review from review, restaurant where review.restaurant_id = "+ id +";")]
      })
      .spread(function(restaurantData, reviewData){
        response.render('restaurant.hbs', {
            restaurants: restaurantData,
            reviews: reviewData
        });
      })
      .catch(next);
});

app.get('/submitReview', function(request, response, next) {
    response.render('home.hbs', {
        title: "Review Submission"
    })
});

app.listen(3000, function() {
    console.log('Listening on port 3000.');
});
