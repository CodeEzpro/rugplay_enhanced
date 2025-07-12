let wordBlacklist = [];
let userBlacklist = [];

chrome.storage.local.get(["bannedWords", "bannedUsers"], (result) => {
    wordBlacklist = result.bannedWords || [];
    userBlacklist = result.bannedUsers || [];
});

async function isExtensionEnabled() {
    return new Promise(resolve => {
        chrome.storage.local.get(['extensionEnabled'], (result) => {
            resolve(result.extensionEnabled !== false); // default true
        });
    });
}

async function loadLanguage() {
    const url = chrome.runtime.getURL('lang.json');
    const response = await fetch(url);
    const langData = await response.json();
    const { selectedLanguage = 'fr' } = await new Promise(resolve => {
        chrome.storage.local.get(['selectedLanguage'], resolve);
    });
    return langData[selectedLanguage]?.content || langData['fr'].content;
}

const goats = {
    "*TCZ" : ["linear-gradient(to right, #c2410c, #f97316, #fdba74)","rgb(255, 215, 164)"],
    "*KNT" : ["linear-gradient(to left,rgb(6, 151, 167),rgb(0, 187, 255))","linear-gradient(to left,#91d9fb,#caeffd)"],
};

(async () => {
    const enabled = await isExtensionEnabled();
    if (!enabled) {
        console.log("Extension is disabled, content.js will not execute.");
        return;
    }

    function createTooltip(element, text) {
        const tooltip = document.createElement("div");
        tooltip.textContent = text;
        tooltip.style.position = "absolute";
        tooltip.style.background = "black";
        tooltip.style.color = "white";
        tooltip.style.padding = "5px";
        tooltip.style.borderRadius = "5px";
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        tooltip.style.transition = "opacity 0.3s";
        tooltip.style.pointerEvents = "none";

        document.body.appendChild(tooltip);

        element.addEventListener("mouseover", (event) => {
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
            tooltip.style.visibility = "visible";
            tooltip.style.opacity = "1";
        });

        element.addEventListener("mouseout", () => {
            tooltip.style.visibility = "hidden";
            tooltip.style.opacity = "0";
        });
    }

    async function limitText() {
        const lang = await loadLanguage();
        Array.from(document.getElementsByClassName('border-border border-b pb-4 last:border-b-0')).forEach(message => {
            let username = message.getElementsByClassName("cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 truncate max-w-[120px] sm:max-w-none text-sm sm:text-base");
            let msgContent = message.getElementsByClassName('whitespace-pre-wrap break-words text-sm leading-relaxed')[0];
            let tagname = message.getElementsByClassName("truncate")[1];

            Array.from(username).forEach(link => {
                if (link.textContent.length > 15) {
                    createTooltip(link,link.textContent);
                    link.textContent = lang.usernameTooLong;
                    link.style.color = '#840102'
                }
            });

            if (userBlacklist.some(word => tagname.textContent.toLowerCase().includes(word))) {
                createTooltip(msgContent,msgContent.textContent);
                msgContent.textContent = lang.userBanned;
                msgContent.style.color = '#840102'
            }
            
            if (wordBlacklist.some(word => msgContent.textContent.toLowerCase().includes(word))) {
                createTooltip(msgContent,msgContent.textContent);
                msgContent.textContent = lang.bannedWords;
                msgContent.style.color = '#840102'
            }
        });
    }

    async function main() {
        const lang = await loadLanguage();
        console.log(lang.consoleStarting);
        await limitText();
        console.log(lang.consoleStarted);
    }

    window.addEventListener('load', main);

    function waitForElement(selector, callback) {
        const target = document.querySelector(selector);
        if (target) {
            callback(target);
            return;
        }

        const tempObserver = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                tempObserver.disconnect();
                callback(el);
            }
        });

        tempObserver.observe(document.body, { childList: true, subtree: false });
    }

    waitForElement('div[data-slot="card-content"].px-6.space-y-4', (target) => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    console.log("[👀] Ajout direct détecté :", node);
                    limitText()
                });
            }
        });

        observer.observe(target, { childList: true, subtree: false });
        console.log("✅ Observation activée sur :", target);
    });

    waitForElement('div.space-y-1.px-2.py-1', (target) => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType != 1) {return}
                    for (const child of node.children) {
                        if (child.classList.contains("truncate")) {
                            for (const tchild of node.children[1].children[0].children) {
                                if (tchild.textContent.startsWith('*') && tchild.textContent in goats) {
                                    node.style.background = goats[tchild.textContent][0]
                                    for (const x of node.children[1].children[0].children) {
                                        x.classList = []
                                    }
                                    node.children[1].children[0].style.cssText = `
                                                           background: ${goats[tchild.textContent][1]};
                                       -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                -webkit-text-fill-color: transparent;`
                                    
                                    
                                }
                            }
                        }
                    };
                });
            }
        });

        observer.observe(target, { childList: true, subtree: false });
        console.log("✅ Observation activée sur :", target);
    });
})();

function createTooltip(element, text) {
    const tooltip = document.createElement("div");
    tooltip.textContent = text;
    tooltip.style.position = "absolute";
    tooltip.style.background = "black";
    tooltip.style.color = "white";
    tooltip.style.padding = "5px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
    tooltip.style.transition = "opacity 0.3s";
    tooltip.style.pointerEvents = "none";

    document.body.appendChild(tooltip);

    element.addEventListener("mouseover", (event) => {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = "1";
    });

    element.addEventListener("mouseout", () => {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
    });
}

