import { Route, Routes } from "react-router"
import { DashboardLayout } from "../components/layouts/DashboardLayout"
import { CreateCampaignPage } from "../pages/CreateCampaignPage"
import { DashboardPage } from "../pages/DashboardPage"
import { LoginPage } from "../pages/LoginPage"
import { ManageCampaignPage } from "../pages/ManageCampaignPage"
import { ManageChannelsPage } from "../pages/ManageChannelsPage"
import { ManageUsersPage } from "../pages/ManageUsersPage"
import { MessageFormPage } from "../pages/MessageFormPage"
import { AuthLayout } from "../components/layouts/AuthLayout"
import { AuthGuard } from "./guards/AuthGuard"
import { GuestGuard } from "./guards/GuestGuard"
import { RoleGuard } from "./guards/RoleGuard"
import { useMe } from "../features"
import { Navigate } from "react-router"

function IndexByRole() {
  const { data: user } = useMe();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");

  if (!isAdmin) {
    return <Navigate to="/manage-channels" replace />;
  }
  return <DashboardPage />;
}

function App() {
  return (
    <Routes>
      <Route element={<GuestGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Route>
      <Route element={<AuthGuard />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<IndexByRole />} />
          <Route path="manage-channels" element={<ManageChannelsPage />} />
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="manage-users" element={<ManageUsersPage />} />
            <Route path="create-campaign" element={<CreateCampaignPage />} />
            <Route path="manage-campaign/:campaignId" element={<ManageCampaignPage />} />
            <Route path="message-form" element={<MessageFormPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
