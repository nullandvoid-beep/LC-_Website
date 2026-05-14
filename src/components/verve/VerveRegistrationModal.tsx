import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { Mail, X, ArrowLeft, Key, LogIn, Phone, User, CheckCircle2 } from 'lucide-react';
import { EVENTS_DATA } from './Events';
import type { EventData } from './Events';

const extractRegNumber = (email: string) => {
    const match = email.match(/\.([^.@]+)@/);
    if (match && match[1]) return match[1].toLowerCase();
    return email.split('@')[0].toLowerCase();
};

const getYearOfStudy = (regNum: string) => {
    const yearDigits = regNum.substring(0, 2);
    switch (yearDigits) {
        case '25': return '1st Year';
        case '24': return '2nd Year';
        case '23': return '3rd Year';
        case '22': return '4th Year';
        case '21': return '5th Year';
        default: return 'Other';
    }
};

type ModalView = 'auth-choice' | 'login-form' | 'phone-form' | 'success-checklist' | 'team-form';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialEventId?: string;
}

const inputClass = "w-full px-4 py-3 border-[4px] border-black rounded-none focus:ring-0 focus:border-verve-gold focus:bg-[#312e2e] transition-all duration-200 bg-[#312e2e] text-white shadow-[4px_4px_0_#000] font-mono font-bold placeholder-gray-400 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#000]";
const inputWithIconClass = "w-full pl-12 pr-4 py-3 border-[4px] border-black rounded-none focus:ring-0 focus:border-verve-gold focus:bg-[#312e2e] transition-all duration-200 bg-[#312e2e] text-white shadow-[4px_4px_0_#000] font-mono font-bold placeholder-gray-400 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#000]";
const labelClass = "flex items-center text-sm font-bold font-sans uppercase tracking-wide text-verve-gold mb-2";
const iconClass = "w-4 h-4 mr-2 text-white";
const fieldIconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-white pointer-events-none z-10 font-bold";

export function VerveRegistrationModal({ isOpen, onClose, initialEventId }: Props) {
    const { user, loginWithGoogle, loginWithCredentials, isLoading: isAuthLoading } = useAuth();

    const [view, setView] = useState<ModalView>('auth-choice');
    const [loginUserId, setLoginUserId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showIntruderAlert, setShowIntruderAlert] = useState(false);

    // Checklist state
    const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
    const [additionalSelections, setAdditionalSelections] = useState<string[]>([]);

    // Team Form State
    const [teamName, setTeamName] = useState('');
    const [teamMembers, setTeamMembers] = useState([
        { name: '', regNumber: '', phone: '' },
        { name: '', regNumber: '', phone: '' },
        { name: '', regNumber: '', phone: '' },
    ]);

    useEffect(() => {
        if (!isOpen) {
            // Reset state fully when closing
            setView('auth-choice');
            setError(null);
            setIsSubmitting(false);
            setShowIntruderAlert(false);
            setPhoneNumber('');
            setLoginUserId('');
            setLoginPassword('');
            setRegisteredEvents([]);
            setAdditionalSelections([]);
            setTeamName('');
            setTeamMembers([
                { name: '', regNumber: '', phone: '' },
                { name: '', regNumber: '', phone: '' },
                { name: '', regNumber: '', phone: '' }
            ]);
            return;
        }

        const checkUserRegistration = async () => {
            if (!user?.email) {
                setView('auth-choice');
                return;
            }

            const userEmailLower = user.email.toLowerCase();
            const isInhouseUser = userEmailLower.endsWith('@nitdgp.ac.in') || userEmailLower.endsWith('@btech.nitdgp.ac.in');

            if (!isInhouseUser) {
                setShowIntruderAlert(true);
                return;
            }

            try {
                const regNumber = extractRegNumber(userEmailLower);
                const docRef = doc(db, 'verve_registrations', regNumber);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const existingEvents = data.registeredEvents || [];
                    setRegisteredEvents(existingEvents);
                    setPhoneNumber(data.phoneNumber || '');

                    // If they have a profile, check initial event
                    if (initialEventId && !existingEvents.includes(initialEventId)) {
                        if (initialEventId === 'treasure-hunt') {
                            setView('team-form');
                        } else {
                            await registerForEvents(regNumber, [...existingEvents, initialEventId], data.phoneNumber);
                        }
                    } else {
                        setView('success-checklist');
                    }
                } else {
                    // Start phone form if no prior verve_registrations document exists
                    setView('phone-form');
                }
            } catch (err) {
                console.error("Error checking registration status", err);
                setError('Failed to check existing registrations.');
            }
        };

        checkUserRegistration();
    }, [user, isOpen, initialEventId]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // @ts-ignore
            if (window.lenis) window.lenis.stop();
        } else {
            document.body.style.overflow = 'unset';
            // @ts-ignore
            if (window.lenis) window.lenis.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            // @ts-ignore
            if (window.lenis) window.lenis.start();
        };
    }, [isOpen]);

    const registerForEvents = async (regNumber: string, newRegisteredEvents: string[], phone: string) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const userEmail = user!.email!.trim().toLowerCase();
            const yearDigits = regNumber.substring(0, 2);
            const calculatedYear = getYearOfStudy(regNumber);
            const docRef = doc(db, 'verve_registrations', regNumber);

            const payload = {
                phoneNumber: phone,
                fullName: user!.name,
                email: userEmail,
                regNumber,
                extractedYear: yearDigits,
                yearOfStudy: calculatedYear,
                registeredEvents: newRegisteredEvents,
                lastUpdated: new Date().toISOString()
            };

            await setDoc(docRef, payload, { merge: true });

            setRegisteredEvents(newRegisteredEvents);
            setView('success-checklist');
            setAdditionalSelections([]);
        } catch (err: any) {
            setError(err.message || 'Something went wrong saving registration.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        const result = await loginWithGoogle();
        if (!result.success) {
            if (result.error?.includes('Intruder Alert')) setShowIntruderAlert(true);
            else setError(result.error || 'Login failed. Please try again.');
        }
        setIsSubmitting(false);
    };

    const handleCredentialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const result = await loginWithCredentials(loginUserId, loginPassword);
        if (!result.success) setError(result.error || 'Login failed. Please check your credentials.');
        setIsSubmitting(false);
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        if (initialEventId === 'treasure-hunt') {
            setView('team-form');
            return;
        }

        const regNumber = extractRegNumber(user.email.toLowerCase());
        const initialArray = initialEventId ? [initialEventId] : [];
        await registerForEvents(regNumber, initialArray, phoneNumber);
    };

    const handleChecklistSubmit = async () => {
        if (!user || !user.email) return;
        if (additionalSelections.length === 0) {
            onClose();
            return;
        }

        if (additionalSelections.includes('treasure-hunt')) {
            // Transition to team form specific to Treasure Hunt. Keep other selections pending.
            setView('team-form');
            return;
        }

        const regNumber = extractRegNumber(user.email.toLowerCase());
        const updatedList = [...new Set([...registeredEvents, ...additionalSelections])];
        await registerForEvents(regNumber, updatedList, phoneNumber);
    };

    const handleTeamMemberUpdate = (index: number, field: string, value: string) => {
        const updatedMembers = [...teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setTeamMembers(updatedMembers);
    };

    const handleTeamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const userEmail = user.email.trim().toLowerCase();
            const leaderRegNumber = extractRegNumber(userEmail);
            const leaderYearDigits = leaderRegNumber.substring(0, 2);
            const leaderCalculatedYear = getYearOfStudy(leaderRegNumber);

            // 1. Ensure Leader Profile Exists/is Updated
            const leaderDocRef = doc(db, 'verve_registrations', leaderRegNumber);
            await setDoc(leaderDocRef, {
                phoneNumber: phoneNumber,
                fullName: user.name,
                email: userEmail,
                regNumber: leaderRegNumber,
                extractedYear: leaderYearDigits,
                yearOfStudy: leaderCalculatedYear,
                registeredEvents: arrayUnion('treasure-hunt'),
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // 2. Create the Team Entry Document for Admins
            const teamId = `${teamName.trim().toLowerCase().replace(/\s+/g, '-')}-${leaderRegNumber}`;
            const teamDocRef = doc(db, 'treasure_hunt_teams', teamId);
            await setDoc(teamDocRef, {
                teamName: teamName,
                leader: {
                    name: user.name,
                    regNumber: leaderRegNumber,
                    phone: phoneNumber,
                    email: userEmail
                },
                members: teamMembers,
                registeredAt: new Date().toISOString()
            });

            // 3. Update the individual `verve_registrations` document for members 2, 3, 4 so they see it on their dashboard
            const memberUpdates = teamMembers.map(async (member) => {
                const memberRegLower = member.regNumber.trim().toLowerCase();
                const memberDocRef = doc(db, 'verve_registrations', memberRegLower);
                const yearDigits = memberRegLower.substring(0, 2);

                await setDoc(memberDocRef, {
                    fullName: member.name, // Just in case it's a new profile
                    regNumber: memberRegLower,
                    phoneNumber: member.phone,
                    extractedYear: yearDigits,
                    yearOfStudy: getYearOfStudy(memberRegLower),
                    registeredEvents: arrayUnion('treasure-hunt'),
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            });
            await Promise.all(memberUpdates);

            // 4. Update local state and finish
            const newRegisteredEvents = [...new Set([...registeredEvents, 'treasure-hunt', ...additionalSelections])];

            // If we have other standard events to submit alongside treasure hunt
            const eventsWithoutTreasureHunt = additionalSelections.filter(id => id !== 'treasure-hunt');
            if (eventsWithoutTreasureHunt.length > 0) {
                await setDoc(leaderDocRef, {
                    registeredEvents: arrayUnion(...eventsWithoutTreasureHunt)
                }, { merge: true });
            }

            setRegisteredEvents(newRegisteredEvents);
            setAdditionalSelections([]);
            setView('success-checklist');

        } catch (err: any) {
            setError(err.message || 'Error occurred while saving team registration.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAdditionalSelection = (eventId: string) => {
        setAdditionalSelections(prev =>
            prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
        );
    };

    /* ─── Render Helpers ─── */

    const renderAuthChoice = () => (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            {isAuthLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-[4px] border-black border-t-verve-gold animate-spin" />
                    <span className="text-xl font-heading uppercase tracking-widest text-verve-gold drop-shadow-[1px_1px_0_#000]">Loading...</span>
                </div>
            ) : (
                <div className="py-2 space-y-6">
                    <div className="bg-verve-gold border-[4px] border-black p-4 shadow-[4px_4px_0_#000] -rotate-1 mb-6">
                        <p className="text-base text-black font-mono font-bold leading-relaxed text-center">
                            Please Sign Up with your <span className="underline decoration-4 decoration-black">institute email</span> to register for Verve.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => { setError(null); setView('login-form'); }}
                            className="flex-1 py-4 bg-verve-dark text-white font-sans font-bold text-lg uppercase tracking-wider border-[4px] border-black shadow-[6px_8px_0_#000] hover:bg-black hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_5px_0_#000] active:translate-x-3 active:translate-y-3 active:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-5 h-5 stroke-[3]" />
                            Log In
                        </button>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                            className="flex-1 py-4 bg-verve-pink text-black font-sans font-bold text-lg uppercase tracking-wider border-[4px] border-black shadow-[6px_8px_0_#000] hover:bg-[#c97474] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_5px_0_#000] active:translate-x-3 active:translate-y-3 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Mail className="w-5 h-5 stroke-[3]" />
                            )}
                            Sign Up
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderLoginForm = () => (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <form onSubmit={handleCredentialLogin} className="space-y-5">
                <div>
                    <label htmlFor="loginUserId" className={labelClass}>
                        <User className={iconClass} />
                        User ID
                    </label>
                    <input
                        type="text" id="loginUserId" required
                        value={loginUserId} onChange={(e) => setLoginUserId(e.target.value.toUpperCase())}
                        className={`${inputClass} uppercase`} placeholder="Enter your User ID"
                    />
                </div>
                <div>
                    <label htmlFor="loginPassword" className={labelClass}>
                        <Key className={iconClass} />
                        Password
                    </label>
                    <input
                        type="password" id="loginPassword" required
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        className={inputClass} placeholder="Enter your password"
                    />
                </div>
                <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 bg-verve-gold text-black font-heading tracking-widest text-3xl uppercase border-[4px] border-black shadow-[6px_8px_0_#000] hover:bg-[#e0ad00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-2 active:translate-x-2 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </motion.div>
    );

    const renderPhoneForm = () => (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="bg-verve-pink border-[4px] border-black p-4 shadow-[4px_4px_0_#000] rotate-1">
                    <p className="text-base text-black font-mono font-bold text-center">
                        Welcome {user?.name}! We need your WhatsApp number to confirm your registration.
                    </p>
                </div>
                <div>
                    <label htmlFor="phoneNumber" className={labelClass}>
                        <Phone className={iconClass} />
                        WhatsApp Number
                    </label>
                    <div className="relative">
                        <Phone className={fieldIconClass} />
                        <input
                            type="tel" id="phoneNumber" required
                            value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                            pattern="[0-9]{10}" minLength={10} maxLength={10}
                            className={inputWithIconClass}
                            placeholder="10-digit number"
                        />
                    </div>
                </div>
                <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 bg-verve-gold text-black font-heading text-3xl uppercase tracking-widest border-[4px] border-black shadow-[6px_8px_0_#000] hover:bg-[#e0ad00] hover:-translate-y-1 hover:shadow-[8px_10px_0_#000] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </motion.div>
    );

    const renderSuccessChecklist = () => {
        const hasNewSelections = additionalSelections.length > 0;

        return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-verve-gold border-[4px] border-black shadow-[4px_4px_0_#000] mb-4 transform rotate-3">
                    <CheckCircle2 className="w-8 h-8 text-black" />
                </div>
                {initialEventId && registeredEvents.includes(initialEventId) && !hasNewSelections ? (
                    <h3 className="text-3xl font-heading uppercase tracking-wider text-white mb-2">Registered Successfully!</h3>
                ) : (
                    <h3 className="text-3xl font-heading uppercase tracking-wider text-white mb-2">Your Registrations</h3>
                )}
                <p className="text-sm text-verve-light/80 font-mono mb-6">
                    Review your registered events or sign up for more below!
                </p>

                <div className="space-y-3 text-left mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {EVENTS_DATA.map((event: EventData) => {
                        const isRegistered = registeredEvents.includes(event.id);
                        const isNewlySelected = additionalSelections.includes(event.id);

                        return (
                            <div
                                key={event.id}
                                onClick={() => !isRegistered && toggleAdditionalSelection(event.id)}
                                className={`p-4 border-[3px] border-black ${isRegistered ? 'bg-verve-dark cursor-default opacity-60' : isNewlySelected ? 'bg-verve-gold cursor-pointer transform -translate-y-1 shadow-[4px_4px_0_#000]' : 'bg-[#312e2e] cursor-pointer hover:bg-verve-pink hover:text-black'} flex items-center justify-between transition-all group`}
                            >
                                <div>
                                    <h4 className={`text-xl font-heading uppercase ${isNewlySelected || isRegistered ? (isRegistered ? 'text-verve-light' : 'text-black') : 'text-white'}`}>
                                        {event.title}
                                    </h4>
                                    <span className={`text-xs font-mono font-bold ${isNewlySelected || (isRegistered && false) ? 'text-black/80' : 'text-gray-400'}`}>
                                        {event.date} • {event.venue}
                                    </span>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    {isRegistered ? (
                                        <span className="text-sm font-sans font-bold text-verve-gold uppercase tracking-widest border-2 border-verve-gold px-2 py-1">Joined</span>
                                    ) : (
                                        <div className={`w-6 h-6 border-2 flex items-center justify-center ${isNewlySelected ? 'border-black bg-black' : 'border-gray-400'}`}>
                                            {isNewlySelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-4 bg-verve-dark text-white font-bold font-sans tracking-widest uppercase border-[4px] border-black shadow-[4px_4px_0_#000] hover:bg-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        Close
                    </button>
                    {hasNewSelections && (
                        <button
                            onClick={handleChecklistSubmit}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-4 bg-verve-pink text-black font-bold font-sans tracking-widest uppercase border-[4px] border-black shadow-[4px_4px_0_#000] hover:bg-[#c97474] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Add Events'}
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    const renderTeamForm = () => (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <form onSubmit={handleTeamSubmit} className="space-y-6">
                <div className="bg-verve-gold border-[4px] border-black p-4 shadow-[4px_4px_0_#000] -rotate-1 mb-6">
                    <p className="text-sm md:text-base text-black font-mono font-bold leading-relaxed text-center">
                        Treasure Hunt is a <span className="underline decoration-4 decoration-verve-pink">4-person</span> team event. Complete your roster below.
                    </p>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {/* Team Info */}
                    <div>
                        <label className={labelClass}>Team Name</label>
                        <input
                            type="text" required
                            value={teamName} onChange={(e) => setTeamName(e.target.value)}
                            className={inputClass} placeholder="Enter an awesome team name"
                        />
                    </div>

                    {/* Leader (Read Only/Pre-filled) */}
                    <div className="bg-[#1f1d1d] border-2 border-black p-4 space-y-4">
                        <div className="flex justify-between items-center mb-2 border-b-2 border-verve-gold pb-2">
                            <span className="font-heading uppercase text-xl text-verve-gold tracking-widest">Member 1 / Leader</span>
                            <User className="w-5 h-5 text-verve-gold" />
                        </div>
                        <div className="space-y-3 font-mono text-sm">
                            <p><span className="text-gray-400">Name:</span> <strong>{user?.name}</strong></p>
                            <p><span className="text-gray-400">Reg No:</span> <strong>{user?.email && extractRegNumber(user.email).toUpperCase()}</strong></p>
                            {/* Ensure we have the phone number if they just came from the Auth Choice without passing through phone form */}
                            <>
                                <label className="text-gray-400 mt-2 block">Leader WhatsApp:</label>
                                <input
                                    type="tel" required
                                    value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-3 py-2 border-[2px] border-black bg-[#312e2e] text-white focus:border-verve-gold transition-colors outline-none font-mono"
                                    placeholder="10-digit number" pattern="[0-9]{10}"
                                />
                            </>
                        </div>
                    </div>

                    {/* Members 2-4 */}
                    {teamMembers.map((member, idx) => (
                        <div key={idx} className="bg-[#1f1d1d] border-2 border-black p-4 space-y-4">
                            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
                                <span className="font-heading uppercase text-xl text-white tracking-widest">Member {idx + 2}</span>
                                <User className="w-5 h-5 text-white/50" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Full Name</label>
                                    <input
                                        type="text" required
                                        value={member.name} onChange={(e) => handleTeamMemberUpdate(idx, 'name', e.target.value)}
                                        className="w-full px-3 py-2 border-[2px] border-black bg-[#312e2e] text-white focus:border-verve-pink transition-colors outline-none font-mono text-sm"
                                        placeholder="Name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">Reg/Roll No</label>
                                        <input
                                            type="text" required
                                            value={member.regNumber} onChange={(e) => handleTeamMemberUpdate(idx, 'regNumber', e.target.value)}
                                            className="w-full px-3 py-2 border-[2px] border-black bg-[#312e2e] text-white focus:border-verve-pink transition-colors outline-none font-mono text-sm uppercase"
                                            placeholder="e.g. 21XX123"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">WhatsApp</label>
                                        <input
                                            type="tel" required
                                            value={member.phone} onChange={(e) => handleTeamMemberUpdate(idx, 'phone', e.target.value)}
                                            className="w-full px-3 py-2 border-[2px] border-black bg-[#312e2e] text-white focus:border-verve-pink transition-colors outline-none font-mono text-sm"
                                            placeholder="10-digits" pattern="[0-9]{10}"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 mt-4 bg-verve-pink text-black font-heading tracking-widest text-2xl md:text-3xl uppercase border-[4px] border-black shadow-[6px_8px_0_#000] hover:bg-[#c97474] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-2 active:translate-x-2 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Registering Team...' : 'Register Team'}
                </button>
            </form>
        </motion.div>
    );

    const showBackButton = view === 'login-form';

    // Extract title text based on View
    const getTitle = () => {
        if (view === 'auth-choice' || view === 'login-form') return 'Verve Registration';
        if (view === 'phone-form') return 'Complete Profile';
        if (view === 'team-form') return 'Team Details';
        if (view === 'success-checklist') return 'Events Dashboard';
        return 'Registration';
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        data-lenis-prevent
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md verve-root mt-12 md:mt-0"
                        onClick={onClose}
                    >
                        {/* Brutalist Noise Overlay */}
                        <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative w-full max-w-lg bg-verve-dark border-[6px] border-black shadow-[12px_15px_0_#000] overflow-hidden z-10 p-2 sm:p-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Inner Brutalist Border Frame */}
                            <div className="w-full h-full border-[3px] border-dashed border-black p-4 sm:p-8 relative max-h-[85vh] overflow-y-auto">
                                <button type="button" onClick={onClose}
                                    className="absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl hover:bg-verve-pink hover:text-black border-[3px] border-black transition-colors z-[60]"
                                >
                                    <X size={24} className="stroke-[3]" />
                                </button>

                                {showBackButton && (
                                    <button
                                        type="button"
                                        onClick={() => { setError(null); setView('auth-choice'); }}
                                        className="absolute top-2 left-2 md:top-4 md:left-4 w-10 h-10 bg-verve-gold text-black border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center hover:bg-[#e0ad00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-2 active:translate-x-2 transition-all z-[60]"
                                    >
                                        <ArrowLeft size={20} className="stroke-[3] -ml-1" />
                                    </button>
                                )}

                                <div className="pt-10 md:pt-4">
                                    <div className="text-center mb-8 relative px-2">
                                        <h2 className="text-3xl md:text-5xl font-heading uppercase text-white drop-shadow-[2px_2px_0_#000] tracking-wide mx-auto">
                                            {getTitle()}
                                        </h2>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 font-mono font-bold text-sm text-center py-2 px-4 bg-red-50/10 border-2 border-red-500 rounded-none mb-5">
                                            {error}
                                        </div>
                                    )}

                                    <AnimatePresence mode="wait">
                                        {view === 'auth-choice' && renderAuthChoice()}
                                        {view === 'login-form' && renderLoginForm()}
                                        {view === 'phone-form' && renderPhoneForm()}
                                        {view === 'team-form' && renderTeamForm()}
                                        {view === 'success-checklist' && renderSuccessChecklist()}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showIntruderAlert && (
                    <motion.div
                        data-lenis-prevent
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md verve-root mt-12 md:mt-0"
                        onClick={() => setShowIntruderAlert(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 30 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full max-w-md bg-black border-[6px] border-verve-pink shadow-[10px_10px_0_#e08585] p-2"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="border-[3px] border-dashed border-verve-pink p-8 text-center relative">
                                <button onClick={() => setShowIntruderAlert(false)}
                                    className="absolute top-4 right-4 p-2 bg-black text-verve-pink hover:text-black hover:bg-verve-pink border-2 border-verve-pink transition-colors">
                                    <X size={20} className="stroke-[3]" />
                                </button>
                                <div className="text-7xl mb-6 drop-shadow-[4px_4px_0_#e08585]">⚠️</div>
                                <h2 className="text-4xl md:text-5xl font-heading uppercase text-verve-pink mb-4">Auth Error</h2>
                                <div className="bg-verve-pink/10 p-4 border-l-[4px] border-verve-pink mb-6 text-left">
                                    <p className="text-zinc-200 font-mono font-bold text-sm mb-2">{">"} Unauthorized Access</p>
                                    <p className="text-white font-mono text-xs">Verve is exclusively available for NIT Durgapur students. You must use an `@nitdgp.ac.in` email.</p>
                                </div>
                                <button onClick={() => setShowIntruderAlert(false)}
                                    className="w-full px-8 py-3 bg-verve-pink text-black font-heading text-2xl uppercase border-[4px] border-black hover:bg-[#c97474]">
                                    Acknowledge
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
