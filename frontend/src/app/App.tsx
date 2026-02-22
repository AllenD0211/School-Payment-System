import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/app/components/login-page";
import CreateAccountPage from "@/app/components/create-account-page";
import ForgotPassword from "@/app/components/forgot-password"; 
import ParentDashboard from "@/app/components/parent-dashboard";
import StudentDashboard from "@/app/components/student-dashboard";
import AdminDashboard from "@/app/components/AdminDashboard";
import { StudentCredentialsPage } from "@/app/components/student-credentials-page";
import { Toaster } from "@/app/components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 

        {/* Student */}
        <Route path="/student" element={<StudentDashboard />} />

        {/* Parent */}
        <Route path="/parent" element={<ParentDashboard />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/credentials" element={<StudentCredentialsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
