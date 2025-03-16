import {
    createRootRouteWithContext,
    createRoute,
    createRouter,
    Outlet,
} from '@tanstack/react-router';
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
import SetPinScreen from './pages/SetPinScreen';
import PinVerificationScreen from './pages/PinVerificationScreen';
import SavingsScreen from './pages/SavingsScreen';
import MilestoneDetailScreen from './pages/MilestoneDetailScreen';
import ProfileScreen from './pages/ProfileScreen';

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

// PIN-related routes
const setPinRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/pin/set',
    component: SetPinScreen,
});

const pinVerificationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/pin/verify',
    component: PinVerificationScreen,
});

// Add routes for savings screens
const savingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/savings',
    component: SavingsScreen,
});

const milestoneDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/savings/$milestoneId',
    component: MilestoneDetailScreen,
});

// Add route for profile screen
const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: ProfileScreen,
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
    setPinRoute,
    pinVerificationRoute,
    savingsRoute,
    milestoneDetailRoute,
    profileRoute,
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