import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import { Menu } from "lucide-react";
import logo from "./logo.svg";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <div className={styles.titleContainer}>
          <span className={styles.title}>COLLEGE OF ENGINEERING PERUMON PTA</span>
          <span className={styles.subtitle}>Under the Cooperative Academy of Professional Education (CAPE)</span>
          <span className={styles.established}>Established by <span className={styles.govt}>Govt. of Kerala</span></span>
        </div>
      </div>
      <div className={styles.menuContainer}>
        <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
        <ul className={`${styles.menu} ${isOpen ? styles.showMenu : ""}`} style={{ marginTop: isOpen ? '10px' : '0' }}>
          <li><Link to="/home" className={styles.menuItem} onClick={toggleMenu}>Home</Link></li>
          <li><Link to="/about" className={styles.menuItem} onClick={toggleMenu}>View/Download list</Link></li>
          <li><Link to="/contact" className={styles.menuItem} onClick={toggleMenu}>Add/Change Routes</Link></li>
          <li><Link to="/contact" className={styles.menuItem} onClick={toggleMenu}>Logout</Link></li>
        </ul>
      </div>
    </nav>
  );
}