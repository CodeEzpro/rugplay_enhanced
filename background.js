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

        users = await response.json();
        
        chrome.storage.local.set({ bannedUsers: users }, () => {
            console.log(lang.wordsListSaved.replace('Words', 'Users'));
        });

    } catch (error) {
        console.error(`${lang.error}`, error);
    }
}

fetchAndSaveWords();
