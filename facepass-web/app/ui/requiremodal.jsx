"use client";

import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
  Upload, FileText, ChevronRight, Lock,
  CheckCircle2, Loader2, Sparkles, FileUp, Search
} from 'lucide-react';
import axios from 'axios';
import {useAppDispatch, useAppSelector} from '../lib/hooks';
import {toast} from 'react-toastify';


const DashboardGateModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  // steps: selection -> search -> upload -> loading -> success
  const [step, setStep] = useState('selection');
  const [uploadType, setUploadType] = useState(null); // 'handbook' or 'pastquestion'
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const userID = useAppSelector((state) => state.user.id);
  const uni = useAppSelector((state) => state.school.uni);


  const fileInputRef = useRef(null);

  useEffect(() => {
    const hasAccess = localStorage.getItem('coursepass_unlockeded');
    if (!hasAccess) setIsOpen(true);
  }, []);

  const handleCourseSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      // Calling your specific local endpoint
      const response = await axios.get(`https://api.coursepass.app/api/v1/courses/${searchQuery}`);
      console.log("hello");
      if (response) {
        console.log(response.data.course_id);

        setCourseData(response.data.course_id); // Save the returned course object
        setStep('upload'); // Proceed to upload step
        toast.success(`Course Verified: ${response.data.course_id}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Course not found. Try with or without spaces (e.g., GET 201).");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType || !courseData) return;

    setStep('loading');
// "https://api.coursepass.app/api/v1/ai/note"
//  "https://api.coursepass.app/api/v1/ai/generate_from_pastquestion";
    const endpoint = uploadType === 'lecture_note'
      ? "https://api.coursepass.app/api/v1/ai/note"
      : `https://api.coursepass.app/api/v1/ai/generate_from_pastquestion/${userID}/${uni}`;

    const finalFileName = uploadType === 'lecture_note' ? 'lecture_note' : 'pastquestion';

    const formData = new FormData();
    formData.append(finalFileName, selectedFile, selectedFile.name);

    formData.append('courseID', courseData);
    formData.append("universityID", uni)
     formData.append("userID", userID)
    try {
      await axios.post(endpoint, formData);
      localStorage.setItem('coursepass_unlockeded', 'true');
      setStep('success');

      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.log(error);
      
      toast.error(error.response?.data?.error || `${error}Upload failed. Try again.`);
      setStep('upload');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <AnimatePresence mode="wait">

        {/* STEP 1: INITIAL SELECTION */}
        {step === 'selection' && (
          <motion.div
            key="selection"
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, x: -20}}
            className="w-full max-w-lg bg-white rounded-[32px] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Lock size={28} className="text-[#007BFF]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Vibe check? <span className="text-[#007BFF]">Locked.</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Drop a resource to unlock your full dashboard access.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <button
                onClick={() => {setUploadType('lecture_note'); setStep('search');}}
                className="group w-full flex items-center justify-between p-6 rounded-2xl border-2 border-gray-100 hover:border-[#007BFF] transition-all bg-white"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="text-gray-400 group-hover:text-[#007BFF]" />
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Upload Lecture Note</p>
                    <p className="text-xs text-gray-400">PDF only</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-[#007BFF] transition-transform group-hover:translate-x-1" size={20} />
              </button>

              <button
                onClick={() => {setUploadType('pastquestion'); setStep('search');}}
                className="group w-full flex items-center justify-between p-6 rounded-2xl border-2 border-gray-100 hover:border-[#007BFF] transition-all bg-white"
              >
                <div className="flex items-center space-x-4">
                  <Upload className="text-gray-400 group-hover:text-[#007BFF]" />
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Upload Past Questions</p>
                    <p className="text-xs text-gray-400">PDF only</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-[#007BFF] transition-transform group-hover:translate-x-1" size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SEARCH COURSE */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -20}}
            className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <button
              onClick={() => setStep('selection')}
              className="text-gray-400 hover:text-gray-900 font-bold text-xs uppercase tracking-widest mb-6"
            >
              Back
            </button>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Find your course</h3>
            <p className="text-gray-500 mb-8 font-medium">Which course is this resource for?</p>

            <form onSubmit={handleCourseSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. GET 201"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#007BFF] focus:outline-none font-bold text-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery}
                className="w-full py-4 bg-[#007BFF] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-blue-100 active:scale-[0.98] transition-transform"
              >
                {isSearching ? <Loader2 className="animate-spin" size={20} /> : <span>Verify Course</span>}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 3: FILE UPLOAD ZONE */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, scale: 0.95}}
            className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => {setStep('search'); setSelectedFile(null);}}
                className="text-gray-400 hover:text-gray-900 font-bold text-sm uppercase tracking-widest"
              >
                Back
              </button>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Linked Course</span>
                <h3 className="font-black text-lg text-[#007BFF]">{courseData?.courseID}</h3>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-100 rounded-[28px] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/30 hover:border-[#007BFF] transition-all group"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
              <div className="p-5 bg-blue-50 text-[#007BFF] rounded-full mb-4 group-hover:scale-110 transition-transform">
                <FileUp size={32} />
              </div>
              <p className="text-gray-900 font-bold text-center break-all px-4">
                {selectedFile ? selectedFile.name : "Tap to select PDF"}
              </p>
              <p className="text-gray-400 text-xs mt-2 font-medium">Size limit: 30MB</p>
            </div>

            <button
              disabled={!selectedFile}
              onClick={handleUpload}
              className={`w-full mt-8 py-4 rounded-2xl font-black text-white transition-all uppercase tracking-widest text-sm ${selectedFile ? 'bg-[#007BFF] shadow-xl shadow-blue-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Drop it like it's hot 🔥
            </button>
          </motion.div>
        )}

        {/* STEP 4: LOADING */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}
            className="flex flex-col items-center bg-white p-16 rounded-[40px] shadow-2xl text-center"
          >
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 text-[#007BFF] animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-200" />
            </div>
            <p className="font-black text-gray-900 text-2xl tracking-tighter">Uploading vibes...</p>
            <p className="text-gray-400 mt-2 font-medium">Securing the cloud for the homies.</p>
          </motion.div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}}
            className="flex flex-col items-center bg-white p-16 rounded-[40px] text-center shadow-2xl border border-green-50"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Vibe Checked! ✅</h2>
            <p className="text-gray-500 mt-2 font-medium">Access granted. Go lock in. 🤝</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default DashboardGateModal;