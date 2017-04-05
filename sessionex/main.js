let Promise = require('bluebird');
let express = require('express');
let hbs = require('hbs');
var fs = require('fs-promise');

const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')({ promiseLib: Promise });
const session = require('express-session');

app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
  secret: 'testtesttest',
  cookie:{
    maxAge: 60000
  }
}));


app.get('/', function(req,res){
  res.render('ask.hbs');
});

app.post('/submit', function(req,res){
  console.log(req.body.uName);
  req.session.loggedInUser = req.body.uName;
  res.redirect('/greet');
});

app.get('/greet', function(req,res){
  // console.log(req.session.loggedInUser);
  res.render('greet.hbs',{
    name: req.session.loggedInUser
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000.');
});
