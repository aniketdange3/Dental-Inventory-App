import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';
import { MdOutlineDeleteOutline, MdOutlineModeEdit } from 'react-icons/md';
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
import PatientForm from './PatientForm';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PatientList({ setShowPatientForm }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [editingPatient, setEditingPatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/patients');
        setPatients(res.data.filter((p) => p && p._id && p.name) || []);
      } catch (err) {
        setError('Failed to fetch patients. Please try again.');
        console.error(err);
        toast.error('Failed to load patients.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?'))
      return;
    try {
      await axios.delete(`/api/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p._id !== id));
      toast.success('Patient deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient.');
    }
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return sortOrder === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else if (sortBy === 'age') {
      const ageA = a.age || 0;
      const ageB = b.age || 0;
      return sortOrder === 'asc' ? ageA - ageB : ageB - ageA;
    }
    return 0;
  });

  const filteredPatients = sortedPatients.filter((patient) => {
    const matchesGender = filterGender ? patient.gender === filterGender : true;
    const matchesAge = filterAge
      ? (() => {
          const age = patient.age || 0;
          switch (filterAge) {
            case '0-18':
              return age >= 0 && age <= 18;
            case '19-30':
              return age >= 19 && age <= 30;
            case '31-50':
              return age >= 31 && age <= 50;
            case '51+':
              return age >= 51;
            default:
              return true;
          }
        })()
      : true;
    return matchesGender && matchesAge;
  });

  if (loading)
    return <div className="p-6 text-center text-slate-700">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const genders = ['Male', 'Female', 'Other'];
  const chartData = {
    labels: genders,
    datasets: [
      {
        label: 'Patients by Gender',
        data: genders.map(
          (gender) => filteredPatients.filter((p) => p.gender === gender).length
        ),
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
        borderColor: ['#2563eb', '#dc2626', '#059669'],
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
          text: 'Number of Patients',
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
            return `${context.raw} patients`;
          },
        },
      },
    },
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Patient Management
      </h2>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditingPatient(null);
            setShowPatientForm(true);
          }}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm transform hover:scale-105"
        >
          <FaPlus className="h-4 w-4 mr-2" /> Add Patient
        </button>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto transition-all"
          aria-label="Filter patients by gender"
        >
          <option value="">All Genders</option>
          {genders.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto transition-all"
          aria-label="Filter patients by age"
        >
          <option value="">All Ages</option>
          <option value="0-18">0-18</option>
          <option value="19-30">19-30</option>
          <option value="31-50">31-50</option>
          <option value="51+">51+</option>
        </select>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSort('name')}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm font-medium text-gray-700 transform hover:scale-105"
            aria-label="Sort patients by name"
          >
            Sort by Name{' '}
            {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => handleSort('age')}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm font-medium text-gray-700 transform hover:scale-105"
            aria-label="Sort patients by age"
          >
            Sort by Age{' '}
            {sortBy === 'age' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border border-gray-200 p-4 text-left font-semibold">
                S.No
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Name
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Contact
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Age
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Gender
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Medical History
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Upcoming Appointment
              </th>
              <th className="border border-gray-200 p-4 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, index) => {
              const upcomingAppointment = patient.appointments
                ?.filter(
                  (appt) => appt?.date && new Date(appt.date) >= new Date()
                )
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
              return (
                <tr
                  key={patient._id}
                  className="hover:bg-gray-50 transition-all duration-150"
                >
                  <td className="border border-gray-200 p-4">{index + 1}</td>
                  <td className="border border-gray-200 p-4">
                    {patient.name || '-'}
                  </td>
                  <td className="border border-gray-200 p-4">
                    {patient.contact || '-'}
                  </td>
                  <td className="border border-gray-200 p-4">
                    {patient.age || '-'}
                  </td>
                  <td className="border border-gray-200 p-4">
                    {patient.gender || '-'}
                  </td>
                  <td className="border border-gray-200 p-4">
                    {patient.medicalHistory || '-'}
                  </td>
                  <td className="border border-gray-200 p-4">
                    {upcomingAppointment
                      ? `${new Date(
                          upcomingAppointment.date
                        ).toLocaleDateString()} - ${
                          upcomingAppointment.purpose || '-'
                        }`
                      : '-'}
                  </td>
                  <td className="border-b border-gray-200 p-4 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setEditingPatient(patient);
                        setShowPatientForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-all duration-200 hover:bg-blue-50 rounded-lg p-2 transform hover:scale-110"
                      title="Edit Patient"
                      aria-label="Edit Patient"
                    >
                      <MdOutlineModeEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(patient._id)}
                      className="text-red-600 hover:text-red-800 transition-all duration-200 hover:bg-red-50 rounded-lg p-2 transform hover:scale-110"
                      title="Delete Patient"
                      aria-label="Delete Patient"
                    >
                      <MdOutlineDeleteOutline className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Patients by Gender
        </h3>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default PatientList;
