import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RiMoneyRupeeCircleLine } from 'react-icons/ri';

import {
  FaUsers,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaHome,
} from 'react-icons/fa';

import PatientList from './PatientList';
import InventoryList from './InventoryList';
import ExpenseList from './ExpenseList';
import InventoryForm from './InventoryForm';
import ExpenseForm from './ExpenseForm';
import PatientForm from './PatientForm';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsRes, inventoryRes, expensesRes] = await Promise.all([
          axios.get('/api/patients'),
          axios.get('/api/inventory'),
          axios.get('/api/expenses'),
        ]);
        setPatients(
          patientsRes.data.filter(
            (patient) => patient && patient._id && patient.name
          )
        );
        setInventory(inventoryRes.data.filter((item) => item && item._id));
        setExpenses(
          expensesRes.data.filter((expense) => expense && expense._id)
        );
      } catch (err) {
        setError(
          'Failed to fetch data. Use the buttons above to add new data.'
        );
        console.error(err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      setInventory(inventory.filter((item) => item._id !== id));
      toast.success('Inventory item deleted successfully!');
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      toast.error('Failed to delete inventory item.');
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
  const monthlyVisits = patients.reduce((acc, patient) => {
    const currentMonth = new Date().getMonth();
    const visits = (patient.appointments || []).filter(
      (appt) => appt?.date && new Date(appt.date).getMonth() === currentMonth
    ).length;
    return acc + visits;
  }, 0);

  const chartData = {
    labels: ['Patients', 'Inventory', 'Expenses'],
    datasets: [
      {
        label: 'Overview',
        data: [totalPatients, lowStockItems, totalExpenses],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderColor: ['#2563eb', '#059669', '#dc2626'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count/Amount',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.raw}`;
          },
        },
      },
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-600 text-xl font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Menu</h2>
        <div className="space-y-2">
          <button
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('home')}
          >
            <FaHome className="mr-3" /> Home
          </button>
          <button
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('patients')}
          >
            <FaUsers className="mr-3" /> Patients
          </button>
          <button
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            <FaExclamationTriangle className="mr-3" /> Inventory
          </button>
          <button
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('expenses')}
          >
            <FaMoneyBillWave className="mr-3" /> Expenses
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">
          Clinic Dashboard
        </h2>

        {error && (
          <div className="mb-8 p-6 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-200">
            <p className="font-semibold">{error}</p>
            <p className="mt-2 text-sm">
              Use the buttons above to add new data manually.
            </p>
          </div>
        )}

        {activeTab === 'home' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* total patients */}
              <div className="flex items-center justify-between  bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex">
                  {' '}
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {' '}
                    <p className="text-3xl font-bold text-slate-800">
                      {totalPatients}
                    </p>
                    Low Stock Alerts
                  </h3>
                </div>

                <FaUsers className="mr-2 h-12 w-15 text-blue-500" />
              </div>
              {/* low stock */}
              <div className="flex items-center justify-between  bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex">
                  {' '}
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {' '}
                    <p className="text-3xl font-bold text-slate-800">
                      {lowStockItems}
                    </p>
                    Low Stock Alerts
                  </h3>
                </div>

                <FaExclamationTriangle className="mr-2 h-12 w-15 text-red-500" />
              </div>
              {/* monthly expenses */}
              <div className="flex items-center justify-between  bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex">
                  {' '}
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {' '}
                    <p className="text-3xl font-bold text-slate-800">
                      ₹ {totalExpenses}
                    </p>
                    monthly expenses{' '}
                  </h3>
                </div>

                <FaMoneyBillWave className="mr-2 h-12 w-15 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Overview
              </h3>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <PatientList setShowPatientForm={setShowPatientForm} />
        )}
        {activeTab === 'inventory' && (
          <InventoryList
            setShowInventoryForm={setShowInventoryForm}
            setEditingItem={setEditingItem}
            editingItem={editingItem}
            handleDelete={handleDelete}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpenseList setShowExpenseForm={setShowExpenseForm} />
        )}

        {/* Modals */}
        {showPatientForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  Add/Edit Patient
                </h2>
                <button
                  onClick={() => setShowPatientForm(false)}
                  className="text-slate-500 hover:text-slate-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <PatientForm
                setPatients={setPatients}
                setShowPatientForm={setShowPatientForm}
                patient={null}
                setEditingPatient={() => {}}
              />
            </div>
          </div>
        )}

        {showInventoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowInventoryForm(false);
                    setEditingItem(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <InventoryForm
                setItems={setInventory}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                setShowInventoryForm={setShowInventoryForm}
              />
            </div>
          </div>
        )}

        {showExpenseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  Add/Edit Expense
                </h2>
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="text-slate-500 hover:text-slate-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <ExpenseForm
                setExpenses={setExpenses}
                setShowExpenseForm={setShowExpenseForm}
                expense={null}
                setEditingExpense={() => {}}
              />
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default Dashboard;
