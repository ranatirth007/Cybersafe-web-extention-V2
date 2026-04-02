export async function findAdminPanels(baseUrl){

let paths = [
"/admin",
"/admin/login",
"/dashboard",
"/wp-admin",
"/cpanel"
];

let found = [];

for(let p of paths){

try{

let r = await fetch(baseUrl + p);

if(r.status === 200)
found.push(p);

}catch(e){}

}

return found;

}