function createDropdownMenu(parentElement) {
    if (!parentElement) return;

    const rect = parentElement.getBoundingClientRect();
    const menu = document.createElement('div');

    Object.assign(menu.style, {
        position: 'absolute',
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        background: '#fff',
        border: '1px solid #ccc',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        zIndex: 1000
    });

    const btn = document.createElement('button');
    btn.textContent = 'Afficher le parent';
    btn.onclick = () => console.log('Parent:', parentElement);

    menu.appendChild(btn);
    document.body.appendChild(menu);
}

function rlog() {
    console.log("pressed")
}

async function limitText() {
    const lang = await loadLanguage();
    Array.from(document.getElementsByClassName('border-border border-b pb-4 last:border-b-0')).forEach(message => {
        let username = message.getElementsByClassName("cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 truncate max-w-[120px] sm:max-w-none text-sm sm:text-base");
        let msgContent = message.getElementsByClassName('whitespace-pre-wrap break-words text-sm leading-relaxed')[0];
        let tagname = message.getElementsByClassName("truncate")[1];

        Array.from(username).forEach(link => {
            if (link.textContent.length > 15) {
                createTooltip(link,link.textContent);
                link.textContent = lang.usernameTooLong;
                link.style.color = '#840102'
            }
        });

        if (userBlacklist.some(word => tagname.textContent.toLowerCase().includes(word))) {
            createTooltip(msgContent,msgContent.textContent);
            msgContent.textContent = lang.userBanned;
            msgContent.style.color = '#840102'
        }
        
        if (wordBlacklist.some(word => msgContent.textContent.toLowerCase().includes(word))) {
            createTooltip(msgContent,msgContent.textContent);
            msgContent.textContent = lang.bannedWords;
            msgContent.style.color = '#840102'
        }

        
        const menuBtn = document.createElement('button');
        menuBtn.setAttribute('data-slot', 'button');
        menuBtn.setAttribute('type', 'button');
        menuBtn.className = `focus-visible:border-ring focus-visible:ring-ring/50 
            aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 
            aria-invalid:border-destructive shrink-0 justify-center whitespace-nowrap 
            text-sm font-medium outline-none transition-all focus-visible:ring-[3px] 
            disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none 
            aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 
            [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer 
            hover:bg-accent dark:hover:bg-accent/50 rounded-md 
            has-[>svg]:px-2.5 flex h-auto items-center gap-1 
            p-2 text-muted-foreground hover:text-foreground`.replace(/\s+/g, ' ');
        menuBtn.textContent = '···';
        menuBtn.onclick = () => createDropdownMenu(message);
        message.children[0].children[2].append(menuBtn)

    });
}

function styliser() {
    document.documentElement.style.setProperty('--muted-foreground', '#fff');
    document.getElementsByClassName("text-base font-semibold")[0]?.insertAdjacentHTML("beforeend", "<span style='font-size: 8px;'>Enhanced</span>");
    // document.querySelector('[data-sidebar="sidebar-menu-item"]').classList.add('border')

    document.querySelectorAll('[data-sidebar="menu-item"]').forEach(val => {
        val.children[0].classList.add('hv-border');
    })
}

async function main() {
    const lang = await loadLanguage();
    console.log(lang.consoleStarting);
    chrome.runtime.sendMessage({type: "getGradient"}, (response) => {
        if (response && response.type === "setGradient") {
            window.postMessage({type: "setGradient", payload: response.payload}, "*");
        }
    });
    await limitText();
    styliser();
    console.log(lang.consoleStarted);
}

isExtensionEnabled().then(result => {
    if (result) {

        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("injected.js");
        (document.head || document.documentElement).appendChild(script);
        window.addEventListener('load', main);
    }
})

function waitForElement(selector, callback) {
    const target = document.querySelector(selector);
    if (target) {
        callback(target);
        return;
    }

    const tempObserver = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
            tempObserver.disconnect();
            callback(el);
        }
    });

    tempObserver.observe(document.body, { childList: true, subtree: false });
}

document.addEventListener("DOMContentLoaded", function() {

waitForElement('div[data-slot="card-content"].px-6.space-y-4', (target) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                limitText()
            });
        }
    });

    observer.observe(target, { childList: true, subtree: false });
});

waitForElement('div.space-y-1.px-2.py-1', (target) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType != 1) {return}
                for (const child of node.children) {
                    if (child.classList.contains("truncate")) {
                        for (const tchild of node.children[1].children[0].children) {
                            if (tchild.textContent.startsWith('*') && tchild.textContent in goats) {
                                node.style.background = goats[tchild.textContent][0]
                                for (const x of node.children[1].children[0].children) {
                                    x.classList = []
                                }
                                node.children[1].children[0].style.cssText = `
                                                       background: ${goats[tchild.textContent][1]};
                                   -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;`
                                
                                
                            }
                        }
                    }
                };
            });
        }
    });

    observer.observe(target, { childList: true, subtree: false });
    console.log("✅ Observation activée sur :", target);
});

});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setGradient") {
        window.postMessage({type: "setGradient", payload: message}, "*");
    }
});

window.addEventListener("message", async(event) => {
    let msg = event.data.payload;
    if (event.source !== window) return;
    if (event.data.type === "loadLanguage") {
        const url = chrome.runtime.getURL('lang.json');
        const response = await fetch(url);
        const langData = await response.json();
        const { selectedLanguage = 'fr' } = await new Promise(resolve => {
            chrome.storage.local.get(['selectedLanguage'], resolve);
        });
        window.postMessage({ type: "loadLanguageReturn",currentLang: selectedLanguage, payload: langData[selectedLanguage] }, "*"); 
    } 
});

// ==============================================================
