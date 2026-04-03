"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/config/supabase/client";
import { User, Mail, Trash2 } from "lucide-react";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

async function fetchAccountProfile(): Promise<{ profile: Profile | null; fullName: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { profile: null, fullName: "" };

    const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", user.id)
        .single();
    
    const googleIdentity = user.identities?.find(i => i.provider === "google");
    const identityData = googleIdentity?.identity_data;
    
    const avatarUrl = 
        data?.avatar_url || 
        user.user_metadata?.avatar_url || 
        user.user_metadata?.picture ||
        identityData?.avatar_url ||
        identityData?.picture;
    
    const fullName = 
        data?.full_name || 
        user.user_metadata?.full_name || 
        user.user_metadata?.name ||
        identityData?.full_name ||
        identityData?.name;
    
    const email = data?.email || user.email;
    
    return {
        profile: {
            id: user.id,
            full_name: fullName || null,
            email: email || null,
            avatar_url: avatarUrl || null
        },
        fullName: fullName || ""
    };
}

export default function AccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [formData, setFormData] = useState({ full_name: "" });
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const fetchTriggered = useState(() => {
        fetchAccountProfile().then(({ profile, fullName }) => {
            setProfile(profile);
            setFormData({ full_name: fullName });
            setLoading(false);
        });
        return true;
    })[0];
    void fetchTriggered;

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase
            .from("profiles")
            .update({ full_name: formData.full_name })
            .eq("id", profile.id);

        if (error) {
            setMessage({ type: "error", text: "Failed to update profile" });
        } else {
            setProfile({ ...profile, full_name: formData.full_name });
            setMessage({ type: "success", text: "Profile updated successfully" });
        }
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        setMessage(null);
        
        const supabase = createClient();
        const { error } = await supabase.rpc("delete_user");
        
        if (error) {
            setMessage({ type: "error", text: "Failed to delete account. Please try again." });
            setDeleting(false);
            setShowDeleteConfirm(false);
        } else {
            await supabase.auth.signOut();
            window.location.href = "/";
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-[#171d2b] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <header className="mb-8">
                <h1 className="font-serif text-[32px] sm:text-[40px] text-[#171d2b] mb-2">
                    Account Settings
                </h1>
                <p className="font-sans text-[16px] text-[#171d2b]/60">
                    Manage your profile and preferences
                </p>
            </header>

            <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 mb-6">
                    <h2 className="font-serif text-[20px] text-[#171d2b] mb-6">Profile</h2>
                    
                    <div className="flex items-center gap-6 mb-6">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#171d2b] to-[#2a3347] flex items-center justify-center text-white font-sora text-xl">
                                {getInitials(profile?.full_name ?? null)}
                            </div>
                        )}
                        <div>
                            <p className="font-sans text-[16px] font-medium text-[#171d2b]">
                                {profile?.full_name || "No name set"}
                            </p>
                            <p className="font-sans text-[14px] text-[#171d2b]/60">
                                {profile?.email}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 font-sans text-[14px] text-[#171d2b]/70 mb-2">
                                <User size={16} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#171d2b]/10 bg-[#f0f0ea] font-sans text-[15px] text-[#171d2b] focus:outline-none focus:border-[#171d2b]/30 transition-colors"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 font-sans text-[14px] text-[#171d2b]/70 mb-2">
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile?.email || ""}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-[#171d2b]/10 bg-[#e5e5e0] font-sans text-[15px] text-[#171d2b]/50 cursor-not-allowed"
                            />
                            <p className="font-sans text-[12px] text-[#171d2b]/40 mt-1">
                                Email cannot be changed
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className={`mt-4 px-4 py-3 rounded-xl font-sans text-[14px] ${
                            message.type === "success" 
                                ? "bg-green-50 text-green-700 border border-green-200" 
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="mt-6 px-6 py-3 bg-[#171d2b] text-white font-sans text-[15px] font-medium rounded-xl hover:bg-[#2a3347] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-red-200 p-6">
                    <h2 className="font-serif text-[20px] text-red-600 mb-2">Danger Zone</h2>
                    <p className="font-sans text-[14px] text-[#171d2b]/60 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-sans text-[14px] font-medium rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={16} />
                        Delete Account
                    </button>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="font-serif text-[20px] text-[#171d2b] mb-2">Delete Account?</h3>
                        <p className="font-sans text-[14px] text-[#171d2b]/60 mb-6">
                            This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-[#f0f0ea] text-[#171d2b] font-sans text-[14px] font-medium rounded-xl hover:bg-[#e5e5e0] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-sans text-[14px] font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
