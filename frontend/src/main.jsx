import * as React from "react";
import { createRoot } from "react-dom/client";
import Home from "./pages/Home/Home";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
} from "react-router-dom";
import Login from "./pages/Login/Login";
import Settings from "./pages/Settings/Settings";
import List from "./pages/List/List";
import BoardingPoints from "./pages/BoardingPoints/BoardingPoints";
import BusRoutes from "./pages/BusRoutes/BusRoutes";
import AddStaff from "./pages/AddStaff/AddStaff";

const router = createBrowserRouter([
  {
    path: "/addstudent",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/",
    element: <List />,
  },
  {
    path: "/boardingpoints",
    element: <BoardingPoints />,
  },
  {
    path: "/routes",
    element: <BusRoutes />,
  },
  {
    path: "/addstaff",
    element: <AddStaff />,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);