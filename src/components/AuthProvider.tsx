"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    updateProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    updateProfile: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClientComponentClient());
    const profileRef = useRef<Profile | null>(null);

    const updateProfile = (updates: Partial<Profile>) => {
        setProfile(prev => {
            const updated = prev ? { ...prev, ...updates } : null;
            profileRef.current = updated;
            return updated;
        });
    };

    useEffect(() => {
        const supabase = supabaseRef.current;
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);

                // Fetch profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    profileRef.current = profileData;
                }
            }

            setLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
            setUser(session?.user ?? null);
            if (session?.user && !profileRef.current) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (profileData) {
                    setProfile(profileData);
                    profileRef.current = profileData;
                }
            } else if (!session?.user) {
                setProfile(null);
                profileRef.current = null;
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
