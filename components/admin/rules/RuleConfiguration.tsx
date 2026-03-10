"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface RuleConfig {
  id: string;
  name: string;
  type: "hard" | "soft";
  pluginType: string;
  parameters: Record<string, any>;
  weight?: number;
  active: boolean;
}

interface Props {
  rules: RuleConfig[];
  onChange: (rules: RuleConfig[]) => void;
}

const AVAILABLE_RULES = [
  {
    pluginType: "max_shifts_per_period",
    name: "Max Shifts Per Period",
    description: "Limit total shifts in a time period",
    type: "hard",
    parameters: {
      period: "week",
      maxShifts: 5,
    },
  },
  {
    pluginType: "min_rest_between_shifts",
    name: "Minimum Rest Between Shifts",
    description: "Required rest hours between shifts",
    type: "hard",
    parameters: {
      minHours: 8,
    },
  },
  {
    pluginType: "max_consecutive_shifts",
    name: "Max Consecutive Shifts",
    description: "Maximum shifts in a row",
    type: "hard",
    parameters: {
      max: 3,
    },
  },
  {
    pluginType: "max_hours_per_week",
    name: "Max Hours Per Week",
    description: "ACGME 80-hour limit",
    type: "hard",
    parameters: {
      maxHours: 80,
      averagingPeriod: 4,
    },
  },
  {
    pluginType: "max_nights_per_month",
    name: "Max Nights Per Month",
    description: "Limit night call frequency",
    type: "hard",
    parameters: {
      maxNights: 8,
    },
  },
  {
    pluginType: "min_days_off_per_week",
    name: "Minimum Days Off Per Week",
    description: "Required free days",
    type: "hard",
    parameters: {
      minDays: 1,
    },
  },
  {
    pluginType: "no_24h_after_night",
    name: "No 24h Call After Night",
    description: "Prevent 24h call day after night shift",
    type: "hard",
    parameters: {},
  },
  {
    pluginType: "weekend_frequency",
    name: "Weekend Frequency",
    description: "How often residents work weekends",
    type: "soft",
    parameters: {
      maxWeekends: 3,
      period: "month",
    },
  },
  {
    pluginType: "prefer_same_site",
    name: "Prefer Same Site",
    description: "Minimize site switching",
    type: "soft",
    parameters: {
      weight: 0.5,
    },
  },
  {
    pluginType: "balance_nights",
    name: "Balance Night Shifts",
    description: "Evenly distribute night calls",
    type: "soft",
    parameters: {
      targetVariance: 0.2,
    },
  },
  {
    pluginType: "max_weekend_nights",
    name: "Max Weekend Nights",
    description: "Limit weekend night calls",
    type: "hard",
    parameters: {
      max: 2,
      period: "month",
    },
  },
  {
    pluginType: "post_call_protection",
    name: "Post-Call Protection",
    description: "Time off after call",
    type: "hard",
    parameters: {
      hours: 14,
    },
  },
];

