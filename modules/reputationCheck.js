export async function checkReputation(domain){

try{

let response = await fetch(
`https://www.virustotal.com/api/v3/domains/${domain}`,
{
headers:{
"x-apikey":"e37daad4f4b399689f85fa97a7902285c1a4c4a76f696d97e8573ed41b349c21"
}
}
);

if (!response.ok) {
    console.warn("VirusTotal API Error:", response.status);
    return 0;
}

let data = await response.json();

let malicious =
data.data.attributes.last_analysis_stats.malicious || 0;
let suspicious = 
data.data.attributes.last_analysis_stats.suspicious || 0;

return (malicious * 10) + (suspicious * 5);

}catch(e){
    console.error("Error fetching reputation:", e);
    return 0;

}

}