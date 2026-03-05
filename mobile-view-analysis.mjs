import { chromium, devices } from 'playwright';

async function run() {
    console.log("Starting Mobile Scroll Analysis...");
    const browser = await chromium.launch({ headless: true });

    // Emulate iPhone 13 Pro
    const context = await browser.newContext({
        ...devices['iPhone 13 Pro'],
        hasTouch: true,
        isMobile: true,
        recordVideo: { dir: './mobile-recording/' }
    });

    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('Warning')) {
            console.log(`[Browser Log] ${msg.text()}`);
        }
    });

    console.log(`Navigating to application on port 3000...`);
    try {
        await page.goto('http://localhost:3000/');
    } catch {
        console.log(`Falling back to port 5173...`);
        await page.goto('http://127.0.0.1:5173/');
    }

    await page.waitForLoadState('networkidle');
    console.log("Page loaded. Taking initial screenshot...");
    await page.screenshot({ path: 'mobile_top.png' });

    console.log("Injecting analysis trackers...");
    await page.evaluate(() => {
        window.scrollLogs = [];
        let lastY = window.scrollY;

        // Track large layout shifts
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.hadRecentInput) continue;
                    window.scrollLogs.push(`Layout shift detected: value ${entry.value.toFixed(4)}`);
                }
            });
            observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) { }

        // Track scroll jittering on mobile
        window.addEventListener('scroll', () => {
            const diff = window.scrollY - lastY;
            // If we scrolled backwards unexpectedly by a large amount without user input
            if (Math.abs(diff) > 200) {
                // Ignore if it's normal scrolling
            }
            lastY = window.scrollY;
        }, { passive: true });
    });

    console.log("\n--- SIMULATING MOBILE SWIPING DOWN ---");
    // Function to simulate a mobile swipe
    async function emulateSwipeDown(distance) {
        await page.evaluate(async (dist) => {
            const startY = window.innerHeight * 0.8;
            const endY = startY - dist;

            const touchStart = new Touch({ identifier: Date.now(), target: document.body, clientX: 150, clientY: startY });
            document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart], bubbles: true }));

            await new Promise(r => setTimeout(r, 50));

            const touchMove = new Touch({ identifier: Date.now(), target: document.body, clientX: 150, clientY: endY });
            document.body.dispatchEvent(new TouchEvent('touchmove', { touches: [touchMove], changedTouches: [touchMove], bubbles: true }));

            await new Promise(r => setTimeout(r, 50));

            document.body.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchMove], bubbles: true }));
        }, distance);
        // Wait for native scroll to process
        await page.waitForTimeout(600);
    }

    // Swipe down 15 times to reach bottom
    for (let i = 0; i < 15; i++) {
        await emulateSwipeDown(400); // 400px swipe
        const currentY = await page.evaluate(() => window.scrollY);
        console.log(`Swiped down... Current scrollY: ${Math.round(currentY)}`);
    }

    console.log("Reached bottom of scrolling. Taking bottom screenshot...");
    await page.screenshot({ path: 'mobile_bottom.png' });
    await page.waitForTimeout(1000);

    console.log("\n--- SIMULATING FAST SWIPING UP ---");
    async function emulateSwipeUp(distance) {
        await page.evaluate(async (dist) => {
            const startY = window.innerHeight * 0.2;
            const endY = startY + dist;

            const touchStart = new Touch({ identifier: Date.now(), target: document.body, clientX: 150, clientY: startY });
            document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart], bubbles: true }));

            await new Promise(r => setTimeout(r, 30));

            const touchMove = new Touch({ identifier: Date.now(), target: document.body, clientX: 150, clientY: endY });
            document.body.dispatchEvent(new TouchEvent('touchmove', { touches: [touchMove], changedTouches: [touchMove], bubbles: true }));

            await new Promise(r => setTimeout(r, 30));

            document.body.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchMove], bubbles: true }));
        }, distance);
        await page.waitForTimeout(600);
    }

    // Swipe up fast 15 times
    for (let i = 0; i < 15; i++) {
        await emulateSwipeUp(500);
        const currentY = await page.evaluate(() => window.scrollY);
        console.log(`Swiped up... Current scrollY: ${Math.round(currentY)}`);
    }

    console.log("Gathering any layout shift/jitter logs...");
    const logs = await page.evaluate(() => window.scrollLogs);
    if (logs.length > 0) {
        console.log("Issues detected:", logs);
    } else {
        console.log("No layout shift exceptions thrown.");
    }

    // Check horizontal overflow
    const overflowInfo = await page.evaluate(() => {
        return {
            docWidth: document.documentElement.scrollWidth,
            winWidth: window.innerWidth
        };
    });

    if (overflowInfo.docWidth > overflowInfo.winWidth) {
        console.log(`\nWARNING: Horizontal OVERFLOW detected! Document width is ${overflowInfo.docWidth}px, Viewport is ${overflowInfo.winWidth}px. This often breaks mobile scrolling.`);
    } else {
        console.log(`\nNo horizontal overflow detected (Width: ${overflowInfo.winWidth}px).`);
    }

    const videoPath = await page.video().path();
    console.log(`\nMobile UI recording saved to: ${videoPath}`);

    await browser.close();
    console.log("Analysis finished.");
}

run().catch(console.error);
