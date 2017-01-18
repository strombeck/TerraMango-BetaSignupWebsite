var express = require('express');
var getConnection = require('../bin/get-connection.js');
var router = express.Router();
var validator = require('validator');

router.post('/%F0%9F%91%BD',function(req,res){
  var email=req.body.email;
  var state=req.body.state;
  var phone=req.body.phone;


if (!(validator.isEmail(email))) {
        res.send("Bad email");
        console.error("E-mail field didn't pass validation: " + email);
    } 
    else if (state.length > 2 || state.length == 0 ){
        res.send("State is invalid");
        console.error("State field didn't pass validation: " + state);
    } 
    else if (phone != '0' && phone != '1'){
        res.send("You have a windows phone, don't you?");
        console.error("Phone field didn't pass validation: " + phone);
    } 
    else {
        getConnection((err, pg) => {
          if (err) {
            console.error(err);
            res.end(err);
          } 
          var headers = req.headers;
          console.log('made it to server')
            pg.client.query("INSERT into signup (email, state, phone_type) VALUES ($1, $2, $3 )", [email, state, phone], (err, result) => {
              pg.done();
              if (err) {
                console.error(err);
                res.send("There was a problem saving your email to the server. Please try again later.");
              } 
              else {
                console.log(JSON.stringify(headers));
                console.log("Made it to the database");
                res.send("Success"); 
                // headers["x-requested-with"] === "XMLHttpRequest"
              }
            });
        });
    }
});

module.exports = router;
