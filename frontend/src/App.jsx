import 'kintaro-ui/src/root.css';
import {
  KintaroTitle1, KintaroTitle2, KintaroTitle3,
  KintaroTextBox1, KintaroTextBox3, KintaroButton3,
  KintaroButton1, KintaroButton2, KintaroButton4,
  KintaroDescription, KintaroModal, KintaroDivider1,
  KintaroCheckBox, KintaroTextBox2
} from 'kintaro-ui/src';

import notfoundimage from '/404.png';
import overlay from '/2.png';
import welcome from '/welcome.jpg';
import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import './App.css';

import { CiVideoOn } from "react-icons/ci";
import { FaRegFilePdf, FaFileArchive, FaRegEye, FaTags, FaCloudUploadAlt, FaKey } from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";
import { MdDeleteForever } from "react-icons/md";
import { FiLogOut, FiSettings } from "react-icons/fi";
import { IoAddCircleOutline } from "react-icons/io5";

const API_URL = import.meta.env.VITE_FRONTEND_API_URL;
const UPLOAD_DIR = import.meta.env.VITE_UPLOAD_DIR;
const USER_PROFILES_DIR = import.meta.env.VITE_USER_PROFILES_DIR;
const THUMBNAILS_DIR = import.meta.env.THUMBNAILS_DIR;

const FilePreview = memo(({ file, isImageFile, isVideoFile, getFileIcon }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        let url;
        if (isVideoFile(file.filename) && file.thumbnail) {
          url = `${API_URL}/${THUMBNAILS_DIR}/${file.thumbnail}`;
        } else if (isImageFile(file.filename)) {
          url = `${API_URL}/${UPLOAD_DIR}/${file.filename}`;
        }

        if (url) {
          const token = localStorage.getItem('token');
          const res = await fetch(`${url}?token=${token}`);
          if (res.ok) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            if (isMounted) setPreviewUrl(objectUrl);
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file]);

  if (error) return <div>Error loading preview</div>;

  if (previewUrl) {
    return (
      <a href={previewUrl} target="_blank" rel="noreferrer" title={file.filename}>
        <img
          src={previewUrl}
          alt="preview"
          className="file-thumbnail"
          onError={() => setError(true)}
        />
      </a>
    );
  }

  return getFileIcon(file.filename);
});

const UserCard = memo(({ user, onSelect }) => {
  if (!user) return null;

  return (
    <div className="user-card" onClick={() => onSelect(user)}>
      <img
        src={`${API_URL}/${USER_PROFILES_DIR}/${user.image}`}
        alt={user.name}
        className="user-avatar"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = notfoundimage;
        }}
      />
      <KintaroDescription text={user.name} showToggleButton={false} maxLength={11} />
    </div>
  );
});

const CreateUserModal = memo(({
  isOpen,
  onClose,
  onCreateUser,
  authError
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateUser(username, password);
    setUsername('');
    setPassword('');
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setUsername('');
        setPassword('');
        onClose();
      }}
      title="Create New Profile"
      width="400px"
    >
      <form onSubmit={handleSubmit} className='create-user-form'>

        <div className="create-user-form-head">
          <img src={welcome} alt="welcome" className="create-user-form-image" />
          <KintaroDescription text="Welcome to Kintaro Cloud" />
        </div>

        <KintaroTextBox2
          title="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <KintaroTextBox3
          title="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        {authError && <KintaroDescription text={authError} />}
        <div className="kintaro-modal-footer">
          <KintaroButton2
            title="Cancel"
            onClick={() => {
              setUsername('');
              setPassword('');
              onClose();
            }}
          />
          <KintaroButton1
            title="Create Profile"
            type="submit"
          />
        </div>
      </form>
    </KintaroModal>
  );
});

const DeleteUserModal = memo(({
  isOpen,
  onClose,
  user,
  onDeleteUser
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeleteUser(user, password);
    setPassword('');
  };

  if (!user) return null;

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setPassword('');
        onClose();
      }}
      title={`Delete ${user.name}`}
    >
      <form onSubmit={handleSubmit}  >
        <div className="delete-user-form">
          <KintaroDescription
            text={`This will permanently delete ${user.name}'s profile and all associated files.`}
            color="var(--kintaro-error-color)"
          />
          <KintaroTextBox3
            title="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="Enter password to confirm"
          />
        </div>
        <div className="kintaro-modal-footer">
          <KintaroButton2
            title={"Cancel"}
            onClick={() => {
              setPassword('');
              onClose();
            }}
          />
          <KintaroButton1
            title={"Delete Profile"}
            type="submit"
            bgColor={"var(--kintaro-error-color)"}
            hoverColor={"var(--kintaro-error-color-transparent)"}
          />
        </div>
      </form>
    </KintaroModal>
  );
});

