import { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Bar, Pie } from 'react-chartjs-2';
import { FaPlus } from 'react-icons/fa';
import { MdDeleteOutline, MdOutlineModeEdit } from 'react-icons/md';
import { toast } from 'react-toastify';
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
import ExpenseForm from './ExpenseForm';

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

function ExpenseList({ setShowExpenseForm }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });
  const [filters, setFilters] = useState({
    category: '',
    month: '',
    year: '',
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [chartType, setChartType] = useState('bar');

  // Dental-specific expense categories
  const categories = [
    'Dental Supplies',
    'Equipment Maintenance',
    'Staff Salaries',
    'Office Supplies',
    'Utilities',
    'Lab Fees',
    'Marketing',
    'Professional Fees',
    'Insurance',
    'Other',
  ];

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/expenses');
        setExpenses(res.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch expenses. Please try again later.');
        console.error('Error fetching expenses:', err);
        toast.error('Failed to load expenses data.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?'))
      return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
      toast.success('Expense deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense.');
      console.error('Error deleting expense:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(0, i);
      return {
        value: i + 1,
        label: date.toLocaleString('default', { month: 'long' }),
      };
    });
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === 'amount') {
      const amountA = a.amount || 0;
      const amountB = b.amount || 0;
      return sortConfig.direction === 'asc'
        ? amountA - amountB
        : amountB - amountA;
    } else if (sortConfig.key === 'category') {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      return sortConfig.direction === 'asc'
        ? categoryA.localeCompare(categoryB)
        : categoryB.localeCompare(categoryA);
    }
    return 0;
  });

  const filteredExpenses = sortedExpenses.filter((expense) => {
    const matchesCategory = filters.category
      ? expense.category === filters.category
      : true;
    const matchesMonth = filters.month
      ? new Date(expense.date).getMonth() + 1 === Number(filters.month)
      : true;
    const matchesYear = filters.year
      ? new Date(expense.date).getFullYear() === Number(filters.year)
      : true;
    return matchesCategory && matchesMonth && matchesYear;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );

  const prepareChartData = () => {
    const filteredCategories = filters.category
      ? [filters.category]
      : categories;

    return {
      labels: filteredCategories,
      datasets: [
        {
          label: 'Expenses by Category',
          data: filteredCategories.map((cat) =>
            filteredExpenses
              .filter((e) => e.category === cat)
              .reduce((sum, e) => sum + (e.amount || 0), 0)
          ),
          backgroundColor: [
            '#3b82f6',
            '#ef4444',
            '#10b981',
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
            '#dc2626',
            '#059669',
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
            return `${context.label}: ₹${context.raw.toFixed(2)} (${(
              (context.raw / totalExpenses) *
              100
            ).toFixed(1)}%)`;
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
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Dental Clinic Expenses
          </h2>
          <p className="text-gray-600">
            Track and manage your clinic's financial outflows
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
        >
          <FaPlus className="mr-2" /> Add Expense
        </button>
      </div>

      {editingExpense && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <ExpenseForm
            setExpenses={setExpenses}
            setShowExpenseForm={setShowExpenseForm}
            expense={editingExpense}
            setEditingExpense={setEditingExpense}
            categories={categories}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Total Expenses
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Expense Count
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredExpenses.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Average Expense
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            ₹
            {(filteredExpenses.length
              ? totalExpenses / filteredExpenses.length
              : 0
            ).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category-filter"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="month-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Month
            </label>
            <select
              id="month-filter"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Months</option>
              {getMonthOptions().map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="year-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year
            </label>
            <select
              id="year-filter"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ category: '', month: '', year: '' })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('date')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'date'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Date{' '}
            {sortConfig.key === 'date' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('amount')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'amount'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Amount{' '}
            {sortConfig.key === 'amount' &&
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
                #
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
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount (₹)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
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
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense, index) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingExpense(expense);
                          setShowExpenseForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <MdOutlineModeEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
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
                  No expenses found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Expense Analysis
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

ExpenseList.propTypes = {
  setShowExpenseForm: PropTypes.func.isRequired,
};

export default ExpenseList;
