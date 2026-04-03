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

Because this is an unpacked developer extension, you need to load it directly into Chrome:

1. **Download the project** using your operating system's command line:

   * **For Windows:** Open Command Prompt or PowerShell and run:
     ```cmd
     git clone https://github.com/ranatirth007/Cybersafe-web-extention-V2.git
     cd Cybersafe-web-extention-V2
     ```

   * **For macOS / Linux:** Open the Terminal app and run:
     ```bash
     git clone https://github.com/ranatirth007/Cybersafe-web-extention-V2.git
     cd Cybersafe-web-extention-V2
     ```
2. Open Google Chrome and type `chrome://extensions/` into the URL bar.
3. In the top right corner, toggle on **"Developer mode"**.
4. Click **"Load unpacked"** in the top left.
5. Select the `Cybersafe-web-extention-V2` folder that you just cloned.

### Configuring the AI Security Advisor
To use the built-in AI remediation tool, you must supply your own Google Gemini API key:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Right-click the CyberSafe Web Guard extension icon in your Chrome toolbar and select **"Options"**.
3. Enter your Gemini API key in the settings page and click **"Save Key"**.

## 💡 Usage

1. Pin the extension to your browser toolbar for quick access.
2. Navigate to any website you want to scan.
3. Click the **CyberSafe Web Guard** extension icon.
4. The scanner will run instantly, evaluating the URL, DOM, and scripts to give you a comprehensive safety score.
5. If the site is flagged with vulnerabilities or threats, click the **"Ask AI Advisor"** button to receive a detailed, step-by-step security patch guide powered by Gemini.

## 🚨 Monitored Phishing Keywords

The extension actively scans the website's text for commonly abused phrases used by malicious actors. Finding these terms drastically increases the risk score of the website and they are shown directly in the UI if found:
*   `verify account`
*   `confirm password`
*   `update payment`
*   `security alert`
*   `bank account`
*   `urgent action`
*   `account suspended`

*(Note: These keywords trigger severe -15 penalties per occurrence in the risk scoring algorithm).*

## 📁 File Structure
*   `manifest.json` - Configuration and permission routing for Manifest V3.
*   `background.js` - Service worker that handles Gemini AI API routing and background execution.
*   `popup.html/js` - The interactive UI and the entry points for the content scanner script.
*   `modules/` - Core penetration algorithms for URL parsing, phishing word detection, and API reputation limits.
*   `styles.css` - Custom Glassmorphism design file.

## 👨‍💻 Author
Created by **Rana Tirth**
