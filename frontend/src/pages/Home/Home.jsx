import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Home.module.css';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
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
    remainingFees: '',
    totalPayable: ''
  });
  const [allStudents, setAllStudents] = useState([]);
  const [allBoardingPoints, setAllBoardingPoints] = useState([]);
  const [boardingMap, setBoardingMap] = useState({});
  const [codeToFullMap, setCodeToFullMap] = useState({});
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentDocId, setCurrentDocId] = useState('');
  const [loadedAdmissionNumber, setLoadedAdmissionNumber] = useState('');

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
      const reverseMap = {};
      boardingData.forEach(item => {
        fareMap[item.fullName.toLowerCase()] = item.fare;
        reverseMap[item.code] = item.fullName;
      });
      setAllBoardingPoints(fullNames);
      setBoardingMap(fareMap);
      setCodeToFullMap(reverseMap);
    };
    fetchAll();
  }, []);

  const handleRadioChange = (event) => {
    setSelectedPayment(event.target.value);
    if (event.target.value === "Fully Paid") {
      setStudentData({ ...studentData, remainingFees: '' });
    }
  };

  const handleBusPointChange = (event) => {
    const value = event.target.value;
    setStudentData({ ...studentData, busPoint: value });
    const filtered = allBoardingPoints.filter(point =>
      point.toLowerCase().includes(value.toLowerCase())
    );
    setBusPointSuggestions(value ? filtered : []);
  };

  const handleBusPointSuggestionClick = (value) => {
    setStudentData({ ...studentData, busPoint: value });
    setBusPointSuggestions([]);
  };
  const normalize = (str) => str.replace(/\//g, '').toLowerCase();
  const handleInputChange = (e) => {
    const value = e.target.value;
    setAdmissionNumber(value);
    const filtered = allStudents
      .filter((s) => normalize(s.Admissionnumber).startsWith(normalize(value)))
      .map((s) => s.Admissionnumber);
    setSuggestions(value ? filtered : []);
  };

  const handleSuggestionClick = (value) => {
    setAdmissionNumber(value);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    const student = allStudents.find(s => s.Admissionnumber === admissionNumber);
    if (student) {
      const fullBusPoint = codeToFullMap[student.busPoint] || '';
      const totalPayable = student.fullypaid === 1
        ? student.paid
        : (parseInt(student.paid || 0) + parseInt(student.remainingFees || 0)).toString();

      setStudentData({
        name: student.Name || '',
        department: student.Department || '',
        semester: student.Semester || '',
        busPoint: fullBusPoint,
        fees: student.fees || '',
        remainingFees: student.remainingFees || '',
        totalPayable: totalPayable
      });

      if (student.fullypaid === 1) {
        setSelectedPayment('Fully Paid');
      } else if (student.partiallypaid === 1) {
        setSelectedPayment('Partially Paid');
      } else {
        setSelectedPayment('');
      }
      setLoadedAdmissionNumber(student.Admissionnumber);
      setCurrentDocId(student.id);
    }
  };

  const handleCalculateFee = () => {
    const fare = boardingMap[studentData.busPoint.toLowerCase()];
    if (fare !== undefined) {
      setStudentData({ ...studentData, fees: fare, totalPayable: fare });
    }
  };

  const handleSave = async () => {
    if (admissionNumber !== loadedAdmissionNumber) {
      setPopupMessage('Please click Submit after entering a new Admission Number before saving.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    return;
  }
    if (
      !admissionNumber ||
      !studentData.name ||
      !studentData.department ||
      !studentData.semester ||
      !studentData.busPoint ||
      !studentData.fees ||
      !selectedPayment ||
      (selectedPayment === 'Partially Paid' && !studentData.remainingFees) ||
      !studentData.totalPayable
    ){
      setPopupMessage('Please fill in all required fields correctly.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    };

    const busCode = studentData.busPoint.split('-')[0];
    const payload = {
      Admissionnumber: admissionNumber,
      Name: studentData.name,
      Department: studentData.department,
      Semester: studentData.semester,
      busPoint: busCode,
      fees: studentData.fees,
      paid: studentData.totalPayable,
      fullypaid: selectedPayment === 'Fully Paid' ? 1 : 0,
      partiallypaid: selectedPayment === 'Partially Paid' ? 1 : 0,
      remainingFees: selectedPayment === 'Partially Paid' ? studentData.remainingFees : ''
    };

    try {
      const docId = currentDocId || encodeURIComponent(admissionNumber);
      await setDoc(doc(db, 'students', docId), payload, { merge:true});
      setPopupMessage('Saved successfully');
      setShowPopup(true);
      setAdmissionNumber('');
      setSelectedPayment('');
      setStudentData({
        name: '',
        department: '',
        semester: '',
        busPoint: '',
        fees: '',
        remainingFees: '',
        totalPayable: ''
      });
      setCurrentDocId('');
    } catch (error) {
      setPopupMessage('Error occurred');
      setShowPopup(true);
    }

    setTimeout(() => setShowPopup(false), 2000);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
            <input type="text" value={studentData.fees} className={styles.inputBox} readOnly />
          </div>

          <div className={styles.row}>
            <input
              type="text"
              placeholder="Total Payable Amount After Concession"
              className={styles.inputBox}
              value={studentData.totalPayable}
              onChange={(e) => setStudentData({ ...studentData, totalPayable: e.target.value })}
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

          <button className={styles.saveButton} onClick={handleSave}>Save</button>
        </div>
      </div>
      {showPopup && <div className={styles.popup}>{popupMessage}</div>}
    </div>
  );
};

export default Home;
