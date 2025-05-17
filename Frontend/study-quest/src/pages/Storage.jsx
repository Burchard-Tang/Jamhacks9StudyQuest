import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Storage.css'; // You'll need to create this CSS file

// File type icons (you can use actual icons or emojis)
const fileIcons = {
  pdf: '📄',
  docx: '📝',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  default: '📁'
};

const Storage = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  
  // Fetch existing files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/files');
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(`File uploaded successfully!`);
      fetchFiles(); // Refresh the file list
    } catch (err) {
      setMessage('Error uploading file');
      console.error(err);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return fileIcons[ext] || fileIcons.default;
  };

  const handleDownload = (filePath, filename) => {
    // Implement download logic
    window.open(`http://localhost:5000${filePath}`, '_blank');
  };

  return (
    <div className="storage-container">
      <h1>Storage</h1>
      
      {/* Upload Section */}
      <div className="upload-section">
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="file-input"
          />
          <button type="submit" className="upload-button">
            Upload File
          </button>
          {message && <p className="message">{message}</p>}
        </form>
      </div>

      {/* Files Grid */}
      <div className="files-grid">
        {files.map((file, index) => (
          <div key={index} className="file-card" onClick={() => handleDownload(file.path, file.name)}>
            <div className="file-icon">{getFileIcon(file.name)}</div>
            <div className="file-name">{file.name}</div>
            <div className="file-type">{file.category}</div>
            <div className="file-date">{new Date(file.uploadedAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Storage;