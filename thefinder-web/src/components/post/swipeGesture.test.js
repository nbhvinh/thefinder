import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseVelocity, swipeDirection } from './swipeGesture.js';

test('a slow drag must pass halfway before changing images in either direction', () => {
  for (const width of [280, 390, 720]) {
    assert.equal(swipeDirection(-width * 0.49, width, -0.1), 0);
    assert.equal(swipeDirection(width * 0.5, width, 0.1), 0);
    assert.equal(swipeDirection(-width * 0.51, width, 0), 1);
    assert.equal(swipeDirection(width * 0.51, width, 0), -1);
  }
});

test('a short fast flick advances, while a tap or slow short drag does not', () => {
  assert.equal(swipeDirection(-60, 390, -0.8), 1);
  assert.equal(swipeDirection(60, 390, 0.8), -1);
  assert.equal(swipeDirection(-60, 390, -0.1), 0);
  assert.equal(swipeDirection(-5, 390, -1), 0);
});

test('holding after a fast movement removes flick momentum', () => {
  const samples = [{ x: 200, time: 0 }, { x: 140, time: 50 }];
  const fast = releaseVelocity(samples, 130, 70);
  assert.equal(swipeDirection(-70, 390, fast), 1);
  const held = releaseVelocity(samples, 130, 500);
  assert.equal(held, 0);
  assert.equal(swipeDirection(-70, 390, held), 0);
});

test('reversing toward the starting image does not trigger the old flick direction', () => {
  const velocity = releaseVelocity([{ x: 80, time: 200 }, { x: 110, time: 230 }], 140, 260);
  assert.equal(swipeDirection(-60, 390, velocity), 0);
});
