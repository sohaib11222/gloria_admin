import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SearchPalette } from "../SearchPalette";
import { useSearch } from "../../contexts/SearchContext";
import { Menu } from "lucide-react";
import logoImage from "../../assets/logo.jpg";

const formatCrumb = (segment: string) => {
	return segment
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const Shell: React.FC = () => {
	const location = useLocation();
	const { isOpen, openSearch, closeSearch } = useSearch();
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				openSearch();
			}
			if (e.key === "Escape" && isOpen) {
				closeSearch();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, openSearch, closeSearch]);

	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	const breadcrumbs = location.pathname.split("/").filter(Boolean);

	return (
		<>
			<div className="flex h-screen overflow-hidden bg-slate-100 text-slate-950">
				<div className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:hidden">
					<div className="flex h-16 items-center justify-between px-4">
						<div className="flex min-w-0 items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
								<img
									src={logoImage}
									alt="Gloria Connect"
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="min-w-0">
								<h1 className="truncate text-base font-bold text-slate-950">
									Gloria Connect
								</h1>
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
									Admin
								</p>
							</div>
						</div>
						<button
							onClick={() => setMobileOpen(!mobileOpen)}
							className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
							aria-label="Toggle menu"
							aria-expanded={mobileOpen}
						>
							<Menu className="h-5 w-5" />
						</button>
					</div>
				</div>

				<Sidebar
					mobileOpen={mobileOpen}
					onMobileToggle={() => setMobileOpen(false)}
				/>

				<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
					<div className="h-16 flex-none lg:hidden" />
					<Topbar />

					<div className="border-b border-slate-200/80 bg-white/70 backdrop-blur">
						<div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
							<nav
								className="flex items-center gap-1 text-sm"
								aria-label="Breadcrumb"
							>
								<Link
									to="/dashboard"
									className="font-medium text-slate-500 transition hover:text-blue-700"
								>
									Admin
								</Link>
								{breadcrumbs.map((seg, idx) => (
									<React.Fragment key={`${seg}-${idx}`}>
										<span className="px-1 text-slate-300">/</span>
										<span
											className={
												idx === breadcrumbs.length - 1
													? "font-semibold text-slate-900"
													: "font-medium text-slate-500"
											}
										>
											{formatCrumb(seg)}
										</span>
									</React.Fragment>
								))}
							</nav>
						</div>
					</div>

					<main className="flex-1 overflow-y-auto">
						<div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
							<Outlet />
						</div>
					</main>
				</div>
			</div>
			<SearchPalette isOpen={isOpen} onClose={closeSearch} />
		</>
	);
};
