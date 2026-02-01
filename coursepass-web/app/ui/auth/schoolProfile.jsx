"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import CPLogo from "../CPLogo";
import {montserrat} from "@/app/ui/fonts";
import {ClipLoader} from "react-spinners";
import {useEffect} from "react";
import {toast} from 'react-toastify';
import axios from 'axios'
import {useSearchParams} from "next/navigation";
import {useRouter} from "next/navigation";
import {useAppDispatch, useAppSelector} from '../../lib/hooks';


export default function SchoolPofile({title}) {
  const [universitiesData, setUnversitiesData] = useState([])
  const [uni, setUni] = useState("")
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const [collegeData, setCollegeData] = useState([])
  const [col, setCol] = useState("")
  const [loadingColleges, setLoadingColleges] = useState(false);

  const [departmentData, setDepartmentData] = useState([])
  const [dept, setDept] = useState("")
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  // const userId = useAppSelector((state) => state.user.id);


    const API_URL = process.env.NEXT_PUBLIC_API_URL 


  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [spinner, setSpinner] = useState(false)
  const router = useRouter();
  const userId = searchParams.get("id");
  
 

  console.log(userId);


  useEffect(() => {
    const fetchUniversity = async () => {

      try {
        setLoadingUniversities(true)
        const response = await axios.get(`${API_URL}universities`);
        console.log(response);

        const universities = response.data
        const uniArray = universities.map((uni) => ({
          label: uni.university,
          value: uni.university,
          value2: uni.id
        }));
        setLoadingUniversities(false)
        setUnversitiesData(uniArray)


      } catch (error) {
        toast.error(error?.data?.error || "error ");
        setLoadingUniversities(false)

      }
    }

    fetchUniversity()
  }, [])
  const handleCollege = async (id) => {

    try {
      setLoadingColleges(true)
      const response = await axios.get(`${API_URL}universities/${id}/college`);
      console.log(response);
      const colleges = response.data
      const collegeArray = colleges.map((col) => ({
        label: col.college,
        value: col.college,
        value2: col.id
      }));


      setCollegeData(collegeArray)
      setLoadingColleges(false)


    } catch (error) {
      setLoadingColleges(false)

    }
  }

  const handleDepartment = async (id) => {

    try {
      setLoadingDepartments(true)
      const response = await axios.get(`${API_URL}college/${id}/department`);

      const department = response.data
      const departmentArray = department.map((dept) => ({
        label: dept.department,
        value: dept.department,
        value2: dept.id

      }));
      console.log(departmentArray);

      setDepartmentData(departmentArray)
      setLoadingDepartments(false)


    } catch (error) {

    }
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    setSpinner(true)
    console.log("success");

    try {
      const response = await axios.post(`${API_URL}auth/university/${userId}`, {
        university: uni,
        College: col,
        department: dept,
        level: "100",

      });


      toast.success(response?.data?.message || "Successful");
      setSpinner(false)
      router.push(`/login`);

    } catch (error) {
      setSpinner(false)
      console.log(error.status);
      if (error.status == -400) {
        router.push(`/login`);
      }

      toast.error(error?.response?.data?.error || "Something went wrong")

    }


  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">


      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex justify-center mb-4 sm:mb-6">
          <CPLogo />
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <p className={`${montserrat.className} text-xl sm:text-2xl md:text-3xl font-bold`}>
            Education Details
          </p>
          <p className={`${montserrat.className} text-xs sm:text-sm text-gray-600`}>
            Enter your university details to help us set up your student profile.
          </p>
        </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {/* UNIVERSITY DROPDOWN */}
          <div className="relative flex gap-2 items-center">
            <div className="flex-grow">
              <select
                className="peer block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={uni}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setUni(selectedName); // 1. Save Name to State

                  // 2. Find the ID from your data array
                  const selectedItem = universitiesData.find(
                    (item) => item.value === selectedName
                  );

                  // 3. Pass the ID to the function
                  if (selectedItem) {
                    handleCollege(selectedItem.value2);
                  }
                }}
                required
              >
                <option value="">Select a University</option>
                {universitiesData.map((data, id) => (
                  // CRITICAL FIX: value must be data.value (Name) for the find() to work
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>
            {loadingUniversities && <div className="flex-shrink-0"><ClipLoader size={20} color="#2563eb" /></div>}
          </div>

          {/* COLLEGE DROPDOWN */}
          <div className="relative flex gap-2 items-center">
            <div className="flex-grow">
              <select
                className="peer block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={col}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setCol(selectedName); // 1. Save Name

                  const selectedItem = collegeData.find(
                    (item) => item.value === selectedName
                  );

                  if (selectedItem) {
                    handleDepartment(selectedItem.value2); // 2. Fetch using ID
                  }
                }}
                required
                disabled={!uni} // Disable if no university selected
              >
                <option value="">Select College</option>
                {collegeData.map((data, id) => (
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>
            {loadingColleges && <div className="flex-shrink-0"><ClipLoader size={20} color="#2563eb" /></div>}
          </div>

          {/* DEPARTMENT DROPDOWN */}
          <div className="relative flex gap-2 items-center">
            <div className="flex-grow">
              <select
                className="peer block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required
                disabled={!col} // Disable if no college selected
              >
                <option value="">Select Department</option>
                {departmentData.map((data, id) => (
                  <option key={id} value={data.value}>
                    {data.value}
                  </option>
                ))}
              </select>
            </div>
            {loadingDepartments && <div className="flex-shrink-0"><ClipLoader size={20} color="#2563eb" /></div>}
          </div>

          {/* SUBMIT BUTTON */}
          <div>
            <button
              type="submit"
              disabled={spinner}
              className={`w-full rounded-lg ${spinner ? "bg-blue-400 hover:bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                } px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition flex justify-center items-center gap-2`}
            >
              {spinner && <ClipLoader color="#fff" size={16} />}
              {spinner ? "Processing..." : "Finish Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}