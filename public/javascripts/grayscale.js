/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */
$(document).ready(function(){
    var url = document.location.search;
    var signupForm = $('#signupForm');
    var msgSubmit = $('#msgSubmit');
    var itFailed = $('#itFailed');
    var introText = $('.intro-text1');
    if (url == "/?beta-signup=1"){
        signupForm.addClass('hidden');
    }
    signupForm.submit(function(e){

        var data = signupForm.serialize();
        $.post(
           this.action, 
           data, 
           function(data){//success
               console.log(data);
                if(data == "Success"){
                    signupForm.addClass('hidden');
                    itFailed.addClass('hidden');
                    introText.addClass('hidden');
                    msgSubmit.removeClass('hidden');
                    console.log(data);
                    console.log("Successful - posted to the database");
                    console.log(url);
                    if (url == "/?beta-signup=1"){
                        console.log("found beta signup in the success area = 1");
                    }
                }
                else{
                    itFailed.text(data);
                    itFailed.removeClass('hidden');
                }
           }
        ).fail(
            function(data) {
                itFailed.text(data);
                itFailed.removeClass('hidden');
                
                if (url == "/?beta-signup=400"){
                    console.log("found beta signup 400 in the failure area");
                }
        });
        e.preventDefault();
    });
});
