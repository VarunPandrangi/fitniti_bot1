// scripts/scrape.js
import fs from 'fs';
import axios from 'axios';
import { load } from 'cheerio';

const PAGES = [
    'https://www.fitniti.com/',
    'https://www.fitniti.com/events',
    'https://www.fitniti.com/results',
    'https://www.fitniti.com/charity',
    'https://www.fitniti.com/groups',
    'https://www.fitniti.com/policy',
    'https://www.fitniti.com/privacy',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000004565-i-haven-t-received-any-confirmation-receipt-for-the-event-registered',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000004576-not-able-to-add-more-than-10-participants',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000004605-why-i-am-expected-to-provide-pan-number-',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000004630-can-i-get-a-refund-or-transfer-donate-my-registration',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000004631-will-the-event-be-called-off-in-case-of-heavy-rain',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000006259-not-able-to-understand-the-t-shirt-sizes',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000008243-what-happens-if-money-is-deducted-but-transaction-failed-',
    'https://runfitpro.freshdesk.com/support/solutions/articles/89000008246-how-can-i-upgrade-downgrade-the-category'
];

async function scrape() {
    const docs = [];

    console.log(`Starting targeted scrape of ${PAGES.length} pages...`);

    for (const url of PAGES) {
        try {
            const { data } = await axios.get(url, { timeout: 15000 });
            const $ = load(data);
            
            let textContent = '';

            // Use different selectors based on the site structure
            if (url.includes('fitniti.com')) {
                // For fitniti, target the main content, but exclude header and footer
                $('script, style, header, footer').remove();
                textContent = $('body').text();
            } else if (url.includes('freshdesk.com')) {
                // For freshdesk, specifically target the article body
                textContent = $('div.article__body').text();
                // If that fails, try a fallback for the general solutions page
                if (!textContent) {
                    textContent = $('section.container').text();
                }
            }

            // Clean up the extracted text
            const cleanedText = textContent
                .replace(/<[^>]*>/g, ' ') // Remove leftover HTML tags
                .replace(/\s\s+/g, ' ')   // Replace multiple spaces with a single space
                .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with a single newline
                .trim();

            if (cleanedText.length > 20) {
                docs.push({ url, text: cleanedText });
                console.log(`✅ Scraped and Cleaned: ${url}`);
            } else {
                console.warn(`⚠️ Skipped (not enough content after cleaning): ${url}`);
            }

        } catch (err) {
            console.error(`❌ Failed to scrape ${url}: (${err.response?.status || err.message})`);
        }
    }

    if (docs.length > 0) {
        fs.writeFileSync('knowledge.json', JSON.stringify(docs, null, 2));
        console.log(`\n🎉 Success! Wrote ${docs.length} docs to a clean knowledge.json file.`);
    } else {
        console.error(`\n❌ No pages were successfully scraped. knowledge.json was not written.`);
    }
}

scrape();
