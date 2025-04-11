import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar/Navbar'
import styles from './QRScanner.module.css'

const QRScanner = () => {
  const [scannedId, setScannedId] = useState(null)
  const [student, setStudent] = useState(null)
  const [boardingMap, setBoardingMap] = useState({})
  const [admissionInput, setAdmissionInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    const fetchBoardingPoints = async () => {
      const bpSnap = await getDocs(collection(db, 'boardingpoints'))
      const map = {}
      bpSnap.docs.forEach(d => {
        const data = d.data()
        map[data.code] = data.name
      })
      setBoardingMap(map)
    }
    fetchBoardingPoints()
  }, [])

  useEffect(() => {
    if (!scannerInitialized && !scannedId) {
      scannerRef.current = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false)
      scannerRef.current.render(
        async (decodedText) => {
          if (!scannedId) {
            setScannedId(decodedText)
            const sSnap = await getDoc(doc(db, 'students', decodedText))
            if (sSnap.exists()) {
              setStudent(sSnap.data())
              setShowModal(true)
            }
            scannerRef.current.clear()
          }
        },
        () => {}
      )
      setScannerInitialized(true)
    }
  }, [scannerInitialized, scannedId])

  const handleAdmissionSearch = async () => {
    const query = admissionInput.trim().toUpperCase()
    const snap = await getDocs(collection(db, 'students'))
    for (let docSnap of snap.docs) {
      const data = docSnap.data()
      if (data.Admissionnumber && data.Admissionnumber.toUpperCase() === query) {
        setStudent(data)
        setShowModal(true)
        break
      }
    }
  }

  const handleScanNext = () => {
    setScannedId(null)
    setStudent(null)
    setShowModal(false)
    setAdmissionInput('')
    setScannerInitialized(false)
  }

  const isPaid = student?.fullypaid === 1 || (student?.partiallypaid && student.partiallypaid > 0)

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.centerBox}>
        {!showModal && <div id="reader" className={styles.qrBox}></div>}
        <div className={styles.searchBox}>
          <input
            type="text"
            value={admissionInput}
            onChange={(e) => setAdmissionInput(e.target.value)}
            placeholder="Enter Admission Number"
            className={styles.input}
          />
          <button onClick={handleAdmissionSearch} className={styles.button}>
            Search
          </button>
        </div>
      </div>
      {showModal && student && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            {student.image && (
              <div className={styles.imageContainer}>
                <img src={student.image} alt="student" className={styles.image} />
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Admission No:</span>
              <span className={styles.value}>{student.Admissionnumber}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Name:</span>
              <span className={styles.value}>{student.Name}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Department:</span>
              <span className={styles.value}>{student.Department}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Semester:</span>
              <span className={styles.value}>{student.Semester}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Boarding Point:</span>
              <span className={styles.value}>
                {boardingMap[student.busPoint] || student.busPoint}
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Fee Status:</span>
              <span className={isPaid ? styles.paid : styles.unpaid}>
                {isPaid ? 'Paid' : 'Not Paid'}
              </span>
            </div>
            <button className={styles.button} onClick={handleScanNext}>
              Scan Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner
