"use strict";


var express = require('express');
var Base62 = require('base62');
var getConnection = require('../bin/get-connection.js');
var router = express.Router();
var validator = require('validator');
var postmark = require("postmark");
var pmClient = new postmark.Client(process.env.POSTMARK_KEY);
var validCountryCodes = "AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,FX,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,XK,YE,YT,ZA,ZM,ZW".split(",");

let desiredTimezoneOffset = -4; // EDT
let dateToCloseBetaSignup = new Date( new Date(2017, 5, 30, 0, 0, 0, 0).getTime() + desiredTimezoneOffset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );
let dateToAddKickstarterLink = new Date( new Date(2017, 5, 30, 8, 59, 30, 0).getTime() + desiredTimezoneOffset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );

function encodeId(id){
	return {
		"public": Base62.encode(+id * 1111),
		"private": Base62.encode(+id * 4135724491328845)
	};
}
function decodePrivate(ref) {
	return Math.round(Base62.decode(ref) / 4135724491328845);
}
function decodePublic(ref) {
	return Math.round(Base62.decode(ref) / 1111);
}

router.get("/R:ref", function(req, res, next) {
	var ref = req.params.ref;
	res.render("index", {formError: null, referrer: ref});
});

router.get("/", function(req, res) {
	let currentTime = new Date( new Date().getTime() + desiredTimezoneOffset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );

	let showKickstarterLink = currentTime >= dateToAddKickstarterLink;
	if(currentTime >= dateToCloseBetaSignup) {
		res.render("index_closed_signup", {"showKickstarterLink": showKickstarterLink});
	}
	else {
		res.render("index", {formError: null});
	}
});
router.get("/referrals/:ref", function(req, res){
	if(!req.params.ref) {
		res.end("Error: No referrer id provided!");
		return;
	}

	getConnection((err, pg) => {
		if (err) {
			console.error(err);
			res.end(err);
		}
		const refid = req.params.ref;
		const id = decodePrivate(refid);
		const encoded = encodeId(id);
		console.log(id);
		pg.client.query("SELECT COUNT(1) as count FROM signup WHERE referrer=$1", [ id ], (err, result) => {
			pg.done();
			if (err) {
				console.error(err);
				res.render('index', {formError: 'We\'re having server problems, please try again in a few minutes', hasError: true});
			}
			else {
				const count = +result.rows[0].count;
				let referrals;
				let totalEarned = 10 + count;
				if (count === 0){
					referrals = "You haven't yet had any referrals. :-(";
				}
				else if (count === 1){
					referrals = "Congrats! You've had one referral.";
				}
				else {
					referrals = "Congrats! You've had " + count + " referrals!";
				}
				referrals += "<br/>Total premium currency earned: $" + totalEarned + " (subject to review).";
				res.render('referrals', {"referrals": referrals, "ref": encoded.public});
			}
		});
	});
})

router.get('/%F0%9F%91%BD', function(req, res) {
	res.render("index");
});

