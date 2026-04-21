import { lazy } from 'react';

// Lazy Loaded Pages
export const HomePage = lazy(() => import('@/pages/HomePage'));
export const LoginPage = lazy(() => import('@/pages/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
export const CiudadanoDashboard = lazy(() => import('@/pages/CiudadanoDashboard'));
