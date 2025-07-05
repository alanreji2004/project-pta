import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './AddStaff.module.css';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const AddStaff = () => {
  const [staffId, setStaffId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [busPointSuggestions, setBusPointSuggestions] = useState([]);
  const [staffData, setStaffData] = useState({
    name: '',
    department: '',
    semester: '',
    busPoint: '',
    fees: ''
  });

  const [allStaff, setAllStaff] = useState([]);
  const [allBoardingPoints, setAllBoardingPoints] = useState([]);
  const [boardingMap, setBoardingMap] = useState({});
  const [codeToFullMap, setCodeToFullMap] = useState({});
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentDocId, setCurrentDocId] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const staffSnap = await getDocs(collection(db, 'staff'));
      const staffData = staffSnap.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setAllStaff(staffData);

      const boardingSnap = await getDocs(collection(db, 'boardingpoints'));
      const boardingData = boardingSnap.docs.map(doc => {
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setStaffId(value);
    const filtered = allStaff
      .filter((s) => s.id.toLowerCase().startsWith(value.toLowerCase()))
      .map((s) => s.id);
    setSuggestions(value ? filtered : []);
  };

  const handleSuggestionClick = (value) => {
    setStaffId(value);
    setSuggestions([]);
  };

  const handleBusPointChange = (event) => {
    const value = event.target.value;
    setStaffData({ ...staffData, busPoint: value });
    const filtered = allBoardingPoints.filter(point =>
      point.toLowerCase().includes(value.toLowerCase())
    );
    setBusPointSuggestions(value ? filtered : []);
  };

  const handleBusPointSuggestionClick = (value) => {
    setStaffData({ ...staffData, busPoint: value });
    setBusPointSuggestions([]);
  };

  const handleSubmit = () => {
    const staff = allStaff.find(s => s.id === staffId);
    if (staff) {
      const fullBusPoint = codeToFullMap[staff.busPoint] || '';
      setStaffData({
        name: staff.name || '',
        department: staff.department || '',
        semester: staff.semester || '',
        busPoint: fullBusPoint,
        fees: ''
      });
      setCurrentDocId(staff.docId);
    }
  };

  const handleCalculateFee = () => {
    const fare = boardingMap[staffData.busPoint.toLowerCase()];
    if (fare !== undefined) {
      setStaffData({ ...staffData, fees: fare });
    }
  };

  const handleSave = async () => {
    if (
      !staffId ||
      !staffData.name ||
      !staffData.department ||
      !staffData.busPoint ||
      !staffData.fees
    ) return;

    const busCode = staffData.busPoint.split('-')[0];
    const payload = {
      id: staffId,
      name: staffData.name,
      department: staffData.department,
      semester: staffData.semester,
      busPoint: busCode,
      fees: staffData.fees,
      paid: staffData.fees,
      fullypaid: 1,
      partiallypaid: 0,
      remainingFees: ''
    };

    try {
      const docId = currentDocId || encodeURIComponent(staffId);
      await setDoc(doc(db, 'staff', docId), payload);
      setPopupMessage('Saved successfully');
      setShowPopup(true);
      setStaffId('');
      setStaffData({
        name: '',
        department: '',
        semester: '',
        busPoint: '',
        fees: ''
      });
      setCurrentDocId('');
    } catch (error) {
      setPopupMessage('Error occurred');
      setShowPopup(true);
    }

    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <h2>Enter Staff Details</h2>
        <div className={styles.formContainer}>
          <div className={styles.row}>
            <div className={styles.admissionContainer}>
              <div className={styles.autocomplete}>
                <input
                  type="text"
                  placeholder="Enter Staff ID"
                  value={staffId}
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
            <input type="text" value={staffData.name} placeholder="Name" className={styles.inputBox} readOnly />
            <input type="text" value={staffData.department} placeholder="Department" className={styles.inputBox} readOnly />
          </div>

          <div className={styles.row}>
            <div className={styles.autocomplete}>
              <input
                type="text"
                placeholder="Enter Bus Point"
                value={staffData.busPoint}
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
            <input type="text" value={staffData.fees} className={styles.inputBox} readOnly />
          </div>

          <button className={styles.saveButton} onClick={handleSave}>Save</button>
        </div>
      </div>
      {showPopup && <div className={styles.popup}>{popupMessage}</div>}
    </div>
  );
};

export default AddStaff;
