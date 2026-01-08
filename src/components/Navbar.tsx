import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import SearchBar from "./SearchBar";

export default function Navbar() {
    const { user, logout } = useAuth();
    // const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setShowMobileSearch(false);
    };

    const toggleMobileSearch = () => {
        setShowMobileSearch(!showMobileSearch);
        if (!showMobileSearch) {
            setMobileMenuOpen(false);
        }
    };

    const getUserInitial = () => {
        if (user?.firstname) {
            return user.firstname[0].toUpperCase();
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return "U";
    };

    const formatRole = (role: string): string => {
        switch(role) {
            case "ADMIN": return "👑 Admin";
            case "AUTHOR": return "✍️ Author";
            default: return "🎬 User";
        }
    };

    return (
        <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Logo & Navigation */}
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link
                            to={user ? "/home" : "/"}
                            className="flex items-center space-x-3"
                            onClick={closeMobileMenu}
                        >
                            <div className="p-2 bg-rose-600 rounded-lg">
                                <span className="text-xl">🎬</span>
                            </div>
                            <span className="text-xl font-bold text-slate-50 hidden sm:block">
                                CINETIME
                            </span>
                            <span className="text-xl font-bold text-slate-50 sm:hidden">
                                CT
                            </span>
                        </Link>

                        {/* Desktop Navigation Links - Only show when logged in */}
                        {user && (
                            <div className="hidden md:block ml-10">
                                <div className="flex items-baseline space-x-4">
                                    <Link
                                        to="/home"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        to="/movies"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                    >
                                        Movies
                                    </Link>
                                    <Link
                                        to="/tvshows"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                    >
                                        TV Shows
                                    </Link>
                                    <Link
                                        to="/watchlist"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                    >
                                        Watchlist
                                    </Link>
                                    {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
                                        <Link
                                            to="/create"
                                            className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                        >
                                            Create
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center - Search Bar (Desktop) */}
                    {user && (
                        <div className="hidden md:block flex-1 max-w-2xl mx-8">
                            <SearchBar />
                        </div>
                    )}

                    {/* Right side - User info & Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Mobile Search Button */}
                        {user && (
                            <button
                                onClick={toggleMobileSearch}
                                className="md:hidden text-slate-400 hover:text-slate-50 p-2"
                                aria-label="Search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        )}

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={toggleMobileMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Desktop User Menu - Minimalistic */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    {/* Minimalistic User Icon Button */}
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                        aria-label="User menu"
                                    >
                                        {/* User Avatar Icon */}
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {/* User Info Section */}
                                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-bold">{getUserInitial()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-50 truncate max-w-[180px]">
                                                            {user.firstname} {user.lastname}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate max-w-[180px]">
                                                            {user.email}
                                                        </p>
                                                        <div className="flex items-center mt-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        user.approved === "APPROVED"
                                            ? "bg-green-900/30 text-green-300"
                                            : "bg-yellow-900/30 text-yellow-300"
                                    }`}>
                                        {user.approved === "APPROVED" ? "✓ Verified" : "⏳ Pending"}
                                    </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items - Icon-based */}
                                            <div className="py-2">
                                                <Link
                                                    to="/home"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition group"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center mr-3 bg-slate-900/50 group-hover:bg-slate-600/50 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Home</div>
                                                        <div className="text-xs text-slate-500">Dashboard</div>
                                                    </div>
                                                </Link>

                                                <Link
                                                    to="/profile"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition group"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center mr-3 bg-slate-900/50 group-hover:bg-slate-600/50 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Profile Settings</div>
                                                        <div className="text-xs text-slate-500">Manage account</div>
                                                    </div>
                                                </Link>

                                                <Link
                                                    to="/watchlist"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition group"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center mr-3 bg-slate-900/50 group-hover:bg-slate-600/50 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">My Watchlist</div>
                                                        <div className="text-xs text-slate-500">Saved content</div>
                                                    </div>
                                                </Link>

                                                {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
                                                    <Link
                                                        to="/create"
                                                        className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition group"
                                                        onClick={() => setDropdownOpen(false)}
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center mr-3 bg-slate-900/50 group-hover:bg-slate-600/50 rounded-lg">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">Create Content</div>
                                                            <div className="text-xs text-slate-500">Add movies & reviews</div>
                                                        </div>
                                                    </Link>
                                                )}

                                                <div className="border-t border-slate-700 my-2"></div>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition group"
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center mr-3 bg-slate-900/50 group-hover:bg-slate-600/50 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Logout</div>
                                                        <div className="text-xs text-rose-500/70">Sign out</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to="/login"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {showMobileSearch && user && (
                    <div className="md:hidden py-4 border-t border-slate-700">
                        <SearchBar />
                    </div>
                )}
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-800 border-t border-slate-700">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {user ? (
                            <>
                                {/* User Info - Mobile */}
                                <div className="px-3 py-4 border-b border-slate-700">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-bold">{getUserInitial()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-50">
                                                {user.firstname} {user.lastname}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Navigation Links */}
                                <Link
                                    to="/home"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">📊</span>
                                    Home
                                </Link>
                                <Link
                                    to="/movies"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">🎬</span>
                                    Movies
                                </Link>
                                <Link
                                    to="/tvshows"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">📺</span>
                                    TV Shows
                                </Link>
                                <Link
                                    to="/watchlist"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">🎯</span>
                                    Watchlist
                                </Link>
                                {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
                                    <Link
                                        to="/create"
                                        className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                        onClick={closeMobileMenu}
                                    >
                                        <span className="mr-3">✍️</span>
                                        Create Content
                                    </Link>
                                )}
                                <Link
                                    to="/profile"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">👤</span>
                                    Profile Settings
                                </Link>

                                <div className="border-t border-slate-700 pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left text-rose-400 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    >
                                        <span className="mr-3">🚪</span>
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">🏠</span>
                                    Home
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">🔑</span>
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-3 rounded-md text-base font-medium"
                                    onClick={closeMobileMenu}
                                >
                                    <span className="mr-3">📝</span>
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}