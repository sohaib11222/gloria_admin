import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { NAVIGATION_ITEMS } from "../../lib/constants";
import * as Icons from "lucide-react";
import { ExternalLink, ShieldCheck, X } from "lucide-react";
import logoImage from "../../assets/logo.jpg";

interface SidebarProps {
	mobileOpen?: boolean;
	onMobileToggle?: () => void;
}

const NAVIGATION_SECTIONS = [
	{
		label: "Overview",
		paths: ["/dashboard", "/companies", "/agents", "/sources"],
	},
	{
		label: "Network operations",
		paths: [
			"/agreements-management",
			"/locations",
			"/branches",
			"/location-requests",
			"/unlocodes",
			"/location-validation",
			"/availability",
			"/verification",
			"/booking-logs",
		],
	},
	{
		label: "Commercial",
		paths: ["/billing", "/referrals", "/transactions", "/support"],
	},
	{
		label: "Administration",
		paths: [
			"/health",
			"/activity",
			"/integrations",
			"/ip-whitelist",
			"/logs",
			"/metrics",
			"/docs",
			"/settings",
		],
	},
];

const itemByPath = new Map(NAVIGATION_ITEMS.map((item) => [item.path, item]));

export const Sidebar: React.FC<SidebarProps> = ({
	mobileOpen = false,
	onMobileToggle,
}) => {
	const location = useLocation();

	return (
		<>
			{mobileOpen && (
				<div
					className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-sm lg:hidden"
					onClick={onMobileToggle}
					aria-hidden="true"
				/>
			)}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-[70] flex h-screen w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-slate-200 shadow-2xl shadow-slate-950/30",
					"transform transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-16 items-center gap-3 border-b border-white/10 bg-slate-950 px-5">
					<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20">
						<img
							src={logoImage}
							alt="Gloria Connect"
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="truncate text-base font-bold tracking-tight text-white">
							Gloria Connect
						</h1>
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
							Admin console
						</p>
					</div>
					{onMobileToggle && (
						<button
							onClick={onMobileToggle}
							className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
							aria-label="Close menu"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>

				<nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
					{NAVIGATION_SECTIONS.map((section) => {
						const items = section.paths
							.map((path) => itemByPath.get(path))
							.filter(Boolean);

						return (
							<div key={section.label} className="space-y-1.5">
								<p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
									{section.label}
								</p>

								{items.map((item) => {
									if (!item) return null;

									const Icon = Icons[
										item.icon as keyof typeof Icons
									] as React.ComponentType<{ className?: string }>;
									const isActive =
										item.path === "/dashboard"
											? location.pathname === "/dashboard" ||
												location.pathname === "/"
											: location.pathname.startsWith(item.path);

									if (item.path === "/docs") {
										const handleDocsClick = (e: React.MouseEvent) => {
											e.preventDefault();
											onMobileToggle?.();
											const docsUrl = `${window.location.origin}/admin/docs-fullscreen`;
											window.open(docsUrl, "_blank", "noopener,noreferrer");
										};

										return (
											<button
												key={item.path}
												onClick={handleDocsClick}
												className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
											>
												<Icon className="h-5 w-5 flex-none text-slate-500 transition group-hover:text-slate-200" />
												<span className="min-w-0 flex-1 truncate">
													{item.label}
												</span>
												<ExternalLink className="h-3.5 w-3.5 flex-none text-slate-600 transition group-hover:text-slate-300" />
											</button>
										);
									}

									return (
										<Link
											key={item.path}
											to={item.path}
											onClick={onMobileToggle}
											className={cn(
												"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
												isActive
													? "bg-white text-slate-950 shadow-lg shadow-slate-950/20"
													: "text-slate-300 hover:bg-white/10 hover:text-white",
											)}
										>
											{isActive && (
												<span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
											)}
											<Icon
												className={cn(
													"h-5 w-5 flex-none transition",
													isActive
														? "text-blue-600"
														: "text-slate-500 group-hover:text-slate-200",
												)}
											/>
											<span className="min-w-0 flex-1 truncate">
												{item.label}
											</span>
										</Link>
									);
								})}
							</div>
						);
					})}
				</nav>

				<div className="border-t border-white/10 p-4">
					<div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
						<div className="flex items-center gap-3">
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
								<ShieldCheck className="h-5 w-5" />
							</span>
							<div className="min-w-0">
								<p className="text-sm font-semibold text-white">
									Protected workspace
								</p>
								<p className="mt-0.5 text-xs leading-5 text-slate-400">
									Monitor companies, agents, sources, and system health.
								</p>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</>
	);
};
