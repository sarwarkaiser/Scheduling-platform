"use client";

import { createRuleSet, createConstraint, deleteConstraint } from "@/app/actions/rules";
import { useState } from "react";

// Types for constraints to help the UI
const CONSTRAINT_TYPES = [
    { value: "hard", label: "Hard (must follow)" },
    { value: "soft", label: "Soft (prefer to follow)" },
];

const PLUGINS = [
    {
        value: "max_shifts_per_period",
        label: "Limit shifts in a time window",
        help: "Example: 5 shifts per 28 days",
    },
    {
        value: "min_rest_between",
        label: "Require rest between shifts",
        help: "Example: 10 hours of rest",
    },
    {
        value: "max_consecutive_shifts",
        label: "Limit consecutive days",
        help: "Example: no more than 3 in a row",
    },
    {
        value: "no_consecutive_24h",
        label: "Block back-to-back 24h shifts",
        help: "Prevents consecutive 24-hour assignments",
    },
];

const LEGACY_PLUGIN_LABELS: Record<string, string> = {
    min_rest_between_shifts: "Require rest between shifts",
    no_overlapping_shifts: "No overlapping shifts",
};

export default function RulesManager({
    ruleSets,
    programs,
    programYears,
}: {
    ruleSets: any[];
    programs: any[];
    programYears: any[];
}) {
    const [selectedRuleSet, setSelectedRuleSet] = useState<string | null>(null);
    const [isAddingRuleSet, setIsAddingRuleSet] = useState(false);
    const [isAddingConstraint, setIsAddingConstraint] = useState(false);

    // Filter State
    const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("");

    // Form State for Constraint
    const [name, setName] = useState("");
    const [pluginType, setPluginType] = useState(PLUGINS[0].value);
    const [maxShifts, setMaxShifts] = useState(5);
    const [periodDays, setPeriodDays] = useState(28);
    const [minRestHours, setMinRestHours] = useState(10);
    const [maxConsecutive, setMaxConsecutive] = useState(3);

    // AI Assist State
    const [showAiAssist, setShowAiAssist] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isProcessingAi, setIsProcessingAi] = useState(false);

    // Filter logic
    const filteredRuleSets = ruleSets.filter((rs) =>
        !selectedProgramFilter || rs.programId === selectedProgramFilter
    );

    // Helper to generate default JSON based on plugin
    function handlePluginChange(plugin: string) {
        setPluginType(plugin);
        if (plugin === "max_shifts_per_period") {
            setMaxShifts(5);
            setPeriodDays(28);
            if (!name) setName("Max shifts per period");
        } else if (plugin === "min_rest_between") {
            setMinRestHours(10);
            if (!name) setName("Minimum rest between shifts");
        } else if (plugin === "max_consecutive_shifts") {
            setMaxConsecutive(3);
            if (!name) setName("Max consecutive shifts");
        } else if (plugin === "no_consecutive_24h") {
            if (!name) setName("No consecutive 24h shifts");
        }
    }

    function buildParameters() {
        if (pluginType === "max_shifts_per_period") {
            return {
                maxShifts,
                periodDays,
                // Backward compatibility with older solver expectations
                max: maxShifts,
            };
        }
        if (pluginType === "min_rest_between") {
            return {
                minRestHours,
                // Backward compatibility with older solver expectations
                hours: minRestHours,
            };
        }
        if (pluginType === "max_consecutive_shifts") {
            return { max: maxConsecutive };
        }
        return {};
    }

    function summarizeParameters(plugin: string, params: any) {
        if (plugin === "max_shifts_per_period") {
            const max = params.maxShifts ?? params.max ?? 4;
            const period = params.periodDays ?? params.period ?? 7;
            return `Max ${max} shifts per ${period} days`;
        }
        if (plugin === "min_rest_between" || plugin === "min_rest_between_shifts") {
            return `At least ${params.minRestHours ?? params.hours} hours of rest between shifts`;
        }
        if (plugin === "max_consecutive_shifts") {
            return `No more than ${params.max} consecutive shifts`;
        }
        if (plugin === "no_consecutive_24h") {
            return "No back-to-back 24-hour shifts";
        }
        if (plugin === "no_overlapping_shifts") {
            return "No overlapping shifts";
        }
        return "Custom rule configuration";
    }

    async function handleAiProcess() {
        if (!aiPrompt) return;
        setIsProcessingAi(true);

        // Simulating AI processing with regex heuristics for the demo
        // In a real app, this would call an API route to an LLM
        setTimeout(() => {
            const prompt = aiPrompt.toLowerCase();
            let matched = false;

            // Heuristic 1: Max shifts
            const maxShiftsMatch = prompt.match(/max.*?(\d+).*?shifts/);
            if (maxShiftsMatch) {
                setPluginType("max_shifts_per_period");
                setMaxShifts(parseInt(maxShiftsMatch[1]));
                setPeriodDays(28);
                setName(`Max ${maxShiftsMatch[1]} Shifts/Month`);
                matched = true;
            }

            // Heuristic 2: Rest time
            const restMatch = prompt.match(/(\d+).*?hours.*?rest/);
            if (!matched && restMatch) {
                setPluginType("min_rest_between");
                setMinRestHours(parseInt(restMatch[1]));
                setName(`Min ${restMatch[1]}h Rest`);
                matched = true;
            }

            // Heuristic 3: Consecutive
            const consecMatch = prompt.match(/(\d+).*?consecutive/);
            if (!matched && consecMatch) {
                setPluginType("max_consecutive_shifts");
                setMaxConsecutive(parseInt(consecMatch[1]));
                setName(`Max ${consecMatch[1]} Consecutive`);
                matched = true;
            }

            if (!matched) {
                // Fallback / Unknown
                setName("Custom Rule");
                // Don't change params if unsure
            }

            setIsProcessingAi(false);
            setShowAiAssist(false);
        }, 800);
    }

    async function handleCreateRuleSet(formData: FormData) {
        await createRuleSet(formData);
        setIsAddingRuleSet(false);
    }

    async function handleCreateConstraint(formData: FormData) {
        if (!selectedRuleSet) return;
        formData.append("ruleSetId", selectedRuleSet);
        formData.append("name", name); // Use state
        formData.append("pluginType", pluginType); // Use state
        formData.append("parameters", JSON.stringify(buildParameters())); // Use state
        await createConstraint(formData);
        setIsAddingConstraint(false);
        // Reset
        setName("");
    }

    const activeRuleSet = ruleSets.find((rs) => rs.id === selectedRuleSet);
    const activePlugin = PLUGINS.find((p) => p.value === pluginType);
    const parameterPreview = summarizeParameters(pluginType, buildParameters());

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Rule Sets List */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold dark:text-white">Rule Sets</h2>
                        <button
                            onClick={() => setIsAddingRuleSet(true)}
                            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500"
                        >
                            + New Set
                        </button>
                    </div>
                    <select
                        value={selectedProgramFilter}
                        onChange={(e) => setSelectedProgramFilter(e.target.value)}
                        className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">All Programs</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {isAddingRuleSet && (
                    <div className="rounded border border-gray-200 p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="font-medium text-sm mb-2 dark:text-white">New Rule Set</h3>
                        <form action={handleCreateRuleSet} className="space-y-3">
                            <input
                                name="name"
                                placeholder="Name (e.g. Intern Rules)"
                                required
                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <select
                                name="programId"
                                required
                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <select
                                name="programYearId"
                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">All Years</option>
                                {programYears.map((py) => (
                                    <option key={py.id} value={py.id}>{py.name}</option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddingRuleSet(false)} className="text-xs">Cancel</button>
                                <button type="submit" className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Save</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-2">
                    {filteredRuleSets.length === 0 && (
                        <div className="text-center py-4 text-xs text-gray-400">No rule sets found for this filter.</div>
                    )}
                    {filteredRuleSets.map(rs => (
                        <div
                            key={rs.id}
                            onClick={() => setSelectedRuleSet(rs.id)}
                            className={`cursor-pointer rounded p-3 border ${selectedRuleSet === rs.id
                                ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}
                        >
                            <div className="font-medium text-sm dark:text-white">{rs.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {rs.program?.name} {rs.programYear ? `(${rs.programYear.name})` : '(All Years)'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle/Right Column: Constraints Editor */}
            <div className="lg:col-span-2 space-y-4">
                {activeRuleSet ? (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold dark:text-white">Constraints: {activeRuleSet.name}</h2>
                            <button
                                onClick={() => setIsAddingConstraint(true)}
                                className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500"
                            >
                                + Add Constraint
                            </button>
                        </div>

                        {isAddingConstraint && (
                            <div className="rounded border border-gray-200 p-4 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
                                <h3 className="font-medium text-sm mb-4 dark:text-white">New Constraint</h3>

                                {/* AI Assistant Toggle */}
                                <div className="absolute top-4 right-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAiAssist(!showAiAssist)}
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        ✨ {showAiAssist ? "Use Manual Mode" : "Use AI Assistant"}
                                    </button>
                                </div>

                                {showAiAssist ? (
                                    <div className="space-y-4 py-2">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">Describe the rule in plain English</label>
                                            <div className="mt-1 flex gap-2">
                                                <input
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    placeholder="e.g. Max 4 shifts per month..."
                                                    className="flex-1 rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAiProcess()}
                                                />
                                                <button
                                                    onClick={handleAiProcess}
                                                    disabled={isProcessingAi}
                                                    className="rounded bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                                                >
                                                    {isProcessingAi ? "Thinking..." : "Generate"}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Try: "Max 3 consecutive shifts", "10 hours rest", "Max 5 shifts per month"
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <form action={handleCreateConstraint} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium dark:text-gray-300">Name</label>
                                            <input
                                                name="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                placeholder="e.g. Max 4 Calls"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium dark:text-gray-300">Type</label>
                                                <select name="type" className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                                                    {CONSTRAINT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium dark:text-gray-300">Logic Plugin</label>
                                                <select
                                                    name="pluginType"
                                                    value={pluginType}
                                                    onChange={(e) => handlePluginChange(e.target.value)}
                                                    className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    {PLUGINS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </select>
                                                {activePlugin?.help && (
                                                    <p className="mt-1 text-[11px] text-gray-500">{activePlugin.help}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium dark:text-gray-300">Settings</label>
                                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {pluginType === "max_shifts_per_period" && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[11px] font-medium text-gray-500">Max shifts</label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={maxShifts}
                                                                onChange={(e) => setMaxShifts(Number(e.target.value))}
                                                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-medium text-gray-500">Period (days)</label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={periodDays}
                                                                onChange={(e) => setPeriodDays(Number(e.target.value))}
                                                                className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                {pluginType === "min_rest_between" && (
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-500">Minimum rest (hours)</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={minRestHours}
                                                            onChange={(e) => setMinRestHours(Number(e.target.value))}
                                                            className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    </div>
                                                )}
                                                {pluginType === "max_consecutive_shifts" && (
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-500">Max consecutive days</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={maxConsecutive}
                                                            onChange={(e) => setMaxConsecutive(Number(e.target.value))}
                                                            className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    </div>
                                                )}
                                                {pluginType === "no_consecutive_24h" && (
                                                    <div className="text-xs text-gray-500">
                                                        This rule has no extra settings.
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Preview: {parameterPreview}</p>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setIsAddingConstraint(false)} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Cancel</button>
                                            <button type="submit" className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500">Add Constraint</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            {activeRuleSet.constraints.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">No constraints defined yet.</div>
                            )}
                            {activeRuleSet.constraints.map((c: any) => (
                                <div key={c.id} className="flex items-start justify-between rounded border border-gray-100 bg-white p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm dark:text-white">{c.name}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${c.type === 'hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {c.type}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {PLUGINS.find(p => p.value === c.pluginType)?.label || LEGACY_PLUGIN_LABELS[c.pluginType] || c.pluginType}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {summarizeParameters(c.pluginType, c.parameters || {})}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteConstraint(c.id)}
                                        className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center rounded border border-dashed border-gray-300 p-12 text-gray-500">
                        Select a Rule Set to manage its constraints.
                    </div>
                )}
            </div>
        </div>
    );
}
