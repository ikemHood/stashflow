import React, { createContext, useContext, useState } from 'react';

// Define the available screens in the app
export type Screen =
    | 'splash'
    | 'welcome'
    | 'login'
    | 'signup'
    | 'forgotPassword'
    | 'home'
    | 'addMilestone'
    | 'depositFunds'
    | 'withdrawFunds';

interface NavigationContextType {
    currentScreen: Screen;
    previousScreen: Screen | undefined;
    params: Record<string, any>;
    navigateTo: (screen: Screen, params?: Record<string, any>) => void;
    goBack: () => void;
}

// Create the context with a default undefined value
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Custom hook to use the navigation context
export const useNavigation = (): NavigationContextType => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

interface NavigationProviderProps {
    children: React.ReactNode;
    initialScreen?: Screen;
}

// Provider component to wrap the app with
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
    children,
    initialScreen = 'splash'
}) => {
    const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
    const [previousScreen, setPreviousScreen] = useState<Screen | undefined>(undefined);
    const [params, setParams] = useState<Record<string, any>>({});

    const navigateTo = (screen: Screen, newParams: Record<string, any> = {}) => {
        setPreviousScreen(currentScreen);
        setCurrentScreen(screen);
        setParams(newParams);
    };

    const goBack = () => {
        if (previousScreen) {
            setCurrentScreen(previousScreen);
            setPreviousScreen(undefined);
            setParams({});
        }
    };

    const value = {
        currentScreen,
        previousScreen,
        params,
        navigateTo,
        goBack
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}; 