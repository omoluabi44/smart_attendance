"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { montserrat } from "@/app/ui/fonts";
import { 
    PhotoIcon, 
    DocumentArrowDownIcon, 
    ArrowPathIcon, 
    CheckBadgeIcon,
    UserGroupIcon 
} from "@heroicons/react/24/outline";

export default function AttendanceDashboard() {
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const API_URL = "https://face.coursepass.app/api/v1/";

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImages([...images, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const resetScanner = () => {
        setImages([]);
        setPreviews([]);
        setAttendanceData(null);
    };

    const handleVerify = async () => {
        if (images.length === 0) return toast.error("Please upload photos first.");
        setLoading(true);
        
        const formData = new FormData();
        images.forEach((img) => formData.append("image", img));

        try {
            const response = await axios.post(`${API_URL}verify-group`, formData);
            console.log(response)
            setAttendanceData(response.data);
            toast.success("Attendance Captured!");
        } catch (error) {
            toast.error(error.response || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setDownloading(true);
        try {
            const response = await axios.post(`${API_URL}export-attendance`, attendanceData, {
                responseType: 'blob' 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_GET201.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Export failed.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Section */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className={`${montserrat.className} text-2xl font-black text-gray-900`}>FacePass</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Applied Electricity • GET 201</p>
                    </div>
                    {attendanceData && (
                        <button 
                            onClick={resetScanner}
                            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition"
                        >
                            <ArrowPathIcon className="h-4 w-4" /> New Scan
                        </button>
                    )}
                </header>

                {/* STEP 1: UPLOAD SECTION (Hidden when data exists) */}
                {!attendanceData && (
                    <div className="bg-white p-8 rounded-3xl  border border-gray-100 animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-gray-800">Take Attendance</h2>
                            <p className="text-gray-500 text-sm mt-1">Upload group photos to identify students</p>
                        </div>

                        <label className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all mb-6">
                            <div className="bg-blue-50 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <PhotoIcon className="h-10 w-10 text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 mt-4">Drop photos here or click to browse</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>

                        {previews.length > 0 && (
                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {previews.map((src, i) => (
                                    <img key={i} src={src} className="h-16 w-full object-cover rounded-xl border-2 border-white " alt="preview" />
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handleVerify}
                            disabled={loading || images.length === 0}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all  flex justify-center items-center gap-3"
                        >
                            {loading ? <ClipLoader color="#fff" size={24} /> : <CheckBadgeIcon className="h-6 w-6" />}
                            {loading ? "Identifying Students..." : "Start Recognition"}
                        </button>
                    </div>
                )}

                {/* STEP 2: RESULT SECTION (Shown only when data exists) */}
                {attendanceData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500 p-2 rounded-full">
                                    <UserGroupIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-900 text-lg">Scan Successful</h3>
                                    <p className="text-emerald-700 text-sm">Review the list below and export your document.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleExport}
                                disabled={downloading}
                                className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all "
                            >
                                {downloading ? <ClipLoader color="#fff" size={18} /> : <DocumentArrowDownIcon className="h-5 w-5" />}
                                Download Excel Report
                            </button>
                        </div>

                        {Object.entries(attendanceData).map(([dept, students]) => (
                            <div key={dept} className="bg-white rounded-3xl  overflow-hidden">
                                <div className="px-8 py-5 bg-gray-200  flex justify-between items-center">
                                    <h3 className="font-black   text-gray-800 uppercase tracking-tighter">{dept}</h3>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                        {students.length} Students
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-8 py-4 text-[10px] font-black  uppercase">S/N</th>
                                                <th className="px-8 py-4 text-[10px] font-black  uppercase">Name</th>
                                                <th className="px-8 py-4 text-[10px] font-black  uppercase">Matric No.</th>
                                                 <th className="px-8 py-4 text-[10px] font-black  uppercase">Lecture days attended</th>
                                                 <th className="px-8 py-4 text-[10px] font-black  uppercase">Percentage %</th>
                                                 <th className="px-8 py-4 text-[10px] font-black  uppercase">eligibility</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {students.map((s, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-4 text-sm font-bold">{i + 1}</td>
                                                    <td className="px-8 py-4 text-sm font-bold ">{s.name}</td>
                                                    <td className="px-8 py-4 text-sm font-medium font-mono">{s.matric}</td>
                                                    <td className="px-8 py-4 text-sm font-medium font-mono">{s.days}</td>
                                                    <td className="px-8 py-4 text-sm font-medium font-mono">{s.percentage}</td>
                                                    <td className="px-8 py-4 text-sm font-medium font-mono">{s.eligibility}</td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}