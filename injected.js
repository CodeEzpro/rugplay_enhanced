let lang = [];
let currentLang = "";
let customStylesheet = [];

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    console.log("Injected.js received message:", event.data);
    if (event.data.type == "loadLanguageReturn") {
        lang = event.data.payload;
        currentLang = event.data.currentLang;
    } else if (event.data.type === "CustomStylesheetReturn") {
        customStylesheet = event.data.payload;
    } else if (event.data.type === "setGradient") {
        const gradientValue = event.data.payload.gradient;
        const deep = event.data.payload.deep;
        console.log("Applying gradient:", gradientValue, deep);
        document.body.style.background = gradientValue;
        document.documentElement.style.setProperty('--background', gradientValue);
        document.documentElement.style.setProperty('--popover', deep);
    }
});

window.postMessage({ type: "loadLanguage", payload: "none" }, "*");
window.postMessage({ type: "CustomStylesheet", payload: "none" }, "*");
window.postMessage({ type: "getGradient", payload: "none" }, "*");

const goats = {
      0   : "linear-gradient(135deg, hsl(43.01deg 100% 52.92%) 0%, hsl(0deg 0% 15.9%) 100%)",
      1   : "linear-gradient(135deg, hsl(43.01deg 1.68% 63.31%) 0%, hsl(0deg 0% 15.9%) 100%)",
      2   : "linear-gradient(135deg, hsl(18.09deg 64.16% 58.66%) 0%, hsl(0deg 0% 15.9%) 100%)",
    "TCZ" : "linear-gradient(to left, #c2410c, #f7873a)",
    "KNT" : "linear-gradient(to left, rgb(0 105 117) 50%, rgb(0, 187, 255))",
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrowText = lang.tooltip.tomorrowAt;
    return (date.getDate() !== now.getDate() ? tomorrowText : "" ) + `${date.getHours()}:${String(date.getMinutes()).length == 1 ? "0" + date.getMinutes() : date.getMinutes()}`;
};

function formatNumber(n) {
  if (currentLang.includes("ja")) {
    if (n < 10000) return n.toString();

    const units = [
      { value: 1e12, symbol: "cho" }, // chō
      { value: 1e8, symbol: "oku" },  // oku
      { value: 1e4, symbol: "man" }   // man
    ];

    for (const unit of units) {
      if (n >= unit.value) {
        return (n / unit.value).toFixed(n / unit.value < 10 ? 1 : 0) + lang.abreviated[unit.symbol];
      }
    }
  }

  if (n < 1000) return n.toString();

  const suffixes = ["", "k", "m", "b", "t"];
  const tier = Math.log10(n) / 3 | 0;
  const scale = Math.pow(10, tier * 3);
  const scaled = n / scale;

  return scaled.toFixed(scaled < 10 ? 1 : 0) + lang.abreviated[suffixes[tier]];
}

function createTooltip(element, text) {
    if (element._tooltip) {
        return element._tooltip;
    }

    const tooltip = document.createElement("div");
    tooltip.textContent = text;
    tooltip.style.cssText = "position: absolute; background: rgba(34, 34, 34, 0.8); color: white; padding: 5px; border-radius: 5px; visibility: hidden; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 9999; white-space: pre-line;";

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

    element._tooltip = tooltip;

    return tooltip;
}

// Don't try to stupidly call this function to get multiples rewards, it's not going to work and ull probably get banned
async function claimRewards() {
    const response = await fetch("https://rugplay.com/api/rewards/claim", {
        method: "POST",
        headers: {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            credentials: "include",
            "Priority": "u=1, i",
            "Referer": "https://rugplay.com/",
            "Sec-Ch-Ua": `"Chromium";v="134", "Not:A-Brand";v="24", "Opera GX";v="119"`,
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": `"Windows"`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/119.0.0.0"
        },
    });
}

function reward(requestContent) {
    try {
        const buttonElement = document.getElementsByClassName("focus-visible:border-ring")[0];
        if (!buttonElement) {
            console.log("reward: buttonElement not found");
            return;
        }
        createTooltip(buttonElement.parentElement,`${lang.tooltip.dayStreakTooltip}: ${requestContent.loginStreak}\n${lang.tooltip.totalMoney}: ${requestContent.totalRewardsClaimed}$\n${lang.tooltip.nextRewardAmount}: ${requestContent.rewardAmount}$`)
        const textButtonElement = buttonElement.querySelectorAll("span")[0];
        if (!textButtonElement) {
            console.log("reward: textButtonElement not found");
            return;
        }

        if (requestContent.canClaim == true && !requestContent.success) {
            textButtonElement.textContent = lang.content.rewardClaim;
            buttonElement.children[0].style.display = "none"
            buttonElement.disabled = false
            buttonElement.style.backgroundColor = "var(--primary)"
            buttonElement.onclick = claimRewards;
        } else {
            buttonElement.onclick = '';
            let formatedDate = formatDate(requestContent["nextClaimTime"]);
            textButtonElement.textContent = formatedDate;
            buttonElement.children[0].style.display = "inline-flex;"
        }
    } catch (error) {
        console.error("Error in reward function:", error);
    }
}

