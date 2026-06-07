<a href="README.md">
 <img src="https://img.shields.io/badge/Language-English-blue?style=flat-square&logo=google-translate&logoColor=white" alt="English">
</a>
<a href="README-TR.md">
 <img src="https://img.shields.io/badge/Dil-Türkçe-red?style=flat-square&logo=google-translate&logoColor=white" alt="Türkçe">
</a>

  <br />
  <br />

<div align="center">
  <img src="md/logo.png" width="120" height="120" />

  <br />
  <br />

  <p>
    Anime-Themed, Secure and Modern Personal Archive System
  </p>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

  <p>
    <a href="#features">Features</a> •
    <a href="#technologies">Technologies</a> •
    <a href="#installation">Installation</a> •
    <a href="#license">License</a> •
    <a href="#gallery">Gallery</a>
  </p>

  <br />
  <br />
</div>

## 📋 About

**Kintaro Cloud** offers an anime-themed, modern, and sleek interface that allows you to store your personal archives in an organized manner on your local network by creating profiles and categorizing them.

<img src="md/20260311104335076.jpg" width="100%"  />

## ✨ Features <a id="features"></a>

### User Management

- **Secure Authentication**: JWT-based authentication system with encrypted sessions.
- **Profile Customization**: Change your username, update your passwords, and set custom profile pictures.
- **Multi-User Ready**: Supports multiple accounts with isolated file spaces.

### Smart Organization

- **Tag System**: Create and assign custom tags to efficiently categorize your archive.
- **Keyword Search**: Add detailed keywords to files for instant discovery.
- **Dynamic Filtering**: Filter your files by users, tags, or keywords in real-time.

### Media Intelligence

- **Automatic Thumbnails**: Automatically generates high-quality thumbnails for video files using **FFmpeg**.
- **In-Browser Viewing**: Instant preview for `PDF`, `MP4`, `WEBM`, `JPG`, `PNG`, `MP3`, and more.
- **File Statistics**: Monitor storage usage and file sizes at a glance.

### Bulk Operations

- **ZIP Export**: Select multiple files and download them as a single time-stamped ZIP archive.
- **Bulk Delete**: Safely remove multiple items from your cloud with disk cleanup.
- **Multi-Upload**: Drag and drop support for uploading large groups of files simultaneously.

## 🛠️ Technologies <a id="technologies"></a>

### Backend

- **Node.js**: Runtime engine for high-concurrency operations.
- **Express**: Fast and flexible web framework for REST API.
- **Multer**: Robust middleware for handling file uploads.
- **Fluent-FFmpeg**: Powerful wrapper for media processing and thumbnail extraction.
- **Archiver**: Stream-based ZIP generation.

### Frontend

- **React 19**: Building user interfaces with the latest concurrency features.
- **Vite**: Lightning-fast front-end tools and build system.
- **Kintaro-UI**: My custom-built UI library.
- **Axios**: HTTP client for API communication.
- **React Icons**: Modern icon library.

## 🚀 Installation <a id="installation"></a>

Follow the steps below to run the project in your local environment.

### Requirements

- **Node.js** (v18+)
- **npm**

### Step-by-Step Installation

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/xkintaro/kintaro-cloud.git
    cd kintaro-cloud
    ```

2.  **Install Backend Dependencies**

    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**

    ```bash
    cd ../frontend
    npm install
    ```

4.  **Environment Configuration**  
    Ensure the `.env` files in both folders are configured.

    **backend/.env**

    ```
    BACKEND_PORT=5088
    ```

    **frontend/.env**

    ```
    VITE_FRONTEND_API_URL=http://localhost:5088
    VITE_FRONTEND_PORT=5087
    ```

5.  **Start the Backend Server**

    ```bash
    cd ../backend
    node index.js
    ```

6.  **Start the Frontend Server**
    Open a new terminal:
    ```bash
    cd frontend
    npm run dev
    ```

## 📄 License <a id="license"></a>

This project is licensed under the MIT License. You can review the [LICENSE](LICENSE) file for details.

## 🖼️ Gallery <a id="gallery"></a>

<img src="md/20260311104334987.jpg" width="100%"  />

#

<img src="md/20260311104334893.jpg" width="100%"  />

#

<p align="center">
  <sub>❤️ Developed by "Mustafa TAŞAL" (kintaro)</sub>
</p>
