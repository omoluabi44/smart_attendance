'use client'

import {useState} from "react";
// import Explore from "../explore/explore";
// import Dashboard from "./dashboard";

export default function Toggle() {
    const [active, setActive] = useState("explore");

    return (
        <>
            <main className="bg-gray-100 m-3">
          
                <div className="w-full my-3">
                    <div className="bg-gray-200 h-10  rounded border-lg   flex flex-row ">

                        <button
                            onClick={() => {
                                setActive("Outline")
                               
                            }}
                            className={`text-center rounded w-1/2 ${active === "Outline" ? "bg-white font-bold shadow-md" : "text-gray-500"} `}>
                            <h1 className=""> Outlines</h1>
                        </button>
                        <button
                            onClick={() => {
                                setActive("Materials")
                               
                            }}
                            className={`text-center rounded-lg w-1/2 ${active === "Materials" ? "bg-white font-bold shadow-md" : "text-gray-500"} `}>
                            <h1> Materials</h1>
                        </button>
                    </div>

                </div>

                {active ==="explore"? 
             <div>
                explores
             </div>
                
                :
                <div>Dashaboard</div>
                }
            </main>
        </>
    )
}
