import { Route, Routes } from "react-router"
import { DashboardLayout } from "../components/layouts/DashboardLayout"
import { CreateCampaignPage } from "../pages/CreateCampaignPage"
import { DashboardPage } from "../pages/DashboardPage"
import { LoginPage } from "../pages/LoginPage"
import { ManageCampaignPage } from "../pages/ManageCampaignPage"
import { ManageChannelsPage } from "../pages/ManageChannelsPage"
import { MessageFormPage } from "../pages/MessageFormPage"
import { AuthLayout } from "../components/layouts/AuthLayout"
import { AuthGuard } from "./guards/AuthGuard"
import { GuestGuard } from "./guards/GuestGuard"

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
          <Route index element={<DashboardPage />} />
          <Route path="manage-channels" element={<ManageChannelsPage />} />
          <Route path="create-campaign" element={<CreateCampaignPage />} />
          <Route path="manage-campaign/:campaignId" element={<ManageCampaignPage />} />
          <Route path="message-form" element={<MessageFormPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
