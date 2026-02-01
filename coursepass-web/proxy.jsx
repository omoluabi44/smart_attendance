import { NextResponse } from "next/server";
import { verifyToken } from "./app/lib/auth";
import { jwtVerify } from "jose";

export async function proxy(req) {

  
  const token = req.cookies.get("refresh_token_cookies")?.value;

  
  const { pathname } = req.nextUrl;

  

  const isAuth = await verifyToken(token);

  


  const protectedRoutes = ["/dashboard", "/profile"];

  const publicOnlyRoutes = ["/login", "/register"];

  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If trying to access a public-only route with a valid token, redirect to dashboard
  if (publicOnlyRoutes.some(route => pathname.startsWith(route)) && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/login", "/register"],
};