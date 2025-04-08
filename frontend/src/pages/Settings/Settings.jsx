import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Settings.module.css';

const Settings = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState({});
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const [confirmation, setConfirmation] = useState({ visible: false, action: null, message: '', actionKey: '' });

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet);
  };

  const showSuccess = () => {
    setShowSuccessBox(true);
    setTimeout(() => setShowSuccessBox(false), 3000);
  };

  const confirmAction = (action, message, actionKey) => {
    setConfirmation({ visible: true, action, message, actionKey });
  };

  const executeConfirmedAction = async () => {
    const { action, actionKey } = confirmation;
    setConfirmation({ visible: false, action: null, message: '', actionKey: '' });
    if (action) await action(actionKey);
  };

  const updateLoading = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const updateProgress = (key, value) => {
    setProgress((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddNewRows = async (key) => {
    if (!selectedFile) return;
    updateLoading(key, true);
    updateProgress(key, 0);

    const data = await readExcel(selectedFile);
    const existingDocs = await getDocs(collection(db, 'students'));
    const existing = existingDocs.docs.map((doc) => doc.data().Admissionnumber);
    const total = data.length;
    let count = 0;

    for (const item of data) {
      const { Admissionnumber, Name, Department, Semester } = item;
      if (!Admissionnumber || !Name || !Department || !Semester) continue;

      if (!existing.includes(Admissionnumber)) {
        await addDoc(collection(db, 'students'), {
          Admissionnumber,
          Name,
          Department,
          Semester,
        });
      }

      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }

    updateLoading(key, false);
    showSuccess();
  };

  const handleDeleteAll = async (key) => {
    updateLoading(key, true);
    updateProgress(key, 0);
    const snapshot = await getDocs(collection(db, 'students'));
    let count = 0;
    const total = snapshot.docs.length;

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'students', docSnap.id));
      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }

    updateLoading(key, false);
    showSuccess();
  };

  const handlePromoteStudents = async (key) => {
    updateLoading(key, true);
    updateProgress(key, 0);
    const snapshot = await getDocs(collection(db, 'students'));
    let count = 0;
    const total = snapshot.docs.length;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let newSemester = parseInt(data.Semester) + 1;

      if (newSemester > 8) {
        await deleteDoc(doc(db, 'students', docSnap.id));
      } else {
        await setDoc(doc(db, 'students', docSnap.id), {
          ...data,
          Semester: String(newSemester),
        });
      }

      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }

    updateLoading(key, false);
    showSuccess();
  };

  return (
    <div>
      <Navbar />
      <div className={styles.settingsContainer}>
        <div className={styles.content}>
          <h2>Add Student Details</h2>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className={styles.fileInput}
          />
          <button
            onClick={() => handleAddNewRows('newrows')}
            className={styles.uploadButton}
            disabled={loading.newrows}
          >
            {loading.newrows ? `Uploading... ${progress.newrows || 0}%` : 'Upload'}
          </button>
        </div>
        <div className={styles.content}>
          <h2>Promote Students</h2>
          <button
            className={styles.promoteButton}
            onClick={() => confirmAction(handlePromoteStudents, 'Are you sure you want to promote all students?', 'promote')}
            disabled={loading.promote}
          >
            {loading.promote ? `Promoting... ${progress.promote || 0}%` : 'Promote All'}
          </button>
        </div>
        <div className={styles.content}>
          <h2>Delete All Rows</h2>
          <button
            className={styles.deleteButton}
            onClick={() => confirmAction(handleDeleteAll, 'Are you sure you want to delete all rows?', 'delete')}
            disabled={loading.delete}
          >
            {loading.delete ? `Deleting... ${progress.delete || 0}%` : 'Delete All Rows'}
          </button>
        </div>
      </div>

      {confirmation.visible && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmBox}>
            <p>{confirmation.message}</p>
            <div className={styles.confirmButtons}>
              <button onClick={executeConfirmedAction}>Confirm</button>
              <button onClick={() => setConfirmation({ visible: false, action: null, message: '', actionKey: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessBox && (
        <div className={styles.popup}>
          Operation Successfull!
          <div className={styles.timeline}></div>
        </div>
      )}
    </div>
  );
};

export default Settings;
