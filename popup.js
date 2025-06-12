async function loadLanguage(selectedLang) {
    const url = chrome.runtime.getURL('lang.json');
    const response = await fetch(url);
    const langData = await response.json();
    if (selectedLang && langData[selectedLang]) {
        return langData[selectedLang].popup;
    }
    return langData.fr.popup; // default to French
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load selected language from storage or default to 'fr'
    const { selectedLanguage = 'fr', extensionEnabled = true, lastSync = null } = await new Promise(resolve => {
        chrome.storage.local.get(['selectedLanguage', 'extensionEnabled', 'lastSync'], resolve);
    });

    const lang = await loadLanguage(selectedLanguage);

    const button = document.getElementById("toggleMenu");
    const listElement = document.getElementById("wordList");
    const addElementInput = document.getElementById("addElementInput");
    const addElementType = document.getElementById("addElementType");
    const addElementButton = document.getElementById("addElementButton");
    const title = document.getElementById('title');
    const lastSyncDiv = document.getElementById('lastSync');
    const disableExtensionBtn = document.getElementById('disableExtensionBtn');
    const languageSelect = document.getElementById('languageSelect');

    // Set UI text from language
    button.textContent = lang.updateButton;
    addElementInput.placeholder = lang.addElementPlaceholder;
    addElementButton.textContent = lang.addElementButton;
    title.textContent = lang.title;
    document.getElementById('toggleMenu').textContent = lang.updateButton;
    disableExtensionBtn.textContent = extensionEnabled ? lang.disableExtension : lang.enableExtension;

    // Show last sync time or placeholder
    if (lastSync) {
        const date = new Date(lastSync);
        lastSyncDiv.textContent = `${lang.lastSync}: ${date.toLocaleString()}`;
    } else {
        lastSyncDiv.textContent = `${lang.lastSync}: --`;
    }

    // Set disable button style
    if (extensionEnabled) {
        disableExtensionBtn.classList.add('enabled');
    } else {
        disableExtensionBtn.classList.remove('enabled');
    }

    // Set language select dropdown
    languageSelect.value = selectedLanguage;

    // Toggle banned words list display
    button.addEventListener("click", () => {
        listElement.style.display = listElement.style.display === "none" ? "block" : "none";
    });

    // Load banned words from storage and display
    chrome.storage.local.get(["bannedWords"], (result) => {
        const words = result.bannedWords || [];
        listElement.innerHTML = '';
        words.forEach(word => {
            const li = document.createElement("li");
            li.textContent = word;
            listElement.appendChild(li);
        });
    });

    // Add new banned word or user
    addElementButton.addEventListener("click", async () => {
        const value = addElementInput.value.trim();
        const type = addElementType.value;

        if (!value) {
            alert(lang.errorEmptyInput);
            return;
        }

        if (type !== lang.typeUser && type !== lang.typeWord) {
            alert(lang.errorInvalidType);
            return;
        }

        if (!confirm(lang.confirmAdd)) {
            return;
        }

        try {
            const response = await fetch("https://rugplaytcz.ianjones2127.workers.dev/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ type, value })
            });

            if (!response.ok) {
                alert(lang.addFailure);
                return;
            }

            alert(lang.addSuccess);
            addElementInput.value = "";

            // Update last sync time in storage and UI
            const now = new Date().toISOString();
            chrome.storage.local.set({ lastSync: now });
            lastSyncDiv.textContent = `${lang.lastSync}: ${new Date(now).toLocaleString()}`;
        } catch (error) {
            alert(lang.addFailure);
        }
    });

    // Enable/disable extension toggle button
    disableExtensionBtn.addEventListener("click", () => {
        const newState = !extensionEnabled;
        chrome.storage.local.set({ extensionEnabled: newState }, () => {
            disableExtensionBtn.textContent = newState ? lang.disableExtension : lang.enableExtension;
            if (newState) {
                disableExtensionBtn.classList.add('enabled');
            } else {
                disableExtensionBtn.classList.remove('enabled');
            }
            // Optionally, notify content scripts or reload extension to apply changes
        });
    });

    // Language selection change
    languageSelect.addEventListener("change", async () => {
        const newLang = languageSelect.value;
        await new Promise(resolve => chrome.storage.local.set({ selectedLanguage: newLang }, resolve));
        // Reload UI texts with new language
        const newLangData = await loadLanguage(newLang);
        button.textContent = newLangData.updateButton;
        addElementInput.placeholder = newLangData.addElementPlaceholder;
        addElementButton.textContent = newLangData.addElementButton;
        title.textContent = newLangData.title;
        disableExtensionBtn.textContent = extensionEnabled ? newLangData.disableExtension : newLangData.enableExtension;
        lastSyncDiv.textContent = lastSync ? `${newLangData.lastSync}: ${new Date(lastSync).toLocaleString()}` : `${newLangData.lastSync}: --`;
    });
});
