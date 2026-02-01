// import React, { useState } from 'react';
// // Import the main components from react-pdf
// import { Document, Page, pdfjs } from 'react-pdf';

// // Import the required CSS files
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';

// // Set up the worker
// // Note: This path might need adjustment based on your project's public folder structure
// pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// const PdfPreviewer = ({ pdfUrl, name }) => {
//   // --- NO LOGIC CHANGES HERE ---
//   const [numPages, setNumPages] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const onDocumentLoadSuccess = ({ numPages }) => {
//     setNumPages(numPages);
//   };

//   const openModal = () => setIsModalOpen(true);
//   const closeModal = () => setIsModalOpen(false);
//   // --- END OF LOGIC ---

//   return (
//     <div className='m-2'>

//       <div
//         onClick={openModal}
//         className="group w-56 cursor-pointer rounded border border-gray-200 bg-white p-2 text-center shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl"
//       >

//         <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-gray-50">
//           <Document
//             file={pdfUrl}
//             onLoadError={console.error}
//             loading={
//               <div className="p-4 text-sm text-gray-500">
//                 Loading preview...
//               </div>
//             }
//           >
       
//             <Page pageNumber={1} renderTextLayer={false} width={208} />
//           </Document>

//           <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
//             <span className="font-semibold text-white">View Fullscreen</span>
//           </div>
//         </div>
//         <h3 className="mt-3 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-base font-medium text-gray-800">
//           {name}
//         </h3>
//       </div>

//       {/* ========================================
//         2. The Full PDF Modal (UI Improved)
//         ========================================
//       */}
//       {isModalOpen && (
//         <div
//           // Modal Overlay
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
//           onClick={closeModal}
//         >
//           <div
//             // Modal Content
//             // UI-IMPROVEMENT: Added `overflow-hidden` and removed `p-5` to allow for a separate header/content structure.
//             className="relative flex h-[90vh] w-11/12 max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
//             onClick={(e) => e.stopPropagation()} // Prevent modal from closing on content click
//           >
//             {/* UI-IMPROVEMENT: 
//               - Added a dedicated modal header for title and close button.
//             */}
//             <div className="flex items-center justify-between border-b border-gray-200 p-4">
//               <h2 className="truncate text-lg font-semibold text-gray-900">
//                 {name}
//               </h2>
//               <button
//                 // UI-IMPROVEMENT: Cleaner, non-destructive close button.
//                 onClick={closeModal}
//                 className="flex h-8 w-8 items-center justify-center rounded-full text-2xl text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-800"
//               >
//                 &times;
//               </button>
//             </div>

//             {/* UI-IMPROVEMENT: 
//               - This div is now the dedicated scrolling area.
//               - `h-[calc(90vh-65px)]` subtracts the header height (approx 65px) from the total.
//               - `bg-gray-100` provides a subtle background for the pages.
//             */}
//             <div className="h-[calc(90vh-65px)] overflow-y-auto bg-gray-100 p-4">
//               <Document
//                 file={pdfUrl}
//                 onLoadSuccess={onDocumentLoadSuccess}
//                 loading={
//                   <div className="p-8 text-center text-gray-500">
//                     Loading PDF...
//                   </div>
//                 }
//                 className="flex flex-col items-center"
//               >
//                 {Array.from(new Array(numPages), (el, index) => (
//                   // UI-IMPROVEMENT: Wrapped Page in a div to add spacing and the page number.
//                   <div
//                     key={`page_wrapper_${index + 1}`}
//                     className="mb-4 last:mb-0"
//                   >
//                     <Page
//                       key={`page_${index + 1}`}
//                       pageNumber={index + 1}
//                       // UI-IMPROVEMENT: Removed the `width` prop.
//                       // The page will now scale to fit its container, constrained by the modal's `max-w-4xl`.
//                       // This is fully responsive.
//                       className="shadow-md"
//                     />
//                     {/* UI-IMPROVEMENT: 
//                       - Added page numbering for better usability.
//                     */}
//                     {numPages && (
//                       <p className="mt-2 text-center text-sm text-gray-600">
//                         Page {index + 1} of {numPages}
//                       </p>
//                     )}
//                   </div>
//                 ))}
//               </Document>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PdfPreviewer;