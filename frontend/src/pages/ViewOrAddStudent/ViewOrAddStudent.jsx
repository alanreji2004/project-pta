import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../../components/Navbar/Navbar';
import styles from './ViewOrAddStudent.module.css';

const ViewOrAddStudent = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    Admissionnumber: '',
    Name: '',
    Department: '',
    Semester: '',
  });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const studentData = doc.data();
        return {
          id: doc.id,
          ...studentData,
          Admissionnumber: studentData.Admissionnumber?.toUpperCase() || '',
          Department: studentData.Department?.toUpperCase() || '',
        };
      });
      setStudents(data);
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
    let { Admissionnumber, Name, Department, Semester } = form;

    if (!Admissionnumber || !Name || !Department || !Semester) {
      showToast('All fields are required.', 'error');
      return;
    }

    Admissionnumber = Admissionnumber.toUpperCase();
    Department = Department.toUpperCase();

    const semesterNumber = Number(Semester);
    if (isNaN(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
      showToast('Semester must be a number between 1 and 8.', 'error');
      return;
    }

    const existingQuery = query(
      collection(db, 'students'),
      where('Admissionnumber', '==', Admissionnumber)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      showToast('A student with this admission number already exists.', 'error');
      return;
    }

    await addDoc(collection(db, 'students'), {
      Admissionnumber,
      Name,
      Department,
      Semester,
      remainingFees: 0,
      busPoint: '',
      fees: '0',
      paid: '0',
      partiallypaid: 0,
      fullypaid: 0,
    });

    setForm({ Admissionnumber: '', Name: '', Department: '', Semester: '' });
    showToast('Student added successfully!', 'success');
  };

  const downloadCSV = (filterNotPaid = false) => {
    const headers = ['Admission Number', 'Name', 'Department', 'Semester', 'Fee Status'];
    const rows = students
      .filter((student) =>
        filterNotPaid
          ? student.fullypaid !== 1 && student.partiallypaid !== 1
          : true
      )
      .map((student) => [
        student.Admissionnumber,
        student.Name,
        student.Department,
        `S${student.Semester || '-'}`,
        (student.fullypaid === 1 || student.partiallypaid === 1) ? 'Paid' : 'Not Paid',
      ]);

    let csvContent = headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filterNotPaid ? 'students_not_paid.csv' : 'all_students.csv';
    link.click();
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastType]}`}>
          {toastMessage}
        </div>
      )}
      <div className={styles.formSection}>
        <h2 className={styles.title}>Add Student</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="Admissionnumber"
            placeholder="Admission Number"
            value={form.Admissionnumber}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="Name"
            placeholder="Name"
            value={form.Name}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="Department"
            placeholder="Department"
            value={form.Department}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="number"
            name="Semester"
            placeholder="Semester"
            value={form.Semester}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>Add Student</button>
        </form>
      </div>
      <div className={styles.downloadButtons}>
        <button onClick={() => downloadCSV(false)} className={styles.downloadButton}>
          Download All Students (CSV)
        </button>
        <button onClick={() => downloadCSV(true)} className={styles.downloadButton}>
          Download Not Paid Only (CSV)
        </button>
      </div>
      <div className={styles.tableSection}>
        <h2 className={styles.title}>All Students</h2>
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div>Admission No</div>
            <div>Name</div>
            <div>Department</div>
            <div>Semester</div>
            <div>Fee Status</div>
          </div>
          {students.length > 0 ? (
            students.map((student, i) => (
              <div key={i} className={styles.tableRow}>
                <div>{student.Admissionnumber}</div>
                <div>{student.Name}</div>
                <div>{student.Department}</div>
                <div>S{student.Semester || '-'}</div>
                <div>
                  {(student.fullypaid === 1 || student.partiallypaid === 1) ? 'Paid' : 'Not Paid'}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyRow}>No students found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewOrAddStudent;
