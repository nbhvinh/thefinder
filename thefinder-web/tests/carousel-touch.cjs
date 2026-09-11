// Run with a locally installed Playwright and Vite on port 5174:
// node tests/carousel-touch.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    async function reset(expanded = false) {
      await page.goto('http://127.0.0.1:5174/tests/fixtures/carousel.html');
      await page.getByRole('button', { name: /^Phóng to ảnh/ }).waitFor();
      if (expanded) {
        await page.getByRole('button', { name: /^Phóng to ảnh/ }).tap();
        await page.getByRole('dialog').waitFor();
        await page.waitForTimeout(400);
      }
      const scope = expanded ? page.getByRole('dialog') : page.locator('article');
      const track = scope.locator('[style*="translate3d"]');
      const viewport = track.locator('..');
      const box = await viewport.boundingBox();
      assert(box && box.width > 200 && box.height > 100, 'carousel must have a visible touch surface');
      return { scope, track, box };
    }
    async function touch(type, x, y) {
      await client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y, id: 1 }] });
    }
    async function drag(box, distance, duration = 400, hold = 0, during) {
      const x = box.x + box.width * (distance < 0 ? 0.85 : 0.15);
      const y = box.y + box.height * 0.32;
      await touch('touchStart', x, y);
      for (let step = 1; step <= 8; step++) {
        await touch('touchMove', x + distance * step / 8, y);
        if (duration) await page.waitForTimeout(duration / 8);
      }
      if (hold) await page.waitForTimeout(hold);
      if (during) await during();
      await touch('touchEnd');
      await page.waitForTimeout(320);
    }
    async function offset(track) {
      return track.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
    }
    async function imageNumber(scope) {
      return scope.locator('img:not([aria-hidden="true"])').getAttribute('alt');
    }
    // Reproduce the previous touch-capture bug in the served test module only.
    // The application source on disk remains the fixed version.
    await page.route('**/src/components/post/SwipeablePostImage.jsx*', async (route) => {
      const response = await route.fetch();
      let source = await response.text();
      assert(source.includes('onLostPointerCapture: lostCapture'));
      source = source.replace('event.currentTarget.setPointerCapture(event.pointerId);', '')
        .replace("gesture.axis = vertical ? \"y\" : \"x\";", 'gesture.axis = vertical ? "y" : "x"; event.currentTarget.setPointerCapture(event.pointerId);')
        .replace('onLostPointerCapture: lostCapture', 'onLostPointerCapture: cancel')
        .replace('pointer-events-none absolute inset-0', 'absolute inset-0');
      await route.fulfill({ response, body: source });
    });
    const broken = await reset();
    await drag(broken.box, -broken.box.width * 0.3, 500, 400, async () => {
      assert(Math.abs(await offset(broken.track)) < 1, 'old handler should incorrectly cancel the held drag');
    });
    console.log('REPRODUCED old touch-capture bug: held drag incorrectly resets');
    await page.unrouteAll();
    await client.send('Network.clearBrowserCache');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    for (const expanded of [false, true]) {
      const mode = expanded ? 'expanded' : 'preview';
      let view = await reset(expanded);
      await drag(view.box, -view.box.width * 0.3, 500, 400, async () => {
        assert(Math.abs(await offset(view.track) + view.box.width * 0.3) < 3, 'image must remain under the finger while held');
        assert.match(await imageNumber(view.scope), /^Ảnh 1 /);
        await page.screenshot({ path: `/private/tmp/carousel-${mode}-held.png` });
      });
      assert(Math.abs(await offset(view.track)) < 1, 'short held drag must snap back');
      assert.match(await imageNumber(view.scope), /^Ảnh 1 /);
      console.log(`PASS ${mode}: live tracking, hold and snap-back`);

      view = await reset(expanded);
      await drag(view.box, -view.box.width * 0.6, 500, 200);
      assert.match(await imageNumber(view.scope), /^Ảnh 2 /);
      if (!expanded) assert.equal(await page.getByRole('dialog').count(), 0, 'swipe must not open lightbox');
      await drag(view.box, view.box.width * 0.6, 500, 200);
      assert.match(await imageNumber(view.scope), /^Ảnh 1 /);
      console.log(`PASS ${mode}: halfway threshold in both directions`);

      view = await reset(expanded);
      await drag(view.box, -view.box.width * 0.3, 0);
      assert.match(await imageNumber(view.scope), /^Ảnh 2 /);
      console.log(`PASS ${mode}: short fast flick`);

      view = await reset(expanded);
      const x = view.box.x + view.box.width * 0.8;
      const y = view.box.y + view.box.height * 0.32;
      await touch('touchStart', x, y);
      await touch('touchMove', x - 90, y);
      await touch('touchCancel');
      await page.waitForTimeout(320);
      assert.match(await imageNumber(view.scope), /^Ảnh 1 /);
      assert(Math.abs(await offset(view.track)) < 1);
      console.log(`PASS ${mode}: cancelled gesture resets`);
    }
    const view = await reset();
    await page.getByRole('button', { name: /^Phóng to ảnh/ }).tap();
    const close = page.getByRole('button', { name: 'Đóng ảnh phóng to' });
    await close.waitFor();
    const color = await close.evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.notEqual(color, 'rgba(0, 0, 0, 0)');
    await close.tap();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Xem ảnh tiếp theo' }).tap();
    await page.waitForTimeout(80);
    assert(Math.abs(await offset(view.track)) > 10, 'arrow must animate the track before committing');
    await page.waitForTimeout(240);
    assert.match(await imageNumber(view.scope), /^Ảnh 2 /);
    console.log('PASS tap to expand, close and arrow navigation');

    await reset();
    await touch('touchStart', 190, 230);
    for (let i = 1; i <= 8; i++) {
      await touch('touchMove', 190, 230 - i * 15);
      await page.waitForTimeout(25);
    }
    await touch('touchEnd');
    await page.waitForTimeout(150);
    assert(await page.evaluate(() => window.scrollY) > 0, 'vertical scrolling must remain usable');
    assert.deepEqual(errors, []);
    console.log('PASS vertical scrolling; no browser runtime errors');

    async function verticalDrag(distanceFraction, fast = false, hold = 0, cancel = false) {
      const view = await reset(true);
      const panel = view.scope.locator('section');
      const distance = view.box.height * distanceFraction;
      const x = view.box.x + view.box.width * 0.55;
      const y = view.box.y + view.box.height * (distance < 0 ? 0.7 : 0.3);
      await touch('touchStart', x, y);
      const steps = fast ? 3 : 8;
      for (let step = 1; step <= steps; step++) {
        await touch('touchMove', x, y + distance * step / steps);
        if (!fast) await page.waitForTimeout(50);
      }
      if (hold) await page.waitForTimeout(hold);
      let held;
      // Measuring between the last move and release would turn a flick into a hold.
      if (!fast) {
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        held = await panel.evaluate((node) => {
          const m = new DOMMatrixReadOnly(getComputedStyle(node).transform);
          return { y: m.m42, scale: m.a };
        });
        assert(Math.abs(held.y - distance) < 3, `full image must follow vertical finger position: ${held.y} vs ${distance}`);
        assert(held.scale < 1 && held.scale >= 0.55, 'full image must shrink while dragging');
        assert.equal(await page.getByRole('dialog').count(), 1, 'holding must not dismiss');
      }
      await touch(cancel ? 'touchCancel' : 'touchEnd');
      const shouldClose = !cancel && (Math.abs(distanceFraction) > 0.25 || fast);
      if (shouldClose) {
        await page.waitForTimeout(100);
        assert.equal(await page.locator('.image-lightbox-closing').count(), 1, 'dismiss must animate before unmounting');
        const closing = await panel.evaluate((node) => {
          const style = getComputedStyle(node);
          const m = new DOMMatrixReadOnly(style.transform);
          return { y: m.m42, scale: m.a, targetY: parseFloat(style.getPropertyValue('--preview-origin-y')) };
        });
        assert(Math.abs(closing.y - closing.targetY) <= Math.abs(distance - closing.targetY) + 1, 'closing image must move toward the post thumbnail');
        assert(closing.scale < (held?.scale ?? 1) - 0.01, 'closing image must continue shrinking toward the thumbnail');
        await page.getByRole('dialog').waitFor({ state: 'detached' });
      } else {
        await page.waitForTimeout(300);
        const transform = await panel.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).toString());
        assert.equal(transform, 'matrix(1, 0, 0, 1, 0, 0)', 'short/cancelled vertical drag must return to full size');
      }
    }
    await verticalDrag(0.12, false, 350);
    await verticalDrag(0.35, false, 250);
    await verticalDrag(-0.35, false, 250);
    await verticalDrag(0.12, true);
    await verticalDrag(-0.12, true);
    await verticalDrag(0.3, false, 0, true);
    console.log('PASS vertical drag: tracking, shrinking, hold, snap-back, up/down dismiss, flick and cancel');

    const desktop = await context.newPage();
    await desktop.setViewportSize({ width: 1280, height: 900 });
    await desktop.goto('http://127.0.0.1:5174/tests/fixtures/carousel.html');
    for (const expanded of [false, true]) {
      if (expanded) {
        await desktop.getByRole('button', { name: /^Phóng to ảnh/ }).click();
        await desktop.waitForTimeout(400);
      }
      const scope = expanded ? desktop.getByRole('dialog') : desktop.locator('article');
      const track = scope.locator('[style*="translate3d"]');
      const before = await imageNumber(scope);
      await scope.getByRole('button', { name: 'Xem ảnh tiếp theo' }).click();
      await desktop.waitForTimeout(80);
      assert(Math.abs(await offset(track)) > 10, 'desktop arrow must animate');
      await desktop.waitForTimeout(240);
      assert.notEqual(await imageNumber(scope), before);
    }
    console.log('PASS desktop arrows animate in preview and expanded views');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
