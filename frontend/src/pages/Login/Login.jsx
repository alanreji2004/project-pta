import React, { useState } from 'react';
import styles from "./Login.module.css";
import { useNavigate } from 'react-router-dom';
import logo from "./logo.svg";
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [userData, setUserData] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const envEmail = import.meta.env.VITE_USERNAME;
    const envPassword = import.meta.env.VITE_PASSWORD;

    if (userData.email === envEmail && userData.password === envPassword) {
      setShowSuccessBox(true);
      localStorage.setItem('user', JSON.stringify({ email: userData.email }));
      sessionStorage.setItem('isLoggedIn', 'true')     
      setTimeout(() => navigate('/'), 1000);
    } else {
      setErrorMessage('Invalid username or password');
    }

    setLoading(false);
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <div className={styles.titleContainer}>
          <span className={styles.title}>COLLEGE OF ENGINEERING PERUMON PTA</span>
          <span className={styles.subtitle}>Under the Cooperative Academy of Professional Education (CAPE)</span>
          <span className={styles.established}>
            Established by <span className={styles.govt}>Govt. of Kerala</span>
          </span>
        </div>
      </div>

      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <h2>Login!</h2>
        <input
          type="text"
          required
          placeholder="Enter Username"
          value={userData.email}
          onChange={(e) => setUserData({ ...userData, email: e.target.value })}
          className={styles.userEmailInput}
        />

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter Your Password"
            value={userData.password}
            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
            className={styles.userPasswordInput}
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={toggleShowPassword}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        <button className={styles.submitButton} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {showSuccessBox && (
        <div className={styles.popup}>
          Login Successful!
          <div className={styles.timeline}></div>
        </div>
      )}
    </div>
  );
};

export default Login;
