const bcrypt = require('bcrypt');
const password = 'james';

bcrypt.hash(password, 10)
  .then(function(encryptedPassword){
    console.log(encryptedPassword);
  })
  .catch(function(err){
    console.log(err.message);
  });
