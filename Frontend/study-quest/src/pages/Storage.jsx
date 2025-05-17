// src/pages/Storage.jsx

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './FileStorage.css';
import TopBar from '../components/TopBar';

const Storage = () => {
  const [files, setFiles] = useState(() => JSON.parse(localStorage.getItem('storedFiles')) || []);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (event) => {
    const uploaded = Array.from(event.target.files);
    const newFiles = uploaded.map(file => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1), // MB
      type: file.name.split('.').pop(),
      date: new Date().toISOString(),
    }));
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    localStorage.setItem('storedFiles', JSON.stringify(updatedFiles));
  };

  const deleteFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    localStorage.setItem('storedFiles', JSON.stringify(updatedFiles));
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Removed storageUsed and storage-limit display as requested

  return (
    <div className="storage-page">

      <div className="storage-header">
        <h1>📁 Study Material Storage</h1>
      </div>
    
    <p><strong>Store all your made notes here for easy access!</strong></p>

      <div className="storage-stats">
        {/* Removed Storage Used display */}
        <div><strong>Total Files:</strong> {files.length}</div>
      </div>

      <div className="search-upload-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="upload-button"
          style={{ cursor: 'pointer' }}
        />
      </div>

      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Date</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.map((file, index) => (
            <tr key={index} className="file-row">
              <td>{file.name}</td>
              <td>{file.size} MB</td>
              <td>{format(new Date(file.date), 'yyyy-MM-dd')}</td>
              <td>{file.type}</td>
              <td>
                <button className="delete-button" onClick={() => deleteFile(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Storage;
