"use client";

import { createContext, useContext } from "react";
import { DEMO_USER } from "@/lib/demoData";

interface AuthContextType {
    user: any;
    profile: any;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Static demo mode - always return demo user
    return (
        <AuthContext.Provider value={{
            user: DEMO_USER,
            profile: DEMO_USER,
            loading: false
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
