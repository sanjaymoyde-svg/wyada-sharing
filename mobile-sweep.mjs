import { chromium, devices } from 'playwright';

async function run() {
    console.log("Starting Mobile Layout Sweep...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        ...devices['iPhone 13 Pro'],
        hasTouch: true,
        isMobile: true
    });

    const page = await context.newPage();

    let issues = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            issues.push(`Console Error: ${msg.text()}`);
        }
    });

    console.log(`Navigating...`);
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);

    console.log("Injecting geometry trackers...");
    await page.evaluate(() => {
        window.domIssues = [];

        // Find obviously overlapping/broken layout elements on mobile
        window.checkLayout = () => {
            const allElements = document.querySelectorAll('*');
            const docWidth = document.documentElement.clientWidth;

            let localIssues = new Set();

            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Ignore invisible elements or tiny ones
                if (rect.width === 0 || rect.height === 0) return;

                // Check if it overflows screen horizontally
                if (rect.right > docWidth + 2) {
                    localIssues.add(`Horizontal Overflow: ${el.tagName}.${el.className} extends to ${rect.right}px (max ${docWidth}px)`);
                }
            });

            localIssues.forEach(i => window.domIssues.push(i));
        };
    });

    // Scroll sweep using mouse wheel which is reliable
    for (let i = 1; i <= 25; i++) {
        await page.mouse.wheel(0, 600); // Scrolldown 600px
        await page.waitForTimeout(400); // Let snap apply / animations render

        // take a screenshot every few scrolls
        if (i % 5 === 0) {
            await page.screenshot({ path: `mobile_sweep_${i}.png` });
        }

        // Scan dom at each stop
        await page.evaluate(() => window.checkLayout());
    }

    console.log("Reached bottom (probably), now scrolling back up...");
    for (let i = 1; i <= 25; i++) {
        await page.mouse.wheel(0, -600);
        await page.waitForTimeout(400);
    }

    // Final report
    const finalIssues = await page.evaluate(() => [...new Set(window.domIssues)]);
    if (finalIssues.length > 0) {
        console.log("\n--- LAYOUT ANOMALIES FOUND ---");
        finalIssues.forEach(i => console.log(i));
    } else {
        console.log("\n--- LAYOUT CHECK CLEAN ---");
        console.log("No elements were extending beyond the mobile viewport bounds.");
    }

    await browser.close();
    console.log("Done.");
}

run().catch(console.error);
