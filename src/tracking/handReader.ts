export type NormalizedLandmark = { x: number; y: number; z: number };

import type { Point } from '../engine/stroke';

// Landmark indices (MediaPipe hand model)
// 0=wrist, 4=thumb tip, 5=index MCP, 6=index PIP, 8=index tip
// 9=middle MCP, 10=middle PIP, 12=middle tip
// 13=ring MCP, 14=ring PIP, 16=ring tip
// 17=pinky MCP, 18=pinky PIP, 20=pinky tip

function dist2d(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isFingerExtended(
  tip: NormalizedLandmark,
  pip: NormalizedLandmark,
): boolean {
  // In MediaPipe's normalized space, y increases downward.
  // A finger is extended when its tip is "above" (lower y) than its PIP joint.
  return tip.y < pip.y;
}

export function isPalmOpen(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const pips = [landmarks[3], landmarks[7], landmarks[11], landmarks[15], landmarks[19]];

  let extendedCount = 0;
  for (let i = 0; i < 5; i++) {
    if (isFingerExtended(tips[i], pips[i])) extendedCount++;
  }

  // Also require spread: mean distance between fingertips > threshold
  let spreadSum = 0;
  let pairs = 0;
  for (let i = 0; i < tips.length; i++) {
    for (let j = i + 1; j < tips.length; j++) {
      spreadSum += dist2d(tips[i], tips[j]);
      pairs++;
    }
  }
  const avgSpread = pairs > 0 ? spreadSum / pairs : 0;

  return extendedCount >= 4 && avgSpread > 0.15;
}

export function isIndexExtended(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];

  // Index up AND middle curled = pointing gesture
  return isFingerExtended(indexTip, indexPip) && !isFingerExtended(middleTip, middlePip);
}

export function isIndexCurled(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  // y increases downward; tip below PIP = finger is genuinely bent/curled
  // +0.015 buffer avoids triggering on a neutral relaxed hand
  return indexTip.y > indexPip.y + 0.015;
}

export function isFistClosed(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const mcps = [landmarks[2], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

  let closedCount = 0;
  for (let i = 0; i < 5; i++) {
    if (dist2d(tips[i], wrist) < dist2d(mcps[i], wrist) * 0.9) closedCount++;
  }
  return closedCount >= 4;
}

export function isPeaceSign(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  return (
    isFingerExtended(indexTip, indexPip) &&
    isFingerExtended(middleTip, middlePip) &&
    !isFingerExtended(ringTip, ringPip) &&
    !isFingerExtended(pinkyTip, pinkyPip)
  );
}

export function isThumbsUp(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Thumb tip must be highest (lowest y) among all fingertips
  return (
    thumbTip.y < indexTip.y &&
    thumbTip.y < middleTip.y &&
    thumbTip.y < ringTip.y &&
    thumbTip.y < pinkyTip.y &&
    !isIndexExtended(landmarks)
  );
}

export function isShaka(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const thumbPip = landmarks[3];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  return (
    isFingerExtended(thumbTip, thumbPip) &&
    !isFingerExtended(indexTip, indexPip) &&
    !isFingerExtended(middleTip, middlePip) &&
    !isFingerExtended(ringTip, ringPip) &&
    isFingerExtended(pinkyTip, pinkyPip)
  );
}

export function isTwoFingerSwipe(
  current: NormalizedLandmark[],
  history: NormalizedLandmark[][],
  _windowMs: number,
): 'left' | 'right' | null {
  if (current.length < 21 || history.length < 5) return null;
  if (!isPeaceSign(current)) return null;

  const recent = history.slice(-8);
  if (recent.length < 4) return null;

  const startX = recent[0][8].x;
  const endX = recent[recent.length - 1][8].x;
  const delta = endX - startX;

  if (Math.abs(delta) < 0.12) return null;
  // Note: we mirror x in the tracking hook (1-x), so left/right are already corrected
  return delta > 0 ? 'left' : 'right';
}

export function getIndexTip(landmarks: NormalizedLandmark[]): Point {
  if (landmarks.length < 9) return { x: 0.5, y: 0.5 };
  return { x: 1 - landmarks[8].x, y: landmarks[8].y };
}

export function getHandCenter(landmarks: NormalizedLandmark[]): Point {
  if (landmarks.length < 1) return { x: 0.5, y: 0.5 };
  // Use wrist + middle MCP as center
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  return {
    x: 1 - (wrist.x + middleMcp.x) / 2,
    y: (wrist.y + middleMcp.y) / 2,
  };

}
