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
import { Link } from "react-router-dom";

const Settings = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [staffFile, setStaffFile] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState({});
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const [confirmation, setConfirmation] = useState({ visible: false, action: null, message: '', actionKey: '' });
  const [passwordModal, setPasswordModal] = useState({ visible: false, action: null, message: '', actionKey: '' });
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


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
    setPasswordModal({ visible: true, action, message, actionKey });
    setPasswordError('');
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

  const handleAddStaff = async (key) => {
    if (!staffFile) return;
    updateLoading(key, true);
    updateProgress(key, 0);
    const data = await readExcel(staffFile);
    const existingDocs = await getDocs(collection(db, 'staff'));
    const existing = existingDocs.docs.map((doc) => doc.data().id);
    const total = data.length;
    let count = 0;
    for (const item of data) {
      const { id, name, department } = item;
      if (!id || !name || !department) continue;
      if (!existing.includes(id)) {
        await addDoc(collection(db, 'staff'), {
          id,
          name,
          department,
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
    const studentSnapshot = await getDocs(collection(db, 'students'));
    const staffSnapshot = await getDocs(collection(db, 'staff'));
    const total = studentSnapshot.docs.length + staffSnapshot.docs.length;

    if (total === 0) {
      updateLoading(key, false);
      setErrorMessage('No student or staff records found to delete.');
      setTimeout(() => setErrorMessage(''), 2200);
      return;
    }

    let count = 0;
    for (const docSnap of studentSnapshot.docs) {
      await deleteDoc(doc(db, 'students', docSnap.id));
      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }
    for (const docSnap of staffSnapshot.docs) {
      await deleteDoc(doc(db, 'staff', docSnap.id));
      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }
    updateLoading(key, false);
    showSuccess();
  };

  const handlePromoteStudents = async (key) => {
    updateLoading(key, true);
    updateProgress(key, 0);
    const studentSnapshot = await getDocs(collection(db, 'students'));
    const staffSnapshot = await getDocs(collection(db, 'staff'));
    let count = 0;
    const total = studentSnapshot.docs.length + staffSnapshot.docs.length;
    for (const docSnap of studentSnapshot.docs) {
      const data = docSnap.data();
      let newSemester = parseInt(data.Semester) + 1;
      if (newSemester > 8) {
        await deleteDoc(doc(db, 'students', docSnap.id));
      } else {
        const {
          fees,
          busPoint,
          fullypaid,
          paid,
          partiallypaid,
          remainingFees,
          ...cleanedData
        } = data;
        await setDoc(doc(db, 'students', docSnap.id), {
          ...cleanedData,
          Semester: String(newSemester),
        });
      }
      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }
    for (const docSnap of staffSnapshot.docs) {
      const data = docSnap.data();
      const {
        fees,
        busPoint,
        fullypaid,
        paid,
        partiallypaid,
        remainingFees,
        ...cleanedData
      } = data;
      await setDoc(doc(db, 'staff', docSnap.id), {
        ...cleanedData,
      });
      count++;
      updateProgress(key, Math.round((count / total) * 100));
    }
    updateLoading(key, false);
    showSuccess();
  };

  const validatePassword = () => {
    if (enteredPassword === import.meta.env.VITE_PASSWORD) {
      setPasswordModal({ visible: false, action: null, message: '', actionKey: '' });
      setEnteredPassword('');
      setPasswordError('');
      setConfirmation({
        visible: true,
        action: passwordModal.action,
        message: passwordModal.message,
        actionKey: passwordModal.actionKey,
      });
    } else {
      setPasswordError('Incorrect password!');
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles.settingsContainer}>
        <div className={styles.content}>
          <h2>Add/Edit Boarding points</h2>
          <Link to="/boardingpoints">
            <button className={styles.busButton}>Go To Page</button>
          </Link>
        </div>
        <div className={styles.content}>
          <h2>Add/Edit Bus Routes</h2>
          <Link to="/routes">
            <button className={styles.busButton}>Go To Page</button>
          </Link>
        </div>
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
          <h2>View or Add Individual Students</h2>
          <Link to="/vieworaddstudent">
            <button className={styles.busButton}>Go To Page</button>
          </Link>
        </div>
        <div className={styles.content}>
          <h2>Add Staff Details</h2>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => setStaffFile(e.target.files[0])}
            className={styles.fileInput}
          />
          <button
            onClick={() => handleAddStaff('staffupload')}
            className={styles.uploadButton}
            disabled={loading.staffupload}
          >
            {loading.staffupload ? `Uploading... ${progress.staffupload || 0}%` : 'Upload'}
          </button>
        </div>
        <div className={styles.content}>
          <h2>Promote to next Semester</h2>
          <button
            className={styles.promoteButton}
            onClick={() =>
              confirmAction(
                handlePromoteStudents,
                'Are you sure you want to promote all students? This action cannot be undone.',
                'promote'
              )
            }
            disabled={loading.promote}
          >
            {loading.promote ? `Promoting... ${progress.promote || 0}%` : 'Promote All'}
          </button>
        </div>
        <div className={styles.content}>
          <h2>Delete All Rows</h2>
          <button
            className={styles.deleteButton}
            onClick={() =>
              confirmAction(
                handleDeleteAll,
                'Are you sure you want to delete all rows? This action cannot be undone.',
                'delete'
              )
            }
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
          Operation Successful!
          <div className={styles.timeline}></div>
        </div>
      )}
      {passwordModal.visible && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmBox}>
            <p>Enter password to continue</p>
            <input
              type="password"
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              placeholder="Password"
              className={styles.passwordInput}
            />
            {passwordError && (
              <p className={styles.errorText}>{passwordError}</p>
            )}
            <div className={styles.confirmButtons}>
              <button onClick={validatePassword}>Submit</button>
              <button onClick={() => {
                setPasswordModal({ visible: false, action: null, message: '', actionKey: '' });
                setEnteredPassword('');
                setPasswordError('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className={styles.errorBox}>
          {errorMessage}
          <div className={styles.timeline}></div>
        </div>
      )}
    </div>
  );
};

export default Settings;
