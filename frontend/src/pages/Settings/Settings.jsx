import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Settings.module.css';

const Settings = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [operation, setOperation] = useState('add');
  const [uploadStatus, setUploadStatus] = useState('');

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet);
  };

  const uploadData = async (data) => {
    try {
      const studentsRef = collection(db, 'students');
      if (operation === 'delete') {
        const existingDocs = await getDocs(studentsRef);
        existingDocs.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'students', docSnap.id));
        });
      }
      for (const item of data) {
        const { RegisterNumber, Name, Email } = item;
        if (operation === 'replace') {
          const existingDocs = await getDocs(studentsRef);
          let found = false;
          existingDocs.forEach(async (docSnap) => {
            if (docSnap.data().RegisterNumber === RegisterNumber) {
              await setDoc(doc(db, 'students', docSnap.id), { RegisterNumber, Name, Email });
              found = true;
            }
          });
          if (!found) {
            await addDoc(studentsRef, { RegisterNumber, Name, Email });
          }
        } else {
          await addDoc(studentsRef, { RegisterNumber, Name, Email });
        }
      }
      setUploadStatus('Upload successful!');
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file.');
      return;
    }
    setUploadStatus('Processing...');
    const data = await readExcel(selectedFile);
    await uploadData(data);
  };

  return (
    <div>
    <Navbar />
    <div className={styles.settingsContainer}>
      <div className={styles.content}>
        <h2>Upload Student Details</h2>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className={styles.fileInput}
        />
        <div className={styles.operationContainer}>
          <label>
            <input
              type="radio"
              value="add"
              checked={operation === 'add'}
              onChange={() => setOperation('add')}
            />
            Add Rows
          </label>
          <label>
            <input
              type="radio"
              value="delete"
              checked={operation === 'delete'}
              onChange={() => setOperation('delete')}
            />
            Delete Current Rows and Update
          </label>
          <label>
            <input
              type="radio"
              value="replace"
              checked={operation === 'replace'}
              onChange={() => setOperation('replace')}
            />
            Replace Matching Rows
          </label>
        </div>
        <button onClick={handleUpload} className={styles.uploadButton}>
          Upload
        </button>
        {uploadStatus && <p className={styles.statusMessage}>{uploadStatus}</p>}
      </div>
    </div>
    </div>
  );
};

export default Settings;
