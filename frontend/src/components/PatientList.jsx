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
import PatientForm from './PatientForm';

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

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [filter, setFilter] = useState({
    gender: '',
    ageRange: '',
    search: '',
  });

  // Age ranges for filtering
  const ageRanges = [
    { label: 'All Ages', value: '' },
    { label: '0-18', value: '0-18' },
    { label: '19-30', value: '19-30' },
    { label: '31-50', value: '31-50' },
    { label: '51+', value: '51+' },
  ];

  // Genders for filtering
  const genders = [
    { label: 'All Genders', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/patients');
        setPatients(res.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch patients. Please try again later.');
        console.error('Error fetching patients:', err);
        toast.error('Failed to load patient data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?'))
      return;
    try {
      await axios.delete(`/api/patients/${id}`);
      setPatients((prev) => prev.filter((patient) => patient._id !== id));
      toast.success('Patient deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient.');
      console.error('Error deleting patient:', err);
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
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortConfig.key === 'age') {
      return sortConfig.direction === 'asc'
        ? (a.age || 0) - (b.age || 0)
        : (b.age || 0) - (a.age || 0);
    } else {
      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  });

  const filteredPatients = sortedPatients.filter((patient) => {
    // Filter by gender
    if (filter.gender && patient.gender !== filter.gender) return false;

    // Filter by age range
    if (filter.ageRange) {
      const age = patient.age || 0;
      switch (filter.ageRange) {
        case '0-18':
          if (age < 0 || age > 18) return false;
          break;
        case '19-30':
          if (age < 19 || age > 30) return false;
          break;
        case '31-50':
          if (age < 31 || age > 50) return false;
          break;
        case '51+':
          if (age < 51) return false;
          break;
      }
    }

    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const searchFields = [
        patient.name,
        patient.email,
        patient.phone,
        patient.address,
        patient.medicalHistory,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchFields.includes(searchTerm)) return false;
    }

    return true;
  });

  const patientGenders = [
    ...new Set(patients.map((patient) => patient.gender)),
  ].filter(Boolean);
  const totalPatients = patients.length;
  const newThisMonth = patients.filter((patient) => {
    const createdDate = new Date(patient.createdAt || new Date());
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const prepareChartData = () => {
    const chartLabels =
      patientGenders.length > 0 ? patientGenders : ['All Patients'];
    const chartData =
      patientGenders.length > 0
        ? patientGenders.map(
            (gender) =>
              patients.filter((patient) => patient.gender === gender).length
          )
        : [patients.length];

    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Patients by Gender',
          data: chartData,
          backgroundColor: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'],
          borderColor: ['#2563eb', '#db2777', '#059669', '#d97706'],
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
            return `${context.label}: ${context.raw} patients`;
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
            Patient Management
          </h2>
          <p className="text-gray-600">Manage your clinic's patient records</p>
        </div>
        <button
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
        >
          <MdAdd className="mr-2" /> Add Patient
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingPatient ? 'Edit Patient' : 'Add Patient'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPatient(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <PatientForm
                setPatients={setPatients}
                editingPatient={editingPatient}
                setEditingPatient={setEditingPatient}
                setShowForm={setShowForm}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Total Patients
          </h3>
          <p className="text-2xl font-bold text-blue-600">{totalPatients}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            New This Month
          </h3>
          <p className="text-2xl font-bold text-green-600">{newThisMonth}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Active Patients
          </h3>
          <p className="text-2xl font-bold text-amber-600">
            {patients.filter((p) => p.status === 'Active').length}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Search patients..."
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="gender-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gender
            </label>
            <select
              id="gender-filter"
              name="gender"
              value={filter.gender}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="age-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Age Range
            </label>
            <select
              id="age-filter"
              name="ageRange"
              value={filter.ageRange}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ageRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() =>
                setFilter({ gender: '', ageRange: '', search: '' })
              }
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
            onClick={() => handleSort('age')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'age'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Age{' '}
            {sortConfig.key === 'age' &&
              (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('gender')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              sortConfig.key === 'gender'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Gender{' '}
            {sortConfig.key === 'gender' &&
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
                Contact
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Age
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Gender
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Last Visit
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
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
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.name}
                    </div>
                    {patient.email && (
                      <div className="text-sm text-gray-500">
                        {patient.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.phone || '-'}
                    </div>
                    {patient.address && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {patient.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        patient.gender === 'Male'
                          ? 'bg-blue-100 text-blue-800'
                          : patient.gender === 'Female'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {patient.gender || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.lastVisit
                      ? new Date(patient.lastVisit).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        patient.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {patient.status || 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingPatient(patient);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <MdOutlineModeEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(patient._id)}
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
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No patients found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Patient Demographics
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

export default PatientList;
