# 📱 Edumate Frontend

This is the mobile application for **Edumate**, built using **Expo** and **React Native**. It provides a premium, interactive experience for consuming AI-generated educational content.

## 🚀 Features

- **Intuitive Navigation**: Built with Expo Router for smooth transitions between screens.
- **AI Summary Player**: A dedicated player interface for listening to summaries with real-time text highlighting.
- **Dynamic Quizzes**: Interactive UI for taking quizzes, with immediate feedback and scoring.
- **Playlist Management**: View and organize your learned content into categories.
- **Authentication**: Integrated with the FastAPI backend for secure login and account management.
- **Theming**: Modern UI styled with **NativeWind** (Tailwind CSS) for a sleek, consistent look.

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Audio**: [expo-av](https://docs.expo.dev/versions/latest/sdk/av/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) & [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 📂 Project Structure

- `app/`: Contains the main screens and layouts.
  - `(auth)`: Login, Register, and Forgot Password screens.
  - `(tabs)`: Home, Library, Create, and Profile tabs.
  - `summary`: Detailed summary view and audio player.
  - `quiz`: Interactive quiz interface.
- `components/`: Reusable UI components like buttons, inputs, and cards.
- `store/`: Zustand stores for managing global state (auth, audio, playlists).
- `api/`: API client and services for communicating with the backend.
- `assets/`: Images, fonts, and other static files.

## 🏗️ Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npx expo start
   ```
3. Use the **Expo Go** app on your phone or an emulator to run the project.

## 📄 License

This project is licensed under the MIT License.
