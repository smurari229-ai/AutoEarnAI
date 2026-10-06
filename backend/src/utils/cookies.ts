import type {Response } from "express";
import { env } from "../config/env.js";
const secure=env.NODE_ENV==="production";
export function setAuthCookies(res:Response,accessToken:string,refreshToken:string){res.cookie("accessToken",accessToken,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:15*60*1000});res.cookie("refreshToken",refreshToken,{httpOnly:true,secure,sameSite:"lax",path:"/api/auth",maxAge:30*24*60*60*1000});}
export function clearAuthCookies(res:Response){res.clearCookie("accessToken",{httpOnly:true,secure,sameSite:"lax",path:"/"});res.clearCookie("refreshToken",{httpOnly:true,secure,sameSite:"lax",path:"/api/auth"});}