const FileItem = memo(({
  index,
  file,
  isImageFile,
  isVideoFile,
  getFileIcon,
  toggleFileSelection,
  selectedFiles,
  userTags,
  openFileTagModal,
  openFileKeywordsModal,
  handleDelete,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div className="file-item">
      <div className="file-item-mobile-preview">
        <div className="mobile-preview-container">
          <div className="mobile-file-icon">
            <FilePreview
              file={file}
              isImageFile={isImageFile}
              isVideoFile={isVideoFile}
              getFileIcon={getFileIcon}
            />
          </div>
        </div>
      </div>
      <div className="file-item-header">
        <div className="file-index">{index}</div>
        <KintaroCheckBox
          checked={selectedFiles.includes(file.filename)}
          onChange={() => toggleFileSelection(file.filename)}
        />
        <div className="file-icon">
          <FilePreview
            file={file}
            isImageFile={isImageFile}
            isVideoFile={isVideoFile}
            getFileIcon={getFileIcon}
          />
        </div>
      </div>
      <div className="file-item-content">
        <a
          href={`${API_URL}/view/${file.filename}?token=${localStorage.getItem('token')}`}
          title={file.filename}
          target='_blank'
          rel="noreferrer"
        >
          <KintaroDescription
            text={file.filename}
            maxLength={"40"}
            showToggleButton={false}
          />
        </a>
        <div className="file-tags">
          {file.tags && file.tags.map(tagId => {
            const tag = userTags.find(t => t.id === tagId);
            return tag ? (
              <span key={tagId} className="tag-badge">{tag.name}</span>
            ) : null;
          })}
        </div>
      </div>
      <div className="file-actions">
        <KintaroModal
          isOpen={modalVisible}
          onClose={() => setModalVisible(false)}
          title={"Delete File"}
        >
          <KintaroDescription
            text={file.filename + " Are you sure you want to delete this file?"}
          />
          <div className="kintaro-modal-footer">
            <KintaroButton2
              title={"Cancel"}
              onClick={() => setModalVisible(false)}
            />
            <KintaroButton1
              title={"Delete"}
              onClick={() => handleDelete(file.filename)}
              bgColor={"var(--kintaro-error-color)"}
              hoverColor={"var(--kintaro-error-color-transparent)"}
            />
          </div>
        </KintaroModal>
        <button
          onClick={() => openFileKeywordsModal(file)}
          className="icon-btn keywords-action"
          title='Edit Keywords'
        >
          <FaKey />
        </button>
        <button
          onClick={() => openFileTagModal(file.filename)}
          className="icon-btn tag-action"
          title='Edit Tags'
        >
          <FaTags />
        </button>
        <button
          onClick={() => setModalVisible(true)}
          className="icon-btn delete-action"
          title='Delete File'
        >
          <MdDeleteForever />
        </button>
        <a
          href={`${API_URL}/view/${file.filename}?token=${localStorage.getItem('token')}`}
          target="_blank"
          rel="noreferrer"
          className="icon-btn view-action"
          title='View File'
        >
          <FaRegEye />
        </a>
        <a
          href={`${API_URL}/download/${file.filename}?token=${localStorage.getItem('token')}`}
          download={file.filename}
          className="icon-btn download-action"
          title='Download File'
        >
          <IoMdDownload />
        </a>
      </div>
    </div>
  );
});

const SettingsModal = memo(({
  isOpen,
  onClose,
  onOpenDeleteModal,
  onOpenUpdateModal
}) => {
  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
    >
      <div className="settings-actions">
        <KintaroButton1
          title="Update Account"
          onClick={onOpenUpdateModal}
        />
        <KintaroButton1
          title="Delete Account"
          onClick={onOpenDeleteModal}
          bgColor="var(--kintaro-error-color)"
          hoverColor="var(--kintaro-error-color-transparent)"
        />
      </div>
    </KintaroModal>
  );
});

const UpdateUserModal = memo(({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  authError
}) => {
  const [username, setUsername] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.name);
      setPreviewUrl(`${API_URL}/${USER_PROFILES_DIR}/${user.image}`);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateUser(user, username, password, newPassword, imageFile);
    setPassword('');
    setNewPassword('');
    setImageFile(null);
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setShowUpdateUserModal(false);
        setAuthError('');
      }}
      title={`Update ${user?.name}`}
    >
      <form onSubmit={handleSubmit} className='update-user-form'>
        <div className="update-avatar-container">
          <img
            src={previewUrl}
            alt="profile"
            className="update-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = notfoundimage;
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        <KintaroTextBox2
          title="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <KintaroTextBox3
          title="Current Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          placeholder="Enter current password"
        />
        <KintaroTextBox3
          title="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          placeholder="Leave blank to keep current password"
        />
        {authError && <KintaroDescription text={authError} color="var(--kintaro-error-color)" />}
        <div className="kintaro-modal-footer">
          <KintaroButton2
            title={"Cancel"}
            onClick={() => {
              setPassword('');
              setNewPassword('');
              setImageFile(null);
              onClose();
            }}
          />
          <KintaroButton1
            title={"Update Profile"}
            type="submit"
          />
        </div>
      </form>
    </KintaroModal>
  );
});

