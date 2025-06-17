import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function InventoryForm({ setItems, editingItem, setEditingItem }) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    supplier: '',
    purchaseDate: '',
    expiryDate: '',
    lowStockThreshold: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        quantity: editingItem.quantity || '',
        supplier: editingItem.supplier || '',
        purchaseDate: editingItem.purchaseDate
          ? new Date(editingItem.purchaseDate).toISOString().split('T')[0]
          : '',
        expiryDate: editingItem.expiryDate
          ? new Date(editingItem.expiryDate).toISOString().split('T')[0]
          : '',
        lowStockThreshold: editingItem.lowStockThreshold || '',
      });
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      supplier: '',
      purchaseDate: '',
      expiryDate: '',
      lowStockThreshold: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = editingItem
        ? { ...formData, _id: editingItem._id }
        : formData;
      console.log('Submitting data:', payload);

      let response;
      if (editingItem) {
        response = await axios.put(
          `/api/inventory/${editingItem._id}`,
          payload
        );
        setItems((prevItems) =>
          prevItems.map((item) =>
            item._id === editingItem._id ? response.data.item : item
          )
        );
        toast.success('Inventory item updated successfully!');
      } else {
        response = await axios.post('/api/inventory', payload);
        setItems((prevItems) => [...prevItems, response.data.item]);
        toast.success('Inventory item added successfully!');
      }
      resetForm();
      setEditingItem(null);
    } catch (error) {
      console.error(
        'Error saving inventory item:',
        error.response?.data || error.message
      );
      toast.error(
        'Failed to save inventory item: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 w-2xl p-10">
      <h3 className="text-l font-semibold mb-4">
        {editingItem ? 'Edit Inventory Item' : 'Add Inventory Product'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="supplier"
            className="block text-sm font-medium text-gray-700"
          >
            Supplier
          </label>
          <input
            type="text"
            id="supplier"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="purchaseDate"
            className="block text-sm font-medium text-gray-700"
          >
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="expiryDate"
            className="block text-sm font-medium text-gray-700"
          >
            Expiry Date
          </label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="lowStockThreshold"
            className="block text-sm font-medium text-gray-700"
          >
            Low Stock Threshold
          </label>
          <input
            type="number"
            id="lowStockThreshold"
            name="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setEditingItem(null);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {editingItem ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

export default InventoryForm;
