import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdOutlineModeEdit, MdDeleteOutline, MdAdd } from 'react-icons/md';
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
import InventoryForm from './InventoryForm';

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

function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [filter, setFilter] = useState({
    supplier: '',
    lowStock: false,
  });

  // Common dental inventory categories
  const dentalCategories = [
    'Dental Instruments',
    'Consumables',
    'Medications',
    'Equipment',
    'Office Supplies',
    'Personal Protective Equipment',
    'Sterilization Supplies',
    'Dental Materials',
    'Lab Supplies',
    'Other',
  ];

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/inventory');
        setInventory(res.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch inventory. Please try again later.');
        console.error('Error fetching inventory:', err);
        toast.error('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?'))
      return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      setInventory((prev) => prev.filter((item) => item._id !== id));
      toast.success('Inventory item deleted successfully!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to delete inventory item.'
      );
      console.error('Error deleting inventory item:', err);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const sortedItems = [...inventory].sort((a, b) => {
    if (sortConfig.key === 'quantity') {
      return sortConfig.direction === 'asc'
        ? a.quantity - b.quantity
        : b.quantity - a.quantity;
    } else if (sortConfig.key === 'expiryDate') {
      const dateA = new Date(a.expiryDate || '9999-12-31');
      const dateB = new Date(b.expiryDate || '9999-12-31');
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  });

  const filteredItems = sortedItems.filter((item) => {
    const matchesSupplier = filter.supplier
      ? item.supplier === filter.supplier
      : true;
    const matchesLowStock = filter.lowStock
      ? item.quantity <= (item.lowStockThreshold || 10)
      : true;
    return matchesSupplier && matchesLowStock;
  });

  const suppliers = [...new Set(inventory.map((item) => item.supplier))].filter(
    Boolean
  );
  const lowStockItems = inventory.filter(
    (item) => item.quantity <= (item.lowStockThreshold || 10)
  ).length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.price * item.quantity || 0),
    0
  );

  const prepareChartData = () => {
    const chartLabels = suppliers.length > 0 ? suppliers : ['All Items'];
    const chartData =
      suppliers.length > 0
        ? suppliers.map(
            (supplier) =>
              filteredItems.filter((item) => item.supplier === supplier).length
          )
        : [filteredItems.length];

    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Inventory Items',
          data: chartData,
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#ef4444',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899',
            '#14b8a6',
            '#f97316',
            '#64748b',
            '#84cc16',
          ],
          borderColor: [
            '#2563eb',
            '#059669',
            '#dc2626',
            '#d97706',
            '#7c3aed',
            '#db2777',
            '#0d9488',
            '#ea580c',
            '#475569',
            '#65a30d',
          ],
          borderWidth: 1,
        },
      ],
    };
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
            return `${context.label}: ${context.raw} items`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Dental Inventory Management
          </h2>
          <p className="text-gray-600">
            Track and manage your clinic's supplies and equipment
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
        >
          <MdAdd className="mr-2" /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <InventoryForm
                setInventory={setInventory}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                setShowForm={setShowForm}
                categories={dentalCategories}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Total Items
          </h3>
          <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Low Stock Items
          </h3>
          <p className="text-2xl font-bold text-amber-600">{lowStockItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Total Inventory Value
          </h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalValue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              htmlFor="supplier-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Supplier
            </label>
            <select
              id="supplier-filter"
              name="supplier"
              value={filter.supplier}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              id="low-stock-filter"
              name="lowStock"
              type="checkbox"
              checked={filter.lowStock}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="low-stock-filter"
              className="ml-2 block text-sm text-gray-700"
            >
              Show only low stock items
            </label>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setFilter({ supplier: '', lowStock: false })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'name'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Name{' '}
            {sortConfig.key === 'name' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('quantity')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'quantity'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Quantity{' '}
            {sortConfig.key === 'quantity' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('category')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'category'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Category{' '}
            {sortConfig.key === 'category' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('expiryDate')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'expiryDate'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Expiry Date{' '}
            {sortConfig.key === 'expiryDate' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Supplier
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Expiry Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr
                  key={item._id}
                  className={`hover:bg-gray-50 ${
                    item.quantity <= (item.lowStockThreshold || 10)
                      ? 'bg-red-50'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${
                        item.quantity <= (item.lowStockThreshold || 10)
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {item.quantity}
                    </div>
                    {item.lowStockThreshold && (
                      <div className="text-xs text-gray-500">
                        Threshold: {item.lowStockThreshold}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.supplier || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <MdOutlineModeEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <MdDeleteOutline className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No inventory items found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Inventory Analysis
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                chartType === 'bar'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                chartType === 'pie'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Pie Chart
            </button>
          </div>
        </div>
        <div className="h-80">
          {chartType === 'bar' ? (
            <Bar data={prepareChartData()} options={chartOptions} />
          ) : (
            <Pie data={prepareChartData()} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryList;
