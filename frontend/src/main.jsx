import * as React from "react"
import { createRoot } from "react-dom/client"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import Home from "./pages/Home/Home"
import Login from "./pages/Login/Login"
import Settings from "./pages/Settings/Settings"
import List from "./pages/List/List"
import BoardingPoints from "./pages/BoardingPoints/BoardingPoints"
import BusRoutes from "./pages/BusRoutes/BusRoutes"
import AddStaff from "./pages/AddStaff/AddStaff"
import ProtectedRoute from "./ProtectedRoute"
import QRScanner from "./pages/QRScanner/QRScanner"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/addstudent",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <List />
      </ProtectedRoute>
    ),
  },
  {
    path: "/boardingpoints",
    element: (
      <ProtectedRoute>
        <BoardingPoints />
      </ProtectedRoute>
    ),
  },
  {
    path: "/routes",
    element: (
      <ProtectedRoute>
        <BusRoutes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/addstaff",
    element: (
      <ProtectedRoute>
        <AddStaff />
      </ProtectedRoute>
    ),
  },
  {
    path: "/scanner",
    element: (
      <ProtectedRoute>
        <QRScanner />
      </ProtectedRoute>
    ),
  },
])

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
)
