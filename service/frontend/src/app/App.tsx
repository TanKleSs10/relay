import { Route, Routes } from "react-router"
import { DashboardLayout } from "../components/layouts/DashboardLayout"
import { CreateCampaignPage } from "../pages/CreateCampaignPage"
import { DashboardPage } from "../pages/DashboardPage"
import { ManageCampaignPage } from "../pages/ManageCampaignPage"
import { ManageChannelsPage } from "../pages/ManageChannelsPage"
import { MessageFormPage } from "../pages/MessageFormPage"

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="manage-channels" element={<ManageChannelsPage />} />
        <Route path="create-campaign" element={<CreateCampaignPage />} />
        <Route path="manage-campaign/:campaignId" element={<ManageCampaignPage />} />
        <Route path="message-form" element={<MessageFormPage />} />
      </Route>
    </Routes>
  )
}

export default App
