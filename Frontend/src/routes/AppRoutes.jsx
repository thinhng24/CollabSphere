// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useRole from "../hooks/useRole";

// Auth pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Layout
import DashboardLayout from "../layouts/DashboardLayout";

// Pages
import Dashboard from "../pages/dashboard/Dashboard";

// Teams
import TeamList from "../pages/teams/TeamList";
import TeamDetail from "../pages/teams/TeamDetail";
import TeamCreate from "../pages/teams/TeamCreate";
import TeamUpdate from "../pages/teams/TeamUpdate";
import AddMember from "../pages/teams/AddMember";
import DeleteTeam from "../pages/teams/DeleteTeam";

// Tasks
import TaskBoard from "../pages/tasks/TaskBoard";
import TaskCreate from "../pages/tasks/TaskCreate";
import TaskDetail from "../pages/tasks/TaskDetail";
import TaskUpdate from "../pages/tasks/TaskUpdate";

// Checkpoints
import CheckpointList from "../pages/checkpoints/CheckpointList";
import CheckpointDetail from "../pages/checkpoints/CheckpointDetail";
import CheckpointCreate from "../pages/checkpoints/CheckpointCreate";
import CheckpointGrade from "../pages/checkpoints/CheckpointGrade";
import SprintBoard from "../pages/checkpoints/SprintBoard"; // Đã sửa đường dẫn đúng
import Contribution from "../pages/teams/Contribution";

// 404 Page
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h2 className="text-4xl font-bold text-gray-800">404 - Trang không tồn tại</h2>
  </div>
);

// ==================== PRIVATE ROUTE ====================
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Đang tải...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ==================== ROLE ROUTE ====================
const RoleRoute = ({ allowRoles, children }) => {
  const { role, loading } = useRole(); // useRole có thể có loading riêng

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Đang kiểm tra quyền...</p>
      </div>
    );
  }

  if (!allowRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ==================== APP ROUTES ====================
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= PRIVATE ROUTES (có Layout) ================= */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

 {/* ================= TEAMS ================= */}
<Route path="teams" element={<TeamList />} />

<Route
  path="teams/create"
  element={
    <RoleRoute allowRoles={["Lecturer"]}>
      <TeamCreate />
    </RoleRoute>
  }
/>

<Route path="teams/:id" element={<TeamDetail />} />

<Route
  path="teams/:id/update"
  element={
    <RoleRoute allowRoles={["Lecturer"]}>
      <TeamUpdate />
    </RoleRoute>
  }
/>

<Route
  path="teams/:id/contribution"
  element={
    <RoleRoute allowRoles={["Lecturer", "Student"]}>
      <Contribution />
    </RoleRoute>
  }
/>

<Route
  path="teams/:id/add-member"
  element={
    <RoleRoute allowRoles={["Lecturer"]}>
      <AddMember />
    </RoleRoute>
  }
/>

<Route
  path="teams/:id/delete"
  element={
    <RoleRoute allowRoles={["Lecturer"]}>
      <DeleteTeam />
    </RoleRoute>
  }
/>

          {/* ================= TASKS ================= */}
          <Route path="tasks" element={<TaskBoard />} />
          <Route
            path="tasks/create"
            element={
              <RoleRoute allowRoles={["Lecturer"]}>
                <TaskCreate />
              </RoleRoute>
            }
          />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route
            path="tasks/:id/update"
            element={
              <RoleRoute allowRoles={["Lecturer"]}>
                <TaskUpdate />
              </RoleRoute>
            }
          />

          {/* ================= CHECKPOINTS ================= */}
          <Route path="checkpoints" element={<CheckpointList />} />
          <Route
            path="checkpoints/create"
            element={
              <RoleRoute allowRoles={["Lecturer"]}>
                <CheckpointCreate />
              </RoleRoute>
            }
          />
          <Route path="checkpoints/:id" element={<CheckpointDetail />} />

          {/* Trang chấm điểm - Lecturer mới được vào */}
          <Route
            path="checkpoints/:id/grade"
            element={
              <RoleRoute allowRoles={["Lecturer"]}>
                <CheckpointGrade />
              </RoleRoute>
            }
          />

          {/* Sprint Board - có thể để cả Student và Lecturer xem, hoặc chỉ Lecturer */}
          <Route path="checkpoints/sprint-board" element={<SprintBoard />} />
          {/* Nếu chỉ Lecturer mới được xem SprintBoard, thì bọc RoleRoute như sau: */}
          {/* 
          <Route
            path="checkpoints/sprint-board"
            element={
              <RoleRoute allowRoles={["Lecturer"]}>
                <SprintBoard />
              </RoleRoute>
            }
          /> 
          */}
        </Route>

        {/* ================= 404 ================= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;