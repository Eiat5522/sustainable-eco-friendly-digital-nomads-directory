"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Calendar, Home, Leaf, LogIn, Mail, Menu, UserCircle, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const navigationItems = [
{ name: 'Home', href: '/', icon: Home },
{ name: 'Listings', href: '/listings', icon: Calendar },
{ name: 'Find', href: '/search' }, // No icon for Find
{ name: 'Blog', href: '/blog', icon: BookOpen },
{ name: 'Contact Us', href: '/contact', icon: Mail },
];

interface MainNavProps {}

export function MainNav({}: MainNavProps) {
	const [isScrolled, setIsScrolled] = useState<boolean>(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
	const pathname = usePathname();
	const { data: session, status } = useSession();

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
			<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center">
						<Link href="/" className="flex items-center group">
							<Leaf className="h-8 w-8 text-primary-500 transition-transform group-hover:rotate-12" />
							<span className="ml-2 text-xl font-medium text-gray-900 dark:text-white">
								EcoNomads
							</span>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:space-x-6 lg:space-x-8">
{navigationItems.map((item) => {
const Icon = item.icon;
const isActive = pathname === item.href;
return (
<Link
key={item.name}
href={item.href}
className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center group text-sm font-medium transition-colors`}
>
{Icon && <Icon className={`mr-1.5 h-4 w-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />}
<span className={`${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>{item.name}</span>
</Link>
);
})}

						{/* Auth Button/User Menu - Desktop */}
						{status === 'loading' ? (
							<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
						) : session ? (
							<div className="relative group">
								<button
									className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
									aria-label="User menu"
								>
									{session.user?.image ? (
										<img
											src={session.user.image}
											alt={session.user.name || 'User profile'}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-100">
											{session.user?.name?.charAt(0)?.toUpperCase() || <UserCircle className="h-5 w-5" />}
										</div>
									)}
								</button>
								<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
									<div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
										<p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.user?.name ?? 'User'}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email ?? ''}</p>
									</div>
									<Link
										href="/dashboard"
										className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										Dashboard
									</Link>
									<Link
										href="/account"
										className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										Account Settings
									</Link>
									<button
										onClick={() => signOut()}
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										Sign out
									</button>
								</div>
							</div>
						) : (
							<button
								onClick={() => signIn()
}
								className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
								aria-label="Sign in"
							>
								<LogIn className="mr-1.5 h-4 w-4" />
								Login
							</button>
						)}
					</div>

{/* Mobile menu button */}
<div className="flex md:hidden items-center space-x-2">
{status !== 'loading' && !session && (
							<button
								onClick={() => signIn()}
								className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								aria-label="Sign in"
							>
								<LogIn className="h-5 w-5" />
							</button>
						)}
						{status !== 'loading' && session && (
							<div className="relative group">
								<button
									className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500"
									aria-label="User menu"
									onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								>
									{session.user?.image ? (
										<img src={session.user.image} alt={session.user.name || 'User profile'} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-100">
											{session.user?.name?.charAt(0)?.toUpperCase() || <UserCircle className="h-5 w-5" />}
										</div>
									)}
								</button>
							</div>
						)}
<button
onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
aria-expanded={mobileMenuOpen ? "true" : "false"}
>
							<span className="sr-only">Open main menu</span>
							{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile menu */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						id="mobile-menu"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg"
					>
						<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
{navigationItems.map((item) => {
const Icon = item.icon;
const isActive = pathname === item.href;
return (
<Link key={item.name} href={item.href}>
<span className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
isActive
? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
}`}>
{Icon && <Icon className="mr-3 h-5 w-5" />}
{item.name}
</span>
</Link>
);
})}

							{/* Mobile Auth/User actions */}
							<div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
								{session && (
									<>
										<div className="px-3 py-2">
											<p className="text-sm font-medium text-gray-800 dark:text-white truncate">{session.user?.name ?? 'User'}</p>
											<p className="text-xs text-gray-600 dark:text-gray-400 truncate">{session.user?.email ?? ''}</p>
										</div>
										<Link href="/dashboard">
											<span className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
												Dashboard
											</span>
										</Link>
										<Link href="/account">
											<span className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
												Account Settings
											</span>
										</Link>
										<button
											onClick={() => { signOut(); setMobileMenuOpen(false); }}
											className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
										>
											Sign out
										</button>
									</>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