const UserLoginModal = memo(({
  isOpen,
  onClose,
  user,
  onLogin,
  authError
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(user, password);
    setPassword('');
  };

  if (!user) return null;

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setPassword('');
        onClose();
      }}
      title={`Login as ${user.name}`}
      width={"350px"}
    >
      <form onSubmit={handleSubmit} className='login-form'>
        <div className="login-form-header">
          <img
            src={`${API_URL}/${USER_PROFILES_DIR}/${user.image}`}
            className="login-avatar"
            alt={user.name}
          />
        </div>
        <KintaroTextBox3
          title="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <KintaroDescription text={authError} />
        <div className="kintaro-modal-footer">
          <KintaroButton2
            title={"Cancel"}
            onClick={() => {
              setPassword('');
              onClose();
            }}
          />
          <KintaroButton1
            title={"Login"}
            type="submit"
          />
        </div>
      </form>
    </KintaroModal>
  );
});

const TagManagementModal = memo(({
  isOpen,
  onClose,
  userTags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  editingTag,
  setEditingTag
}) => {
  const [newTagName, setNewTagName] = useState(editingTag?.name || '');
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const filteredTags = userTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (editingTag) {
      onUpdateTag(editingTag.id, newTagName);
    } else {
      onCreateTag(newTagName);
    }
    setNewTagName('');
    setEditingTag(null);
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setNewTagName('');
        setEditingTag(null);
        setTagSearchTerm('');
        onClose();
      }}
      title={editingTag ? "Edit Tag" : "Create New Tag"}
      width="600px"
    >
      <KintaroTextBox1
        type="text"
        title="Tag Name"
        value={newTagName}
        onChange={(e) => setNewTagName(e.target.value)}
        placeholder="Enter tag name"
      />
      <div className="actions-end">
        <KintaroButton2
          title={"Cancel"}
          onClick={() => {
            setNewTagName('');
            setEditingTag(null);
            setTagSearchTerm('');
            onClose();
          }}
        />
        <KintaroButton1
          title={editingTag ? "Update" : "Create"}
          onClick={handleSubmit}
          disabled={!newTagName.trim()}
        />
      </div>

      {userTags.length > 0 && (
        <>
          <div style={{ paddingBottom: 'var(--kintaro-gap-xs)', paddingTop: 'var(--kintaro-gap-sm)', marginTop: 'var(--kintaro-gap-sm)', borderTop: '1px solid #3f3f3f' }}>
            <KintaroTitle3 title="Your Tags" />
          </div>
          <div className="tags-search-box">
            <KintaroTextBox1
              type="text"
              placeholder="Search tags..."
              value={tagSearchTerm}
              onChange={(e) => setTagSearchTerm(e.target.value)}
              height={"45px"}
            />
          </div>
          <div className="tags-list">
            {filteredTags.map(tag => (
              <div key={tag.id} className="tag-item">
                <KintaroDescription text={tag.name} />
                <button
                  onClick={() => onDeleteTag(tag)}
                  className="icon-btn delete-action"
                >
                  <MdDeleteForever />
                </button>
                <button
                  onClick={() => {
                    setEditingTag(tag);
                    setNewTagName(tag.name);
                  }}
                  className="icon-btn view-action"
                >
                  <FaRegEye />
                </button>
              </div>
            ))}
          </div>
        </>
      )
      }
    </KintaroModal >
  );
});

const FileTagModal = memo(({
  isOpen,
  onClose,
  userTags,
  fileTags,
  onUpdateFileTags
}) => {
  const [selectedTags, setSelectedTags] = useState(fileTags);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  useEffect(() => {
    setSelectedTags(fileTags);
  }, [fileTags]);

  const filteredTags = userTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const toggleTagSelection = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    onUpdateFileTags(selectedTags);
    onClose();
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setTagSearchTerm('');
        onClose();
      }}
      title={"Edit Tags"}
    >
      <div className="tags-search-box">
        <KintaroTextBox1
          type="text"
          placeholder="Search tags..."
          value={tagSearchTerm}
          onChange={(e) => setTagSearchTerm(e.target.value)}
        />
      </div>
      <div className="tags-container">
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => (
            <KintaroCheckBox
              key={tag.id}
              checked={selectedTags.includes(tag.id)}
              onChange={() => toggleTagSelection(tag.id)}
              title={tag.name}
            />
          ))
        ) : (
          <KintaroDescription text="No matching tags found" />
        )}
      </div>
      <div className="kintaro-modal-footer">
        <KintaroButton2
          title={"Cancel"}
          onClick={() => {
            setTagSearchTerm('');
            onClose();
          }}
        />
        <KintaroButton1
          title={"Save"}
          onClick={handleSubmit}
        />
      </div>
    </KintaroModal>
  );
});

