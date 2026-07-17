import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Departments from './pages/Departments'
import Courses from './pages/Courses'
import AttendancePage from './pages/AttendancePage'
import Grades from './pages/Grades'
import Notifications from './pages/Notifications'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import AdminUsers from './pages/AdminUsers'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/departments" element={
              <ProtectedRoute allowedRoles={['admin']}><Departments /></ProtectedRoute>
            } />
            <Route path="/courses" element={<Courses />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['student']}><Profile /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
