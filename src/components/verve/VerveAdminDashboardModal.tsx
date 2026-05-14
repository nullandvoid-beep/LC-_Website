import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { X, Users, Search, Target, Mail, Phone, Calendar, UserCircle, Download } from 'lucide-react';
import { EVENTS_DATA } from './Events';
import type { EventData } from './Events';

interface VerveRegistration {
    email: string;
    extractedYear: string;
    fullName: string;
    lastUpdated: string;
    phoneNumber: string;
    regNumber: string;
    registeredEvents: string[];
    yearOfStudy: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function RegistrationDetailsView({ reg, onClose }: { reg: VerveRegistration, onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-[#e08585] border-[6px] border-black shadow-[12px_12px_0_#fff] p-6 sm:p-10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                <button type="button" onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl hover:bg-white hover:text-black border-[3px] border-black transition-colors z-[120]"
                >
                    <X size={24} className="stroke-[3]" />
                </button>

                <div className="flex items-center gap-4 border-b-[4px] border-black pb-6 mb-6 relative z-10">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0">
                        <UserCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-heading uppercase text-black font-black leading-none break-words pr-8">{reg.fullName}</h2>
                        <span className="inline-block px-3 py-1 bg-white border-[2px] border-black font-mono font-bold text-sm text-black mt-2">{reg.regNumber}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 font-mono relative z-10">
                    <div className="bg-white border-[3px] border-black p-4 flex flex-col justify-center shadow-[4px_4px_0_#000]">
                        <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs uppercase font-bold"><Mail className="w-4 h-4" /> Email</div>
                        <div className="font-bold text-black break-all">{reg.email}</div>
                    </div>
                    <div className="bg-white border-[3px] border-black p-4 flex flex-col justify-center shadow-[4px_4px_0_#000]">
                        <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs uppercase font-bold"><Phone className="w-4 h-4" /> Phone Number</div>
                        <div className="font-bold text-black">{reg.phoneNumber || 'N/A'}</div>
                    </div>
                    <div className="bg-white border-[3px] border-black p-4 flex flex-col justify-center shadow-[4px_4px_0_#000] sm:col-span-2">
                        <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs uppercase font-bold"><Calendar className="w-4 h-4" /> Year of Study</div>
                        <div className="font-bold text-black">{reg.yearOfStudy}</div>
                    </div>
                </div>

                <div className="bg-[#312e2e] p-6 border-[4px] border-black shadow-[6px_6px_0_#000] relative z-10">
                    <h3 className="font-heading uppercase text-white tracking-widest mb-4 border-b border-white/20 pb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-verve-gold" /> Registered Events
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {reg.registeredEvents && reg.registeredEvents.length > 0 ? (
                            reg.registeredEvents.map(eventId => {
                                const eventRef = EVENTS_DATA.find(e => e.id === eventId);
                                return (
                                    <span
                                        key={eventId}
                                        className="px-4 py-2 font-heading tracking-widest text-sm uppercase text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all cursor-default"
                                        style={{ backgroundColor: eventRef?.color || '#fff' }}
                                    >
                                        {eventRef?.title || eventId}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-gray-400 font-mono italic">No events registered</span>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function VerveAdminDashboardModal({ isOpen, onClose }: Props) {
    const [registrations, setRegistrations] = useState<VerveRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReg, setSelectedReg] = useState<VerveRegistration | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchRegistrations = async () => {
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'verve_registrations'));
                const regs: VerveRegistration[] = [];
                querySnapshot.forEach((doc) => {
                    regs.push(doc.data() as VerveRegistration);
                });
                // Sort by name by default
                regs.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setRegistrations(regs);
            } catch (error) {
                console.error("Error fetching registrations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrations();
    }, [isOpen]);

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


    if (!isOpen) return null;

    const filteredRegistrations = registrations.filter(reg => {
        const matchesTab = activeTab === 'all' || (reg.registeredEvents && reg.registeredEvents.includes(activeTab));
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            reg.fullName.toLowerCase().includes(searchLower) ||
            reg.regNumber.toLowerCase().includes(searchLower) ||
            reg.email.toLowerCase().includes(searchLower) ||
            (reg.phoneNumber && reg.phoneNumber.includes(searchLower));

        return matchesTab && matchesSearch;
    });

    const handleExportCSV = async () => {
        if (activeTab === 'treasure-hunt') {
            try {
                const querySnapshot = await getDocs(collection(db, 'treasure_hunt_teams'));
                const headers = [
                    "Team Name", "Registered At",
                    "Leader Name", "Leader Reg No", "Leader Phone", "Leader Email",
                    "Member 2 Name", "Member 2 Reg No", "Member 2 Phone",
                    "Member 3 Name", "Member 3 Reg No", "Member 3 Phone",
                    "Member 4 Name", "Member 4 Reg No", "Member 4 Phone"
                ];

                const rows: string[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const mems = data.members || [];
                    const row = [
                        `"${data.teamName || ''}"`,
                        data.registeredAt ? `"${new Date(data.registeredAt).toLocaleString()}"` : 'N/A',
                        `"${data.leader?.name || ''}"`,
                        data.leader?.regNumber || '',
                        data.leader?.phone || '',
                        data.leader?.email || '',
                        `"${mems[0]?.name || ''}"`, mems[0]?.regNumber || '', mems[0]?.phone || '',
                        `"${mems[1]?.name || ''}"`, mems[1]?.regNumber || '', mems[1]?.phone || '',
                        `"${mems[2]?.name || ''}"`, mems[2]?.regNumber || '', mems[2]?.phone || ''
                    ];
                    rows.push(row.join(','));
                });

                const csvContent = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `verve_treasure_hunt_teams_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error("Error exporting teams:", error);
            }
            return;
        }

        const headers = ["Registration Number", "Full Name", "Email", "Phone Number", "Year of Study", "Extracted Year", "Registered Events", "Last Updated"];
        const rows = filteredRegistrations.map(reg => {
            const events = reg.registeredEvents
                ? reg.registeredEvents.map(eId => {
                    const eventDef = EVENTS_DATA.find(e => e.id === eId);
                    return eventDef ? eventDef.title : eId;
                }).join('; ')
                : 'None';

            return [
                reg.regNumber,
                `"${reg.fullName}"`,
                reg.email,
                reg.phoneNumber || 'N/A',
                reg.yearOfStudy,
                reg.extractedYear,
                `"${events}"`,
                reg.lastUpdated ? `"${new Date(reg.lastUpdated).toLocaleString()}"` : 'N/A'
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `verve_registrations_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-lenis-prevent
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed inset-0 z-[100] flex flex-col bg-verve-dark overflow-hidden verve-root"
                >
                    {/* Brutalist Noise Overlay */}
                    <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Header */}
                    <div className="bg-[#e08585] px-6 py-4 md:px-8 md:py-6 border-b-[6px] border-black flex flex-col md:flex-row md:justify-between md:items-center shrink-0 z-10 gap-4">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-heading uppercase text-black drop-shadow-[2px_2px_0_#fff] tracking-wide m-0 leading-none">
                                Admin Dashboard
                            </h2>
                            <p className="font-mono text-black/80 font-bold uppercase tracking-widest text-sm mt-2">
                                Total Participants: {filteredRegistrations.length} {searchQuery && ' (Filtered)'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-auto shrink-0 z-[60]">
                            <button type="button" onClick={handleExportCSV}
                                className="h-12 px-4 bg-black text-white flex items-center justify-center gap-2 font-heading tracking-widest text-sm uppercase hover:bg-verve-gold hover:text-black border-[3px] border-black shadow-[4px_4px_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#fff] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all"
                            >
                                <Download size={20} className="stroke-[3]" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                            <button type="button" onClick={onClose}
                                className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-xl hover:bg-white hover:text-black border-[3px] border-black shadow-[4px_4px_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#fff] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all"
                            >
                                <X size={28} className="stroke-[3]" />
                            </button>
                        </div>
                    </div>

                    {/* Controls / Tabs */}
                    <div className="px-6 py-4 md:px-8 bg-[#312e2e] border-b-[4px] border-black shrink-0 space-y-4 z-10 shadow-xl">

                        {/* Search */}
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, reg no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-[3px] border-black rounded-none focus:ring-0 focus:border-verve-gold focus:bg-[#201f1f] transition-all bg-[#423f3f] text-white shadow-[4px_4px_0_#000] font-mono placeholder-gray-400"
                            />
                        </div>

                        {/* Tabs */}
                        <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`shrink-0 px-6 py-2 font-heading tracking-widest uppercase border-[3px] border-black transition-all ${activeTab === 'all'
                                    ? 'bg-verve-gold text-black shadow-[4px_4px_0_#000]'
                                    : 'bg-[#201f1f] text-white hover:bg-verve-pink hover:text-black'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4" /> All ({registrations.length})
                                </span>
                            </button>

                            {EVENTS_DATA.map((event: EventData) => {
                                const eventCount = registrations.filter(r => r.registeredEvents && r.registeredEvents.includes(event.id)).length;
                                const isActive = activeTab === event.id;

                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => setActiveTab(event.id)}
                                        className={`shrink-0 px-6 py-2 font-heading tracking-widest uppercase border-[3px] border-black transition-all flex items-center gap-2`}
                                        style={{
                                            backgroundColor: isActive ? event.color : '#201f1f',
                                            color: isActive ? '#000' : '#fff',
                                            boxShadow: isActive ? '4px 4px 0 #000' : 'none',
                                        }}
                                    >
                                        <Target className="w-4 h-4" /> {event.title} ({eventCount})
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar relative z-10 bg-verve-dark">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-6 h-full">
                                <div className="w-16 h-16 border-[6px] border-black border-t-verve-gold animate-spin" />
                                <span className="text-2xl font-heading uppercase tracking-widest text-[#e08585] drop-shadow-[2px_2px_0_#000]">Gathering Intel...</span>
                            </div>
                        ) : filteredRegistrations.length === 0 ? (
                            <div className="text-center p-20 border-[4px] border-dashed border-gray-600 bg-black/20 h-full flex items-center justify-center">
                                <p className="text-2xl font-heading text-gray-400 uppercase tracking-widest">No Participants Found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                {filteredRegistrations.map((reg, index) => (
                                    <div
                                        key={reg.regNumber}
                                        onClick={() => setSelectedReg(reg)}
                                        className="bg-[#2a2828] border-[4px] border-black p-5 shadow-[6px_6px_0_#000] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_10px_0_#e08585] transition-all flex flex-col h-full group cursor-pointer relative overflow-hidden"
                                    >
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-verve-gold/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4 border-b-2 border-dashed border-gray-600 pb-4 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-heading text-white uppercase tracking-wider group-hover:text-verve-gold transition-colors break-words line-clamp-2">{reg.fullName}</h3>
                                                <p className="text-xs font-mono text-gray-400 uppercase mt-1">{reg.regNumber}</p>
                                            </div>
                                            <div className="bg-black text-white border-2 border-white px-2 py-1 font-mono font-bold text-[10px] shrink-0 transform rotate-2">
                                                {reg.yearOfStudy}
                                            </div>
                                        </div>

                                        {/* Basic Info */}
                                        <div className="font-mono text-xs text-gray-300 space-y-1 mb-6 relative z-10">
                                            <div className="flex items-center gap-2 truncate"><Mail className="w-3 h-3 text-verve-pink" /> <span className="truncate">{reg.email}</span></div>
                                            <div className="flex items-center gap-2 truncate"><Phone className="w-3 h-3 text-verve-pink" /> <span>{reg.phoneNumber || 'N/A'}</span></div>
                                        </div>

                                        {/* Events Pill Tags */}
                                        <div className="mt-auto relative z-10">
                                            <span className="text-gray-500 uppercase text-[10px] font-bold font-mono block mb-2 tracking-widest">Registered Events ({reg.registeredEvents?.length || 0})</span>
                                            <div className="flex flex-wrap gap-2">
                                                {reg.registeredEvents && reg.registeredEvents.length > 0 ? (
                                                    reg.registeredEvents.map(eventId => {
                                                        const eventRef = EVENTS_DATA.find(e => e.id === eventId);
                                                        return (
                                                            <span
                                                                key={eventId}
                                                                className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-black border-2 border-black"
                                                                style={{ backgroundColor: eventRef?.color || '#fff' }}
                                                            >
                                                                {eventRef?.title || eventId}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-gray-600 font-mono text-xs italic">None</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Index Decorative */}
                                        <div className="absolute bottom-[-10px] right-2 font-mono font-black text-7xl text-white/5 pointer-events-none select-none mix-blend-overlay">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {selectedReg && (
                            <RegistrationDetailsView
                                reg={selectedReg}
                                onClose={() => setSelectedReg(null)}
                            />
                        )}
                    </AnimatePresence>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
