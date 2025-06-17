import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import PatientsDataPage from "./pages/PatientsDataPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<PatientsDataPage />} />
        <Route path="/inventory" element={<Dashboard activeTab="inventory" />} />
        <Route path="/expenses" element={<Dashboard activeTab="expenses" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;