const FileKeywordsModal = memo(({
  isOpen,
  onClose,
  file,
  keywords: initialKeywords,
  onUpdateKeywords
}) => {
  const [keywords, setKeywords] = useState(initialKeywords.join(', '));

  useEffect(() => {
    setKeywords(initialKeywords.join(', '));
  }, [initialKeywords]);

  const handleSubmit = () => {
    const keywordArray = keywords.split(',').map(kw => kw.trim()).filter(kw => kw !== '');
    onUpdateKeywords(file.filename, keywordArray);
    onClose();
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Keywords"
    >
      <div>
        <KintaroTextBox1
          type="text"
          placeholder="Enter keywords separated by commas"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>
      <div className="kintaro-modal-footer">
        <KintaroButton2 title="Cancel" onClick={onClose} />
        <KintaroButton1 title="Save" onClick={handleSubmit} />
      </div>
    </KintaroModal>
  );
});

const UploadFileModal = memo(({
  isOpen,
  onClose,
  userTags,
  onUpload,
  onRemoveFile
}) => {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const filteredTags = userTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const handleFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    setProgress(0);

    const keywordArray = keywords.split(',').map(kw => kw.trim()).filter(kw => kw !== '');

    onUpload(uploadFiles, selectedTags, keywordArray, {
      onProgress: (progress) => setProgress(progress),
      onComplete: () => {
        setIsUploading(false);
        setUploadFiles([]);
        setSelectedTags([]);
        setKeywords('');
        onClose();
      }
    });
  };

  const toggleTagSelection = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setUploadFiles([]);
        setSelectedTags([]);
        setTagSearchTerm('');
        setKeywords('');
        onClose();
      }}
      title="Upload Files"
      width="800px"
    >
      <form onSubmit={handleSubmit} className='upload-container'>
        <label
          className="file-drop-zone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            setUploadFiles(droppedFiles);
          }}
        >
          <FaCloudUploadAlt className='upload-icon' />
          <KintaroDescription text={uploadFiles.length > 0
            ? `${uploadFiles.length} files selected`
            : isDragging
              ? 'Drop files here'
              : 'Drag & drop files or click to browse'
          }
          />
          <input
            type="file"
            onChange={handleFileChange}
            className="file-input"
            multiple
          />
        </label>

        {uploadFiles.length > 0 && (
          <div className="upload-file-list">
            {uploadFiles.map((file, index) => (
              <div key={index} className="upload-file-item">
                <KintaroDescription text={file.name} showToggleButton={false} maxLength={24} />
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...uploadFiles];
                    updated.splice(index, 1);
                    setUploadFiles(updated);
                  }}
                  className="icon-btn delete-action"
                >
                  <MdDeleteForever />
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadFiles.length > 0 && (
          <>
            <div style={{ paddingTop: 'var(--kintaro-gap-sm)', marginTop: 'var(--kintaro-gap-sm)', borderTop: '1px solid #3f3f3f' }}>
              <KintaroTitle3 title="Keywords" />
            </div>
            <KintaroTextBox1
              type="text"
              placeholder="Enter keywords separated by commas"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </>
        )}
        {uploadFiles.length > 0 && userTags.length > 0 && (
          <>
            <div style={{ paddingTop: 'var(--kintaro-gap-sm)', marginTop: 'var(--kintaro-gap-sm)', borderTop: '1px solid #3f3f3f' }}>
              <KintaroTitle3 title="Select Tags" />
            </div>
            <div className="tags-search-box">
              <KintaroTextBox1
                type="text"
                placeholder="Search tags..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                height={"45px"}
              />
            </div>
            <div className="tags-container">
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <KintaroCheckBox
                    key={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTagSelection(tag.id)}
                    title={tag.name}
                  />
                ))
              ) : (
                <KintaroDescription text="No matching tags found" />
              )}
            </div>
          </>
        )}

        <div className="kintaro-modal-footer">
          <KintaroButton2
            title={"Cancel"}
            onClick={() => {
              setUploadFiles([]);
              setSelectedTags([]);
              setTagSearchTerm('');
              setKeywords('');
              onClose();
            }}
          />
          <KintaroButton1
            title={isUploading ? `Uploading... ${progress}%` : 'Upload Files'}
            type="submit"
            disabled={uploadFiles.length === 0 || isUploading}
          />
        </div>
      </form>
    </KintaroModal>
  );
});

