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

const router = createBrowserRouter([
  {
    path: "/",
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
    path: "/viewordownload",
    element: <List />,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);