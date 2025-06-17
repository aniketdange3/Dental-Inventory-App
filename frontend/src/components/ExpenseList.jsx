import { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ExpenseForm from './ExpenseForm';
import { MdDeleteOutline, MdOutlineModeEdit } from 'react-icons/md';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function ExpenseList({ setShowExpenseForm }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/expenses');
        setExpenses(res.data || []);
      } catch (err) {
        setError('Failed to fetch expenses. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      options.push({ value, label });
    }
    return options;
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'amount') {
      const amountA = a.amount || 0;
      const amountB = b.amount || 0;
      return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
    } else if (sortBy === 'category') {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      return sortOrder === 'asc'
        ? categoryA.localeCompare(categoryB)
        : categoryB.localeCompare(categoryA);
    }
    return 0;
  });

  const filteredExpenses = sortedExpenses.filter((expense) => {
    const matchesCategory = filterCategory
      ? expense.category === filterCategory
      : true;
    const matchesMonth = filterMonth
      ? new Date(expense.date).toISOString().slice(0, 7) === filterMonth
      : true;
    return matchesCategory && matchesMonth;
  });

  if (loading)
    return <div className="p-6 text-center text-slate-700">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const categories = ['Consumables', 'Equipment', 'Salaries', 'Maintenance'];

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses by Category',
        data: categories.map((cat) =>
          filteredExpenses
            .filter((e) => e.category === cat)
            .reduce((sum, e) => sum + (e.amount || 0), 0)
        ),
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
        borderColor: ['#2563eb', '#dc2626', '#059669', '#d97706'],
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
          text: 'Amount (₹)',
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
            return `₹${context.raw.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Expense Tracking</h2>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
        >
          <FaPlus className="mr-2" /> Add Expense
        </button>
      </div>

      {editingExpense !== null && (
        <div className="mb-6">
          <ExpenseForm
            setExpenses={setExpenses}
            setShowExpenseForm={setShowExpenseForm}
            expense={editingExpense}
            setEditingExpense={setEditingExpense}
          />
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto"
          aria-label="Filter expenses by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-slate-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto"
          aria-label="Filter expenses by month"
        >
          <option value="">All Months</option>
          {getMonthOptions().map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSort('date')}
            className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300 transition-all duration-200 text-sm font-medium text-slate-700"
            aria-label="Sort expenses by date"
          >
            Sort by Date{' '}
            {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => handleSort('amount')}
            className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300 transition-all duration-200 text-sm font-medium text-slate-700"
            aria-label="Sort expenses by amount"
          >
            Sort by Amount{' '}
            {sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => handleSort('category')}
            className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300 transition-all duration-200 text-sm font-medium text-slate-700"
            aria-label="Sort expenses by category"
          >
            Sort by Category{' '}
            {sortBy === 'category' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          aria-label="Expenses table"
        >
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-200 p-3 text-left font-semibold">
                S.No
              </th>
              <th className="border border-slate-200 p-3 text-left font-semibold">
                Category
              </th>
              <th className="border border-slate-200 p-3 text-left font-semibold">
                Date
              </th>
              <th className="border border-slate-200 p-3 text-left font-semibold">
                Amount
              </th>
              <th className="border border-slate-200 p-3 text-left font-semibold">
                Description
              </th>
              <th className="border border-slate-200 p-3 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense, index) => (
              <tr
                key={expense._id}
                className="hover:bg-slate-50 transition-all duration-150"
              >
                <td className="border border-slate-200 p-3">{index + 1}</td>
                <td className="border border-slate-200 p-3">
                  {expense.category || '-'}
                </td>
                <td className="border border-slate-200 p-3">
                  {expense.date
                    ? new Date(expense.date).toLocaleDateString()
                    : '-'}
                </td>
                <td className="border border-slate-200 p-3">
                  ₹{(expense.amount || 0).toFixed(2)}
                </td>
                <td className="border border-slate-200 p-3">
                  {expense.description || '-'}
                </td>
                <td className="border border-slate-200 p-3 flex   justify-between items-center">
                  <button
                    onClick={() => {
                      setEditingExpense(expense);
                      setShowExpenseForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-all duration-200  bg-gray-50 rounded-md p-2 shadow-sm"
                    title="Edit Expense"
                    aria-label="Edit Expense"
                  >
                    <MdOutlineModeEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="text-red-600 hover:text-red-700 transition-all duration-200  bg-gray-50 rounded-md p-2 shadow-sm"
                    title="Delete Expense"
                    aria-label="Delete Expense"
                  >
                    <MdDeleteOutline className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Expenses by Category
        </h3>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

ExpenseList.propTypes = {
  setShowExpenseForm: PropTypes.func.isRequired,
};

export default ExpenseList;
