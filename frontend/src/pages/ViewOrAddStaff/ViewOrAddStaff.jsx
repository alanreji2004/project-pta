import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../../components/Navbar/Navbar';
import styles from './ViewOrAddStaff.module.css';

const ViewOrAddStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    name: '',
    id: '',
    department: '',
  });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.data().id?.toUpperCase() || '',
        name: doc.data().name || '',
        department: doc.data().department?.toUpperCase() || '',
        fullypaid: doc.data().fullypaid || 0,
      }));
      setStaffList(data);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let { name, id, department } = form;

    if (!name || !id || !department) {
      showToast('All fields are required.', 'error');
      return;
    }

    id = id.toUpperCase();
    department = department.toUpperCase();

    const existingQuery = query(collection(db, 'staff'), where('id', '==', id));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      showToast('Staff with this ID already exists.', 'error');
      return;
    }

    await addDoc(collection(db, 'staff'), {
      name,
      id,
      department,
      fullypaid: 0,
    });

    setForm({ name: '', id: '', department: '' });
    showToast('Staff added successfully!', 'success');
  };

  const downloadCSV = (filterNotPaid = false) => {
    const headers = ['ID', 'Name', 'Department', 'Payment Status'];
    const rows = staffList
      .filter((staff) => (filterNotPaid ? staff.fullypaid !== 1 : true))
      .map((staff) => [
        staff.id,
        staff.name,
        staff.department,
        staff.fullypaid === 1 ? 'Paid' : 'Not Paid',
      ]);

    const csvContent = headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filterNotPaid ? 'staff_not_paid.csv' : 'all_staff.csv';
    link.click();
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastType]}`}>{toastMessage}</div>
      )}
      <div className={styles.formSection}>
        <h2 className={styles.title}>Add Staff</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="id"
            placeholder="Staff ID"
            value={form.id}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>Add Staff</button>
        </form>
      </div>
      <div className={styles.downloadButtons}>
        <button onClick={() => downloadCSV(false)} className={styles.downloadButton}>
          Download All Staff (CSV)
        </button>
        <button onClick={() => downloadCSV(true)} className={styles.downloadButton}>
          Download Not Paid Only (CSV)
        </button>
      </div>
      <div className={styles.tableSection}>
        <h2 className={styles.title}>All Staff</h2>
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div>ID</div>
            <div>Name</div>
            <div>Department</div>
            <div>Payment Status</div>
          </div>
          {staffList.length > 0 ? (
            staffList.map((staff, i) => (
              <div key={i} className={styles.tableRow}>
                <div>{staff.id}</div>
                <div>{staff.name}</div>
                <div>{staff.department}</div>
                <div>{staff.fullypaid === 1 ? 'Paid' : 'Not Paid'}</div>
              </div>
            ))
          ) : (
            <div className={styles.emptyRow}>No staff found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewOrAddStaff;
