# Price Calculator App - Local Deployment Guide

## 📱 Deploy to Your Phone

This guide will help you run the Price Calculator app on your phone for local development and testing.

### Option 1: Expo Go (Recommended for Development)

#### Prerequisites
- Node.js installed on your computer
- Expo CLI installed globally: `npm install -g @expo/cli`
- Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

#### Steps
1. **Clone/Download the project** to your local machine
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Connect your phone**:
   - Make sure your phone and computer are on the same WiFi network
   - Open Expo Go app on your phone
   - Scan the QR code displayed in your terminal/browser
   - The app will load on your phone

### Option 2: Development Build (For Production-like Testing)

#### Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Expo account (free): [expo.dev](https://expo.dev)

#### Steps
1. **Login to Expo**:
   ```bash
   eas login
   ```
2. **Configure the project**:
   ```bash
   eas build:configure
   ```
3. **Build for your platform**:
   
   **For Android APK**:
   ```bash
   eas build --platform android --profile development
   ```
   
   **For iOS (requires Apple Developer account)**:
   ```bash
   eas build --platform ios --profile development
   ```

4. **Install the build**:
   - Download the APK/IPA from the Expo dashboard
   - Install on your device

### Option 3: Local Build (Advanced)

#### For Android APK
1. **Setup Android development environment**:
   - Install Android Studio
   - Setup Android SDK and emulator
   
2. **Generate local build**:
   ```bash
   npx expo run:android
   ```

#### For iOS (macOS only)
1. **Setup iOS development environment**:
   - Install Xcode
   - Setup iOS Simulator
   
2. **Generate local build**:
   ```bash
   npx expo run:ios
   ```

## 🚀 Quick Start (Recommended)

The fastest way to test on your phone:

1. Install Expo Go on your phone
2. Run these commands on your computer:
   ```bash
   npm install
   npm run dev
   ```
3. Scan the QR code with Expo Go
4. Start using the app!

## 📋 App Features

- ✅ **Price Calculator**: Calculate total price from weight or required weight from price
- ✅ **Item Management**: Add, edit, and delete items with per-kg prices
- ✅ **Search Functionality**: Quickly find items with search
- ✅ **Responsive Design**: Optimized for mobile screens
- ✅ **Dark/Light Theme**: Toggle between themes
- ✅ **Calculation History**: Track recent calculations
- ✅ **Offline Storage**: Data persists locally on your device
- ✅ **Material Design**: Modern, beautiful UI

## 🛠️ Troubleshooting

### Common Issues

1. **QR Code not scanning**:
   - Ensure both devices are on the same WiFi
   - Try using the tunnel connection: `npm run dev -- --tunnel`

2. **App crashes on phone**:
   - Check the Expo Go app logs
   - Restart the development server

3. **Slow loading**:
   - Use LAN connection instead of tunnel
   - Clear Expo Go cache

### Performance Tips

- The app uses AsyncStorage for local data persistence
- All calculations are performed locally on your device
- No internet connection required after initial load

## 📱 Supported Platforms

- ✅ **Android**: 5.0+ (API level 21+)
- ✅ **iOS**: 11.0+
- ✅ **Web**: Modern browsers (Chrome, Safari, Firefox)

## 🔧 Development

To modify the app:

1. Edit files in the project
2. Save changes
3. The app will automatically reload on your phone (Fast Refresh)

### Key Files
- `app/(tabs)/index.tsx` - Calculator screen
- `app/(tabs)/items.tsx` - Items management screen
- `contexts/ThemeContext.tsx` - Theme configuration
- `utils/storage.ts` - Data storage logic

## 📦 Building for Production

For a production APK/IPA:

```bash
# Configure for production
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

## 🎯 Next Steps

After deploying locally, you can:
- Test all features on your actual device
- Share with friends/family for feedback
- Submit to app stores (requires additional setup)
- Add more features and improvements

---

**Need Help?** 
- Check [Expo Documentation](https://docs.expo.dev/)
- Visit [Expo Discord](https://discord.gg/4gtbPAdpaE) for community support