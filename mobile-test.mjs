import { chromium, devices } from 'playwright';

async function run() {
    console.log("Starting Mobile Scroll Analysis...");

    const browser = await chromium.launch({ headless: true });
    // Emulate iPhone 13 Pro
    const context = await browser.newContext({
        ...devices['iPhone 13 Pro'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true
    });

    const page = await context.newPage();

    // Listen to all console logs to track touch numbers
    page.on('console', msg => {
        if (msg.text().includes('[ANALYTICS]')) {
            console.log(msg.text());
        }
    });

    console.log("Navigating to Manifesto page...");
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(3000); // Wait for animations to settle

    console.log("Injecting scroll and touch analytics tracking...");
    await page.evaluate(() => {
        let touchStart = 0;
        let ts = 0;
        window.addEventListener('touchstart', e => {
            touchStart = e.touches[0].clientY;
            ts = Date.now();
        }, { passive: true });

        window.addEventListener('touchend', e => {
            let dy = touchStart - e.changedTouches[0].clientY;
            let dt = Date.now() - ts;
            console.log(`[ANALYTICS] TouchEnd emitted. Distance: ${dy}px, Time: ${dt}ms, Velocity: ${(dy / dt).toFixed(2)}px/ms`);
        }, { passive: true });

        window.addEventListener('touchcancel', () => {
            console.log(`[ANALYTICS] TouchCancel emitted! The browser interrupted the touch gesture.`);
        }, { passive: true });
    });

    // We must emulate direct touch dispatches because page.mouse often doesn't trigger touch events properly
    console.log("\n--- TEST 1: Normal Slow Swipe (Reading speed) ---");
    await page.evaluate(async () => {
        const touch = new Touch({ identifier: Math.Date, target: document.body, clientX: 200, clientY: 600 });
        document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch] }));

        await new Promise(r => setTimeout(r, 100));

        const touch2 = new Touch({ identifier: Math.Date, target: document.body, clientX: 200, clientY: 400 });
        document.body.dispatchEvent(new TouchEvent('touchmove', { touches: [touch2], changedTouches: [touch2] }));

        await new Promise(r => setTimeout(r, 200)); // 300ms total for 200px = ~0.66 px/ms

        document.body.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2] }));
    });

    await page.waitForTimeout(1000);

    console.log("\n--- TEST 2: Fast Flick (Fast scroll) ---");
    await page.evaluate(async () => {
        const touch = new Touch({ identifier: Math.Date, target: document.body, clientX: 200, clientY: 700 });
        document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch] }));

        await new Promise(r => setTimeout(r, 20));

        const touch2 = new Touch({ identifier: Math.Date, target: document.body, clientX: 200, clientY: 200 }); // 500px in 50ms = 10 px/ms
        document.body.dispatchEvent(new TouchEvent('touchmove', { touches: [touch2], changedTouches: [touch2] }));

        await new Promise(r => setTimeout(r, 30));

        document.body.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2] }));
    });

    await page.waitForTimeout(2000);
    await browser.close();
    console.log("\nAnalysis complete.");
}

run().catch(console.error);
