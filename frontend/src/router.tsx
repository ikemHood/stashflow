import {
    createRootRouteWithContext,
    createRoute,
    createRouter,
    Outlet,
    redirect
} from '@tanstack/react-router';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { MilestoneProvider } from './context/MilestoneContext';

// Import all screens
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import SignupScreen from './pages/SignupScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import HomeScreen from './pages/HomeScreen';
import AddMilestoneScreen from './pages/AddMilestoneScreen';
import DepositScreen from './pages/DepositScreen';
import WithdrawScreen from './pages/WithdrawScreen';

// Create a root layout component
const RootLayout = () => {
    return (
        <div className="h-[100dvh] flex flex-col bg-gray-50">
            <AuthProvider>
                <MilestoneProvider>
                    <Outlet />
                </MilestoneProvider>
            </AuthProvider>
        </div>
    );
};

// Define context for our router
export interface RouterContext {
    // We can add auth state, etc. here later if needed
}

// Create the root route
const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: RootLayout,
});

// Create routes for each screen
const splashRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: SplashScreen,
});

const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/welcome',
    component: WelcomeScreen,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginScreen,
});

const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: SignupScreen,
});

const forgotPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/forgot-password',
    component: ForgotPasswordScreen,
});

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    component: HomeScreen,
});

const addMilestoneRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/add-milestone',
    component: AddMilestoneScreen,
});

// Routes with parameters
const depositRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/deposit/$milestoneId',
    component: DepositScreen,
});

const withdrawRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/withdraw/$milestoneId',
    component: WithdrawScreen,
});

// Create the router with all routes
const routeTree = rootRoute.addChildren([
    splashRoute,
    welcomeRoute,
    loginRoute,
    signupRoute,
    forgotPasswordRoute,
    homeRoute,
    addMilestoneRoute,
    depositRoute,
    withdrawRoute,
]);

export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});

// Register types for our router
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
} 