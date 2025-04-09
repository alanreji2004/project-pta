import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './List.module.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const List = () => {
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredRoutes = routes.filter((route) =>
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRouteStudents = (route) => {
    const bpCodes = route.boardingPoints.map((bp) => bp.code);
    return students.filter((student) => bpCodes.includes(student.busPoint));
  };

  const generateCSVContent = (withFees) => {
    let content = '';
    filteredRoutes.forEach((route) => {
      const routeStudents = getRouteStudents(route);
      if (routeStudents.length === 0) return;

      const headers = withFees
        ? ['Sl No', 'Admission No', 'Name', 'Boarding Point', 'Semester', 'Remaining Fee']
        : ['Sl No', 'Admission No', 'Name', 'Boarding Point', 'Semester'];

      const rows = routeStudents.map((student, i) =>
        withFees
          ? [
              i + 1,
              student.Admissionnumber,
              student.Name,
              student.busPoint,
              `S${student.Semester || '-'}`,
              student.remainingFees || 0
            ]
          : [
              i + 1,
              student.Admissionnumber,
              student.Name,
              student.busPoint,
              `S${student.Semester || '-'}`
            ]
      );

      content += `\n${route.routeName}\n`;
      content += headers.join(',') + '\n';
      content += rows.map((r) => r.join(',')).join('\n');
      content += `\nTotal: ${routeStudents.length} students\n\n`;
    });

    return content;
  };

  const downloadCSV = (withFees) => {
    const content = generateCSVContent(withFees);
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = withFees ? 'students_with_fees.csv' : 'StudentsList.csv';
    link.click();
  };

  const downloadPDF = (withFees) => {
    const doc = new jsPDF();
    let currentY = 20;

    filteredRoutes.forEach((route, idx) => {
      const routeStudents = getRouteStudents(route);
      if (routeStudents.length === 0) return;

      if (idx !== 0) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${route.routeName}`, 14, currentY);
      currentY += 6;

      const headers = withFees
        ? ['Sl No', 'Admission No', 'Name', 'Boarding Point', 'Semester', 'Remaining Fee']
        : ['Sl No', 'Admission No', 'Name', 'Boarding Point', 'Semester'];

      const rows = routeStudents.map((student, i) =>
        withFees
          ? [
              i + 1,
              student.Admissionnumber,
              student.Name,
              student.busPoint,
              `S${student.Semester || '-'}`,
              student.remainingFees || 0
            ]
          : [
              i + 1,
              student.Admissionnumber,
              student.Name,
              student.busPoint,
              `S${student.Semester || '-'}`
            ]
      );

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        styles: { fontSize: 10 },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = data.cursor.y + 10;
        },
      });

      doc.setFontSize(11);
      doc.text(`Total: ${routeStudents.length} students`, 14, currentY);
      currentY += 10;
    });

    doc.save(withFees ? 'students_with_fees.pdf' : 'StudentsList.pdf');
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search route..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.downloadButtons}>
        <button className={styles.downloadButton} onClick={() => downloadCSV(true)}>Download CSV (With Fees)</button>
        <button className={styles.downloadButton} onClick={() => downloadPDF(true)}>Download PDF (With Fees)</button>
        <button className={styles.downloadButton} onClick={() => downloadCSV(false)}>Download CSV (Without Fees)</button>
        <button className={styles.downloadButton} onClick={() => downloadPDF(false)}>Download PDF (Without Fees)</button>
      </div>
      <div className={styles.routesSection}>
        {filteredRoutes.map((route) => {
          const filteredStudents = getRouteStudents(route);
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
                <div>Semester</div>
                <div>Remaining Fee</div>
              </div>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div>{student.Admissionnumber}</div>
                    <div>{student.Name}</div>
                    <div>{student.busPoint}</div>
                    <div>S{student.Semester || '-'}</div>
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
