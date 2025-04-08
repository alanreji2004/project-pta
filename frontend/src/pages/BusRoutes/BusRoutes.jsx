import React, { useState, useEffect } from 'react';
import styles from './BusRoutes.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FiEdit2 } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BusRoutes = () => {
  const [formData, setFormData] = useState({ code: '', name: '', fare: '' });
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: '', code: '', name: '', fare: '' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'boardingpoints'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBoardingPoints(data);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const codeUpper = formData.code.trim().toUpperCase();
    const nameUpper = formData.name.trim().toUpperCase();
    const fare = formData.fare;

    if (codeUpper && nameUpper && fare) {
      const qCode = query(collection(db, 'boardingpoints'), where('code', '==', codeUpper));
      const qName = query(collection(db, 'boardingpoints'), where('name', '==', nameUpper));
      const [codeSnap, nameSnap] = await Promise.all([getDocs(qCode), getDocs(qName)]);

      if (!codeSnap.empty) {
        setError('Code is already in use.');
        return;
      }

      if (!nameSnap.empty) {
        setError('Boarding point already entered.');
        return;
      }

      await addDoc(collection(db, 'boardingpoints'), {
        code: codeUpper,
        name: nameUpper,
        fare
      });

      setFormData({ code: '', name: '', fare: '' });
    }
  };

  const openEditModal = (point) => {
    setEditData({ id: point.id, code: point.code, name: point.name, fare: point.fare });
    setEditModal(true);
  };

  const handleEditSubmit = async () => {
    const docRef = doc(db, 'boardingpoints', editData.id);
    await updateDoc(docRef, {
      name: editData.name.trim().toUpperCase(),
      fare: editData.fare
    });
    setEditModal(false);
  };

  const downloadCSV = () => {
    const csv = [
      ['Code', 'Name', 'Fare'],
      ...boardingPoints.map(point => [point.code, point.name, point.fare])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'BoardingPoints.csv');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Boarding Points', 14, 15);
    autoTable(doc, {
      head: [['Code', 'Name', 'Fare']],
      body: boardingPoints.map(point => [point.code, point.name, point.fare]),
      startY: 20
    });
    doc.save('BoardingPoints.pdf');
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <div className={styles.addBoardingPoint}>
        <h2 className={styles.sectionTitle}>Add Boarding Point</h2>
        <form onSubmit={handleSubmit} className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Boarding Point Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Fare"
            value={formData.fare}
            onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.submitButton}>Submit</button>
        </form>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>All Boarding Points</h2>
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div>Code</div>
            <div>Name</div>
            <div>Fare</div>
            <div>Edit</div>
          </div>
          {boardingPoints.map((point) => (
            <div key={point.id} className={styles.tableRow}>
              <div>{point.code}</div>
              <div>{point.name}</div>
              <div>₹{point.fare}</div>
              <div className={styles.editIconWrapper}>
                <button className={styles.editButton} onClick={() => openEditModal(point)}>
                  <FiEdit2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.downloadButtons}>
          <button className={styles.downloadButton} onClick={downloadCSV}>Download CSV</button>
          <button className={styles.downloadButton} onClick={downloadPDF}>Download PDF</button>
        </div>
      </div>

      {editModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Edit Boarding Point</h3>
            <div className={styles.modalInputGroup}>
            <input type="text" value={editData.code} disabled className={styles.input} />
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className={styles.input}
            />
            <input
              type="number"
              value={editData.fare}
              onChange={(e) => setEditData({ ...editData, fare: e.target.value })}
              className={styles.input}
            />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.submitButton} onClick={handleEditSubmit}>Save</button>
              <button className={styles.cancelButton} onClick={() => setEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusRoutes;
