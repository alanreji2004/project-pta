import React, { useState } from 'react';
import styles from './BusRoutes.module.css';
import Navbar from '../../components/Navbar/Navbar';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const BusRoutes = () => {
  const [formData, setFormData] = useState({ code: '', name: '', fare: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.code && formData.name && formData.fare) {
      await addDoc(collection(db, 'boardingpoints'), {
        code: formData.code,
        name: formData.name,
        fare: formData.fare,
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
      </div>
    </div>
  );
};

export default BusRoutes;
