import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Home.module.css';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Home = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [busPointSuggestions, setBusPointSuggestions] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [studentData, setStudentData] = useState({
    name: '',
    department: '',
    semester: '',
    busPoint: '',
    fees: '',
    payable: '',
    remainingFees: ''
  });
  const [allStudents, setAllStudents] = useState([]);
  const [allBoardingPoints, setAllBoardingPoints] = useState([]);
  const [boardingMap, setBoardingMap] = useState({});
  const [codeToFullMap, setCodeToFullMap] = useState({});
  const [studentDocId, setStudentDocId] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const studentSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStudents(studentsData);

      const boardingSnapshot = await getDocs(collection(db, 'boardingpoints'));
      const boardingData = boardingSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          code: data.code,
          fullName: `${data.code}-${data.name}`,
          fare: data.fare
        };
      });
      const fullNames = boardingData.map(item => item.fullName);
      const fareMap = {};
      const codeMap = {};
      boardingData.forEach(item => {
        fareMap[item.fullName.toLowerCase()] = item.fare;
        codeMap[item.code] = item.fullName;
      });
      setAllBoardingPoints(fullNames);
      setBoardingMap(fareMap);
      setCodeToFullMap(codeMap);
    };
    fetchAll();
  }, []);

  const handleRadioChange = (event) => {
    setSelectedPayment(event.target.value);
    if (event.target.value === "Fully Paid") {
      setStudentData(prev => ({ ...prev, remainingFees: '' }));
    }
  };

  const handleBusPointChange = (event) => {
    const value = event.target.value;
    setStudentData(prev => ({ ...prev, busPoint: value }));
    const filtered = allBoardingPoints.filter(point =>
      point.toLowerCase().includes(value.toLowerCase())
    );
    setBusPointSuggestions(value ? filtered : []);
  };

  const handleBusPointSuggestionClick = (value) => {
    setStudentData(prev => ({ ...prev, busPoint: value }));
    setBusPointSuggestions([]);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setAdmissionNumber(value);
    const filtered = allStudents
      .filter((s) => s.Admissionnumber.toLowerCase().startsWith(value.toLowerCase()))
      .map((s) => s.Admissionnumber);
    setSuggestions(value ? filtered : []);
  };

  const handleSuggestionClick = (value) => {
    setAdmissionNumber(value);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    const student = allStudents.find(s => s.Admissionnumber === admissionNumber);
    if (student && Object.keys(codeToFullMap).length > 0) {
      setStudentDocId(student.id);
      const fullBusPoint = codeToFullMap[student.busPoint] || '';
      setStudentData({
        name: student.Name || '',
        department: student.Department || '',
        semester: student.Semester || '',
        busPoint: fullBusPoint,
        fees: student.fees || '',
        payable: student.paid || '',
        remainingFees: student.partiallypaid ? (student.remaining || '') : ''
      });
      if (student.fullypaid) setSelectedPayment('Fully Paid');
      else if (student.partiallypaid) setSelectedPayment('Partially Paid');
      else setSelectedPayment('');
    }
  };

  const handleCalculateFee = () => {
    const fare = boardingMap[studentData.busPoint.toLowerCase()];
    if (fare !== undefined) {
      setStudentData(prev => ({ ...prev, fees: fare, payable: fare }));
    }
  };

  const handleSave = async () => {
    const { name, department, semester, busPoint, fees, payable, remainingFees } = studentData;
    if (!name || !department || !semester || !busPoint || !fees || !payable || !selectedPayment) return;
    if (selectedPayment === 'Partially Paid' && !remainingFees) return;
    const code = busPoint.split('-')[0];
    const docRef = doc(db, 'students', studentDocId);
    const updatedData = {
      paid: payable,
      fullypaid: selectedPayment === 'Fully Paid' ? 1 : 0,
      partiallypaid: selectedPayment === 'Partially Paid' ? 1 : 0,
      remaining: selectedPayment === 'Partially Paid' ? remainingFees : '',
      busPoint: code,
      fees: fees
    };
    await updateDoc(docRef, updatedData);
    setAdmissionNumber('');
    setSuggestions([]);
    setStudentData({
      name: '',
      department: '',
      semester: '',
      busPoint: '',
      fees: '',
      payable: '',
      remainingFees: ''
    });
    setSelectedPayment('');
    setStudentDocId('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <h2>Enter Student Details</h2>
        <div className={styles.formContainer}>
          <div className={styles.row}>
            <div className={styles.admissionContainer}>
              <div className={styles.autocomplete}>
                <input
                  type="text"
                  placeholder="Enter Admission Number"
                  value={admissionNumber}
                  onChange={handleInputChange}
                  className={`${styles.inputBox} ${styles.longInput}`}
                />
                {suggestions.length > 0 && (
                  <ul className={styles.suggestions}>
                    {suggestions.map((item, index) => (
                      <li key={index} onClick={() => handleSuggestionClick(item)}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button className={styles.button} onClick={handleSubmit}>Submit</button>
            </div>
          </div>

          <div className={styles.row}>
            <input type="text" value={studentData.name} placeholder="Name" className={styles.inputBox} readOnly />
            <input type="text" value={studentData.department} placeholder="Department" className={styles.inputBox} readOnly />
            <input type="text" value={studentData.semester} placeholder="Semester" className={styles.inputBox} readOnly />
          </div>

          <div className={styles.row}>
            <div className={styles.autocomplete}>
              <input
                type="text"
                placeholder="Enter Bus Point"
                value={studentData.busPoint}
                onChange={handleBusPointChange}
                className={styles.inputBox}
              />
              {busPointSuggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {busPointSuggestions.map((item, index) => (
                    <li key={index} onClick={() => handleBusPointSuggestionClick(item)}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className={styles.button} onClick={handleCalculateFee}>Calculate Fee</button>
            <input
              type="text"
              value={studentData.fees}
              className={styles.inputBox}
              readOnly
            />
          </div>

          <div className={styles.row}>
            <input
              type="text"
              placeholder="Total Payable Amount"
              className={styles.inputBox}
              value={studentData.payable}
              onChange={(e) => setStudentData(prev => ({ ...prev, payable: e.target.value }))}
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
              onChange={(e) => setStudentData(prev => ({ ...prev, remainingFees: e.target.value }))}
              disabled={selectedPayment === "Fully Paid"} 
            />
          </div>

          <button className={styles.saveButton} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
