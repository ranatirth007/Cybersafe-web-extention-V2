export function analyzeURL(url){

let score = 0;

if(url.length > 75)
score += 30;

if(url.includes("-"))
score += 20;

if(url.includes("@"))
score += 35;

if(url.includes("http://"))
score += 30;

return score;

}