import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PatientList from "../components/PatientList";
import PatientForm from "../components/PatientForm";

function PatientsDataPage() {
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleClearForm = () => {
    setSelectedPatient(null);
    setIsModalOpen(false);
  };

  const handleUpdateSuccess = () => {
    console.log("Patient updated successfully!");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Patient Management</h1>
        <button
          onClick={handleAddPatient}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Filter by name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="border border-slate-300 p-2 rounded flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-slate-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Patient List - Full Screen */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <PatientList
          filterName={filterName}
          filterDate={filterDate}
          onEdit={handleEdit}
        />
      </div>

      {/* Modal for Patient Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedPatient ? "Edit Patient" : "Add Patient"}
              </h2>
              <button
                onClick={handleClearForm}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <PatientForm
              selectedPatient={selectedPatient}
              onClearForm={handleClearForm}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PatientsDataPage;