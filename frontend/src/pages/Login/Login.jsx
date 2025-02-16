import React, { useState } from 'react';
import styles from "./Login.module.css";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from "./logo.svg";;

const Login = () => {
  const [userData, setUserData] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginUser = async () => {
    

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:8082/login', userData);

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/profile');
      } else {
        setErrorMessage(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred while logging in. Please try again.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className={styles.mainContainer}>
        <div>
                  <div className={styles.logoContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <div className={styles.titleContainer}>
          <span className={styles.title}>COLLEGE OF ENGINEERING PERUMON PTA</span>
          <span className={styles.subtitle}>Under the Cooperative Academy of Professional Education (CAPE)</span>
          <span className={styles.established}>Established by <span className={styles.govt}>Govt. of Kerala</span></span>
        </div>
      </div>
        </div>
      <div className={styles.formContainer}>
        <h2>Login!</h2>
        <input
          type="email"
          required
          placeholder="Enter Your Email Address"
          onChange={(e) => setUserData({ ...userData, email: e.target.value })}
          className={styles.userEmailInput}
        />
        <input
          type="password"
          required
          placeholder="Enter Your Password"
          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          className={styles.userPasswordInput}
        />
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <button className={styles.submitButton} onClick={loginUser} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;