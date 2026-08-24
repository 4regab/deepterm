"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/config/supabase/client";
import { User, Mail, Trash2, AlertTriangle } from "lucide-react";
import { Button, Modal, Toast } from "@/components/ui";
import {
    requestAccountDeletionAction,
    cancelAccountDeletionAction,
    getAccountDeletionStatusAction,
} from "./actions";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

interface DeletionStatus {
    pending: boolean;
    deletedAt?: string;
    finalizeAt?: string;
}

const REQUIRED_PHRASE = "delete my account";

function formatDate(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

async function fetchAccountProfile(): Promise<{
    profile: Profile | null;
    fullName: string;
    deletion: DeletionStatus;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { profile: null, fullName: "", deletion: { pending: false } };

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

    // Ask the server for authoritative deletion state (RLS-protected RPC).
    const deletion = await getAccountDeletionStatusAction();
    
    return {
        profile: {
            id: user.id,
            full_name: fullName || null,
            email: email || null,
            avatar_url: avatarUrl || null
        },
        fullName: fullName || "",
        deletion,
    };
}

export default function AccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [formData, setFormData] = useState({ full_name: "" });
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [loading, setLoading] = useState(true);
    const [deletion, setDeletion] = useState<DeletionStatus>({ pending: false });
    const [cancelling, setCancelling] = useState(false);
    const fetchTriggered = useState(() => {
        fetchAccountProfile().then(({ profile, fullName, deletion }) => {
            setProfile(profile);
            setFormData({ full_name: fullName });
            setDeletion(deletion);
            setLoading(false);
        });
        return true;
    })[0];
    void fetchTriggered;

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setMessage(null);

        // Sanitize: strip HTML tags to prevent stored XSS
        const sanitizedName = formData.full_name.replace(/<[^>]*>/g, '').trim();
        if (!sanitizedName) {
            setMessage({ type: "error", text: "Enter a name using plain text." });
            setSaving(false);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("profiles")
            .update({ full_name: sanitizedName })
            .eq("id", profile.id);

        if (error) {
            setMessage({ type: "error", text: "Unable to save. Check your connection and try again." });
        } else {
            setProfile({ ...profile, full_name: sanitizedName });
            setFormData({ full_name: sanitizedName });
            setMessage({ type: "success", text: "Saved" });
        }
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        setMessage(null);

        const result = await requestAccountDeletionAction({
            confirmationPhrase: deleteConfirmText,
        });

        if (!result.ok) {
            let text = "Unable to delete the account. Check your connection and try again.";
            if (result.error === "phrase_mismatch") text = "Type delete my account exactly to confirm.";
            else if (result.error === "rate_limited") text = "A deletion request was already sent in the last 24 hours. Try again tomorrow.";
            else if (result.error === "not_authenticated") text = "Session expired. Sign in and try again.";
            setMessage({ type: "error", text });
            setDeleting(false);
            setShowDeleteConfirm(false);
            setDeleteConfirmText("");
            return;
        }

        // Sign-out already happened server-side. Drop any local client session too
        // so the browser state matches, then send the user to the homepage.
        const supabase = createClient();
        await supabase.auth.signOut().catch(() => { /* already signed out is fine */ });
        window.location.href = "/";
    };

    const handleCancelDeletion = async () => {
        setCancelling(true);
        setMessage(null);
        const result = await cancelAccountDeletionAction();
        setCancelling(false);
        if (!result.ok) {
            setMessage({ type: "error", text: "Unable to cancel deletion. Check your connection and try again." });
            return;
        }
        setDeletion({ pending: false });
        setMessage({ type: "success", text: "Deletion cancelled. The account stays active." });
    };

    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                <h1 className="font-sans tracking-tight text-[32px] sm:text-[40px] text-foreground mb-2">
                    Account settings
                </h1>
                <p className="font-sans text-[16px] text-muted-foreground">
                    Manage your name and account
                </p>
            </header>

            <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-border p-6 mb-6">
                    <h2 className="font-sans tracking-tight text-[20px] text-foreground mb-6">Profile</h2>
                    
                    <div className="flex items-center gap-6 mb-6">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#2a3347] flex items-center justify-center text-white font-sans text-xl">
                                {getInitials(profile?.full_name ?? null)}
                            </div>
                        )}
                        <div>
                            <p className="font-sans text-[16px] font-medium text-foreground">
                                {profile?.full_name || "No name set"}
                            </p>
                            <p className="font-sans text-[14px] text-muted-foreground">
                                {profile?.email}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="full-name" className="flex items-center gap-2 font-sans text-[14px] text-muted-foreground mb-2">
                                <User size={16} aria-hidden="true" />
                                Full name
                            </label>
                            <input
                                id="full-name"
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-sans text-[15px] text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                                placeholder="Ada Lovelace"
                            />
                        </div>

                        <div>
                            <label htmlFor="account-email" className="flex items-center gap-2 font-sans text-[14px] text-muted-foreground mb-2">
                                <Mail size={16} aria-hidden="true" />
                                Email
                            </label>
                            <input
                                id="account-email"
                                type="email"
                                value={profile?.email || ""}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-border bg-[#e5e5e0] font-sans text-[15px] text-muted-foreground cursor-not-allowed"
                            />
                            <p className="font-sans text-[12px] text-muted-foreground mt-1">
                                Email cannot be changed
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4">
                            <Toast kind={message.type === "success" ? "success" : "error"}>
                                {message.text}
                            </Toast>
                        </div>
                    )}

                    <Button
                        onClick={handleSave}
                        loading={saving}
                        className="mt-6"
                    >
                        Save changes
                    </Button>
                </div>

                <div className="bg-white rounded-2xl border border-red-200 p-6">
                    <h2 className="font-sans tracking-tight text-[20px] text-destructive-foreground mb-2">Delete account</h2>

                    {deletion.pending ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50">
                                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-sans text-[14px] font-medium text-amber-900">
                                        Your account is scheduled for deletion.
                                    </p>
                                    <p className="font-sans text-[13px] text-amber-800/80 mt-1">
                                        Requested {formatDate(deletion.deletedAt)}. We will permanently remove
                                        your data on {formatDate(deletion.finalizeAt)}. You can cancel this
                                        any time before that date.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCancelDeletion}
                                loading={cancelling}
                            >
                                Cancel account deletion
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="font-sans text-[14px] text-muted-foreground mb-4">
                                Deleting your account is a two-step process. Once requested, your account
                                enters a 30-day grace window during which you can sign in only to cancel.
                                After 30 days your data is permanently removed.
                            </p>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                Delete account
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Modal
                open={showDeleteConfirm}
                onClose={() => { if (!deleting) { setShowDeleteConfirm(false); setDeleteConfirmText(""); } }}
                title="Delete this account?"
            >
                <p className="font-sans text-sm text-muted-foreground mb-4">
                    The account enters a 30-day window. Sign in during that time to cancel. After 30 days the data is removed for good.
                </p>
                <label htmlFor="delete-confirm" className="font-sans text-sm text-foreground mb-2 block">
                    Type <span className="font-mono">{REQUIRED_PHRASE}</span> to confirm
                </label>
                <input
                    id="delete-confirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={REQUIRED_PHRASE}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-mono text-sm text-foreground mb-4"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                />
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        loading={deleting}
                        disabled={deleteConfirmText !== REQUIRED_PHRASE}
                    >
                        Delete account
                    </Button>
                </div>
            </Modal>
        </motion.div>
    );
}