router.post('/%F0%9F%91%BD',function(req,res) {
	let currentTime = new Date( new Date().getTime() + desiredTimezoneOffset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );

	if(currentTime >= dateToCloseBetaSignup) {
		res.render("index_closed_signup", {"showKickstarterLink": showKickstarterLink});
	}

	var email = req.body.email;
	var ref = req.body.ref || null;
	var state = req.body.state;
	var phone = req.body.phone_type;
	var zip   = req.body.zip;
	var country   = req.body.country;
	var headers = req.headers;
	var jsEnabled = headers["x-requested-with"] === "XMLHttpRequest";

	if (ref) {
		try{
			ref = decodePublic(ref);
		}
		catch(ex){
			ref = null;
		}
	}

	country = country ? country.split(" - ")[0] : null;
	if (!country || validCountryCodes.indexOf(country)===-1) {
		if (!jsEnabled) {
			res.render('index', {formError: 'Invalid Country Code, check to make sure you entered a valid country or try a different one.', hasError: true});
		}
		else {
			res.send("Invalid Country Code, check to make sure you entered a valid country or try a different one.");
			console.error("Country code was invalid: " + country);
		}
		return;
	}
	var isUSA = country === "US";
	email = email ? email.trim() : email;
	if (!(validator.isEmail(email))) {
		if (!jsEnabled) {
			res.render('index', {formError: 'Invalid E-mail, check to make sure you entered your correct e-mail or try a different one.', hasError: true});
		}
		else {
			res.send("Invalid E-mail, check to make sure you entered your correct e-mail or try a different one.");
			console.error("E-mail field didn't pass validation: " + email);
		}
	}
	else if (isUSA && (state.length > 2 || state.length == 0 )) {
		if (!jsEnabled) {
			res.render('index', {formError: 'State selected is invalid, please choose another state or refresh and try again', hasError: true});
		}
		else {
			res.send("State is invalid");
			console.error("State field didn't pass validation: " + state);
		}
	}
	else if (phone != '0' && phone != '1') {
		if (!jsEnabled) {
			res.render('index', {formError: 'Good or evil phones only, please! Check the Good or Evil field and make sure you select Android or iPhone', hasError: true});
		}
		else {
			res.send("You have a windows phone, don't you?");
			console.error("Phone field didn't pass validation: " + phone);
		}
	}
	else if (isUSA && (zip.length > 0 && ( zip.length != 5 || !(validator.isNumeric(zip)) ) )) {
		if (!jsEnabled) {
			res.render('index', {formError: 'Invalid ZIP code, check to make sure you entered your correct 5 digit US ZIP code or try a different one.', hasError: true});
		}
		else {
			res.send("Invalid ZIP code, check to make sure you entered your correct 5 digit US ZIP code or try a different one.");
			console.error("ZIP field didn't pass validation: " + zip);
		}
	}
	else {
		getConnection((err, pg) => {
			if (err) {
				console.error(err);
				res.end(err);
			}
			email = email.replace(/\.con$/i, ".com");
			console.log('Made it to server');
			var insertString = "";
			var insertVariables = [];
			if (isUSA && zip.length > 0) {
				insertString = "INSERT into signup (email, country, state, phone_type, zip, referrer) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
				insertVariables = [email.toLowerCase().trim(), country, state, phone, zip, ref];
			}
			else {
				insertString = "INSERT into signup (email, country, state, phone_type, referrer) VALUES ($1, $2, $3, $4, $5) RETURNING id";
				insertVariables = [email.toLowerCase().trim(), country, isUSA ? state : null, phone, ref];
			}
			pg.client.query(insertString, insertVariables, (err, result) => {
				
				if (err) {
					if (err.message === "duplicate key value violates unique constraint \"email_uq\"") {
						pg.client.query("SELECT id FROM signup WHERE email = $1 LIMIT 1", [email.toLowerCase().trim()], (err, result) => {
							pg.done();
							if(err){
								console.error(err);
								if (!jsEnabled) {
									res.render('index', {formError: 'Looks like your email address has already been signed up!', hasError: true});
								}
								else {
									res.send("Looks like your email has already been signed up!");
								}
								return;
							}
							const refid = encodeId(result.rows[0].id).private;
							var errMsg = 'Looks like your email address has already been signed up! Here\'s your referral info: <a href="/referrals/' + refid + '">https://terramango.com/referrals/' + refid + '</a>.';
							if (!jsEnabled) {
								res.render('index', {"formError": errMsg, "hasError": true});
							}
							else {
								res.send(errMsg);
							}
						});
					}
					else {
						pg.done();
						console.error(err);
						if (!jsEnabled) {
							res.render('index', {formError: 'We\'re having server problems, please try again in a few minutes', hasError: true});
						}
						else {
							res.send("We\'re having server issues, please try again in a few minutes.");
						}
					}
				}
				else {
					pg.done();
					console.log("Made it to the database");
					const encoded = encodeId(+result.rows[0].id);
					pmClient.sendEmailWithTemplate({
						"From": "beta@terramango.com",
						"TemplateId": 1792042,
						"To": email,
						"TemplateModel": {
							"publicRef": encoded.public,
							"privateRef": encoded.private,
							"subjectPrefix": isUSA ? "You're In! " : "",
							"inviteTimeline": isUSA ? "You can expect your invite link in just a few weeks." : "We're launching one country at a time; we'll send your invite link when the beta opens in your country."
						},
						"InlineCss": true
					}, function(error, result) {
						if(error) {
							console.log(error);
							if (!jsEnabled) {
								res.render('index', {formError: 'We\'re having server problems, please try again in a few minutes', hasError: true});
							}
							else {
								res.send("We\'re having server issues, please try again in a few minutes.");
							}
						}
						else {
							if (!jsEnabled) {
								res.render('index', {success: 'WooHoo! Form submitted and email sent', hasSuccess: true});
							} 
							else {
								res.send("Success"); 
							}
						}
					});
				}
			});
		});
	}
});

module.exports = router;