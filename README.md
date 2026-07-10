<div align="center">

# SwipeBox

### Your photos deserve better than clutter.

A gesture-driven photo gallery cleaner, crafted exclusively for iPhone.
Swipe right to keep. Swipe left to clean. No complexity — just motion.

<br/>

![Platform](https://img.shields.io/badge/platform-iOS-000000?style=flat-square&logo=apple&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)

</div>

<br/>

## Overview

Photo libraries grow quietly. A screenshot here, a burst of duplicates there — and before long, thousands of images you'll never look at again are quietly eating your storage.

**SwipeBox** turns cleanup into something you'll actually enjoy. One photo at a time, one gesture at a time. Everything happens on your device. Nothing is uploaded. Nothing is complicated.

<br/>

## How It Works

<table>
<tr>
<td width="33%" valign="top">

### Swipe
Move through your library with fluid, physics-based gestures. Right to keep, left to clean.

</td>
<td width="33%" valign="top">

### Review
See your selections on a frosted-glass interface before anything is deleted.

</td>
<td width="33%" valign="top">

### Clean
Reclaim your storage in a single, deliberate tap.

</td>
</tr>
</table>

No accounts required. No cloud uploads. Everything stays on your device.

<br/>

## Design

SwipeBox is built on a **glassmorphism** design system that feels native to iOS — depth, luminance, and translucency working together so nothing competes with your photos.

- **Directional feedback** — every swipe responds with intent
- **60fps transitions** — powered by Reanimated worklets on the UI thread
- **Deliberate haptics** — motion you can feel, not just see
- **Native glass effects** — real iOS blur via `expo-glass-effect`

<br/>

## Under the Hood

| | |
|---|---|
| **Platform** | iOS |
| **Framework** | React Native 0.81 · Expo SDK 54 |
| **Language** | TypeScript |
| **Animations** | React Native Reanimated 4 |
| **Gestures** | React Native Gesture Handler |
| **Media** | Expo Media Library · Expo Image · Expo Video |
| **Auth** | Apple Sign-In · Email |
| **Glass** | Expo Glass Effect |

<br/>

## Getting Started

**Requirements**

- iOS 16.0 or later
- Node 22 (see `.nvmrc`)
- Expo CLI

**Run locally**

```bash
npm install
npx expo start
```

Open the project in Expo Go or a development build on your iPhone.

<br/>

## Privacy

SwipeBox never uploads your photos. All media access is read locally through the system photo library, and deletions are confirmed by iOS itself before anything leaves your device. Your gallery is yours.

<br/>

<div align="center">
<sub>Designed for iOS. Crafted with intention.</sub>
</div>
