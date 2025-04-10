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
  const [staff, setStaff] = useState([]);
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

    const unsubscribeStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const staffData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStaff(staffData);
    });

    return () => {
      unsubscribeRoutes();
      unsubscribeStudents();
      unsubscribeStaff();
    };
  }, []);

  const filteredRoutes = routes.filter((route) =>
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRouteStudents = (route) => {
    const bpCodes = route.boardingPoints.map((bp) => bp.code);
    return students.filter((student) => bpCodes.includes(student.busPoint));
  };

  const getRouteStaff = (route) => {
    const bpCodes = route.boardingPoints.map((bp) => bp.code);
    return staff.filter((stf) => bpCodes.includes(stf.busPoint));
  };

  const generateCSVContent = (withFees) => {
    let content = '';
    filteredRoutes.forEach((route) => {
      const routeStudents = getRouteStudents(route);
      const routeStaff = getRouteStaff(route);
      if (routeStudents.length + routeStaff.length === 0) return;

      const headers = withFees
        ? ['Sl No', 'ID', 'Name', 'Boarding Point', 'Semester/Type', 'Remaining Fee']
        : ['Sl No', 'ID', 'Name', 'Boarding Point', 'Semester/Type'];

      const studentRows = routeStudents.map((student, i) =>
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

      const staffRows = routeStaff.map((staffMember, i) =>
        withFees
          ? [
              studentRows.length + i + 1,
              staffMember.id,
              staffMember.name,
              staffMember.busPoint,
              'Staff',
              staffMember.remainingFees || 0
            ]
          : [
              studentRows.length + i + 1,
              staffMember.id,
              staffMember.name,
              staffMember.busPoint,
              'Staff'
            ]
      );

      const rows = [...studentRows, ...staffRows];

      content += `\n${route.routeName}\n`;
      content += headers.join(',') + '\n';
      content += rows.map((r) => r.join(',')).join('\n');
      content += `\nTotal: ${rows.length} entries\n\n`;
    });

    return content;
  };

  const downloadCSV = (withFees) => {
    const content = generateCSVContent(withFees);
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = withFees ? 'students_staff_with_fees.csv' : 'StudentsStaffList.csv';
    link.click();
  };

  const downloadPDF = (withFees) => {
    const doc = new jsPDF();
    let currentY = 20;

    filteredRoutes.forEach((route, idx) => {
      const routeStudents = getRouteStudents(route);
      const routeStaff = getRouteStaff(route);
      if (routeStudents.length + routeStaff.length === 0) return;

      if (idx !== 0) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${route.routeName}`, 14, currentY);
      currentY += 6;

      const headers = withFees
        ? ['Sl No', 'ID', 'Name', 'Boarding Point', 'Semester/Type', 'Remaining Fee']
        : ['Sl No', 'ID', 'Name', 'Boarding Point', 'Semester/Type'];

      const studentRows = routeStudents.map((student, i) =>
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

      const staffRows = routeStaff.map((staffMember, i) =>
        withFees
          ? [
              studentRows.length + i + 1,
              staffMember.id,
              staffMember.name,
              staffMember.busPoint,
              'Staff',
              staffMember.remainingFees || 0
            ]
          : [
              studentRows.length + i + 1,
              staffMember.id,
              staffMember.name,
              staffMember.busPoint,
              'Staff'
            ]
      );

      const rows = [...studentRows, ...staffRows];

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
      doc.text(`Total: ${rows.length} entries`, 14, currentY);
      currentY += 10;
    });

    doc.save(withFees ? 'students_staff_with_fees.pdf' : 'StudentsStaffList.pdf');
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
          const routeStudents = getRouteStudents(route);
          const routeStaff = getRouteStaff(route);
          const all = [
            ...routeStudents.map((s) => ({ ...s, type: 'student' })),
            ...routeStaff.map((s) => ({ ...s, type: 'staff' }))
          ];

          return (
            <div key={route.id} className={styles.routeTable}>
              <div className={styles.routeHeader}>
                <h3 className={styles.routeTitle}>
                  {route.routeName}
                  <div className={styles.routeCount}>
                    {routeStudents.length} Students | {routeStaff.length} Staff ({all.length} total)
                  </div>
                </h3>
              </div>
              <div className={styles.tableHeader}>
                <div>ADMN NO/STAFF ID</div>
                <div>Name</div>
                <div>Boarding Point</div>
                <div>Semester</div>
                <div>Remaining Fee</div>
              </div>
              {all.length > 0 ? (
                all.map((entry, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div>{entry.type === 'student' ? entry.Admissionnumber : entry.id}</div>
                    <div>{entry.Name || entry.name}</div>
                    <div>{entry.busPoint}</div>
                    <div>{entry.type === 'student' ? `S${entry.Semester || '-'}` : 'Staff'}</div>
                    <div>₹{entry.remainingFees || 0}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyRow}>No students or staff for this route</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