export default function RuleConfiguration({ rules, onChange }: Props) {
  const [showAddRule, setShowAddRule] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState("");

  const handleAddRule = (ruleTemplate: any) => {
    const newRule: RuleConfig = {
      id: `rule-${Date.now()}`,
      name: ruleTemplate.name,
      type: ruleTemplate.type as "hard" | "soft",
      pluginType: ruleTemplate.pluginType,
      parameters: { ...ruleTemplate.parameters },
      weight: ruleTemplate.type === "soft" ? 1.0 : undefined,
      active: true,
    };
    onChange([...rules, newRule]);
    setShowAddRule(false);
    setSelectedRuleType("");
  };

  const handleRemoveRule = (ruleId: string) => {
    onChange(rules.filter((r) => r.id !== ruleId));
  };

  const handleUpdateParameter = (
    ruleId: string,
    paramKey: string,
    value: any
  ) => {
    onChange(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, parameters: { ...r.parameters, [paramKey]: value } }
          : r
      )
    );
  };

  const handleToggleRule = (ruleId: string) => {
    onChange(
      rules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scheduling Rules
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure constraints for auto-generation
          </p>
        </div>
        <button
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add Rule
        </button>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Add Scheduling Rule</h3>
              <div className="space-y-3">
                {AVAILABLE_RULES.map((rule) => (
                  <button
                    key={rule.pluginType}
                    onClick={() => handleAddRule(rule)}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rule.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {rule.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          rule.type === "hard"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {rule.type === "hard" ? "Hard" : "Soft"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowAddRule(false);
                  setSelectedRuleType("");
                }}
                className="mt-4 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">
            No rules configured. Add rules to constrain schedule generation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${
                rule.active
                  ? "border-indigo-200 dark:border-indigo-800"
                  : "border-gray-200 dark:border-gray-700 opacity-60"
              } p-4`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        rule.type === "hard"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {rule.type === "hard" ? "Hard Constraint" : "Soft Preference"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Plugin: {rule.pluginType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1 text-xs rounded-lg transition ${
                      rule.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {rule.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Rule Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {Object.entries(rule.parameters).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    {typeof value === "boolean" ? (
                      <select
                        value={value ? "true" : "false"}
                        onChange={(e) =>
                          handleUpdateParameter(
                            rule.id,
                            key,
                            e.target.value === "true"
                          )
                        }
                        className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : typeof value === "number" ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          handleUpdateParameter(
                            rule.id,
                            key,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                      />
                    ) : typeof value === "string" ? (
                      <select
                        value={value}
                        onChange={(e) =>
                          handleUpdateParameter(rule.id, key, e.target.value)
                        }
                        className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                      >
                        {["week", "month", "year"].includes(value) ? (
                          <>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                          </>
                        ) : (
                          <>
                            <option value={value}>{value}</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                          </>
                        )}
                      </select>
                    ) : null}
                  </div>
                ))}
                {rule.type === "soft" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Weight (Importance)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={rule.weight || 1}
                      onChange={(e) =>
                        handleUpdateParameter(
                          rule.id,
                          "weight",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preset Configurations */}
      <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
        <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4">
          Quick Presets
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const presets: RuleConfig[] = [
                {
                  id: "preset-1",
                  name: "Max Hours Per Week",
                  type: "hard",
                  pluginType: "max_hours_per_week",
                  parameters: { maxHours: 80, averagingPeriod: 4 },
                  active: true,
                },
                {
                  id: "preset-2",
                  name: "Minimum Rest Between Shifts",
                  type: "hard",
                  pluginType: "min_rest_between_shifts",
                  parameters: { minHours: 8 },
                  active: true,
                },
                {
                  id: "preset-3",
                  name: "Max Shifts Per Period",
                  type: "hard",
                  pluginType: "max_shifts_per_period",
                  parameters: { period: "week", maxShifts: 5 },
                  active: true,
                },
              ];
              onChange(presets);
            }}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition"
          >
            <p className="font-medium text-indigo-900 dark:text-indigo-300">
              ACGME Compliant
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              80hr week, 8h rest, max 5 shifts
            </p>
          </button>

          <button
            onClick={() => {
              const presets: RuleConfig[] = [
                {
                  id: "can-1",
                  name: "Max Hours Per Week",
                  type: "hard",
                  pluginType: "max_hours_per_week",
                  parameters: { maxHours: 60, averagingPeriod: 1 },
                  active: true,
                },
                {
                  id: "can-2",
                  name: "Post-Call Protection",
                  type: "hard",
                  pluginType: "post_call_protection",
                  parameters: { hours: 14 },
                  active: true,
                },
                {
                  id: "can-3",
                  name: "Max Nights Per Month",
                  type: "hard",
                  pluginType: "max_nights_per_month",
                  parameters: { maxNights: 8 },
                  active: true,
                },
              ];
              onChange(presets);
            }}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition"
          >
            <p className="font-medium text-indigo-900 dark:text-indigo-300">
              Canadian Standards
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              60hr week, 14h rest, max 8 nights
            </p>
          </button>

          <button
            onClick={() => {
              const presets: RuleConfig[] = [
                {
                  id: "fair-1",
                  name: "Balance Night Shifts",
                  type: "soft",
                  pluginType: "balance_nights",
                  parameters: { targetVariance: 0.2 },
                  weight: 2.0,
                  active: true,
                },
                {
                  id: "fair-2",
                  name: "Weekend Frequency",
                  type: "soft",
                  pluginType: "weekend_frequency",
                  parameters: { maxWeekends: 3, period: "month" },
                  weight: 1.5,
                  active: true,
                },
                {
                  id: "fair-3",
                  name: "Prefer Same Site",
                  type: "soft",
                  pluginType: "prefer_same_site",
                  parameters: { weight: 0.5 },
                  active: true,
                },
              ];
              onChange(presets);
            }}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition"
          >
            <p className="font-medium text-indigo-900 dark:text-indigo-300">
              Fairness Focused
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Balance nights, weekends, sites
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
