export function detectPhishing(url){

let score = 0;
let foundWords = [];

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
    if(url.toLowerCase().includes(word)) {
        score += 25;
        foundWords.push(word);
    }
});

return { score: score, foundWords: foundWords };

}