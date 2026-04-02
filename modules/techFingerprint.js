export function detectTechnologies(){

let tech = [];

if(document.querySelector("meta[name='generator'][content*='WordPress']"))
tech.push("WordPress");

if(window.React)
tech.push("React");

if(window.angular)
tech.push("Angular");

if(document.querySelector("script[src*='jquery']"))
tech.push("jQuery");

return tech;

}