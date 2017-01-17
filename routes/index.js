var express = require('express');
var getConnection = require('../bin/get-connection.js');
var router = express.Router();
var validator = require('validator');

router.post('/%F0%9F%91%BD',function(req,res){
  var email=req.body.email;
  var state=req.body.state;
  var phone=req.body.phone;

  // if (!(validator.isEmail(email))) {
  //   console.error("E-mail field didn't pass validation: " + email);
  //   res.redirect("/?beta-signup=400")
  //   // res.status(400).send('Bad email');
  //   // response.send(String(444));
  //   // res.status("test")
  //   // res.writeHead(400, 'Please enter a valid e-mail address.')
  //   // res.write("444");
  //   // res.end(err);
  //   // res.status(406).send('E-mail Not Acceptable')
  //   // console.log(res.headersSent);
  // }

  // if (state.length > 2){
  //   console.error("State field didn't pass validation: " + state);
  //   res.redirect("/?beta-signup=401")
  //   // res.end(err);
  // }

  //   if (phone != 0 && phone != 1){
  //   console.error("Phone field didn't pass validation: " + phone);
  //   res.redirect("/?beta-signup=402")
  //   // res.end(err);
  // }

  getConnection((err, pg) => {
    var headers = req.headers;
    if (err) {
      console.error(err);
      res.end(err);
    } else if (!(validator.isEmail(email))) {
      res.sendStatus(998, "Bad E-mail");
        // res.status('488');
        // res.send('poooop');
        // res.end('test');
        console.error("E-mail field didn't pass validation: " + email);
        // res.redirect("/?beta-signup=400")
    } else if (state.length > 2 || state.length == 0 ){
        res.sendStatus(997, "State is invalid");
        console.error("State field didn't pass validation: " + state);
        // res.redirect("/?beta-signup=401")
    } else if (phone != '0' && phone != '1'){
        res.sendStatus(996, "You have a windows phone, don't you?");
        console.error("Phone field didn't pass validation: " + phone);
        // res.redirect("/?beta-signup=402")
    }
    else {
      pg.client.query("INSERT into signup (email, state, phone_type) VALUES ($1, $2, $3 )", [email, state, phone], (err, result) => {
        pg.done();
        if (err) {
          console.error(err);
          res.redirect("/?beta-signup=0")
        } else {
          res.redirect("/?beta-signup=1") 
          console.log(JSON.stringify(headers));
          console.log("Made it to the database")
          // headers["x-requested-with"] === "XMLHttpRequest"
        }
      });
    }
  });
});

module.exports = router;
