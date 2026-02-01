"use client"

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import axios from "axios";
import {useAppDispatch, useAppSelector} from '@/app/lib/hooks';
import {login, logout} from "../../lib/features/user/userStore"
import Cookies from "js-cookie";
import Link from "next/link";

const Redirect = () => {
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const dispatch = useAppDispatch();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await axios.get(`${API_URL}auth/session`, {
                    withCredentials: true,
                });


                console.log(response);



                Cookies.set("refresh_token_cookies", response.data.tokens.refresh_token_cookie, {expires: 7});
                dispatch(login(
                    {
                        id: response.data.user.id,
                        access_token: response.data.tokens.access,
                        email: response.data.user.email,
                        profile_url: response.data.user.profile_url,
                        isLoggedIn: true

                    }))


                if (response.data.is_new === true) {


                    router.push(`/registration?firstname=${response.data.user.first_name}&lastname=${response.data.user.last_name}&username=${response.data.username}&is_new=${true}`);
                    return
                }
                router.push("/dashboard");


            } catch (err) {
                console.log(err);
                router.push("/login")

            }
        };

        fetchSession();
    }, [router]);




    return (
        <main>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
            </div>
        </main>
    );
};

export default Redirect;
