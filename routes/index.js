"use strict";

var express = require('express');
var getConnection = require('../bin/get-connection.js');
var router = express.Router();
var validator = require('validator');

router.get("/", function(req, res){
	res.render("index", {formErorr: null});
})

router.get('/%F0%9F%91%BD', function(req, res){
	res.render("index");
})

router.post('/%F0%9F%91%BD',function(req,res){
	var email=req.body.email;
	var state=req.body.state;
	var phone=req.body.phone_type;
	var headers = req.headers;
	var jsEnabled = headers["x-requested-with"] === "XMLHttpRequest";


	if (!(validator.isEmail(email))) {
		if (!jsEnabled) {
			res.render('index', {formError: 'Invalid E-mail, check to make sure you entered your correct e-mail or try a different one.', hasError: true});
		} 
		else {
				res.send("Invalid E-mail, check to make sure you entered your correct e-mail or try a different one.");
				console.error("E-mail field didn't pass validation: " + email);
		}
	} 
	else if (state.length > 2 || state.length == 0 ){
		if (!jsEnabled) {
			res.render('index', {formError: 'State selected is invalid, please choose another state or refresh and try again', hasError: true});
		} 
		else {
			res.send("State is invalid");
			console.error("State field didn't pass validation: " + state);
		}
		} 
		else if (phone != '0' && phone != '1'){
		if (!jsEnabled) {
			res.render('index', {formError: 'Good or evil phones only, please! Check the Good or Evil field and make sure you select Android or iPhone', hasError: true});
		} 
		else {
			res.send("You have a windows phone, don't you?");
			console.error("Phone field didn't pass validation: " + phone);
		}
		} 
		else {
			getConnection((err, pg) => {
			if (err) {
				console.error(err);
				res.end(err);
			} 
			console.log('Made it to server')
				pg.client.query("INSERT into signup (email, state, phone_type) VALUES ($1, $2, $3)", [email, state, phone], (err, result) => {
				pg.done();
				if (err) {
					console.error(err);
					if (!jsEnabled) {
						res.render('index', {formError: 'We\'re having server problems, please try again in a few minutes', hasError: true});
					} 
					else {
						res.send("We\'re having server issues, please try again in a few minutes.");
					}
				} 
				else {
					console.log("Made it to the database");
					if (!jsEnabled) {
						res.render('index', {success: 'WooHoo! Form submitted', hasSuccess: true});
					} 
					else {
						res.send("Success"); 
					}
				}
			});
		});
	}
});

module.exports = router;