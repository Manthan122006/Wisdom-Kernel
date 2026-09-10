/**
 * App.jsx
 * -------
 * Route table. Everything except the two organization routes lives inside
 * the application shell; /organization/vault is wrapped in ProtectedRoute
 * so it can only be reached with a token.
 */

import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Button from "./components/Button";

import Home from "./pages/Home";
import Experiences from "./pages/Experiences";
import ExperienceDetail from "./pages/ExperienceDetail";
import Record from "./pages/Record";
import Search from "./pages/Search";
import Mistakes from "./pages/Mistakes";
import Simulator from "./pages/Simulator";
import TransferScore from "./pages/TransferScore";
import Advice from "./pages/Advice";
import OrganizationWorkspace from "./pages/OrganizationWorkspace";
import OrganizationVault from "./pages/OrganizationVault";
import HeadDashboard from "./pages/HeadDashboard";
import SeniorDashboard from "./pages/SeniorDashboard";
import JuniorDashboard from "./pages/JuniorDashboard";

function NotFound() {
  return (
    <div className="animate-fade-in py-16 text-center">
      <p className="font-mono text-sm font-bold text-royal">404 — NOT FOUND</p>
      <h1 className="mt-3 font-sans text-3xl font-bold text-ink">This page does not exist</h1>
      <p className="mx-auto mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
        The link may be out of date. Everything in WisdomKernel is reachable from the top navigation.
      </p>
      <div className="mt-6 flex justify-center">
        <Button to="/">Go to home</Button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/record" element={<Record />} />
          <Route path="/search" element={<Search />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/score" element={<TransferScore />} />
          <Route path="/advice" element={<Advice />} />

          {/* Role-Based Organization Workspace Routes */}
          <Route path="/organization" element={<OrganizationWorkspace />} />
          <Route
            path="/organization/head"
            element={
              <ProtectedRoute allowedRoles={["HEAD_ADMIN"]}>
                <HeadDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/senior"
            element={
              <ProtectedRoute allowedRoles={["SENIOR_ENGINEER", "HEAD_ADMIN"]}>
                <SeniorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/junior"
            element={
              <ProtectedRoute allowedRoles={["JUNIOR_EMPLOYEE", "SENIOR_ENGINEER", "HEAD_ADMIN"]}>
                <JuniorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/vault"
            element={
              <ProtectedRoute>
                <OrganizationVault />
              </ProtectedRoute>
            }
          />


          {/* Legacy/mistyped organization paths land on the login page. */}
          <Route path="/organization/*" element={<Navigate to="/organization" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
