/**
 * Created by austin on 5/17/16.
 */

const cookieName = "vets4warriorsCLR";

window.onload = function() {
    // Sets the background image randomly.
    var img=['m90.jpg','marpatD.jpg', 'nwu.jpg', 'multicam.jpg', 'odBack.jpg','urban.jpg'];

    document.getElementsByTagName('html')[0].style.backgroundImage = 'url(/assets/gfx/back/' + img[Math.floor(Math.random() * img.length)] + ')';

    // Only play the full tour if they haven't been here before
    // Might extend this for the few first times. Who knows.
    var intro;
    if (hasCookie(cookieName))
        intro = introJs('.disclaimer-tour');
    else
        intro = introJs();

    intro.start();

    // Mark that they have visited for next time
    setCookie(cookieName, 'hasVisited');
};

/**
 * Sets a cookie to expire in 31 days
 * @param name  Name of cookie
 * @param val   Value of cookie
 */
function setCookie(name, val) {
    // Default to expire in a month
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 31);

    var cookieVal = escape(val) + "; expires=" + expireDate.toUTCString();
    document.cookie = name + "=" + cookieVal;
}

/**
 *  Whether there is a cookie from us present or not
 * @param name
 */
function hasCookie(name) {
    var cookies = document.cookie;
    return ~(cookies.indexOf(name));
}