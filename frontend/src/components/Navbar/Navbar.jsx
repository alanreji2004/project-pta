import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import styles from "./Navbar.module.css"
import { Menu } from "lucide-react"
import logo from "./logo.svg"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn")
    navigate("/login")
  }

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
          <li><Link to="/scanner" className={styles.menuItem} onClick={toggleMenu}>QR Scanner</Link></li>
          <li><Link to="/addstudent" className={styles.menuItem} onClick={toggleMenu}>Add Student</Link></li>
          <li><Link to="/addstaff" className={styles.menuItem} onClick={toggleMenu}>Add Staff</Link></li>
          <li><Link to="/" className={styles.menuItem} onClick={toggleMenu}>View/Download list</Link></li>
          <li><Link to="/settings" className={styles.menuItem} onClick={toggleMenu}>Settings</Link></li>
          <li><Link onClick={handleLogout} className={styles.menuItem}>Logout</Link></li>
        </ul>
      </div>
    </nav>
  )
}