const DeleteTagModal = memo(({
  isOpen,
  onClose,
  tag,
  onDelete
}) => (
  <KintaroModal
    isOpen={isOpen}
    onClose={onClose}
    title="Confirm Tag Deletion"
  >
    <KintaroDescription
      text={`Are you sure you want to delete the "${tag?.name}" tag?`}
    />
    <div className="kintaro-modal-footer">
      <KintaroButton2
        title={"Cancel"}
        onClick={onClose}
      />
      <KintaroButton1
        title={"Delete"}
        onClick={() => {
          onDelete(tag.id);
          onClose();
        }}
        bgColor={"var(--kintaro-error-color)"}
        hoverColor={"var(--kintaro-error-color-transparent)"}
      />
    </div>
  </KintaroModal>
));

const LogoutModal = memo(({
  isOpen,
  onClose,
  user,
  onLogout
}) => (
  <KintaroModal
    isOpen={isOpen}
    onClose={onClose}
    title="Confirm Logout"
  >
    <KintaroDescription
      text={`Are you sure you want to logout as ${user?.name}?`}
    />
    <div className="kintaro-modal-footer">
      <KintaroButton2
        title={"Cancel"}
        onClick={onClose}
      />
      <KintaroButton1
        title={"Logout"}
        onClick={onLogout}
        bgColor={"var(--kintaro-error-color)"}
        hoverColor={"var(--kintaro-error-color-transparent)"}
      />
    </div>
  </KintaroModal>
));

const FilterModal = memo(({
  isOpen,
  onClose,
  userTags,
  selectedTags,
  onApplyFilter
}) => {
  const [tempTags, setTempTags] = useState(selectedTags);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  useEffect(() => {
    setTempTags(selectedTags);
  }, [selectedTags]);

  const filteredTags = userTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const toggleTag = (tagId) => {
    setTempTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <KintaroModal
      isOpen={isOpen}
      onClose={() => {
        setTagSearchTerm('');
        onClose();
      }}
      title="Filter by Tags"
    >
      <div className="tags-search-box">
        <KintaroTextBox1
          type="text"
          placeholder="Search tags..."
          value={tagSearchTerm}
          onChange={(e) => setTagSearchTerm(e.target.value)}
          style={{ marginBottom: '15px' }}
        />
      </div>
      <div className="tags-container">
        <KintaroCheckBox
          checked={tempTags.length === 0}
          onChange={() => setTempTags([])}
          title="All Files"
        />
        {filteredTags.map(tag => (
          <KintaroCheckBox
            key={tag.id}
            checked={tempTags.includes(tag.id)}
            onChange={() => toggleTag(tag.id)}
            title={tag.name}
          />
        ))}
      </div>
      <div className="kintaro-modal-footer">
        <KintaroButton2
          title={"Cancel"}
          onClick={() => {
            setTagSearchTerm('');
            onClose();
          }}
        />
        <KintaroButton1
          title={"Apply Filter"}
          onClick={() => {
            onApplyFilter(tempTags);
            onClose();
          }}
        />
      </div>
    </KintaroModal>
  );
});

const DeleteSelectedModal = memo(({
  isOpen,
  onClose,
  count,
  onDelete
}) => (
  <KintaroModal
    isOpen={isOpen}
    onClose={onClose}
    title={`Delete ${count} Files`}
  >
    <KintaroDescription
      text={`Are you sure you want to delete ${count} selected files? This action cannot be undone.`}
    />
    <div className="kintaro-modal-footer">
      <KintaroButton2
        title={"Cancel"}
        onClick={onClose}
      />
      <KintaroButton1
        title={"Delete Selected"}
        onClick={onDelete}
        bgColor={"var(--kintaro-error-color)"}
        hoverColor={"var(--kintaro-error-color-transparent)"}
      />
    </div>
  </KintaroModal>
));

const DownloadSelectedModal = memo(({
  isOpen,
  onClose,
  count,
  onDownload
}) => (
  <KintaroModal
    isOpen={isOpen}
    onClose={onClose}
    title={`Download ${count} Files`}
  >
    <KintaroDescription
      text={`You are about to download ${count} files. This may take some time depending on file sizes.`}
    />
    <div className="kintaro-modal-footer">
      <KintaroButton2
        title={"Cancel"}
        onClick={onClose}
      />
      <KintaroButton1
        title={"Download Selected"}
        onClick={onDownload}
        bgColor={"var(--kintaro-success-color)"}
        hoverColor={"var(--kintaro-success-color-transparent)"}
      />
    </div>
  </KintaroModal>
));

