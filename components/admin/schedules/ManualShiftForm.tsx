"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

interface ManualShift {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftTypeId: string;
  siteId: string;
  serviceId: string;
  residentIds: string[];
  notes?: string;
}

interface Props {
  programId: string;
  shiftTypes: { id: string; name: string; code: string }[];
  sites: { id: string; name: string }[];
  services: { id: string; name: string }[];
  residents: { id: string; name: string }[];
  onSave?: (shift: ManualShift) => void;
  onCancel?: () => void;
}

export default function ManualShiftForm({
  programId,
  shiftTypes,
  sites,
  services,
  residents,
  onSave,
  onCancel,
}: Props) {
  const [shift, setShift] = useState<ManualShift>({
    date: new Date().toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "17:00",
    shiftTypeId: shiftTypes[0]?.id || "",
    siteId: sites[0]?.id || "",
    serviceId: services[0]?.id || "",
    residentIds: [],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!shift.date) newErrors.date = "Date is required";
    if (!shift.startTime) newErrors.startTime = "Start time is required";
    if (!shift.endTime) newErrors.endTime = "End time is required";
    if (!shift.shiftTypeId) newErrors.shiftTypeId = "Shift type is required";
    if (!shift.siteId) newErrors.siteId = "Site is required";
    if (shift.residentIds.length === 0) {
      newErrors.residentIds = "At least one resident must be assigned";
    }

    // Check if end time is after start time (handle overnight shifts)
    const start = new Date(`2000-01-01T${shift.startTime}`);
    const end = new Date(`2000-01-01T${shift.endTime}`);
    const isOvernight = end < start;
    
    if (!isOvernight && end.getTime() <= start.getTime()) {
      newErrors.endTime = "End time must be after start time (or use overnight)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate) return;
    onSave?.(shift);
  };

  const toggleResident = (residentId: string) => {
    setShift((prev) => ({
      ...prev,
      residentIds: prev.residentIds.includes(residentId)
        ? prev.residentIds.filter((id) => id !== residentId)
        : [...prev.residentIds, residentId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Manual Shift
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Date & Times */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={shift.date}
            onChange={(e) => setShift({ ...shift, date: e.target.value })}
            className={`w-full rounded-lg border ${errors.date ? "border-red-500" : "border-gray-300 dark:border-gray-600"} px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            value={shift.startTime}
            onChange={(e) => setShift({ ...shift, startTime: e.target.value })}
            className={`w-full rounded-lg border ${errors.startTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"} px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time *
          </label>
          <input
            type="time"
            value={shift.endTime}
            onChange={(e) => setShift({ ...shift, endTime: e.target.value })}
            className={`w-full rounded-lg border ${errors.endTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"} px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>}
          {shift.startTime > shift.endTime && (
            <p className="mt-1 text-xs text-blue-500">Overnight shift detected</p>
          )}
        </div>
      </div>

      {/* Shift Type, Site, Service */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Shift Type *
          </label>
          <select
            value={shift.shiftTypeId}
            onChange={(e) => setShift({ ...shift, shiftTypeId: e.target.value })}
            className={`w-full rounded-lg border ${errors.shiftTypeId ? "border-red-500" : "border-gray-300 dark:border-gray-600"} px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          >
            {shiftTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.shiftTypeId && <p className="mt-1 text-xs text-red-500">{errors.shiftTypeId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Site *
          </label>
          <select
            value={shift.siteId}
            onChange={(e) => setShift({ ...shift, siteId: e.target.value })}
            className={`w-full rounded-lg border ${errors.siteId ? "border-red-500" : "border-gray-300 dark:border-gray-600"} px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          {errors.siteId && <p className="mt-1 text-xs text-red-500">{errors.siteId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Service
          </label>
          <select
            value={shift.serviceId}
            onChange={(e) => setShift({ ...shift, serviceId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resident Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assign Residents * {shift.residentIds.length > 0 && `(${shift.residentIds.length})`}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
          {residents.map((resident) => (
            <label
              key={resident.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                shift.residentIds.includes(resident.id)
                  ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 border"
                  : "bg-gray-50 dark:bg-gray-700/50 border-transparent border hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={shift.residentIds.includes(resident.id)}
                onChange={() => toggleResident(resident.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-900 dark:text-white truncate">
                {resident.name}
              </span>
            </label>
          ))}
        </div>
        {errors.residentIds && (
          <p className="mt-1 text-xs text-red-500">{errors.residentIds}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={shift.notes}
          onChange={(e) => setShift({ ...shift, notes: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          placeholder="Additional notes about this shift..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusIcon className="h-4 w-4" />
          Add Shift
        </button>
      </div>
    </form>
  );
}
