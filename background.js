const targetCssUrl = "https://rugplay.com/_app/immutable/assets/0.BQV8Pc2H.css"; // URL du CSS original

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    return {
      redirectUrl: chrome.runtime.getURL("enhanced.css")
    };
  },
  { urls: [targetCssUrl] },
  ["blocking"]
);

async function loadLanguage() {
  const url = chrome.runtime.getURL('lang.json');
  const response = await fetch(url);
  const langData = await response.json();
  const { selectedLanguage = 'fr' } = await new Promise(resolve => {
    chrome.storage.local.get(['selectedLanguage'], resolve);
  });
  return langData[selectedLanguage]?.background || langData['fr'].background;
}

chrome.runtime.onInstalled.addListener(async () => {
  const lang = await loadLanguage();
  console.log(lang.extensionInstalled);
});

async function fetchAndSaveWords() {
  const lang = await loadLanguage();
  try {
    let response = await fetch("https://rugplaytcz.ianjones2127.workers.dev/words", { mode: 'cors' });
    if (!response.ok) throw new Error(`${lang.httpError}${response.status}`);

    let words = await response.json();

    chrome.storage.local.set({ bannedWords: words }, () => {
      console.log(lang.wordsListSaved);
    });

    response = await fetch("https://rugplaytcz.ianjones2127.workers.dev/users", { mode: 'cors' });
    if (!response.ok) throw new Error(`${lang.httpError}${response.status}`);

    let users = await response.json();

    chrome.storage.local.set({ bannedUsers: users }, () => {
      console.log(lang.wordsListSaved.replace('Words', 'Users'));
    });

  } catch (error) {
    console.error(`${lang.error}`, error);
  }
}

async function getGradientFromStorage(sendResponse) {
  chrome.storage.local.get(['backgroundGradient'], (result) => {
    console.log("Get Gradient from Storage");
    let bgGradient = result.backgroundGradient;
    if (!bgGradient) {
      bgGradient = "000000";
      chrome.storage.local.set({ backgroundGradient: bgGradient });
    }
    const gradientObj = getGradient(bgGradient,true);
    sendResponse({ type: "setGradient", payload: gradientObj });
  });
}

function getGradient(hex, isHsl = false) {
  const rgb = hexToRgb(hex);
  var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  if (isHsl) {
    hsl = hex.match(/\d+/g).map(Number);
;
  }

  const dark = `hsl(${hsl[0]}, ${hsl[1]}%, ${Math.max(hsl[2] * 0.1, 0)}%)`;
  const mid = `hsl(${hsl[0]}, ${hsl[1]}%, ${Math.max(hsl[2] * 0.5, 0)}%)`;
  const deep = `hsl(${hsl[0]}, ${hsl[1]}%, ${Math.max(hsl[2] * 1, 0)}%)`;

  return { gradient: `linear-gradient(35deg, ${dark} 25%, ${mid} 50%, ${deep} 100%)`, deep: deep };
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  let bigint = parseInt(hex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHsl(r, g, b) {
  let coef = 0.2173913043;
  r *= coef, g *= coef, b *= coef;
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getGradient") {
    getGradientFromStorage(sendResponse);
    return true;
  }
});

fetchAndSaveWords();
