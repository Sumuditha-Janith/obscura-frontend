import { useState } from "react";
import { generateMediaReport } from "../services/media.service";
import { useAuth } from "../context/authContext";
import { errorAlert, showToast, warningAlert } from "../utils/swal";

interface ReportGeneratorProps {
    onClose?: () => void;
}

export default function ReportGenerator({ onClose }: ReportGeneratorProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<string>("all");
    const [error, setError] = useState<string>("");

    const handleGenerateReport = async () => {
        if (!user) {
            warningAlert("Login Required", "Please login to generate a report");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const blob = await generateMediaReport(period);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            const date = new Date().toISOString().split('T')[0];
            link.download = `Cinetime_Report_${date}_${period}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Show success notification
            showToast("Report generated successfully!", "success");

            if (onClose) onClose();
        } catch (err: any) {
            console.error("Report generation failed:", err);
            errorAlert(
                "Report Generation Failed",
                err.response?.data?.message || "Failed to generate report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const periodOptions = [
        { value: "all", label: "All Time" },
        { value: "year", label: "Last Year" },
        { value: "month", label: "Last Month" },
        { value: "week", label: "Last Week" }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-50">📊 Generate Media Report</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-50"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Report Period
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {periodOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setPeriod(option.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === option.value
                                        ? "bg-rose-600 text-slate-50"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-50 mb-2">What's included:</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• Total movies and TV shows</li>
                            <li>• Watch time statistics</li>
                            <li>• Episode tracking data</li>
                            <li>• Monthly activity chart</li>
                            <li>• Top rated content</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Generating...
                                </div>
                            ) : (
                                "📥 Download PDF Report"
                            )}
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}