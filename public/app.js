"use strict";
function formSubmit(event) {
    console.log(event);
    return false;
}
for (let el of document.getElementsByClassName("gen-form")) {
    el.addEventListener('submit', formSubmit);
}
console.log("App loaded");
