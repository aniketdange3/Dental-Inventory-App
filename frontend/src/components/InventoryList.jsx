import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdOutlineModeEdit, MdDeleteOutline } from 'react-icons/md';

import InventoryForm from './InventoryForm';
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

function InventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/inventory');
        setItems(res.data);
      } catch (err) {
        setError('Failed to fetch inventory items.');
        console.error(err);
        toast.error('Failed to load inventory items.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      setItems(items.filter((item) => item._id !== id));
      toast.success('Inventory item deleted successfully!');
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      toast.error('Failed to delete inventory item.');
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-700">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // Prepare data for the chart
  const suppliers = [...new Set(items.map((item) => item.supplier))];
  const chartData = {
    labels: suppliers,
    datasets: [
      {
        label: 'Items by Supplier',
        data: suppliers.map(
          (supplier) =>
            items.filter((item) => item.supplier === supplier).length
        ),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#ef4444',
          '#f59e0b',
          '#8b5cf6',
        ],
        borderColor: ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed'],
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
          text: 'Number of Items',
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
            return `${context.raw} items`;
          },
        },
      },
    },
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Inventory Management
      </h2>
      <button
        onClick={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
      >
        Add Inventory Item
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-slate-500 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <InventoryForm
              setItems={setItems}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              setShowForm={setShowForm}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Name
              </th>
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Quantity
              </th>
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Supplier
              </th>
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Purchase Date
              </th>
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Expiry Date
              </th>
              <th className="border border-slate-200 p-4 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item._id}
                className={`hover:bg-slate-50 transition-all duration-150 ${
                  item.quantity <= (item.lowStockThreshold || 10)
                    ? 'bg-gray-100100'
                    : ''
                }`}
              >
                <td className="border border-slate-200 p-4">{item.name}</td>
                <td className="border border-slate-200 p-4">{item.quantity}</td>
                <td className="border border-slate-200 p-4">{item.supplier}</td>
                <td className="border border-slate-200 p-4">
                  {item.purchaseDate
                    ? new Date(item.purchaseDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="border border-slate-200 p-4">
                  {item.expiryDate
                    ? new Date(item.expiryDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="border border-slate-200 p-4 flex space-x-2 justify-between">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-all duration-200 bg-gray-50 rounded-md p-2 shadow-sm"
                  >
                    <MdOutlineModeEdit className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-red-600 hover:text-red-700 transition-all duration-200  bg-gray-50 rounded-md p-2 shadow-sm"
                  >
                    <MdDeleteOutline className="w-6 h-6" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Items by Supplier
        </h3>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default InventoryList;
