# BanglaTech Mobile (Expo + TypeScript)

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (via `npx expo` is enough)
- One of:
  - Expo Go app on physical Android phone
  - Android Emulator (optional)

## Environment

Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

Update API URL as needed:

- Android emulator: `http://10.0.2.2:5000`
- Physical phone: `http://<your-lan-ip>:5000`

## Run (development)

```bash
npm install
npx expo start
```

Then press:

- `a` for Android emulator
- or scan QR from Expo Go on physical device

## Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

For Play Store AAB:

```bash
eas build --platform android --profile production
```
