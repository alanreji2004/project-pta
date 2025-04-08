import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Settings.module.css';

const Settings = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [operation, setOperation] = useState('add');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessBox, setShowSuccessBox] = useState(false);

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
        for (const docSnap of existingDocs.docs) {
          await deleteDoc(doc(db, 'students', docSnap.id));
        }
      }

      let count = 0;
      const total = data.length;

      for (const item of data) {
        const { Admissionnumber, Name, Department, Semester } = item;
        if (!Admissionnumber || !Name || !Department || !Semester) continue;

        if (operation === 'replace') {
          const existingDocs = await getDocs(studentsRef);
          let found = false;
          for (const docSnap of existingDocs.docs) {
            if (docSnap.data().Admissionnumber === Admissionnumber) {
              await setDoc(doc(db, 'students', docSnap.id), { Admissionnumber, Name, Department, Semester });
              found = true;
              break;
            }
          }
          if (!found) {
            await addDoc(studentsRef, { Admissionnumber, Name, Department, Semester });
          }
        } else {
          await addDoc(studentsRef, { Admissionnumber, Name, Department, Semester });
        }

        count++;
        setUploadProgress(Math.round((count / total) * 100));
      }

      setShowSuccessBox(true);
      setTimeout(() => setShowSuccessBox(false), 5000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadProgress(0);
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
            accept=".xlsx, .xls, .csv"
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
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      </div>
      {showSuccessBox && (
        <div className={styles.successBox}>
          <span className={styles.arrow}></span>
          Upload Successful
        </div>
      )}
    </div>
  );
};

export default Settings;
