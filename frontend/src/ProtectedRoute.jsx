import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('isLoggedIn') === 'true'
  const location = useLocation()

  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
