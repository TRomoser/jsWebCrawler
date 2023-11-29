const { load } = require("cheerio");
const fs = require("fs/promises")
const os = require("os")

const crawlPage = async (pageURL) => {
    const response = await fetch(pageURL);
    const html = await response.text();
    const $ = load(html);

    const discoveredHTMLAElements = $("a[href]");

    const discoveredURLs = [];
    discoveredHTMLAElements.each((_, a) => {
        discoveredURLs.push($(a).attr("href"))
    });

    const baseURL = "https://scrapeme.live/";
    const filteredDiscoveredURLs = discoveredURLs.filter((url) => {
        return (
            url.startsWith(baseURL) &&
            (!url.startsWith(`${baseURL}/wp-admin`) || url === `${baseURL}/wp-admin/admin-ajax.php`)
        )
    });

    return filteredDiscoveredURLs
};


const crawlSite = async () => {
    const startTime = new Date();
    let interval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = currentTime - startTime;
        console.log(`Elapsed time: ${formatTime(elapsedTime)}`);
    }, 10000);

    const pagesToCrawl = ["https://scrapeme.live/shop"];
    const pagesCrawled = new Set(); // Use a Set for efficient lookup
    const discoveredURLs = new Set();

    while (pagesToCrawl.length !== 0) {
        const currentPage = pagesToCrawl.pop();
        console.log(`Crawling page: ${currentPage}`);

        if (!pagesCrawled.has(currentPage)) {
            try {
                const pageDiscoveredURLs = await crawlPage(currentPage);
                pageDiscoveredURLs.forEach(url => {
                    discoveredURLs.add(url);
                    if (!pagesCrawled.has(url) && url !== currentPage) {
                        pagesToCrawl.push(url);
                    }
                });
                console.log(`${pageDiscoveredURLs.length} URLs found`);
            } catch (error) {
                console.error(`Error crawling ${currentPage}: ${error}`);
            }

            pagesCrawled.add(currentPage);
            console.log(`${discoveredURLs.size} URLs discovered so far`);
        }
    }
    clearInterval(interval);

    const endTime = new Date();
    const totalElapsedTime = endTime - startTime;
    console.log(`Total elapsed time: ${formatTime(totalElapsedTime)}`);

    const csvContent = [...discoveredURLs].join(os.EOL);
    await fs.writeFile("full_output.csv", csvContent);
};

crawlSite();