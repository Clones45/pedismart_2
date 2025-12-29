import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, MapPin, Radio, Shield } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const AccuracyConfigCard = ({ title, value, icon: Icon, color, sampleSize, unit = "%" }) => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                    <Icon size={20} className={color.replace("bg-", "text-")} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    N={sampleSize}
                </span>
            </div>
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
            <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span>
            </div>
        </div>
    );
};

const AccuracyMetrics = ({ data }) => {
    const { isDarkMode } = useTheme();

    if (!data) return null;

    const { metrics, sample_size } = data;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>System Accuracy Metrics</h2>
                <span className={`px-3 py-1 text-xs rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                    Thesis Validation
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AccuracyConfigCard
                    title="OTP Validation"
                    value={metrics.otp_accuracy}
                    sampleSize={sample_size.otp_attempts}
                    icon={Shield}
                    color="bg-green-500"
                />
                <AccuracyConfigCard
                    title="FSM Integrity"
                    value={metrics.fsm_integrity}
                    sampleSize={sample_size.fsm_transitions}
                    icon={CheckCircle}
                    color="bg-purple-500"
                />
                <AccuracyConfigCard
                    title="GPS Precision"
                    value={metrics.gps_average_precision_meters}
                    sampleSize={sample_size.gps_points}
                    unit="m"
                    icon={MapPin}
                    color="bg-blue-500"
                />
                <AccuracyConfigCard
                    title="WebSocket Delivery"
                    value={metrics.websocket_delivery_rate}
                    sampleSize={sample_size.ws_events}
                    icon={Radio}
                    color="bg-orange-500"
                />
            </div>

            <div className={`mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} italic text-center`}>
                * Metrics computed in real-time from system instrumentation logs
            </div>
        </div>
    );
};

export default AccuracyMetrics;
