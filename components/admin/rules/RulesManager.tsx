"use client";

import { useState, useTransition } from "react";
import { addRuleToProgram, deleteConstraint, getRulesForProgram } from "@/app/actions/rules";

const RULE_TYPES = [
    {
        value: "max_shifts_per_period",
        label: "Max shifts in a period",
        description: "e.g. no more than 5 calls per 28 days",
        fields: [
            { key: "maxShifts", label: "Max shifts", type: "number", default: 5 },
            { key: "periodDays", label: "Period (days)", type: "number", default: 28 },
        ],
    },
    {
        value: "min_rest_between",
        label: "Minimum rest between shifts",
        description: "e.g. at least 10 hours off after a shift",
        fields: [
            { key: "minRestHours", label: "Hours of rest", type: "number", default: 10 },
        ],
    },
    {
        value: "max_consecutive_shifts",
        label: "Max consecutive shifts",
        description: "e.g. no more than 3 call days in a row",
        fields: [
            { key: "max", label: "Max consecutive days", type: "number", default: 3 },
        ],
    },
    {
        value: "no_consecutive_24h",
        label: "No back-to-back 24h shifts",
        description: "Prevents two 24-hour assignments on consecutive days",
        fields: [],
    },
];

function summarize(pluginType: string, params: Record<string, unknown>) {
    if (pluginType === "max_shifts_per_period")
        return `Max ${params.maxShifts ?? params.max ?? "?"} shifts per ${params.periodDays ?? "?"} days`;
    if (pluginType === "min_rest_between")
        return `At least ${params.minRestHours ?? params.hours ?? "?"} hours of rest`;
    if (pluginType === "max_consecutive_shifts")
        return `No more than ${params.max ?? "?"} consecutive shifts`;
    if (pluginType === "no_consecutive_24h")
        return "No back-to-back 24-hour shifts";
    return "Custom rule";
}

interface Constraint {
    id: string;
    pluginType: string;
    parameters: Record<string, unknown>;
    name: string;
}

export default function RulesManager({
    programs,
    initialRules,
    initialProgramId,
}: {
    programs: { id: string; name: string }[];
    initialRules: Constraint[];
    initialProgramId: string;
}) {
    const [selectedProgram, setSelectedProgram] = useState(initialProgramId);
    const [rules, setRules] = useState<Constraint[]>(initialRules);
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState(RULE_TYPES[0].value);
    const [fieldValues, setFieldValues] = useState<Record<string, number>>({});
    const [isPending, startTransition] = useTransition();
    const [loadingRules, setLoadingRules] = useState(false);

    const ruleType = RULE_TYPES.find((r) => r.value === selectedType)!;

    function handleTypeChange(type: string) {
        setSelectedType(type);
        const def = RULE_TYPES.find((r) => r.value === type)!;
        const defaults: Record<string, number> = {};
        def.fields.forEach((f) => { defaults[f.key] = f.default; });
        setFieldValues(defaults);
    }

    async function handleProgramChange(programId: string) {
        setSelectedProgram(programId);
        setShowForm(false);
        setLoadingRules(true);
        const data = await getRulesForProgram(programId);
        setRules(data as Constraint[]);
        setLoadingRules(false);
    }

    function handleAddRule() {
        const defaults: Record<string, number> = {};
        ruleType.fields.forEach((f) => { defaults[f.key] = f.default; });
        setFieldValues(defaults);
        setShowForm(true);
    }

    async function handleSave() {
        const params: Record<string, unknown> = { ...fieldValues };
        // Backward compat aliases
        if (selectedType === "max_shifts_per_period") params.max = fieldValues.maxShifts;
        if (selectedType === "min_rest_between") params.hours = fieldValues.minRestHours;

        startTransition(async () => {
            await addRuleToProgram(selectedProgram, selectedType, params);
            const data = await getRulesForProgram(selectedProgram);
            setRules(data as Constraint[]);
            setShowForm(false);
        });
    }

    async function handleDelete(id: string) {
        startTransition(async () => {
            await deleteConstraint(id);
            setRules((prev) => prev.filter((r) => r.id !== id));
        });
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Program selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Program</label>
                <select
                    value={selectedProgram}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Rules list */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold dark:text-white">Rules</h2>
                    {!showForm && (
                        <button
                            onClick={handleAddRule}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
                        >
                            + Add Rule
                        </button>
                    )}
                </div>

                {/* Add rule form */}
                {showForm && (
                    <div className="px-5 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 space-y-4">
                        {/* Rule type cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {RULE_TYPES.map((rt) => (
                                <button
                                    key={rt.value}
                                    onClick={() => handleTypeChange(rt.value)}
                                    className={[
                                        "text-left p-3 rounded-lg border-2 transition",
                                        selectedType === rt.value
                                            ? "border-indigo-500 bg-white dark:bg-gray-800"
                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300",
                                    ].join(" ")}
                                >
                                    <p className="text-sm font-semibold dark:text-white">{rt.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rt.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Dynamic fields */}
                        {ruleType.fields.length > 0 && (
                            <div className="flex flex-wrap gap-4">
                                {ruleType.fields.map((f) => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={fieldValues[f.key] ?? f.default}
                                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                                            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {isPending ? "Saving…" : "Save Rule"}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Existing rules */}
                {loadingRules ? (
                    <p className="px-5 py-6 text-sm text-gray-400">Loading…</p>
                ) : rules.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-gray-400 text-center">No rules yet. Click &quot;+ Add Rule&quot; to get started.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rules.map((rule) => {
                            const rt = RULE_TYPES.find((r) => r.value === rule.pluginType);
                            return (
                                <li key={rule.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold dark:text-white">{rt?.label || rule.pluginType}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {summarize(rule.pluginType, rule.parameters)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        disabled={isPending}
                                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 ml-4"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
