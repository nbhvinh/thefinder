export function swipeDirection(distance, width, velocity) {
  if (Math.abs(distance) > width / 2) return distance < 0 ? 1 : -1;
  if (Math.abs(distance) >= 20 && Math.abs(velocity) >= 0.5 && Math.sign(distance) === Math.sign(velocity)) {
    return distance < 0 ? 1 : -1;
  }
  return 0;
}

export function releaseVelocity(samples, x, time) {
  const recent = samples.find((sample) => time - sample.time <= 100);
  const elapsed = recent ? time - recent.time : 0;
  return elapsed > 0 ? (x - recent.x) / elapsed : 0;
}