function waitForElement(selector, callback) {
  const found = document.querySelector(selector);
  if (found) {
    callback(found);
    return;
  }

  const observer = new MutationObserver((mutations, obs) => {
    const el = document.querySelector(selector);
    if (el) {
      obs.disconnect(); // on coupe l'observer dès la détection
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function ctop(jsonData) {
    
    p = document.getElementsByClassName("container mx-auto p-6")[0];
    waitForElement('div.flex.h-96.items-center.justify-center', function(target) {
        target.remove();
        d = document.createElement("div");
        d.className = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 cstom";
        p.appendChild(d);

        pos='<span data-slot="badge" class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&amp;>svg]:pointer-events-none [&amp;>svg]:size-3 bg-green-600 hover:bg-green-700 border-transparent text-white ml-2">+'
        neg='<span data-slot="badge" class="focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&amp;>svg]:pointer-events-none [&amp;>svg]:size-3 bg-destructive [a&amp;]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white">'

        jsonData.coins.slice(0,6).forEach((coin,i) => {
            style2Add = ""

            if (goats[coin.symbol] || goats[i]) {
                style2Add = ` style = 'background: ${goats[coin.symbol] || goats[i]};'`;
            }

            d.insertAdjacentHTML("beforeend", 
                `<a class="block" href="/coin/${coin.symbol}">
                    <div data-slot="card" class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm hover:bg-card/50 h-full transition-all hover:shadow-md" ${style2Add}>
                        <div data-slot="card-header" class="@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                            <div data-slot="card-title" class="font-semibold leading-none flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    ${ coin.icon == null ? `<div class="h-6 w-6 bg-primary flex items-center justify-center overflow-hidden rounded-full "><span class="text-xs font-bold text-white">${coin.symbol.slice(0, 2)}</span></div>` : `<img loading="lazy" decoding="async" src="/api/proxy/s3/${coin.icon}" alt="${coin.name}" class="h-6 w-6 rounded-full object-cover "></img>`}
                                    <span>${coin.name} (*${coin.symbol})</span>
                                </div>
                                ${coin.change24h >= 0 ? pos : neg}
                                    ${coin.change24h}%
                                </span>
                            </div>
                            <p data-slot="card-description" class="text-muted-foreground text-sm">Market Cap: $${formatNumber(coin.marketCap)}
                            </p>
                        </div>
                        <div data-slot="card-content" class="px-6">
                            <div class="flex items-baseline justify-between"><span class="text-3xl font-bold">$${coin.price.toFixed(2)}</span> <span class="text-muted-foreground text-sm">24h Vol: $${formatNumber(coin.volume24h)}</span></div>
                        </div>
                    </div>
                </a>`
            );
        });

        elem = `<div class="mt-12">
			<h2 class="mb-4 text-2xl font-bold">${lang.home.marketOverview}</h2>
			<div data-slot="card" class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
				<div data-slot="card-content" class="px-6">
					<div data-slot="table-container" class="relative w-full overflow-x-auto">
						<table data-slot="table" class="w-full caption-bottom text-sm">
                            <thead data-slot="table-header" class="[&amp;_tr]:border-b">	
								<tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
									<th data-slot="table-head" class="text-foreground h-10 whitespace-nowrap px-2 text-left align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium">
										${lang.home.name}
									</th>
									
									<th data-slot="table-head" class="text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&amp;:has([role=checkbox])]:pr-0 min-w-[80px]">
										${lang.home.price}
									</th>
									
									<th data-slot="table-head" class="text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&amp;:has([role=checkbox])]:pr-0 min-w-[80px]">
										${lang.home.change24}
									</th>
									
									<th data-slot="table-head" class="text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&amp;:has([role=checkbox])]:pr-0 min-w-[80px]">
										${lang.home.marketCap}
									</th>
									
									<th data-slot="table-head" class="text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&amp;:has([role=checkbox])]:pr-0 min-w-[80px]">
										${lang.home.volume24h}
									</th>
								</tr>			
							</thead>
                            <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
        `

        jsonData.coins.forEach((coin,i) => {
            style2Add = ""

            if (goats[coin.symbol] || goats[i]) {
                style2Add = ` style = 'background: ${goats[coin.symbol] || goats[i]};'`;
            }
            
            elem += `<tr data-slot="table-row" class="data-[state=selected]:bg-muted border-b hover:bg-muted/50 cursor-pointer transition-colors"${style2Add}>
				<td data-slot="table-cell" class="whitespace-nowrap p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium" style="border-radius: ${(1-Math.min(1, Math.abs(i)))*10}px 0px 0px ${(1 - Math.min(1, Math.abs(i - 2)))*10}px;">
					<div class="flex items-center gap-2">
						${coin.icon == null ? `<div class="h-6 w-6 bg-primary flex items-center justify-center overflow-hidden rounded-full "><span class="text-xs font-bold text-white">${coin.symbol.slice(0, 2)}</span></div>` : `<img loading="lazy" decoding="async" src="/api/proxy/s3/${coin.icon}" alt="${coin.name}" class="h-6 w-6 rounded-full object-cover "></img>`}
						<span class="font-medium">${coin.name}</span>
					</div>
				</td>
				<td data-slot="table-cell" class="whitespace-nowrap p-2 align-middle [&amp;:has([role=checkbox])]:pr-0">
					<span>$${coin.price.toFixed(6)}</span>
				</td>
				<td data-slot="table-cell" class="whitespace-nowrap p-2 align-middle [&amp;:has([role=checkbox])]:pr-0">
					${coin.change24h >= 0 ? pos : neg}
						${coin.change24h}%
					</span>
				</td>

				<td data-slot="table-cell" class="whitespace-nowrap p-2 align-middle [&amp;:has([role=checkbox])]:pr-0">
					<span>$${formatNumber(coin.marketCap)}</span>
				</td>
				<td data-slot="table-cell" class="whitespace-nowrap p-2 align-middle [&amp;:has([role=checkbox])]:pr-0"style="border-radius: 0px ${(1-Math.min(1, Math.abs(i)))*10}px ${(1 - Math.min(1, Math.abs(i - 2)))*10}px 0px;">
					<span>${formatNumber(coin.volume24h)}</span>
				</td>
			</tr>
            `
        });
        elem += "</tbody></table></div></div></div>"

        p.insertAdjacentHTML("beforeend",elem)

        console.log("created")
    });
    
}

let debug = false;

(function () {
    const originalFetch = window.fetch;
    const customLimit = 100; // useless shit, the server is limited to 100 transaction max
    const debug = false; // logs fetch for EVERY requests

    window.fetch = async (...args) => {
        let [url, options] = args;
        options = options || {};

        
        if (debug) {
            console.log("🔎 Interception de fetch");
            console.log("🌐 URL finale :", args[0]);
            console.log("⚙️ Options :", options);
        }

        const response = await originalFetch(...args);
        const cloned = response.clone();
        const json = await cloned.json().catch(() => "Réponse non-JSON");

        if (debug) {
            console.log("📤 Requête envoyée :", { url: args[0], method: options.method || "GET" });
            console.log("📥 Réponse reçue :", json);
        }

        if (typeof url === "string") {
            if (url.includes("/api/trades/recent")) {
                try {
                    const urlObj = new URL(url, window.location.origin); // Assure une base correcte
                    urlObj.searchParams.set("limit", customLimit.toString());
                    args[0] = urlObj.toString();

                    if (debug) {
                        console.log("🛠️ URL modifiée :", args[0]);
                    }
                } catch (e) {
                    if (debug) console.warn("❗ Erreur lors de la manipulation de l'URL :", e);
                }
            } else if (url.includes("/api/coins/top")) {
                try {
                    return new Response(null, { status: 204, statusText: "No Content" });
                } finally {
                    ctop(json);
                }
                
            }
        }

        if (typeof args[0] === "string" && args[0].includes("claim")) {
            reward(json);
            return new Response(null, { status: 204, statusText: "No Content" });
        }

        return response;
    };
})();


window.addEventListener("load", () => {
    document.querySelectorAll('.bg-popover').forEach(el => {
        el.style.backgroundColor = 'none';
        el.style.background = "var(--pop-up)";
    });
});

const originalConsoleError = console.error;

const errorBlacklist = ["Error fetching reward status:","Failed to fetch coins:","https://analytics.outpoot.com/api/event"]

console.error = function (...args) {
    const message = args.join(" ").split(":")[0]+":";
    function errorFilter(error) {
        return error == message
    }
    if (errorBlacklist.find(errorFilter)) {
        return; // Ignoring error of the original reward script
    } else {
        originalConsoleError.apply(console, args);
    }
};
