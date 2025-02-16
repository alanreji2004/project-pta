import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Home.module.css';

const Home = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [studentData, setStudentData] = useState({
    name: '',
    department: '',
    semester: '',
    busPoint: '',
    fees: '',
    remainingFees: '',
    paymentStatus: ''
  });

  const handleRadioChange = (event) => {
    setSelectedPayment(event.target.value);
    if (event.target.value === "Fully Paid") {
      setStudentData({ ...studentData, remainingFees: '' }); 
    }
  };

  const handleBusPointChange = (event) => {
    setStudentData({ ...studentData, busPoint: event.target.value });
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.content}>
        <h2>Enter Student Details</h2>
      <div className={styles.formContainer}>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="Enter Admission Number"
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            className={styles.inputBox}
          />
          <button className={styles.button}>Submit</button>
        </div>

        <div className={styles.row}>
          <input type="text" value={studentData.name} placeholder="Name" className={styles.inputBox} readOnly />
          <input type="text" value={studentData.department} placeholder="Department" className={styles.inputBox} readOnly />
          <input type="text" value={studentData.semester} placeholder="Semester" className={styles.inputBox} readOnly />
        </div>

        <div className={styles.row}>
          <input
            type="text"
            placeholder="Enter Bus Point"
            value={studentData.busPoint}
            onChange={handleBusPointChange}
            className={styles.inputBox}
          />
          <button className={styles.button}>Calculate Fee</button>
          <input
            type="text"
            value={studentData.fees}
            className={styles.inputBox}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.checkboxLabel}>
            <input
              type="radio"
              value="Fully Paid"
              checked={selectedPayment === "Fully Paid"}
              onChange={handleRadioChange}
            />
            Fully Paid
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="radio"
              value="Partially Paid"
              checked={selectedPayment === "Partially Paid"}
              onChange={handleRadioChange}
            />
            Partially Paid
          </label>
          <input
            type="text"
            placeholder="Remaining Fees"
            className={styles.inputBox}
            value={studentData.remainingFees}
            onChange={(e) => setStudentData({ ...studentData, remainingFees: e.target.value })}
            disabled={selectedPayment === "Fully Paid"} 
          />
        </div>

        <button className={styles.saveButton}>Save</button>
      </div>
    </div>
    </div>
  );
};

export default Home;
