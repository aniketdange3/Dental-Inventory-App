import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaUsers,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaHome,
  FaTooth,
  FaCalendarAlt,
  FaUserMd,
} from 'react-icons/fa';
import { GiToothbrush } from 'react-icons/gi';

import PatientList from './PatientList';
import InventoryList from './InventoryList';
import ExpenseList from './ExpenseList';
import InventoryForm from './InventoryForm';
import ExpenseForm from './ExpenseForm';
import PatientForm from './PatientForm';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [editingItem, setEditingItem] = useState(null);

  // Sample dental diseases data
  const dentalDiseases = [
    'Caries',
    'Gingivitis',
    'Periodontitis',
    'Tooth Decay',
    'Bruxism',
    'TMJ Disorder',
    'Oral Cancer',
    'Halitosis',
    'Hypodontia',
    'Enamel Erosion',
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsRes, inventoryRes, expensesRes] = await Promise.all([
          axios.get('/api/patients'),
          axios.get('/api/inventory'),
          axios.get('/api/expenses'),
        ]);

        // Process patients data with dental information
        const processedPatients = patientsRes.data
          .filter((patient) => patient && patient._id && patient.name)
          .map((patient) => ({
            ...patient,
            dentalDisease:
              dentalDiseases[Math.floor(Math.random() * dentalDiseases.length)],
            lastVisit: patient.appointments?.length
              ? new Date(
                  patient.appointments[patient.appointments.length - 1].date
                ).toLocaleDateString()
              : 'Never',
          }));

        setPatients(processedPatients);
        setInventory(inventoryRes.data.filter((item) => item && item._id));
        setExpenses(
          expensesRes.data.filter((expense) => expense && expense._id)
        );

        // Generate appointments from patient data
        const allAppointments = processedPatients.flatMap((patient) =>
          (patient.appointments || []).map((appt) => ({
            ...appt,
            patientName: patient.name,
            patientId: patient._id,
            purpose: appt.purpose || 'Dental Checkup',
            disease: patient.dentalDisease,
          }))
        );
        setAppointments(allAppointments);

        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(
          'Failed to fetch data. Please check your connection or add data manually.'
        );
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;
    try {
      await axios.delete(`/api/${type}/${id}`);

      switch (type) {
        case 'patients':
          setPatients(patients.filter((patient) => patient._id !== id));
          break;
        case 'inventory':
          setInventory(inventory.filter((item) => item._id !== id));
          break;
        case 'expenses':
          setExpenses(expenses.filter((expense) => expense._id !== id));
          break;
        default:
          break;
      }

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`
      );
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      toast.error(`Failed to delete ${type}.`);
    }
  };

  // Dashboard Metrics
  const totalPatients = patients.length;
  const lowStockItems = inventory.filter(
    (item) => item.quantity <= (item.lowStockThreshold || 5)
  ).length;
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const todayAppointments = appointments.filter(
    (appt) => new Date(appt.date).toDateString() === new Date().toDateString()
  ).length;
  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.date) > new Date()
  ).length;

  // Common dental diseases count
  const diseaseCounts = dentalDiseases.reduce((acc, disease) => {
    acc[disease] = patients.filter((p) => p.dentalDisease === disease).length;
    return acc;
  }, {});

  // Chart data
  const barChartData = {
    labels: ['Patients', 'Low Stock', 'Expenses', 'Today Appts'],
    datasets: [
      {
        label: 'Clinic Overview',
        data: [totalPatients, lowStockItems, totalExpenses, todayAppointments],
        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
        borderColor: ['#2563eb', '#d97706', '#dc2626', '#059669'],
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: dentalDiseases,
    datasets: [
      {
        data: dentalDiseases.map((d) => diseaseCounts[d]),
        backgroundColor: [
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#10b981',
          '#8b5cf6',
          '#ec4899',
          '#14b8a6',
          '#f97316',
          '#64748b',
          '#84cc16',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - Mobile first hidden on small screens */}
      <div className="w-full md:w-64 bg-white shadow-md p-4 fixed md:static bottom-0 z-10 md:z-auto md:block">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-8">
          Dental Clinic
        </h2>
        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <button
            className={`flex items-center p-2 md:p-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('home')}
          >
            <FaHome className="mr-2 md:mr-3" />
            <span className="text-sm md:text-base">Dashboard</span>
          </button>
          <button
            className={`flex items-center p-2 md:p-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('patients')}
          >
            <FaUsers className="mr-2 md:mr-3" />
            <span className="text-sm md:text-base">Patients</span>
          </button>
          <button
            className={`flex items-center p-2 md:p-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            <GiToothbrush className="mr-2 md:mr-3" />
            <span className="text-sm md:text-base">Inventory</span>
          </button>
          <button
            className={`flex items-center p-2 md:p-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('expenses')}
          >
            <FaMoneyBillWave className="mr-2 md:mr-3" />
            <span className="text-sm md:text-base">Expenses</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 mb-16 md:mb-0">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 tracking-tight">
          Dental Clinic Dashboard
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-200">
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-sm">
              Use the buttons below to add new data manually.
            </p>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Patients */}
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Patients
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {totalPatients}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FaUsers className="text-xl" />
                  </div>
                </div>
              </div>

              {/* Low Stock Items */}
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Low Stock Items
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {lowStockItems}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                    <FaExclamationTriangle className="text-xl" />
                  </div>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <FaMoneyBillWave className="text-xl" />
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Today's Appointments
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {todayAppointments}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FaCalendarAlt className="text-xl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Clinic Overview
                </h3>
                <div className="h-64">
                  <Bar data={barChartData} options={chartOptions} />
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Dental Conditions
                </h3>
                <div className="h-64">
                  <Pie data={pieChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Upcoming Appointments
                </h3>
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => setActiveTab('patients')}
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Condition
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.slice(0, 5).map((appt, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {appt.patientName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(appt.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {appt.purpose}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {appt.disease}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <PatientList
            patients={patients}
            setPatients={setPatients}
            setShowPatientForm={setShowPatientForm}
            handleDelete={handleDelete}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryList
            inventory={inventory}
            setInventory={setInventory}
            setShowInventoryForm={setShowInventoryForm}
            setEditingItem={setEditingItem}
            editingItem={editingItem}
            handleDelete={handleDelete}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            setExpenses={setExpenses}
            setShowExpenseForm={setShowExpenseForm}
            handleDelete={handleDelete}
          />
        )}

        {/* Modals */}
        {showPatientForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Patient' : 'Add New Patient'}
                </h2>
                <button
                  onClick={() => {
                    setShowPatientForm(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                <PatientForm
                  setPatients={setPatients}
                  setShowPatientForm={setShowPatientForm}
                  patient={editingItem}
                  setEditingPatient={setEditingItem}
                />
              </div>
            </div>
          </div>
        )}

        {showInventoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowInventoryForm(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                <InventoryForm
                  setItems={setInventory}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  setShowInventoryForm={setShowInventoryForm}
                />
              </div>
            </div>
          </div>
        )}

        {showExpenseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  onClick={() => {
                    setShowExpenseForm(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                <ExpenseForm
                  setExpenses={setExpenses}
                  setShowExpenseForm={setShowExpenseForm}
                  expense={editingItem}
                  setEditingExpense={setEditingItem}
                />
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </div>
  );
}

export default Dashboard;
