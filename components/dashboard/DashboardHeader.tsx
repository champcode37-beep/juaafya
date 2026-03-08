import React, { memo } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { TeamMember } from '../../types';

interface DashboardHeaderProps {
    currentUser: TeamMember | null;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    unreadCount: number;
    isNotifOpen: boolean;
    setIsNotifOpen: (val: boolean) => void;
    isProfileOpen: boolean;
    setIsProfileOpen: (val: boolean) => void;
    handleLogout: () => void;
    systemNotifications: any[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({
    currentUser,
    searchTerm,
    setSearchTerm,
    unreadCount,
    isNotifOpen,
    setIsNotifOpen,
    isProfileOpen,
    setIsProfileOpen,
    handleLogout,
    systemNotifications
}) => {
    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-8 px-4 sm:px-0">
            <div className="flex-1 max-w-xl relative group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-[#121721]/40 border border-slate-100 dark:border-white/5 rounded-2xl py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:focus:ring-brand-blue/40 shadow-sm transition-all text-slate-900 dark:text-white"
                />
            </div>

            <div className="flex items-center justify-end space-x-2 sm:space-x-4">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 sm:p-3 bg-white dark:bg-[#121721]/40 border border-slate-100 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#121721]/60 transition-all text-slate-600 dark:text-slate-300 relative shadow-sm active:scale-95"
                    >
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 border-2 border-white dark:border-brand-dark rounded-full text-[8px] sm:text-[10px] text-white flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Notifications</h3>
                                <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full uppercase">Recent</span>
                            </div>
                            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                                {systemNotifications.length > 0 ? (
                                    systemNotifications.map(n => (
                                        <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{n.text}</p>
                                            <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-slate-400 text-xs sm:text-sm">No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-1.5 pr-2 sm:pr-4 bg-white dark:bg-[#121721]/40 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#121721]/60 transition-all shadow-sm group active:scale-95"
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-brand-blue/10 border border-brand-blue/20">
                            <img src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=3462ee&color=fff`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="hidden xs:block text-left">
                            <div className="flex items-center">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{currentUser?.name?.split(' ')[0]}</span>
                                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-1.5 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-48 sm:w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-2">
                                <button className="w-full flex items-center p-2.5 sm:p-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left">
                                    <User className="w-4 h-4 mr-3" />
                                    My Profile
                                </button>
                                <button className="w-full flex items-center p-2.5 sm:p-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left">
                                    <Settings className="w-4 h-4 mr-3" />
                                    Security
                                </button>
                                <div className="h-px bg-slate-50 dark:bg-slate-800 my-2 mx-2" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
});

DashboardHeader.displayName = 'DashboardHeader';
