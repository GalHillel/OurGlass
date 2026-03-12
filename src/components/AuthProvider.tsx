"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getNow } from "@/demo/demo-config";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { useDashboardStore } from "@/stores/dashboardStore";
import { DEMO_MODE } from "@/demo/demo-config";
import { MOCK_PROFILE, MOCK_USER_ID_GAL } from "@/demo/mock-data";

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
    const [user, setUser] = useState<User | null>(() => {
        if (DEMO_MODE) {
            return {
                id: MOCK_USER_ID_GAL,
                email: "demo@ourglass.io",
                user_metadata: { full_name: MOCK_PROFILE.name },
                aud: 'authenticated',
                created_at: getNow().toISOString(),
                app_metadata: {}
            } as User;
        }
        return null;
    });
    const [profile, setProfile] = useState<Profile | null>(() => {
        if (DEMO_MODE) return MOCK_PROFILE;
        return null;
    });
    const [loading, setLoading] = useState(!DEMO_MODE);
    const supabaseRef = useRef(createClient());
    const profileRef = useRef<Profile | null>(DEMO_MODE ? MOCK_PROFILE : null);

    const initializeFromProfile = useDashboardStore(s => s.initializeFromProfile);

    const updateProfile = (updates: Partial<Profile>) => {
        setProfile(prev => {
            const updated = prev ? { ...prev, ...updates } : null;
            profileRef.current = updated;
            return updated;
        });
    };

    useEffect(() => {
        if (profile) {
            initializeFromProfile(profile);
        }
    }, [profile, initializeFromProfile]);

    useEffect(() => {
        if (DEMO_MODE) return;

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
            if (session?.user && !profileRef.current) {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profileData) {
                    setProfile(profileData);
                    profileRef.current = profileData;
                } else if (!error) {
                    // Fallback: Create profile if it doesn't exist (trigger should handle this, but for robustness)
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            name: session.user.user_metadata?.full_name || 'User',
                            couple_id: crypto.randomUUID(),
                            onboarding_completed: false
                        })
                        .select()
                        .single();

                    if (!insertError && newProfile) {
                        setProfile(newProfile);
                        profileRef.current = newProfile;
                    }
                }
            } else if (!session?.user) {
                setProfile(null);
                profileRef.current = null;
            }
        });


        return () => {
            subscription.unsubscribe();
        };
    }, [initializeFromProfile]);

    return (
        <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
