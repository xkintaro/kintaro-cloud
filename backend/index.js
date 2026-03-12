require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const USER_PROFILES_DIR = process.env.USER_PROFILES_DIR || 'userProfiles';
const THUMBNAILS_DIR = process.env.THUMBNAILS_DIR || 'thumbnails';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const DEFAULT_IMAGES_DIR = path.join(USER_PROFILES_DIR, 'default');

app.use('/thumbnails', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  express.static(THUMBNAILS_DIR)(req, res, next);
});

const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getCurrentDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
};

const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  const randomString = generateRandomString(10);
  const dateString = getCurrentDateString();
  return `${randomString}_${dateString}${ext}`;
};

const getRandomDefaultImage = () => {
  const defaultImages = fs.readdirSync(DEFAULT_IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });

  if (defaultImages.length === 0) {
    throw new Error('No default images found');
  }

  const randomIndex = Math.floor(Math.random() * defaultImages.length);
  return `default/${defaultImages[randomIndex]}`;
};

[UPLOAD_DIR, USER_PROFILES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const dataFiles = {
  users: './users.json',
  tags: './tags.json',
  uploads: './uploads.json'
};

const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    const command = `"${ffmpegPath}" -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=320:240" "${thumbnailPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Thumbnail generation failed:', stderr);
        reject(error);
      } else {
        console.log('Thumbnail created successfully:', thumbnailPath);
        resolve(thumbnailPath);
      }
    });
  });
};

Object.entries(dataFiles).forEach(([key, file]) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(key === 'users' ? [
      {
        id: 1,
        name: 'user',
        password: '123',
        image: 'default.jpg'
      }
    ] : []));
  }
});

const loadData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
    return [];
  }
};

const saveData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
  }
};

let users = loadData(dataFiles.users);
let tags = loadData(dataFiles.tags);
let uploads = loadData(dataFiles.uploads);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/userProfiles', express.static(USER_PROFILES_DIR));

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const userProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, USER_PROFILES_DIR),
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});


const uploadFiles = multer({ storage: uploadStorage }).array('files');

app.use((err, req, res, next) => {
  if (err) {
    return res.status(err instanceof multer.MulterError ? 400 : 500).json({ error: err.message });
  }
  next();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.name === username);
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign(
    { userId: user.id, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, image: user.image }
  });
});

app.get('/verify', authenticateJWT, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.sendStatus(404);
  res.json({ user: { id: user.id, name: user.name, image: user.image } });
});

app.get('/users', (req, res) => {
  res.json(users.map(({ id, name, image }) => ({ id, name, image })));
});

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const existingUser = users.find(u => u.name === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name: username,
    password: password,
    image: getRandomDefaultImage()
  };

  users.push(newUser);
  saveData(dataFiles.users, users);
  res.json(newUser);
});
const uploadUserProfileMemory = multer({ storage: multer.memoryStorage() }).single('image');

app.put('/users/:id', authenticateJWT, uploadUserProfileMemory, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (parseInt(id) !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { username, password, newPassword } = req.body;

  if (newPassword) {
    if (password !== user.password) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
  }

  if (username && username !== user.name) {
    const existingUser = users.find(u => u.name === username && u.id !== userId);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    user.name = username;
  }

  if (req.file) {
    const newFilename = generateUniqueFilename(req.file.originalname);
    const newFilePath = path.join(USER_PROFILES_DIR, newFilename);

    const defaultImages = ['default/1.jpg', 'default/2.jpg', 'default/3.jpg', 'default/4.jpg'];
    if (user.image && !defaultImages.includes(user.image)) {
      const oldImagePath = path.join(USER_PROFILES_DIR, user.image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    fs.writeFileSync(newFilePath, req.file.buffer);
    user.image = newFilename;
  }

  saveData(dataFiles.users, users);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      image: user.image
    }
  });
});


app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const userIndex = users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const user = users[userIndex];
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const defaultImages = ['default/1.jpg', 'default/2.jpg', 'default/3.jpg', 'default/4.jpg'];
  if (user.image && !defaultImages.includes(user.image)) {
    const userImagePath = path.join(USER_PROFILES_DIR, user.image);
    if (fs.existsSync(userImagePath)) {
      fs.unlinkSync(userImagePath);
    }
  }

  const userFiles = uploads.filter(u => u.user === user.id);
  userFiles.forEach(file => {
    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (file.thumbnail) {
      const thumbnailPath = path.join(THUMBNAILS_DIR, file.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
  });

  uploads = uploads.filter(u => u.user !== user.id);
  saveData(dataFiles.uploads, uploads);

  tags = tags.filter(t => t.user_id !== user.id);
  saveData(dataFiles.tags, tags);

  users.splice(userIndex, 1);
  saveData(dataFiles.users, users);

  res.json({ message: 'User deleted successfully' });
});

app.get('/tags', authenticateJWT, (req, res) => {
  res.json(tags.filter(tag => tag.user_id === req.user.userId));
});

app.post('/tags', authenticateJWT, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name is required' });

  const newTag = {
    id: tags.length ? Math.max(...tags.map(t => t.id)) + 1 : 1,
    name,
    user_id: req.user.userId
  };

  tags.push(newTag);
  saveData(dataFiles.tags, tags);
  res.json(newTag);
});

app.put('/tags/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const tagIndex = tags.findIndex(t => t.id === parseInt(id) && t.user_id === req.user.userId);
  if (tagIndex === -1) return res.status(404).json({ error: 'Tag not found' });

  tags[tagIndex].name = name;
  saveData(dataFiles.tags, tags);
  res.json(tags[tagIndex]);
});

app.delete('/tags/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const tagIndex = tags.findIndex(t => t.id === parseInt(id) && t.user_id === req.user.userId);
  if (tagIndex === -1) return res.status(404).json({ error: 'Tag not found' });

  uploads.forEach(upload => {
    if (upload.tags) {
      upload.tags = upload.tags.filter(tagId => tagId !== parseInt(id));
    }
  });
  saveData(dataFiles.uploads, uploads);

  tags.splice(tagIndex, 1);
  saveData(dataFiles.tags, tags);
  res.json({ message: 'Tag deleted' });
});

app.get('/file-tags', authenticateJWT, (req, res) => {
  const { filename } = req.query;
  const upload = uploads.find(u => u.filename === filename && u.user === req.user.userId);
  if (!upload) return res.status(404).json({ error: 'File not found' });
  res.json(upload.tags || []);
});

app.post('/file-tags', authenticateJWT, (req, res) => {
  const { filename, tags: tagIds } = req.body;
  const uploadIndex = uploads.findIndex(u => u.filename === filename && u.user === req.user.userId);
  if (uploadIndex === -1) return res.status(404).json({ error: 'File not found' });

  const userTagIds = tags.filter(t => t.user_id === req.user.userId).map(t => t.id);
  const validTags = tagIds.filter(tagId => userTagIds.includes(tagId));

  uploads[uploadIndex].tags = validTags;
  saveData(dataFiles.uploads, uploads);
  res.json({ message: 'Tags updated' });
});

app.get('/file-keywords', authenticateJWT, (req, res) => {
  const { filename } = req.query;
  const upload = uploads.find(u => u.filename === filename && u.user === req.user.userId);
  if (!upload) return res.status(404).json({ error: 'File not found' });
  res.json(upload.keywords || []);
});

app.post('/file-keywords', authenticateJWT, (req, res) => {
  const { filename, keywords } = req.body;
  const uploadIndex = uploads.findIndex(u => u.filename === filename && u.user === req.user.userId);
  if (uploadIndex === -1) return res.status(404).json({ error: 'File not found' });

  uploads[uploadIndex].keywords = keywords;
  saveData(dataFiles.uploads, uploads);
  res.json({ message: 'Keywords updated' });
});

if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

const isVideoFile = (filename) => /\.(mp4|mov|avi|mkv|webm)$/i.test(filename);

app.post('/upload', authenticateJWT, uploadFiles, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const response = await Promise.all(req.files.map(async (file) => {
    const newUpload = {
      filename: file.filename,
      size: file.size,
      uploadedDate: new Date().toISOString(),
      user: req.user.userId,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      keywords: req.body.keywords ? JSON.parse(req.body.keywords) : [],
      thumbnail: ''
    };

    if (isVideoFile(file.filename)) {
      const videoPath = path.join(UPLOAD_DIR, file.filename);
      const thumbnailFilename = `${path.parse(file.filename).name}_thumbnail.jpg`;
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

      try {
        await generateThumbnail(videoPath, thumbnailPath);
        newUpload.thumbnail = thumbnailFilename;
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
    }

    uploads.push(newUpload);
    return {
      message: 'File uploaded',
      filename: file.filename
    };
  }));

  saveData(dataFiles.uploads, uploads);
  res.json(response);
});

app.get('/files', authenticateJWT, (req, res) => {
  const userFiles = uploads.filter(upload => upload.user === req.user.userId);

  const filesWithSize = userFiles.map(file => {
    try {
      const filePath = path.join(UPLOAD_DIR, file.filename);
      const stats = fs.statSync(filePath);
      return {
        ...file,
        size: stats.size
      };
    } catch (error) {
      return {
        ...file,
        size: 0
      };
    }
  });

  res.json(filesWithSize);
});

app.get('/download/:filename', authenticateJWT, (req, res) => {
  const fileName = req.params.filename;
  const upload = uploads.find(u => u.filename === fileName && u.user === req.user.userId);
  if (!upload) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  res.download(filePath, fileName);
});

app.delete('/delete/:filename', authenticateJWT, (req, res) => {
  const fileName = req.params.filename;
  const uploadIndex = uploads.findIndex(u => u.filename === fileName && u.user === req.user.userId);
  if (uploadIndex === -1) return res.status(404).json({ error: 'File not found' });

  const upload = uploads[uploadIndex];
  const filePath = path.join(UPLOAD_DIR, fileName);

  if (upload.thumbnail) {
    const thumbnailPath = path.join(THUMBNAILS_DIR, upload.thumbnail);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlink(thumbnailPath, (err) => {
        if (err) console.error(`Error deleting thumbnail for ${fileName}:`, err);
      });
    }
  }

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Delete error' });

    uploads.splice(uploadIndex, 1);
    saveData(dataFiles.uploads, uploads);
    res.json({ message: 'File deleted' });
  });
});

app.delete('/delete-selected', authenticateJWT, (req, res) => {
  const filesToDelete = req.body.files;
  if (!Array.isArray(filesToDelete)) return res.status(400).json({ error: 'Invalid request format' });

  let errors = [];
  let deletedCount = 0;

  filesToDelete.forEach(file => {
    const uploadIndex = uploads.findIndex(u => u.filename === file && u.user === req.user.userId);
    if (uploadIndex === -1) {
      errors.push({ file, error: 'File not found or not owned by user' });
      return;
    }

    const upload = uploads[uploadIndex];
    const filePath = path.join(UPLOAD_DIR, file);

    if (upload.thumbnail) {
      const thumbnailPath = path.join(THUMBNAILS_DIR, upload.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        try {
          fs.unlinkSync(thumbnailPath);
        } catch (err) {
          errors.push({ file, error: `Thumbnail deletion failed: ${err.message}` });
        }
      }
    }

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        uploads.splice(uploadIndex, 1);
        deletedCount++;
      } else {
        errors.push({ file, error: 'File not found' });
      }
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  });

  saveData(dataFiles.uploads, uploads);

  if (errors.length) {
    return res.status(207).json({
      message: `Some files couldn't be deleted`,
      deletedCount,
      errorCount: errors.length,
      errors
    });
  }
  res.json({ message: `${deletedCount} files deleted successfully` });
});

app.post('/download-selected', authenticateJWT, (req, res) => {
  const filesToDownload = req.body.files;
  if (!Array.isArray(filesToDownload)) return res.status(400).json({ error: 'Invalid request format' });

  const invalidFiles = filesToDownload.filter(file =>
    !uploads.some(u => u.filename === file && u.user === req.user.userId)
  );

  if (invalidFiles.length) {
    return res.status(403).json({ error: 'Some files are not accessible', invalidFiles });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment('downloads.zip');
  archive.pipe(res);

  filesToDownload.forEach(file => {
    const filePath = path.join(UPLOAD_DIR, file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  archive.finalize();
});

app.get('/thumbnails/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, THUMBNAILS_DIR, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Thumbnail not found');
  }
});

app.get('/view/:filename', authenticateJWT, (req, res) => {
  const fileName = req.params.filename;
  const upload = uploads.find(u => u.filename === fileName && u.user === req.user.userId);
  if (!upload) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.mp3': 'audio/mpeg', '.txt': 'text/plain',
    '.html': 'text/html'
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline');
  fs.createReadStream(filePath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running: ${PORT}`);
  console.log(`📂 Files stored in: ${path.join(__dirname, UPLOAD_DIR)}`);
});