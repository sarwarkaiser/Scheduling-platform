"use client";

import { useState, useEffect } from "react";
import ManualShiftForm from "./ManualShiftForm";
import { CalendarDaysIcon, PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

interface ManualShift {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: { id: string; name: string; code: string };
  site: { id: string; name: string };
  service?: { id: string; name: string };
  residents: { id: string; name: string }[];
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

interface Props {
  programId: string;
}

export default function ManualShiftManager({ programId }: Props) {
  const [shifts, setShifts] = useState<ManualShift[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<ManualShift | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with API calls
  const shiftTypes = [
    { id: "st-1", name: "Night Call", code: "NIGHT" },
    { id: "st-2", name: "24 Hour Call", code: "24H" },
    { id: "st-3", name: "Weekend Day", code: "WEEKEND" },
    { id: "st-4", name: "Day Shift", code: "DAY" },
    { id: "st-5", name: "Home Call", code: "HOME" },
  ];

  const sites = [
    { id: "site-1", name: "Main Campus" },
    { id: "site-2", name: "Community Hospital" },
  ];

  const services = [
    { id: "svc-1", name: "Internal Medicine", code: "IM" },
    { id: "svc-2", name: "Emergency Medicine", code: "EM" },
    { id: "svc-3", name: "Psychiatry", code: "PSY" },
  ];

  const residents = [
    { id: "res-1", name: "John Doe" },
    { id: "res-2", name: "Jane Smith" },
    { id: "res-3", name: "Bob Wilson" },
    { id: "res-4", name: "Alice Johnson" },
    { id: "res-5", name: "Charlie Brown" },
  ];

  useEffect(() => {
    loadShifts();
  }, [programId]);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/schedules/manual?programId=${programId}`);
      // const data = await response.json();
      // setShifts(data);
      
      // Mock data for now
      setShifts([]);
    } catch (error) {
      console.error("Failed to load shifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (shiftData: ManualShift) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch("/api/schedules/manual", {
      //   method: editingShift ? "PUT" : "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ...shiftData, programId }),
      // });
      
      // Optimistic update
      if (editingShift) {
        setShifts(shifts.map((s) => (s.id === editingShift.id ? { ...s, ...shiftData } : s)));
      } else {
        setShifts([...shifts, { ...shiftData, id: `new-${Date.now()}` }]);
      }
      
      setShowForm(false);
      setEditingShift(null);
    } catch (error) {
      console.error("Failed to save shift:", error);
      alert("Failed to save shift. Please try again.");
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/schedules/manual/${shiftId}`, { method: "DELETE" });
      
      setShifts(shifts.filter((s) => s.id !== shiftId));
    } catch (error) {
      console.error("Failed to delete shift:", error);
      alert("Failed to delete shift.");
    }
  };

  const handleEdit = (shift: ManualShift) => {
    setEditingShift(shift);
    setShowForm(true);
  };

  const filteredShifts = filterDate
    ? shifts.filter((s) => s.date === filterDate)
    : shifts;

  const groupedShifts = filteredShifts.reduce((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = [];
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, ManualShift[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Manual Shift Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create custom shifts with specific hours and assignments
          </p>
        </div>
        <button
          onClick={() => {
            setEditingShift(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add Manual Shift
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by date:
        </label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate("")}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ManualShiftForm
              programId={programId}
              shiftTypes={shiftTypes}
              sites={sites}
              services={services}
              residents={residents}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingShift(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Shifts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading shifts...</p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No manual shifts
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Create your first manual shift to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Shift
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedShifts).map(([date, dayShifts]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                            {shift.shiftType.name}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {shift.startTime} - {shift.endTime}
                          </span>
                          {shift.startTime > shift.endTime && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              (Overnight)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>📍 {shift.site.name}</span>
                          {shift.service && (
                            <span>🏥 {shift.service.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Assigned:
                          </span>
                          {shift.residents.map((resident) => (
                            <span
                              key={resident.id}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {resident.name}
                            </span>
                          ))}
                        </div>
                        {shift.notes && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                            📝 {shift.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(shift)}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Edit shift"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id!)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          title="Delete shift"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {shifts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Shifts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{shifts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Assignments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {shifts.reduce((sum, s) => sum + s.residents.length, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unique Dates</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(groupedShifts).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Residents/Shift</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(shifts.reduce((sum, s) => sum + s.residents.length, 0) / shifts.length).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
