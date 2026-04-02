export function analyzeSSL(url){

let score = 0;

if(!url.startsWith("https"))
score += 25;

return score;

}