export async function scanSubdomains(domain){

let common = [
"admin",
"dev",
"test",
"api",
"mail"
];

let found = [];

for(let s of common){

let url = `https://${s}.${domain}`;

try{

await fetch(url);

found.push(url);

}catch(e){}

}

return found;

}