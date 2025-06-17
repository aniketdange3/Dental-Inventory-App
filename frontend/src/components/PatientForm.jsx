import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';

function PatientForm({
  setPatients,
  setShowPatientForm,
  patient,
  setEditingPatient,
}) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    age: '',
    gender: '',
    medicalHistory: '',
    appointments: [{ date: '', purpose: '' }],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        contact: patient.contact || '',
        age: patient.age ? patient.age.toString() : '',
        gender: patient.gender || '',
        medicalHistory: patient.medicalHistory || '',
        appointments: patient.appointments?.length
          ? patient.appointments.map((appt) => ({
              date: appt.date
                ? new Date(appt.date).toISOString().split('T')[0]
                : '',
              purpose: appt.purpose || '',
            }))
          : [{ date: '', purpose: '' }],
      });
    }
  }, [patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : 0,
        appointments: formData.appointments.filter(
          (appt) => appt.date && appt.purpose
        ),
      };
      let response;
      if (patient) {
        response = await axios.put(
          `/api/patients/${patient._id}`,
          dataToSubmit
        );
        setPatients((prev) =>
          prev.map((p) => (p._id === patient._id ? response.data : p))
        );
        setEditingPatient(null);
        toast.success('Patient updated successfully!');
      } else {
        response = await axios.post('/api/patients', dataToSubmit);
        setPatients((prev) => [...prev, response.data]);
        toast.success('Patient added successfully!');
      }
      setFormData({
        name: '',
        contact: '',
        age: '',
        gender: '',
        medicalHistory: '',
        appointments: [{ date: '', purpose: '' }],
      });
      setShowPatientForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save patient.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      contact: '',
      age: '',
      gender: '',
      medicalHistory: '',
      appointments: [{ date: '', purpose: '' }],
    });
    setEditingPatient(null);
    setShowPatientForm(false);
  };

  const addAppointment = () => {
    setFormData({
      ...formData,
      appointments: [...formData.appointments, { date: '', purpose: '' }],
    });
  };

  const removeAppointment = (index) => {
    setFormData({
      ...formData,
      appointments: formData.appointments.filter((_, i) => i !== index),
    });
  };

  const updateAppointment = (index, field, value) => {
    const newAppointments = [...formData.appointments];
    newAppointments[index][field] = value;
    setFormData({ ...formData, appointments: newAppointments });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter patient name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="contact"
            className="block text-sm font-medium text-slate-700"
          >
            Contact
          </label>
          <input
            id="contact"
            type="text"
            placeholder="Enter contact details"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="age"
            className="block text-sm font-medium text-slate-700"
          >
            Age
          </label>
          <input
            id="age"
            type="number"
            placeholder="Enter age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            min="0"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-slate-700"
          >
            Gender
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="medicalHistory"
          className="block text-sm font-medium text-slate-700"
        >
          Medical History
        </label>
        <textarea
          id="medicalHistory"
          placeholder="Enter medical history"
          value={formData.medicalHistory}
          onChange={(e) =>
            setFormData({ ...formData, medicalHistory: e.target.value })
          }
          className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          rows="4"
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Appointments
        </label>
        {formData.appointments.map((appt, index) => (
          <div
            key={index}
            className="border border-slate-200 p-4 rounded-lg relative space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor={`appointment-date-${index}`}
                  className="block text-sm font-medium text-slate-700"
                >
                  Appointment Date
                </label>
                <input
                  id={`appointment-date-${index}`}
                  type="date"
                  value={appt.date}
                  onChange={(e) =>
                    updateAppointment(index, 'date', e.target.value)
                  }
                  className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`appointment-purpose-${index}`}
                  className="block text-sm font-medium text-slate-700"
                >
                  Purpose
                </label>
                <input
                  id={`appointment-purpose-${index}`}
                  type="text"
                  placeholder="Enter appointment purpose"
                  value={appt.purpose}
                  onChange={(e) =>
                    updateAppointment(index, 'purpose', e.target.value)
                  }
                  className="border border-slate-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
            {formData.appointments.length > 1 && (
              <button
                type="button"
                onClick={() => removeAppointment(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-700 transition-all duration-200"
                title="Remove Appointment"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addAppointment}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-all duration-200 text-sm font-medium"
        >
          <FaPlus className="h-4 w-4 mr-1" /> Add Another Appointment
        </button>
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
            : patient
            ? 'Update Patient'
            : 'Add Patient'}
        </button>
      </div>
    </form>
  );
}

export default PatientForm;
