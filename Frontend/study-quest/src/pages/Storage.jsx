import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import './FileStorage.css';
import { createWorker } from 'tesseract.js';
import axios from 'axios';

const Storage = () => {

   // ===================== STATE MANAGEMENT =====================
  /**
   * Manages all file-related state including:
   * - files: Array of uploaded files (persisted in localStorage)
   * - searchTerm: Filter term for searching files
   * - fileObjects: Mapping of file IDs to actual File objects
   * - processingFile: Tracks currently processed file ID
   * - flashcards: Generated flashcards array
   * - UI states: Uploading status, errors, flashcard viewing states
   */

  // State declarations
  const [files, setFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('storedFiles')) || [];
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [fileObjects, setFileObjects] = useState({});
  const [processingFile, setProcessingFile] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileUrlCache = useRef({});
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [directTextInput, setDirectTextInput] = useState('');
  const [flashcardDecks, setFlashcardDecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('flashcardDecks')) || [];
    } catch (e) {
      return [];
    }
  });
  const [currentDeckName, setCurrentDeckName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter files based on search term (case insensitive)
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enhanced isTextFile function with more text file types (text based --> no extract text, not text based --> gives the option to run text recognition)
  const isTextFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const textExtensions = [
      'txt', 'text', 'md', 'markdown', 'rtf', 'csv', 'json', 
      'log', 'html', 'htm', 'xml', 'yaml', 'yml', 'ini', 'cfg'
    ];
    return textExtensions.includes(extension) || 
           file.type.startsWith('text/') ||
           file.type === 'application/json' ||
           file.type === 'application/xml';
  };

  // Text extraction function with progress tracking
    const extractTextFromFile = async (file) => {
  // First try to extract text directly if it's a PDF with selectable text
  if (file.type === 'application/pdf') {
    try {
      // Try to extract text directly first
      const text = await file.text();
      if (text.trim().length > 0) {
        return text;
      }
    } catch (e) {
      console.log("Direct text extraction failed, falling back to OCR");
    }
  } else if (isTextFile(file)) {
    return await file.text();
  }

  // If direct extraction failed or it's an image, use OCR
  const worker = await createWorker();
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(file);
    return text.trim();
  } finally {
    await worker.terminate();
  }
};

  // Generate flashcards with Ollama API using Mistral
  const generateFlashcardsWithAI = async (text) => {
    setIsGenerating(true);
    setErrorMessage('');
    
    try {
      const response = await axios.post(
        'http://localhost:11434/api/generate',
        {
          model: "mistral",
          prompt: `Create exactly 5 high-quality flashcards from this study material as a json list.
          Format each as JSON objects with "question" and "answer" keys with string values.
          Return ONLY a valid JSON array of exactly 5 flashcards.
          Study material: ${text.substring(0, 2000)}`,
          stream: false,
          format: "json",
          options: {
            temperature: 0.7,
            num_ctx: 4096,
            num_predict: 500
          }
        },
        {
          timeout: 120000
        }
      ).catch(error => {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          throw new Error('Unable to connect to the Ollama server. Please ensure it is running on your machine.');
        } else if (error.response && error.response.status === 404) {
          throw new Error('The Mistral model is not available. Please install it using "ollama pull mistral".');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new Error('The request to Ollama timed out. The model might be still loading or your input is too large.');
        } else {
          throw new Error(`Ollama API error: ${error.message}`);
        }
      });
      
      if (!response) {
        throw new Error('Failed to get a response from the Ollama server.');
      }

      try {
        let content = response.data.response;
        const jsonMatch = content.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("No JSON array found in response");
        
        const result = JSON.parse(jsonMatch[0]);
        
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error("Response wasn't a valid array");
        }
        
        const finalCards = result.slice(0, 5).map((card, i) => ({
          question: card.question || `Question ${i+1}`, 
          answer: card.answer || `Answer ${i+1}`
        }));
        
        while (finalCards.length < 5) {
          finalCards.push({
            question: `Question ${finalCards.length + 1}`,
            answer: `Answer ${finalCards.length + 1}`
          });
        }
        
        return finalCards;
      } catch (e) {
        console.error("Parsing error:", e, "Raw response:", response?.data);
        throw new Error("Failed to parse AI response. The response format was invalid. Please try again.");
      }
    } catch (error) {
      console.error("Generation Error:", error);
      setErrorMessage(error.message || 'An unknown error occurred while generating flashcards.');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // ===================== EVENT HANDLERS =====================
  /**
   * Handles flashcard generation from uploaded files */
  // Enhanced handleGenerateFlashcards with better error handling
  const handleGenerateFlashcards = async (fileId) => {
    const file = fileObjects[fileId];
    if (!file) {
      setErrorMessage("File not found. It may have been deleted or corrupted.");
      return;
    }

    setProcessingFile(fileId);
    setErrorMessage('');
    try {
      const text = await extractTextFromFile(file);
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract any text from the file");
    }
    
    const generatedCards = await generateFlashcardsWithAI(text);
    setFlashcards(generatedCards);
    setShowFlashcardModal(true);
  } catch (error) {
    setErrorMessage(`Failed to process file: ${error.message}`);
    console.error("Processing error:", error);
  } finally {
    setProcessingFile(null);
    }
  };

   /**
   * Handles text extraction from non-text files (images/PDFs) */

  const handleTextRecognition = async (fileId) => {
    const file = fileObjects[fileId];
    if (!file) return;

    setProcessingFile(fileId);
    try {
      const extractedText = await extractTextFromFile(file);
      setDirectTextInput(extractedText);
      alert("Text extracted successfully! You can now generate flashcards from it.");
    } catch (error) {
      setErrorMessage(`Text recognition failed: ${error.message}`);
    } finally {
      setProcessingFile(null);
    }
  };

  // Modified saveFlashcardDeck to save both JSON and TXT formats
  const saveFlashcardDeck = () => {
  if (!currentDeckName.trim() || flashcards.length === 0) return;

  const deckData = {
    name: currentDeckName,
    cards: flashcards,
    createdAt: new Date().toISOString()
  };

  // Create JSON blob
  const jsonBlob = new Blob([JSON.stringify(deckData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentDeckName.replace(/[^a-z0-9]/gi, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setCurrentDeckName('');
  alert(`Deck "${currentDeckName}" saved successfully!`);
};
  /**
   * Generates flashcards from directly pasted text
   */

  const handleDirectTextSubmit = async () => {
    if (!directTextInput.trim()) return;
    
    try {
      const generatedCards = await generateFlashcardsWithAI(directTextInput);
      setFlashcards(generatedCards);
      setCurrentFlashcardIndex(0);
      setShowFlashcardModal(true);
      setDirectTextInput('');
      setIsFlipped(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Failed to generate flashcards: ${error.message}`);
      console.error("Flashcard generation error:", error);
    }
  };

  // Handles file uploads with metadata creation

  const handleFileUpload = (event) => {
    setIsUploading(true);
    setErrorMessage('');
    const uploaded = Array.from(event.target.files);
    const newFiles = uploaded.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1),
      type: file.name.split('.').pop().toLowerCase(),
      date: new Date().toISOString(),
      isTextFile: isTextFile(file)
    }));

    const newFileObjects = uploaded.reduce((acc, file, index) => {
      acc[newFiles[index].id] = file;
      return acc;
    }, {});

    setFileObjects(prev => ({ ...prev, ...newFileObjects }));
    setFiles(prev => [...prev, ...newFiles]);
    
    try {
      localStorage.setItem('storedFiles', JSON.stringify([...files, ...newFiles]));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      setErrorMessage("Could not save files to local storage. Your browser storage may be full.");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image/' + extension;
  if (extension === 'pdf') return 'application/pdf';
  return 'text/plain'; // default
  };

  // Deletes a file from state and localStorage
  const deleteFile = (index) => {
    const fileId = files[index].id;
    const updatedFiles = files.filter((_, i) => i !== index);
    
    setFiles(updatedFiles);
    setFileObjects(prev => {
      const newObjects = { ...prev };
      delete newObjects[fileId];
      return newObjects;
    });
    
    try {
      localStorage.setItem('storedFiles', JSON.stringify(updatedFiles));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  };

  // Open file handler / Opens a file in new tab using cached blob URL
  const openFile = (file) => {
    const fileObj = fileObjects[file.id];
    if (fileObj) {
      let fileUrl = fileUrlCache.current[file.id];
      if (!fileUrl) {
        fileUrl = URL.createObjectURL(fileObj);
        fileUrlCache.current[file.id] = fileUrl;
      }
      window.open(fileUrl, '_blank');
    } else {
      setErrorMessage("File content not loaded. Please re-upload the file.");
    }
  };

  // Cleanup effects
  useEffect(() => {
    return () => {
      Object.values(fileUrlCache.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
      fileUrlCache.current = {};
    };
  }, []);

   useEffect(() => {
    const currentFileIds = new Set(Object.keys(fileObjects));
    Object.keys(fileUrlCache.current).forEach(id => {
      if (!currentFileIds.has(id)) {
        URL.revokeObjectURL(fileUrlCache.current[id]);
        delete fileUrlCache.current[id];
      }
    });
  }, [fileObjects]);

  return (
    <div className="storage-page">
      <div className="storage-header">
        <div className="storage-stats">
          {/* You can add stats content here if needed */}
        </div>
      </div>

      <div className="search-upload-section">
        <div className="search-upload-row">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <label className={`file-upload-label ${isUploading ? 'disabled' : ''}`}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="file-upload-input"
              disabled={isUploading}
            />
          </label>
        </div>
        <div className="direct-text-input">
          <textarea
            placeholder="Or paste your notes directly here..."
            value={directTextInput}
            onChange={(e) => setDirectTextInput(e.target.value)}
            rows={4}
          />
          <button 
            onClick={handleDirectTextSubmit}
            disabled={!directTextInput.trim() || isGenerating}
            className="generate-flashcards-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate Flashcards from Text'}
          </button>
        </div>
        {errorMessage && (
          <div className="error-message">
            <button 
              onClick={() => setErrorMessage('')}
              className="dismiss-error-btn"
            >
              Dismiss
            </button>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <table className="file-table">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size (MB)</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.map((file, index) => (
            <tr key={file.id} className="file-row">
              <td>
                <button
                  onClick={() => openFile(file)}
                  className="file-link-button"
                >
                  {file.name}
                </button>
              </td>
              <td>{file.size}</td>
              <td>{format(new Date(file.date), 'yyyy-MM-dd HH:mm')}</td>
              <td className="actions-cell">
                <button 
                  className="delete-button"
                  onClick={() => deleteFile(index)}
                >
                  Delete
                </button>
                <div className="file-actions">
                  {!file.isTextFile && (
                    <button 
                      className="text-recognition-btn"
                      onClick={() => handleTextRecognition(file.id)}
                      disabled={processingFile === file.id}
                    >
                      Extract Text
                    </button>
                  )}
                  <button 
                    className="generate-flashcards-btn"
                    onClick={() => handleGenerateFlashcards(file.id)}
                    disabled={processingFile === file.id || isGenerating}
                  >
                    Generate Flashcards
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showFlashcardModal && (
        <div className="flashcard-modal">
          <div className="flashcard-modal-content">
            <div className="deck-name-input">
              <input
                type="text"
                placeholder="Name this deck (optional)"
                value={currentDeckName}
                onChange={(e) => setCurrentDeckName(e.target.value)}
              />
              <div className="deck-actions">
                <button 
                  onClick={saveFlashcardDeck}
                  disabled={!currentDeckName.trim()}
                  className="save-deck-btn"
                >
                  Save Deck
                </button>
              </div>
            </div>
            <div 
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="flashcard-front">
                {flashcards[currentFlashcardIndex]?.question}
              </div>
              <div className="flashcard-back">
                {flashcards[currentFlashcardIndex]?.answer}
              </div>
            </div>
            <div className="flashcard-navigation">
              <button 
                onClick={() => {
                  setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
                  setIsFlipped(false);
                }}
                disabled={currentFlashcardIndex === 0}
              >
                Previous
              </button>
              <span>
                {currentFlashcardIndex + 1} / {flashcards.length}
              </span>
              <button 
                onClick={() => {
                  setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                  setIsFlipped(false);
                }}
                disabled={currentFlashcardIndex === flashcards.length - 1}
              >
                Next
              </button>
            </div>
            {errorMessage && (
              <div className="error-message modal-error">
                <button 
                  onClick={() => setErrorMessage('')}
                  className="dismiss-error-btn"
                >
                  Dismiss
                </button>
                <span>{errorMessage}</span>
              </div>
            )}
            <button 
              onClick={() => setShowFlashcardModal(false)}
              className="close-modal-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Storage;