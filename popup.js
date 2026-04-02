(async function init() {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            let urlEl = document.getElementById("url");
            urlEl.innerText = tab.url;
            urlEl.title = tab.url;
        }
    } catch(e) {}
})();

document.getElementById("openSettingsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());

document.getElementById("scanBtn").addEventListener("click", async () => {
    let scanBtn = document.getElementById("scanBtn");
    scanBtn.disabled = true;

    scanBtn.innerText = "Scanning in progress...";

    document.getElementById("radarContainer").classList.remove("hidden");
    document.getElementById("result").classList.add("hidden");
    document.getElementById("report").classList.add("hidden");

    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://")) {
            alert("Cannot scan browser settings or restricted pages. Please try on a regular website like google.com.");
            scanBtn.disabled = false;
            scanBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Scan Website`;
            document.getElementById("radarContainer").classList.add("hidden");
            return;
        }

        let urlEl = document.getElementById("url");
        urlEl.innerText = tab.url;
        urlEl.title = tab.url;

        // 1. Ask background to do URL/Domain Risk check
        let bgPromise = new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "scanURL", url: tab.url }, (response) => {
                resolve(response || { error: true, score: 0 });
            });
        });

        // 2. DOM Analysis via Chrome Scripting
        let domPromise = chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                let reasons = [];
                
                // Extract detailed lists (capped at 30 items)
                let extractSources = (selector, attr) => {
                    return Array.from(document.querySelectorAll(selector))
                                .map(el => el[attr] || "No target/source defined")
                                .slice(0, 30);
                };
                
                let detailsLinks = extractSources("a", "href");
                let detailsScripts = extractSources("script", "src");
                let detailsForms = extractSources("form", "action");
                let detailsIframes = extractSources("iframe", "src");

                let links = document.querySelectorAll("a").length;
                let scripts = document.querySelectorAll("script").length;
                let forms = document.querySelectorAll("form").length;
                let iframes = document.querySelectorAll("iframe").length;
                let passwordInputs = document.querySelectorAll("input[type='password']").length;

                let suspiciousWords = ["verify account", "confirm password", "update payment", "security alert", "bank account", "urgent action", "account suspended"];
                let text = document.body.innerText.toLowerCase();
                let keywordsFound = 0;
                let detailsKeywords = [];
                suspiciousWords.forEach(w => {
                    if (text.includes(w)) {
                        keywordsFound++;
                        detailsKeywords.push(`Found phrase: "${w}"`);
                    }
                });

                let domScore = 0;
                if (passwordInputs > 0) { domScore += 25; reasons.push("-25: Hidden password fields found"); }
                if (forms > 1) { domScore += 10; reasons.push("-10: Multiple data forms on page"); }
                if (keywordsFound > 0) { 
                    let penalty = keywordsFound * 15;
                    domScore += penalty; 
                    reasons.push(`-${penalty}: Phishing keywords detected`); 
                }
                if (iframes > 2) { domScore += 10; reasons.push("-10: Excessive iframe embeds"); }
                if (location.protocol === "http:") { domScore += 20; reasons.push("-20: Unencrypted (HTTP)"); }

                return { 
                    links, scripts, forms, iframes, keywords: keywordsFound, domScore, reasons,
                    detailsLinks, detailsScripts, detailsForms, detailsIframes, detailsKeywords
                };
            }
        });

        let [bgResult, domResultWrap] = await Promise.all([bgPromise, domPromise]);
        
        // Hide Radar
        document.getElementById("radarContainer").classList.add("hidden");

        let domResult = (domResultWrap && domResultWrap[0] && domResultWrap[0].result) ? domResultWrap[0].result : { links:0, scripts:0, forms:0, iframes:0, keywords:0, domScore:0, reasons: [] };

        let totalRiskScore = (bgResult.score || 0) + (domResult.domScore || 0);
        let allReasons = (bgResult.reasons || []).concat(domResult.reasons || []);

        // Check for trusted domains to prevent false positives
        try {
            let urlHostname = new URL(tab.url).hostname.toLowerCase();
            
            let trustedRoots = [
                // Tech / Search
                "google.com", "bing.com", "yahoo.com", "duckduckgo.com",
                // Social / Forums
                "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "reddit.com", "pinterest.com", "tiktok.com", "snapchat.com", "quora.com", "discord.com", "twitch.tv",
                // Content / Streaming
                "youtube.com", "netflix.com", "hulu.com", "spotify.com", "vimeo.com", "disneyplus.com", "primevideo.com",
                // Shopping
                "amazon.com", "ebay.com", "walmart.com", "target.com", "aliexpress.com", "etsy.com", "bestbuy.com",
                // Work / Dev
                "github.com", "stackoverflow.com", "microsoft.com", "apple.com", "slack.com", "zoom.us", "atlassian.com", "trello.com", "notion.so", "gitlab.com",
                // Information / Media
                "wikipedia.org", "cnn.com", "nytimes.com", "bbc.co.uk", "news.google.com",
                // Payment / Finance (Extremely important these are correctly validated)
                "paypal.com", "stripe.com", "chase.com", "bankofamerica.com", "wellsfargo.com", "capitalone.com", "venmo.com", "cash.app"
            ];

            let isTrusted = trustedRoots.some(root => {
                return urlHostname === root || urlHostname.endsWith("." + root);
            });
            
            if (isTrusted) {
                totalRiskScore = 0; // Force perfectly safe for trusted major sites
                allReasons = ["Safe Domain Override: Platform is known & trusted"];
            }
        } catch(e) {}

        // Calculate Safety Score (0-100) where 100 is perfectly safe.
        let safetyScore = Math.max(0, Math.min(100, 100 - totalRiskScore));

        // CRITICAL RISK OVERRIDE
        // If a high-severity threat is found (phishing, VirusTotal flagged, hidden passwords),
        // forcefully cap the score to 80 so it triggers "Suspicious" status, even if math allows passing.
        let hasCriticalRisk = allReasons.some(r => 
            r.toLowerCase().includes("phishing") || 
            r.toLowerCase().includes("virustotal") || 
            r.toLowerCase().includes("password")
        );
        
        if (hasCriticalRisk && safetyScore > 80) {
            safetyScore = 80; // Force into suspicious tier
        }

        // Update Report Text
        document.getElementById("links").innerText = domResult.links;
        document.getElementById("scripts").innerText = domResult.scripts;
        document.getElementById("forms").innerText = domResult.forms;
        document.getElementById("iframes").innerText = domResult.iframes;
        
        let keywordBox = document.getElementById("keywordBox");
        if (domResult.keywords > 0) {
            keywordBox.classList.remove("hidden");
            document.getElementById("keywords").innerText = domResult.keywords;
        } else {
            keywordBox.classList.add("hidden");
        }

        // Render Breakdown
        let breakdownContainer = document.getElementById("breakdownContainer");
        let reasonsList = document.getElementById("reasonsList");
        if (allReasons.length > 0) {
            breakdownContainer.classList.remove("hidden");
            reasonsList.innerHTML = "";
            allReasons.forEach(r => {
                let li = document.createElement("li");
                li.innerText = r;
                if (!r.startsWith("-")) {
                    li.className = "positive";
                } else {
                    li.className = "clickable";
                    li.title = "Click to analyze with Security Advisor";
                    li.onclick = () => {
                        document.getElementById("aiModal").classList.remove("hidden");
                        document.getElementById("aiLoadingIndicator").classList.remove("hidden");
                        document.getElementById("aiResponseText").classList.add("hidden");
                        
                        chrome.runtime.sendMessage({ action: "analyzeVulnerability", reason: r }, (res) => {
                            // Check for error if extension background went to sleep
                            if (chrome.runtime.lastError) {
                                document.getElementById("aiLoadingIndicator").classList.add("hidden");
                                document.getElementById("aiResponseText").classList.remove("hidden");
                                document.getElementById("aiResponseText").innerText = "Background script error: " + chrome.runtime.lastError.message;
                                return;
                            }
                            
                            document.getElementById("aiLoadingIndicator").classList.add("hidden");
                            let textEl = document.getElementById("aiResponseText");
                            textEl.classList.remove("hidden");
                            if (res && res.text) {
                                if (res.error && res.text.includes("API Key missing")) {
                                    textEl.innerHTML = `<span>${res.text}</span><br><br><button id="aiConfigBtn" style="padding: 8px 12px; background: var(--primary-color, #3b82f6); color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px;">Configure API Key</button>`;
                                    document.getElementById("aiConfigBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
                                } else {
                                    textEl.innerText = res.text;
                                }
                            } else {
                                textEl.innerText = "Connection Error: Failed to generate a response from the AI.";
                            }
                        });
                    };
                }
                reasonsList.appendChild(li);
            });
        } else {
            breakdownContainer.classList.add("hidden");
        }

        // Animate Score Counter
        let scoreEl = document.getElementById("score");
        let currentStatus = "Safe";
        let scoreClass = "score-safe";

        if (safetyScore <= 40) {
            currentStatus = "Dangerous Website";
            scoreClass = "score-danger";
        } else if (safetyScore <= 80) {
            currentStatus = "Suspicious Website";
            scoreClass = "score-warn";
        }

        // Setup Interactive Detail Modals
        let statsData = {
            "Links": domResult.detailsLinks || [],
            "Scripts": domResult.detailsScripts || [],
            "Forms": domResult.detailsForms || [],
            "Iframes": domResult.detailsIframes || [],
            "Risk Words": domResult.detailsKeywords || []
        };

        let setupModalTrigger = (elementId, titleKey) => {
            let el = document.getElementById(elementId);
            if (!el) return;
            let statItem = el.closest(".stat-item");
            if (statItem) {
                statItem.classList.add("clickable");
                statItem.onclick = () => {
                    let items = statsData[titleKey] || [];
                    document.getElementById("modalTitle").innerText = titleKey + ` (${items.length})`;
                    let modalList = document.getElementById("modalList");
                    modalList.innerHTML = "";
                    if (items.length === 0) {
                        modalList.innerHTML = "<li>No specific targets found.</li>";
                    } else {
                        items.forEach((i, idx) => {
                            let li = document.createElement("li");
                            li.innerText = `${idx + 1}. ${i}`;
                            modalList.appendChild(li);
                        });
                    }
                    document.getElementById("detailsModal").classList.remove("hidden");
                };
            }
        };

        setupModalTrigger("links", "Links");
        setupModalTrigger("scripts", "Scripts");
        setupModalTrigger("forms", "Forms");
        setupModalTrigger("iframes", "Iframes");
        setupModalTrigger("keywords", "Risk Words");

        document.getElementById("closeModal").onclick = () => {
             document.getElementById("detailsModal").classList.add("hidden");
        };

        // Ensure closing when clicking outside the modal content
        document.getElementById("detailsModal").onclick = (e) => {
             if (e.target.id === "detailsModal") {
                 document.getElementById("detailsModal").classList.add("hidden");
             }
        };

        // AI Modal Close Handling
        document.getElementById("closeAiModal").onclick = () => {
             document.getElementById("aiModal").classList.add("hidden");
        };
        document.getElementById("aiModal").onclick = (e) => {
             if (e.target.id === "aiModal") {
                 document.getElementById("aiModal").classList.add("hidden");
             }
        };

        let circleEl = document.getElementById("scoreCircle");
        circleEl.className = "score-circle " + scoreClass;
        
        // Setup Score Math Breakdown Clicker
        circleEl.classList.add("clickable");
        circleEl.title = "Click to view full mathematical score breakdown";
        circleEl.style.cursor = "pointer"; // explicitly ensure hand icon
        
        circleEl.onclick = () => {
             let modalTitle = document.getElementById("modalTitle");
             let modalList = document.getElementById("modalList");
             
             modalTitle.innerText = "Score Equation Breakdown";
             modalList.innerHTML = "";
             
             let baseLi = document.createElement("li");
             baseLi.innerText = "Base Score: 100";
             baseLi.style.borderLeft = "2px solid #00ffd5";
             modalList.appendChild(baseLi);

             if (allReasons.length === 0) {
                  let infoLi = document.createElement("li");
                  infoLi.innerText = "No penalties. Clean website.";
                  modalList.appendChild(infoLi);
             } else {
                  allReasons.forEach(r => {
                       let li = document.createElement("li");
                       li.innerText = r;
                       li.style.borderLeft = r.startsWith("-") ? "2px solid #ff4757" : "2px solid #00ffd5";
                       modalList.appendChild(li);
                  });
             }
             
             // The local variable for hasCriticalRisk was defined further up
             // If the math puts it above 80 but it was capped to 80, we show that.
             if ((100 - totalRiskScore) > 80 && safetyScore === 80) {
                 let overLi = document.createElement("li");
                 overLi.innerText = "⚠️ CRITICAL RISK OVERRIDE:\nScore forcefully capped at maximum 80.";
                 overLi.style.borderLeft = "2px solid #ffb800";
                 overLi.style.color = "#ffb800";
                 overLi.style.background = "rgba(255,184,0,0.1)";
                 modalList.appendChild(overLi);
             }

             let finalLi = document.createElement("li");
             finalLi.innerText = `======\nFINAL COMPUTED SCORE: ${safetyScore}`;
             finalLi.style.borderLeft = "2px solid #f1f5f9";
             finalLi.style.fontWeight = "bold";
             finalLi.style.fontSize = "12px";
             modalList.appendChild(finalLi);
             
             document.getElementById("detailsModal").classList.remove("hidden");
        };
        
        let statusEl = document.getElementById("status");
        statusEl.innerText = currentStatus;
        if (safetyScore <= 40) statusEl.style.color = "var(--danger)";
        else if (safetyScore <= 80) statusEl.style.color = "var(--warning)";
        else statusEl.style.color = "var(--safe)";

        document.getElementById("result").classList.remove("hidden");
        document.getElementById("report").classList.remove("hidden");

        // Count up animation
        let count = 0;
        let inc = Math.max(1, Math.floor(safetyScore / 20));
        let int = setInterval(() => {
            count += inc;
            if (count >= safetyScore) {
                count = Math.floor(safetyScore);
                clearInterval(int);
            }
            scoreEl.innerText = count;
        }, 30);

    } catch (err) {
        console.error("Scan error:", err);
        document.getElementById("radarContainer").classList.add("hidden");
        alert("An error occurred during scan.");
    } finally {
        scanBtn.disabled = false;
        scanBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Scan Website Again`;
    }
});