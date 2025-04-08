import React, { useState, useEffect } from 'react';
import styles from './BusRoutes.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

const BusRoutes = () => {
  const [formData, setFormData] = useState({ code: '', name: '', fare: '' });
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [error, setError] = useState('');

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
          </div>
          {boardingPoints.map((point) => (
            <div key={point.id} className={styles.tableRow}>
              <div>{point.code}</div>
              <div>{point.name}</div>
              <div>₹{point.fare}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusRoutes;
