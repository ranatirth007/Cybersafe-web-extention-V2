export function detectPhishing(url){

let score = 0;

let phishingWords = [

"login",
"verify",
"update",
"bank",
"secure",
"account",
"paypal",
"signin"

];

phishingWords.forEach(word=>{

if(url.toLowerCase().includes(word))
score += 25;

});

return score;

}