function App() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userTags, setUserTags] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const [fileToTag, setFileToTag] = useState(null);
  const [fileTags, setFileTags] = useState([]);
  const [fileToEditKeywords, setFileToEditKeywords] = useState(null);
  const [fileKeywords, setFileKeywords] = useState([]);
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFileTagModal, setShowFileTagModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showDownloadSelectedModal, setShowDownloadSelectedModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 50;

  const displayedFiles = useMemo(() => {
    return filteredFiles.slice(0, currentPage * itemsPerPage);
  }, [filteredFiles, currentPage]);

  const loadMoreFiles = useCallback(() => {
    if (displayedFiles.length < filteredFiles.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setLoadingMore(false);
      }, 300);
    }
  }, [displayedFiles, filteredFiles, loadingMore]);

  const handleDeleteUser = useCallback(async (user, password) => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Deletion failed');
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));
      setShowDeleteUserModal(false);
      if (loggedInUser && loggedInUser.id === user.id) {
        handleLogout();
      }
    } catch (error) {
      setAuthError(error.message);
    }
  }, [loggedInUser]);

  const handleUpdateUser = useCallback(async (user, username, password, newPassword, imageFile) => {
    setAuthError('');
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      if (newPassword) formData.append('newPassword', newPassword);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const data = await res.json();
      setLoggedInUser(data.user);
      setUsers(prev => prev.map(u => u.id === user.id ? data.user : u));
      setShowUpdateUserModal(false);
      setShowSettingsModal(false);
    } catch (error) {
      setAuthError(error.message);
    }
  }, []);

  const isImageFile = useCallback((filename) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename), []);
  const isVideoFile = useCallback((filename) => /\.(mp4|mov|avi|mkv|webm)$/i.test(filename), []);

  const getFileIcon = useCallback((filename) => {
    if (isImageFile(filename)) return null;
    if (/\.(mp4|mov|avi|mkv|webm)$/i.test(filename)) return <CiVideoOn />;
    if (/\.(pdf)$/i.test(filename)) return <FaRegFilePdf />;
    return <FaFileArchive />;
  }, [isImageFile]);

  const toggleFileSelection = useCallback((filename) => {
    setSelectedFiles(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedFiles(selectAll ? [] : displayedFiles.map(f => f.filename));
    setSelectAll(!selectAll);
  }, [selectAll, displayedFiles]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsers(data.filter(user => user !== null));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const handleUserLogin = useCallback(async (user, password) => {
    setAuthError('');

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.name,
          password: password
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      setLoggedInUser(data.user);
      setShowUserModal(false);
    } catch (error) {
      setAuthError(error.message);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setLoggedInUser(null);
    setFiles([]);
    setFilteredFiles([]);
    setShowLogoutModal(false);
  }, []);

  const fetchUserTags = useCallback(async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`${API_URL}/tags`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const sortedTags = data.sort((a, b) => a.name.localeCompare(b.name));
      setUserTags(sortedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, [loggedInUser]);

  const createTag = useCallback(async (name) => {
    try {
      const res = await fetch(`${API_URL}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        fetchUserTags();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  }, [fetchUserTags]);

  const updateTag = useCallback(async (tagId, name) => {
    try {
      const res = await fetch(`${API_URL}/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        setEditingTag(null);
        fetchUserTags();
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  }, [fetchUserTags]);

  const deleteTag = useCallback(async (tagId) => {
    try {
      const res = await fetch(`${API_URL}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchUserTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
    setShowDeleteTagModal(false);
  }, [fetchUserTags]);

  const fetchFileTags = useCallback(async (filename) => {
    try {
      const res = await fetch(`${API_URL}/file-tags?filename=${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setFileTags(data);
      return data;
    } catch (error) {
      console.error('Error fetching file tags:', error);
      return [];
    }
  }, []);

  const updateFileTags = useCallback(async (filename, tags) => {
    try {
      const res = await fetch(`${API_URL}/file-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filename,
          tags
        })
      });

      if (res.ok) {
        setFiles(prev => prev.map(file =>
          file.filename === filename ? { ...file, tags } : file
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating file tags:', error);
    }
    return false;
  }, []);

  const updateFileKeywords = useCallback(async (filename, keywords) => {
    try {
      const res = await fetch(`${API_URL}/file-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filename,
          keywords
        })
      });

      if (res.ok) {
        setFiles(prev => prev.map(file =>
          file.filename === filename ? { ...file, keywords } : file
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating keywords:', error);
    }
    return false;
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`${API_URL}/files`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [loggedInUser]);

  useEffect(() => {
    let filtered = [...files];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(file => {
        if (file.filename.toLowerCase().includes(lowerSearchTerm)) return true;

        if (file.tags && file.tags.length > 0) {
          const tagNames = file.tags.map(tagId => {
            const tag = userTags.find(t => t.id === tagId);
            return tag ? tag.name.toLowerCase() : '';
          });
          if (tagNames.some(name => name.includes(lowerSearchTerm))) return true;
        }

        if (file.keywords && file.keywords.some(kw => kw.toLowerCase().includes(lowerSearchTerm))) {
          return true;
        }

        return false;
      });
    }

    if (selectedFilterTags.length > 0) {
      filtered = filtered.filter(file =>
        file.tags && selectedFilterTags.every(tagId => file.tags.includes(tagId))
      );
    }

    setFilteredFiles(filtered);
  }, [files, searchTerm, selectedFilterTags, userTags]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/delete-selected`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ files: selectedFiles })
      });
      if (res.ok) {
        fetchFiles();
        setSelectedFiles([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error('Error deleting selected files:', error);
    }
    setShowDeleteSelectedModal(false);
  }, [selectedFiles, fetchFiles]);

  const handleDownloadSelected = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/download-selected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ files: selectedFiles })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `downloads-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading selected files:', error);
    }
    setShowDownloadSelectedModal(false);
  }, [selectedFiles]);

  const applyTagFilter = useCallback((tags) => {
    setSelectedFilterTags(tags);
    setShowFilterModal(false);
  }, []);

  const openFileTagModal = useCallback(async (filename) => {
    const tags = await fetchFileTags(filename);
    setFileToTag(filename);
    setFileTags(tags);
    setShowFileTagModal(true);
  }, [fetchFileTags]);

  const openFileKeywordsModal = useCallback((file) => {
    setFileToEditKeywords(file);
    setFileKeywords(file.keywords || []);
    setShowKeywordsModal(true);
  }, []);

  const handleUpload = useCallback(async (files, tags, keywords, { onProgress, onComplete }) => {
    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('tags', JSON.stringify(tags));
    formData.append('keywords', JSON.stringify(keywords));

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.open('POST', `${API_URL}/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.onload = () => {
        if (xhr.status === 200) {
          fetchFiles();
          onComplete();
        }
      };
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  }, [fetchFiles]);

  const handleDelete = useCallback(async (filename) => {
    try {
      const res = await fetch(`${API_URL}/delete/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }, [fetchFiles]);

  const createUser = useCallback(async (username, password) => {
    try {
      const existingUser = users.find(u => u.name === username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error('User creation failed');

      const data = await res.json();
      setUsers(prev => [...prev, data]);
      setShowCreateUserModal(false);
      setAuthError('');
    } catch (error) {
      setAuthError(error.message);
    }
  }, [users]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setLoggedInUser(data.user);
          }
        })
        .catch(console.error);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchFiles();
      fetchUserTags();
    }
  }, [loggedInUser, fetchFiles, fetchUserTags]);

  return (
    <div className="app-container">
      <UserLoginModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        onLogin={handleUserLogin}
        authError={authError}
      />

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
          setAuthError('');
        }}
        onCreateUser={createUser}
        authError={authError}
      />

      <TagManagementModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        userTags={userTags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={(tag) => {
          setTagToDelete(tag);
          setShowDeleteTagModal(true);
        }}
        editingTag={editingTag}
        setEditingTag={setEditingTag}
      />

      <FileTagModal
        isOpen={showFileTagModal}
        onClose={() => setShowFileTagModal(false)}
        userTags={userTags}
        fileTags={fileTags}
        onUpdateFileTags={(tags) => updateFileTags(fileToTag, tags)}
      />

      <FileKeywordsModal
        isOpen={showKeywordsModal}
        onClose={() => setShowKeywordsModal(false)}
        file={fileToEditKeywords}
        keywords={fileKeywords}
        onUpdateKeywords={updateFileKeywords}
      />

      <UploadFileModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userTags={userTags}
        onUpload={handleUpload}
        onRemoveFile={(index) => {
          const updated = [...uploadFiles];
          updated.splice(index, 1);
          setUploadFiles(updated);
        }}
      />

      <DeleteTagModal
        isOpen={showDeleteTagModal}
        onClose={() => setShowDeleteTagModal(false)}
        tag={tagToDelete}
        onDelete={deleteTag}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        user={loggedInUser}
        onLogout={handleLogout}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        userTags={userTags}
        selectedTags={selectedFilterTags}
        onApplyFilter={applyTagFilter}
      />

      <DeleteSelectedModal
        isOpen={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        count={selectedFiles.length}
        onDelete={handleDeleteSelected}
      />

      <DownloadSelectedModal
        isOpen={showDownloadSelectedModal}
        onClose={() => setShowDownloadSelectedModal(false)}
        count={selectedFiles.length}
        onDownload={handleDownloadSelected}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenDeleteModal={() => {
          setShowSettingsModal(false);
          setUserToDelete(loggedInUser);
          setShowDeleteUserModal(true);
        }}
        onOpenUpdateModal={() => {
          setShowSettingsModal(false);
          setShowUpdateUserModal(true);
        }}
      />

      <UpdateUserModal
        isOpen={showUpdateUserModal}
        onClose={() => {
          setShowUpdateUserModal(false);
          setAuthError('');
        }}
        user={loggedInUser}
        onUpdateUser={handleUpdateUser}
        authError={authError}
      />

      <DeleteUserModal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setAuthError('');
        }}
        user={userToDelete}
        onDeleteUser={handleDeleteUser}
      />

      {!loggedInUser ? (
        <>
          <div className="hero-section" >
            <div className="hero-content">
              <KintaroTitle1 title={"Kintaro Cloud"} />
              <KintaroDescription
                text={"Access and share your files seamlessly across all your devices."}
              />
              <div className="hero-buttons">
                <KintaroButton1 title={"Discord"}
                  onClick={() => window.open("https://discord.com/invite/NSQk27Zdkv", "_blank")}
                />
                <KintaroButton2 title={"GitHub"}
                  onClick={() => window.open("https://github.com/xkintaro", "_blank")}
                />
              </div>
            </div>
            <img src={overlay} alt="hero-overlay" className="hero-background" />
          </div >

          <KintaroDivider1 />

          <div className="user-selection">
            <div className="user-selection-header">
              <KintaroTitle2 title={"Select Profile"} />
              <KintaroDescription
                text={"Select your own profile to access your files."}
              />
            </div>

            <div className="user-list">
              {users.filter(user => user !== null).map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onSelect={(user) => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                />
              ))}
              <div
                className="user-card"
                onClick={() => setShowCreateUserModal(true)}
              >
                <div className="new-user-icon-body">
                  <IoAddCircleOutline className='new-user-icon' />
                </div>
                <KintaroDescription text={"Create Profile"} textAlign='center' />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="user-profile">
            <img
              src={`${API_URL}/${USER_PROFILES_DIR}/${loggedInUser.image}`}
              alt={loggedInUser.name}
              className="profile-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = notfoundimage;
              }}
            />

            <KintaroTitle2 title={"Welcome, " + loggedInUser.name} showToggleButton={false} maxLength={24} />
            <div className="profile-actions">
              <KintaroButton1
                onClick={() => setShowUploadModal(true)}
              >
                <FaCloudUploadAlt />Upload Files
              </KintaroButton1>
              <KintaroButton1
                onClick={() => setShowTagModal(true)}
              >
                <FaTags />Tag Settings
              </KintaroButton1>
              <KintaroButton1
                onClick={() => setShowSettingsModal(true)}
              >
                <FiSettings />Account Settings
              </KintaroButton1>
              <KintaroButton1
                onClick={() => setShowLogoutModal(true)}
                bgColor='var(--kintaro-error-color)'
                hoverColor='var(--kintaro-error-color-transparent)'
              >
                <FiLogOut />Logout
              </KintaroButton1>
            </div>
          </div>
          <KintaroDivider1 />
          <div className="file-manager">
            {files.length > 0 && (
              <div className='file-manager-actions'>
                <KintaroTextBox1
                  type="text"
                  placeholder="Search Keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  width={"fit-content"}
                  height={"45px"}
                />
                <KintaroButton1
                  onClick={() => setShowFilterModal(true)}
                >
                  <FaTags />
                  Filter by Tags
                </KintaroButton1>
              </div>
            )}
            <div className="file-manager-content">
              <div className="file-list-container">
                <div className="file-list-header">
                  <div className="header-title">
                    {filteredFiles.length > 0 && (
                      <KintaroCheckBox
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    )}
                    <KintaroTitle2 title={`Files${filteredFiles.length > 0 ? `: ${filteredFiles.length}` : ''}`} />
                  </div>
                </div>
                <div className="file-container">
                  {displayedFiles.length > 0 ? (
                    <div className="file-list-content">
                      {displayedFiles.map((file, index) => (
                        <FileItem
                          key={file.filename}
                          index={index + 1}
                          file={file}
                          isImageFile={isImageFile}
                          isVideoFile={isVideoFile}
                          getFileIcon={getFileIcon}
                          toggleFileSelection={toggleFileSelection}
                          selectedFiles={selectedFiles}
                          userTags={userTags}
                          openFileTagModal={openFileTagModal}
                          openFileKeywordsModal={openFileKeywordsModal}
                          handleDelete={handleDelete}
                        />

                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <img src={notfoundimage} alt="" className="empty-state-image" />
                      <KintaroTitle3 title={"No file yet"} />
                    </div>
                  )}

                  {displayedFiles.length < filteredFiles.length && (
                    <div className="load-more-container">
                      <KintaroButton3
                        onClick={loadMoreFiles}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading...' : `Load More (${filteredFiles.length - displayedFiles.length} remaining)`}
                      </KintaroButton3>
                    </div>
                  )}
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className='actions-end'>
                  <KintaroButton4
                    title={`Delete (${selectedFiles.length})`}
                    onClick={() => setShowDeleteSelectedModal(true)}
                    color="var(--kintaro-error-color)"
                    hoverColor="var(--kintaro-error-color-transparent)"
                  />
                  <KintaroButton4
                    title={`Download (${selectedFiles.length})`}
                    onClick={() => setShowDownloadSelectedModal(true)}
                    color="var(--kintaro-success-color)"
                    hoverColor="var(--kintaro-success-color-transparent)"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;