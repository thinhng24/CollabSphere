import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import ImportExcel from "./pages/ImportExcel";

export default function App() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <Sidebar />
            <div style={{ flex: 1 }}>
                <Header />
                <div style={{ padding: 20 }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/subjects" element={<Subjects />} />
                        <Route path="/import" element={<ImportExcel />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />     {/* ⭐ BẮT BUỘC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
