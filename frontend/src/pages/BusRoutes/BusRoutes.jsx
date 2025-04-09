import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './BusRoutes.module.css';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { FaPlus, FaMinus, FaTrash, FaPen, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BusRoutes = () => {
  const [routeName, setRouteName] = useState('');
  const [routes, setRoutes] = useState([]);
  const [routeError, setRouteError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [boardingCode, setBoardingCode] = useState('');
  const [boardingName, setBoardingName] = useState('');
  const [boardingTime, setBoardingTime] = useState('');
  const [searchError, setSearchError] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editTime, setEditTime] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'busroutes'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRoutes(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddRoute = async () => {
    const name = routeName.trim().toUpperCase();
    if (!name) return;
    const isDuplicate = routes.some((route) => route.routeName === name);
    if (isDuplicate) {
      setRouteError('Route name already in use.');
      return;
    }
    await addDoc(collection(db, 'busroutes'), {
      routeName: name,
      boardingPoints: [],
    });
    setRouteName('');
    setRouteError('');
  };

  const openModal = (routeId) => {
    setSelectedRouteId(routeId);
    setBoardingCode('');
    setBoardingName('');
    setBoardingTime('');
    setSearchError('');
    setModalVisible(true);
  };

  const searchBoardingPoint = async () => {
    const code = boardingCode.trim().toUpperCase();
    if (!code) return;
    const q = query(collection(db, 'boardingpoints'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const isUsedInAnotherRoute = routes.some(
        (route) =>
          route.id !== selectedRouteId &&
          route.boardingPoints.some((point) => point.code === data.code.toUpperCase())
      );
      if (isUsedInAnotherRoute) {
        setBoardingName('');
        setSearchError(`Boarding point already used in another route`);
        return;
      }
      setBoardingCode(data.code.toUpperCase());
      setBoardingName(data.name.toUpperCase());
      setSearchError('');
    } else {
      setBoardingName('');
      setSearchError('Boarding point not found');
    }
  };

  const handleSavePoint = async () => {
    if (!boardingCode || !boardingName) return;
    const routeRef = doc(db, 'busroutes', selectedRouteId);
    const route = routes.find((r) => r.id === selectedRouteId);
    const updatedPoints = [
      ...route.boardingPoints,
      {
        code: boardingCode.toUpperCase(),
        name: boardingName.toUpperCase(),
        time: boardingTime || '',
      },
    ];
    await updateDoc(routeRef, { boardingPoints: updatedPoints });
    setModalVisible(false);
  };

  const handleRemovePoint = async (routeId, codeToRemove) => {
    const routeRef = doc(db, 'busroutes', routeId);
    const route = routes.find((r) => r.id === routeId);
    const updatedPoints = route.boardingPoints.filter((point) => point.code !== codeToRemove);
    await updateDoc(routeRef, { boardingPoints: updatedPoints });
  };

  const openEditModal = (routeId, code, currentTime) => {
    setSelectedRouteId(routeId);
    setEditCode(code);
    setEditTime(currentTime || '');
    setEditModalVisible(true);
  };

  const saveEditedTime = async () => {
    const routeRef = doc(db, 'busroutes', selectedRouteId);
    const route = routes.find((r) => r.id === selectedRouteId);
    const updatedPoints = route.boardingPoints.map((point) =>
      point.code === editCode ? { ...point, time: editTime } : point
    );
    await updateDoc(routeRef, { boardingPoints: updatedPoints });
    setEditModalVisible(false);
  };

  const openConfirmDelete = (routeId) => {
    setRouteToDelete(routeId);
    setConfirmModalVisible(true);
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;
    await deleteDoc(doc(db, 'busroutes', routeToDelete));
    setConfirmModalVisible(false);
    setRouteToDelete(null);
  };

  const downloadCSV = () => {
    const rows = [];
    routes.forEach((route) => {
      rows.push([route.routeName]);
      rows.push(['Code', 'Name', 'Time']);
      route.boardingPoints.forEach((point) => {
        rows.push([point.code, point.name, point.time || '--']);
      });
      rows.push([]);
    });
    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'BusRoutes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const docPDF = new jsPDF();
    routes.forEach((route, idx) => {
      if (idx !== 0) docPDF.addPage();
      docPDF.setFontSize(14);
      docPDF.text(route.routeName, 14, 20);
      const tableData = route.boardingPoints.map((point) => [
        point.code,
        point.name,
        point.time || '--',
      ]);
      autoTable(docPDF, {
        head: [['Code', 'Name', 'Time']],
        body: tableData,
        startY: 30,
      });
    });
    docPDF.save('BusRoutes.pdf');
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.addRouteSection}>
        <h2 className={styles.sectionTitle}>Add Bus Route</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter Route Name"
            className={styles.input}
            value={routeName}
            onChange={(e) => {
              setRouteName(e.target.value.toUpperCase());
              setRouteError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRoute()}
          />
          <button className={styles.submitButton} onClick={handleAddRoute}>
            Add Route
          </button>
          <button className={styles.downloadButton} onClick={downloadCSV}>
            <FaDownload /> CSV
          </button>
          <button className={styles.downloadButton} onClick={downloadPDF}>
            <FaDownload /> PDF
          </button>
        </div>
        {routeError && <p className={styles.errorText}>{routeError}</p>}
      </div>

      <div className={styles.routesSection}>
        {routes.map((route) => (
          <div key={route.id} className={styles.routeTable}>
            <div className={styles.routeHeader}>
              <h3 className={styles.routeTitle}>{route.routeName}</h3>
              <div className={styles.headerButtons}>
                <button className={styles.addPointButton} onClick={() => openModal(route.id)}>
                  <FaPlus size={14} />
                </button>
                <button className={styles.deleteRouteButton} onClick={() => openConfirmDelete(route.id)}>
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
            <div className={styles.tableHeader}>
              <div>Code</div>
              <div>Name</div>
              <div>Time</div>
              <div>Actions</div>
            </div>
            {route.boardingPoints &&
              route.boardingPoints.map((point, index) => (
                <div key={index} className={styles.tableRow}>
                  <div>{point.code}</div>
                  <div>{point.name}</div>
                  <div>{point.time || '--'}</div>
                  <div className={styles.actionsCell}>
                    <button
                      className={styles.editButton}
                      onClick={() => openEditModal(route.id, point.code, point.time)}
                    >
                      <FaPen size={12} />
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemovePoint(route.id, point.code)}
                    >
                      <FaMinus size={12} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {modalVisible && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Add Boarding Point</h3>
            <input
              className={styles.modalInput}
              placeholder="Enter Boarding Code"
              value={boardingCode}
              onChange={(e) => setBoardingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && searchBoardingPoint()}
            />
            <button className={styles.searchButton} onClick={searchBoardingPoint}>
              Search
            </button>
            {searchError && <p className={styles.errorText}>{searchError}</p>}
            <input className={styles.modalInput} placeholder="Boarding Name" value={boardingName} readOnly />
            <input
              type="time"
              className={styles.modalInput}
              placeholder="Enter Time"
              value={boardingTime}
              onChange={(e) => setBoardingTime(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button
                className={styles.modalSaveButton}
                disabled={!boardingCode || !boardingName}
                onClick={handleSavePoint}
              >
                Save
              </button>
              <button className={styles.modalCancelButton} onClick={() => setModalVisible(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalVisible && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Edit Time</h3>
            <input
              type="time"
              className={styles.modalInput}
              placeholder="Enter New Time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button className={styles.modalSaveButton} onClick={saveEditedTime}>
                Save
              </button>
              <button className={styles.modalCancelButton} onClick={() => setEditModalVisible(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalVisible && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Route?</h3>
            <p className={styles.confirmText}>
              Are you sure you want to delete this route? This operation cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.modalDeleteButton} onClick={confirmDeleteRoute}>
                Delete
              </button>
              <button
                className={styles.modalCancelButton}
                onClick={() => {
                  setConfirmModalVisible(false);
                  setRouteToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusRoutes;
