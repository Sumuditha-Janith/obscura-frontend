import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import SearchBar from "./SearchBar";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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

                        {/* Desktop User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    {/* User Profile Button */}
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center space-x-3 bg-slate-700 hover:bg-slate-600 text-slate-50 px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        {/* User Avatar */}
                                        <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold">{getUserInitial()}</span>
                                        </div>

                                        {/* User Info - Desktop only */}
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium truncate max-w-[120px]">
                                                {user.firstname} {user.lastname}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {user.roles?.map((role: string) => formatRole(role)).join(", ")}
                                            </span>
                                        </div>

                                        {/* Dropdown Arrow */}
                                        <svg
                                            className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {/* User Info Section */}
                                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                                                <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                                                <p className="text-sm font-medium text-slate-50 truncate">{user.email}</p>
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

                                            {/* Menu Items */}
                                            <div className="py-2">
                                                <Link
                                                    to="/home"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <span className="mr-3 text-lg">📊</span>
                                                    <div>
                                                        <div className="font-medium">Home</div>
                                                        <div className="text-xs text-slate-500">Your movie stats</div>
                                                    </div>
                                                </Link>

                                                <Link
                                                    to="/profile"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <span className="mr-3 text-lg">👤</span>
                                                    <div>
                                                        <div className="font-medium">Profile Settings</div>
                                                        <div className="text-xs text-slate-500">Manage your account</div>
                                                    </div>
                                                </Link>

                                                <Link
                                                    to="/watchlist"
                                                    className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <span className="mr-3 text-lg">🎯</span>
                                                    <div>
                                                        <div className="font-medium">My Watchlist</div>
                                                        <div className="text-xs text-slate-500">Movies to watch</div>
                                                    </div>
                                                </Link>

                                                {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
                                                    <Link
                                                        to="/create"
                                                        className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition"
                                                        onClick={() => setDropdownOpen(false)}
                                                    >
                                                        <span className="mr-3 text-lg">✍️</span>
                                                        <div>
                                                            <div className="font-medium">Create Content</div>
                                                            <div className="text-xs text-slate-500">Add movies & reviews</div>
                                                        </div>
                                                    </Link>
                                                )}

                                                <div className="border-t border-slate-700 my-2"></div>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition"
                                                >
                                                    <span className="mr-3 text-lg">🚪</span>
                                                    <div>
                                                        <div className="font-medium">Logout</div>
                                                        <div className="text-xs text-rose-500/70">Sign out of your account</div>
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