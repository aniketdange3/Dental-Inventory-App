import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

function ExpenseForm({
  setExpenses,
  setShowExpenseForm,
  expense,
  setEditingExpense,
}) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || '',
        amount: expense.amount ? expense.amount.toString() : '',
        date: expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : '',
        description: expense.description || '',
      });
    }
  }, [expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date
          ? new Date(formData.date).toISOString()
          : new Date().toISOString(),
      };
      let response;
      if (expense) {
        response = await axios.put(
          `/api/expenses/${expense._id}`,
          dataToSubmit
        );
        setExpenses((prev) =>
          prev.map((exp) => (exp._id === expense._id ? response.data : exp))
        );
        setEditingExpense(null);
        toast.success('Expense updated successfully!');
      } else {
        response = await axios.post('/api/expenses', dataToSubmit);
        setExpenses((prev) => [...prev, response.data]);
        toast.success('Expense added successfully!');
      }
      setFormData({ category: '', amount: '', date: '', description: '' });
      setShowExpenseForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ category: '', amount: '', date: '', description: '' });
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 bg-white rounded-lg shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            required
          >
            <option value="">Select Category</option>
            <option value="Consumables">Consumables</option>
            <option value="Equipment">Equipment</option>
            <option value="Salaries">Salaries</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-slate-700"
          >
            Amount (₹)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-slate-700"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>
      <div className="flex gap-4 pt-4 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className={`bg-slate-500 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-all duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading
            ? 'Submitting...'
            : expense
            ? 'Update Expense'
            : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}

ExpenseForm.propTypes = {
  setExpenses: PropTypes.func.isRequired,
  setShowExpenseForm: PropTypes.func.isRequired,
  expense: PropTypes.object,
  setEditingExpense: PropTypes.func.isRequired,
};

export default ExpenseForm;
