import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './BusRoutes.module.css';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

const BusRoutes = () => {
  const [routeName, setRouteName] = useState('');
  const [routes, setRoutes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [boardingCode, setBoardingCode] = useState('');
  const [boardingName, setBoardingName] = useState('');
  const [searchError, setSearchError] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);

  const fetchRoutes = async () => {
    const snapshot = await getDocs(collection(db, 'busroutes'));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setRoutes(data);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAddRoute = async () => {
    if (!routeName.trim()) return;
    const name = routeName.trim().toUpperCase();
    await addDoc(collection(db, 'busroutes'), {
      routeName: name,
      boardingPoints: [],
    });
    setRouteName('');
    fetchRoutes();
  };

  const openModal = (routeId) => {
    setSelectedRouteId(routeId);
    setBoardingCode('');
    setBoardingName('');
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
      { code: boardingCode.toUpperCase(), name: boardingName.toUpperCase() },
    ];
    await updateDoc(routeRef, { boardingPoints: updatedPoints });
    setModalVisible(false);
    fetchRoutes();
  };

  const handleRemovePoint = async (routeId, codeToRemove) => {
    const routeRef = doc(db, 'busroutes', routeId);
    const route = routes.find((r) => r.id === routeId);
    const updatedPoints = route.boardingPoints.filter((point) => point.code !== codeToRemove);
    await updateDoc(routeRef, { boardingPoints: updatedPoints });
    fetchRoutes();
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
    fetchRoutes();
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
            onChange={(e) => setRouteName(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRoute()}
          />
          <button className={styles.submitButton} onClick={handleAddRoute}>
            Add Route
          </button>
        </div>
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
              <div>Actions</div>
            </div>
            {route.boardingPoints &&
              route.boardingPoints.map((point, index) => (
                <div key={index} className={styles.tableRow}>
                  <div>{point.code}</div>
                  <div>{point.name}</div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemovePoint(route.id, point.code)}
                  >
                    <FaMinus size={12} />
                  </button>
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
            <input
              className={styles.modalInput}
              placeholder="Boarding Name"
              value={boardingName}
              readOnly
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
