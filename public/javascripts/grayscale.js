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
    var goodOrEvil = $('#goodOrEvil');
    var isMac = navigator.userAgent.indexOf("Macintosh")!=-1; 
    var browser = (function(){var t=navigator,n=t.userAgent,r=t.appVersion,i=parseFloat(r),s={};
    s.isOpera=n.indexOf("Opera")>=0?i:undefined,s.isKhtml=r.indexOf("Konqueror")>=0?i:undefined,s.isWebKit=parseFloat(n.split("WebKit/")[1])||undefined,s.isChrome=parseFloat(n.split("Chrome/")[1])||undefined,s.isFirefox=/Firefox[\/\s](\d+\.\d+)/.test(n);
    var o=Math.max(r.indexOf("WebKit"),r.indexOf("Safari"),0);
    if(o&&!s.isChrome){s.isSafari=parseFloat(r.split("Version/")[1]);
    if(!s.isSafari||parseFloat(r.substr(o+7))<=419.3)s.isSafari=2}if(document.all&&!s.isOpera){s.isIE=parseFloat(r.split("MSIE ")[1])||undefined;
    var u=new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})"),a=-1;
    u.exec(n)!=null&&(a=parseFloat(RegExp.$1)),s.isIE7=a>=7&&a<8,s.isIE8=a>=8&&a<9}

    return s}());

    if (typeof goodOrEvil !== "undefined") {
        if (isMac || browser.isSafari) {
            goodOrEvil.html("<option value=\"\" selected disabled>Good or Evil?</option><option value=\"1\">iPhone</option><option value=\"0\">Android</option>")
        } 
        else {
            goodOrEvil.html("<option value=\"\" selected disabled>Good or Evil?</option><option value=\"0\">Android</option><option value=\"1\">iPhone</option>")
        }
    }

    var stateinput = $("#state")
    var state = stateinput.closest(".form-group");
    var zip = $("#zip").closest(".form-group");
    var country = $("#country");
    updateState();
    function updateState(){
        if( country.val() === "US - United States"){
            stateinput.prop("required", true);
            state.show();
            zip.show();
        }
        else {
            stateinput.prop("required", false);
            state.hide();
            zip.hide();
        }
    }
    country.on("change", updateState);

    var buttons = signupForm.find("button");
    signupForm.submit(function(e){
        var data = signupForm.serialize();
        buttons.prop("disabled", true);
        $.post(
           this.action, 
           data, 
           function(data){//success
                if(data == "Success"){
                    signupForm.addClass('hidden');
                    itFailed.addClass('hidden');
                    introText.addClass('hidden');
                    msgSubmit.removeClass('hidden');
                }
                else {
                    itFailed.html(data);
                    itFailed.removeClass('hidden');
                }
           }
        ).fail(
            function(jqXHR, textStatus, errorThrown) {
                itFailed.html(errorThrown);
                itFailed.removeClass('hidden');
        }).always(function(){
            buttons.prop("disabled", false);
        })
        e.preventDefault();
    });
});

const submitUpdate = () => {
    let data = {"email": existing_board_name, "phone_type": reference_card_name, "ref": new_board_name, "year": year};
    $.ajax({
        "type": "POST",
        "contentType": "application/json; charset=utf-8",
        "url": "/update",
        "data": JSON.stringify(data),
        "success": (data, textStatus, jqXHR) => {
            if (data === "Success") {
                // do something
                $("#itFailed").removeClass("hidden");
                $("#itFailed").removeClass("fontRed");
                $("#itFailed").addClass("fontGreen");
                $("#itFailed").text("Update Successful. Look out for another email once we process your update (1-2 business days).");
            }
            else {
                $("#itFailed").removeClass("hidden");
                $("#itFailed").removeClass("fontGreen");
                $("#itFailed").addClass("fontRed");
                $("#itFailed").text("There were some issues with updating your information. Please try again later. If this continues to happen, please contact us at beta@terramango.com");
            }
        },
        "error": function(jqXHR, textStatus, errorThrown) {
            $("#itFailed").removeClass("hidden");
            $("#itFailed").removeClass("fontGreen");
            $("#itFailed").addClass("fontRed");
            $("#itFailed").text("There were some issues with updating your information. Please try again later. If this continues to happen, please contact us at beta@terramango.com");
        }
    });
}