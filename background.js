import { analyzeURL } from "./modules/urlAnalyzer.js";
import { detectPhishing } from "./modules/phishingDetector.js";
import { checkReputation } from "./modules/reputationCheck.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanURL") {
    (async () => {
      let url = request.url;
      try {
        let domain = "";
        try {
            domain = new URL(url).hostname;
        } catch(e) {
            domain = url;
        }

        let score = 0;
        let reasons = [];
        
        let urlScore = analyzeURL(url);
        if (urlScore > 0) { score += urlScore; reasons.push(`-${urlScore}: Suspicious URL structure`); }
        
        let phishResult = detectPhishing(url);
        if (phishResult.score > 0) { score += phishResult.score; reasons.push(`-${phishResult.score}: Phishing words in URL`); }
        
        if (domain) {
            let repScore = await checkReputation(domain);
            if (repScore > 0) { score += repScore; reasons.push(`-${repScore}: Flagged by security vendors (VirusTotal)`); }
        }

        sendResponse({ error: false, score: score, reasons: reasons, urlPhishingWords: phishResult.foundWords || [] });
      } catch (err) {
        console.error("scanURL handler error:", err);
        sendResponse({ error: true, score: 0 });
      }
    })();
    return true;
  }

  if (request.action === "analyzeVulnerability") {
    (async () => {
      try {
        const storageData = await chrome.storage.local.get(['geminiApiKey']);
        const apiKey = storageData.geminiApiKey;
        
        if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
             sendResponse({ error: true, text: "API Key missing. Please right-click the extension icon and select 'Options' to configure your Gemini API Key." });
             return;
        }

        let reason = request.reason;
        let promptText = `I am running a cybersecurity extension. I detected this specific risk factor on a website: "${reason}". Briefly explain the core danger in exactly 1 simple sentence, then provide a concise, actionable 3-step developer security patch guide to fix it. Format cleanly without markdown symbols so it prints nicely as plain text.`;

        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        let data = await response.json();
        
        if (data.error) {
             sendResponse({ error: true, text: "Gemini API Error: " + data.error.message });
        } else if (data.candidates && data.candidates[0].content.parts[0].text) {
             sendResponse({ error: false, text: data.candidates[0].content.parts[0].text });
        } else {
             sendResponse({ error: true, text: "AI returned unexpected format: " + JSON.stringify(data).substring(0, 50) });
        }
      } catch (err) {
        console.error("AI handler error:", err);
        sendResponse({ error: true, text: "Connection to AI engine failed." });
      }
    })();
    return true;
  }
});