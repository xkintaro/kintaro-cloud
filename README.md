<div align="center">
  <img src="md/logo.png" width="120" height="120" />
  <br />
  <br />

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

  <p align="center">
    <b>Modern, Secure and Fast Self-Hosted Personal Cloud Station</b>
    <br />
    Take control of your media archive locally.
    <br />
    <br />
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech">Technologies</a> •
    <a href="#setup">Setup</a>
  </p>
</div>

---

## <a id="about"></a> 📋 About

**Kintaro Cloud** is a self-hosted personal cloud application designed for users who value privacy and performance. It provides a sleek, modern interface for managing your media files—including videos, images, and documents—directly from your local workstation.

By utilizing **Node.js** and **React 19**, it offers a desktop-like experience in your browser. All processing, including video thumbnail extraction and file archiving, happens entirely on your machine. No data ever leaves your local network.

<img src="md/20260311104335076.jpg" width="100%" style="border-radius: 8px;" />

## <a id="features"></a> ✨ Features

### 🛡️ User Management

- **Secure Auth**: JWT-based authentication system with encrypted sessions.
- **Profile Customization**: Change your username, update passwords, and set custom profile pictures.
- **Multi-User Ready**: Supports multiple accounts with isolated file spaces.

### 🏷️ Smart Organization

- **Tag System**: Create and assign custom tags to categorize your archive efficiently.
- **Keyword Search**: Add granular keywords to files for instant discovery.
- **Dynamic Filtering**: Filter your files by users, tags, or keywords in real-time.

### 🖼️ Media Intelligence

- **Auto-Thumbnails**: Automatically generates high-quality thumbnails for video files using **FFmpeg**.
- **In-Browser Viewing**: Instant preview for `PDF`, `MP4`, `WEBM`, `JPG`, `PNG`, `MP3`, and more.
- **File Statistics**: Monitor storage usage and file sizes at a glance.

### ⚡ Batch Operations

- **ZIP Export**: Select multiple files and download them as a single timestamped ZIP archive.
- **Bulk Delete**: Safely remove multiple items from your cloud with disk cleanup.
- **Multi-Upload**: Drag and drop support for uploading large batches of files simultaneously.

<img src="md/20260311104334987.jpg" width="100%" style="border-radius: 8px;" />

## <a id="tech"></a> 🛠️ Technologies

The project is built with a modern, high-performance stack:

### Backend

- **[Node.js](https://nodejs.org/)**: The runtime engine for high-concurrency operations.
- **[Express](https://expressjs.com/)**: Fast, unopinionated web framework for the REST API.
- **[LowDB](https://github.com/typicode/lowdb)**: Lightweight JSON-based database for local state management.
- **[Multer](https://github.com/expressjs/multer)**: Robust middleware for handling file uploads.
- **[Fluent-FFmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)**: Powerful wrapper for media processing and thumbnail extraction.
- **[Archiver](https://github.com/archiverjs/node-archiver)**: Stream-based ZIP generation.

### Frontend

- **[React 19](https://react.dev/)**: Building the UI with the latest concurrent features.
- **[Vite](https://vitejs.dev/)**: Lightning-fast front-end tooling and build system.
- **[Kintaro-UI](https://github.com/xkintaro/kintaro-ui)**: A custom, premium component library for a consistent cyberpunk aesthetic.
- **[Axios](https://axios-http.com/)**: Promise-based HTTP client for API communication.
- **[React Icons](https://react-icons.github.io/react-icons/)**: High-quality SVG icons.

<img src="md/20260311104334893.jpg" width="100%" style="border-radius: 8px;" />

## <a id="setup"></a> 🚀 Setup and Installation

### Requirements

- **Node.js**
- **NPM**

### Step-by-Step Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/xkintaro/kintaro-cloud.git
   cd kintaro-cloud
   ```

2. **Install Dependencies**  
   You can install all dependencies for both backend and frontend using the provided batch script:

   ```bash
   install-dependencies.bat
   ```

   _Or manually:_

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Configuration**  
   Ensure the `.env` files in both folders are configured (Port, Secret Keys, etc.).

4. **Run the Application**  
   Start both services simultaneously:
   ```bash
   run.bat
   ```

---

<p align="center">
  <sub>❤️ 2026 Developed by Kintaro.</sub>
</p>
