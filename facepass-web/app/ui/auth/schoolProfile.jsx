"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CPLogo from "../CPLogo";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, GraduationCap, Layers, CheckCircle2, ArrowLeft } from "lucide-react";

export default function SchoolPofile({ title }) {
  const [universitiesData, setUnversitiesData] = useState([]);
  const [uni, setUni] = useState("");
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const [collegeData, setCollegeData] = useState([]);
  const [col, setCol] = useState("");
  const [loadingColleges, setLoadingColleges] = useState(false);

  const [departmentData, setDepartmentData] = useState([]);
  const [dept, setDept] = useState("");
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const searchParams = useSearchParams();
  const [spinner, setSpinner] = useState(false);
  const router = useRouter();
  const userId = searchParams.get("id");

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        setLoadingUniversities(true);
        const response = await axios.get(`${API_URL}universities`);
        const universities = response.data;
        const uniArray = universities.map((uniItem) => ({
          label: uniItem.university,
          value: uniItem.university,
          value2: uniItem.id,
        }));
        setLoadingUniversities(false);
        setUnversitiesData(uniArray);
      } catch (error) {
        toast.error(error?.data?.error || "Unable to load universities registry");
        setLoadingUniversities(false);
      }
    };

    fetchUniversity();
  }, [API_URL]);

  const handleCollege = async (id) => {
    try {
      setLoadingColleges(true);
      const response = await axios.get(`${API_URL}universities/${id}/college`);
      const colleges = response.data;
      const collegeArray = colleges.map((colItem) => ({
        label: colItem.college,
        value: colItem.college,
        value2: colItem.id,
      }));

      setCollegeData(collegeArray);
      setLoadingColleges(false);
    } catch (error) {
      setLoadingColleges(false);
    }
  };

  const handleDepartment = async (id) => {
    try {
      setLoadingDepartments(true);
      const response = await axios.get(`${API_URL}college/${id}/department`);

      const department = response.data;
      const departmentArray = department.map((deptItem) => ({
        label: deptItem.department,
        value: deptItem.department,
        value2: deptItem.id,
      }));

      setDepartmentData(departmentArray);
      setLoadingDepartments(false);
    } catch (error) {
      setLoadingDepartments(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSpinner(true);

    try {
      const response = await axios.post(`${API_URL}auth/university/${userId}`, {
        university: uni,
        College: col,
        department: dept,
        level: "100",
      });

      toast.success(response?.data?.message || "Institutional profile bound successfully");
      setSpinner(false);
      router.push(`/login`);
    } catch (error) {
      setSpinner(false);
      toast.error(error?.response?.data?.error || "Unable to complete institutional binding");
    }
  };

  return (
    <div className="flex items-center justify-center w-full px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Top Step Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <span className="text-[11px] font-mono text-emerald-600 font-semibold uppercase tracking-wider">
            STEP 02 OF 02 // INSTITUTIONAL BINDING
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
            <div className="h-1.5 flex-1 rounded-full bg-blue-500" />
          </div>

          <div className="mb-6">
            <CPLogo theme="light" size="md" />
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Academic Unit Assignment
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Select your institution and department to synchronize CoursePass student rosters.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* UNIVERSITY DROPDOWN */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  University / Institution
                </span>
                {loadingUniversities && <ClipLoader size={12} color="#0f172a" />}
              </label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 transition focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={uni}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setUni(selectedName);
                  setCol("");
                  setDept("");

                  const selectedItem = universitiesData.find(
                    (item) => item.value === selectedName
                  );

                  if (selectedItem) {
                    handleCollege(selectedItem.value2);
                  }
                }}
                required
              >
                <option value="">Select University</option>
                {universitiesData.map((data, id) => (
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>

            {/* COLLEGE DROPDOWN */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  College / Faculty
                </span>
                {loadingColleges && <ClipLoader size={12} color="#0f172a" />}
              </label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 transition focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                value={col}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setCol(selectedName);
                  setDept("");

                  const selectedItem = collegeData.find(
                    (item) => item.value === selectedName
                  );

                  if (selectedItem) {
                    handleDepartment(selectedItem.value2);
                  }
                }}
                required
                disabled={!uni}
              >
                <option value="">
                  {uni ? "Select College or Faculty" : "Select University first"}
                </option>
                {collegeData.map((data, id) => (
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>

            {/* DEPARTMENT DROPDOWN */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  Academic Department
                </span>
                {loadingDepartments && <ClipLoader size={12} color="#0f172a" />}
              </label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 transition focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required
                disabled={!col}
              >
                <option value="">
                  {col ? "Select Academic Department" : "Select College first"}
                </option>
                {departmentData.map((data, id) => (
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary preview when selected */}
            {uni && col && dept && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-semibold block">Ready to bind unit:</span>
                  <span className="font-mono text-[11px] text-emerald-800">
                    {uni} → {col} → {dept}
                  </span>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={spinner}
                className={`w-full rounded-xl ${
                  spinner
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition flex justify-center items-center gap-2`}
              >
                {spinner && <ClipLoader color="#fff" size={16} />}
                {spinner ? "Binding Academic Unit..." : "Complete Lecturer Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
