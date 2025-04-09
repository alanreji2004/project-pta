import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './List.module.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const List = () => {
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const unsubscribeRoutes = onSnapshot(collection(db, 'busroutes'), (snapshot) => {
      const routeData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRoutes(routeData);
    });

    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(studentData);
    });

    return () => {
      unsubscribeRoutes();
      unsubscribeStudents();
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.routesSection}>
        {routes.map((route) => {
          const bpCodes = route.boardingPoints.map((bp) => bp.code);
          const filteredStudents = students.filter((student) =>
            bpCodes.includes(student.busPoint)
          );

          return (
            <div key={route.id} className={styles.routeTable}>
              <div className={styles.routeHeader}>
                <h3 className={styles.routeTitle}>
                  {route.routeName}
                  <div className={styles.routeCount}>
                    {filteredStudents.length} students
                  </div>
                </h3>
              </div>
              <div className={styles.tableHeader}>
                <div>Admission No</div>
                <div>Name</div>
                <div>Boarding Point</div>
                <div>Remaining Fee</div>
              </div>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div>{student.Admissionnumber}</div>
                    <div>{student.Name}</div>
                    <div>{student.busPoint}</div>
                    <div>₹{student.remainingFees || 0}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyRow}>No students for this route</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
