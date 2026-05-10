import { jwtVerify } from "jose";

export async function verifyToken(token) {
  console.log(token);
  
  if (!token) {
    return null;
  }
  console.log(process.env.JWT_SECRET_KEY);
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    console.log("successful");
    
    return payload;

  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}