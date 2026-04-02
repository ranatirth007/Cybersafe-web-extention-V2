# CyberSafe Web Guard 🛡️

CyberSafe Web Guard is a next-generation browser extension designed to instantly analyze websites for modern cyber threats. Built on Google's Manifest V3 architecture, it features a comprehensive real-time scoring engine that evaluates URL structure, DOM vulnerabilities, and domain reputation. 

It is also equipped with the **Gemini 2.5 Flash AI Security Advisor** to instantly generate developer patch protocols for any intercepted vulnerability.

![CyberSafe Screenshot](images/background.jpeg)

## ✨ Core Features
*   **Deep DOM Scanner:** Injects a lightweight script to map out undocumented iframes, hidden password fields, and tracking scripts.
*   **Intelligent Scoring Matrix:** A mathematical scoring engine dynamically adjusts website safety based on a vast array of risk factors.
*   **Critical Risk Override:** Forcefully blocks passing scores if high-severity phishing keywords or suspicious cross-site components are found.
*   **Gemini AI Security Advisor:** Click on any flagged threat to instantly stream a custom 3-step security patch guide powered by Google's Gemini 2.5 AI model.
*   **Premium Auto-Dark GUI:** Built on an elegant, futuristic Glassmorphism design system.
*   **Cryptographic Whitelisting:** Major platforms (Google, Amazon, GitHub) are whitelisted securely to prevent false positives.

## 🚀 Installation & Setup

Because this is a developer extension, you need to load it directly into Chrome:

1. Download or clone this repository to your computer.
2. Open Google Chrome and type `chrome://extensions/` into the URL bar.
3. In the top right corner, toggle on **"Developer mode"**.
4. Click **"Load unpacked"** in the top left.
5. Select the `CyberSafe Web Guard` folder!

### Configuring the AI Security Advisor
To use the built-in AI remediation tool, you must supply your own Google Gemini API key:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Open `background.js` in a code editor.
3. Locate `const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";` on Line 5.
4. Replace it with your actual key and save the file.
5. Reload the extension in Chrome.

## 📁 File Structure
*   `manifest.json` - Configuration and permission routing for Manifest V3.
*   `background.js` - Service worker that handles Gemini AI API routing and background execution.
*   `popup.html/js` - The interactive UI and the entry points for the content scanner script.
*   `modules/` - Core penetration algorithms for URL parsing, phishing word detection, and API reputation limits.
*   `styles.css` - Custom Glassmorphism design file.

## 👨‍💻 Author
Created by **Rana Tirth**
