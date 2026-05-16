import React, { useState } from "react";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { userAtom, logoutAtom } from "../../store/auth";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { NotificationsDrawer } from "../NotificationsDrawer";
import { useSearch } from "../../contexts/SearchContext";
import http from "../../lib/http";

export const Topbar: React.FC = () => {
	const navigate = useNavigate();
	const [user] = useAtom(userAtom);
	const [, logout] = useAtom(logoutAtom);
	const [showNotifications, setShowNotifications] = useState(false);
	const { openSearch } = useSearch();

	const { data: notificationsData } = useQuery({
		queryKey: ["notifications-count"],
		queryFn: async () => {
			try {
				const { data } = await http.get("/admin/notifications", {
					params: { limit: 50, unreadOnly: true },
				});
				const items = data?.items || data?.data?.items || [];
				return items.filter((n: any) => !n.read && !n.readAt);
			} catch (error) {
				return [];
			}
		},
		refetchInterval: 30000,
		retry: 1,
	});

	const unreadCount = notificationsData?.length || 0;

	const handleLogout = () => {
		logout();
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("notifiedAgreements");
		navigate("/login", { replace: true });
	};

	const apiLabel = (() => {
		if (import.meta.env.VITE_API_BASE_URL)
			return import.meta.env.VITE_API_BASE_URL;
		if (import.meta.env.PROD) return "Same Origin";
		return "http://localhost:8080";
	})();

	return (
		<>
			<header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
				<div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<Badge
							variant="info"
							size="sm"
							className="hidden max-w-[280px] truncate font-mono text-xs xl:inline-flex"
						>
							{apiLabel}
						</Badge>

						<button
							onClick={openSearch}
							className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-700 sm:max-w-md"
							aria-label="Open quick search"
						>
							<Search className="h-4 w-4 flex-none text-slate-400" />
							<span className="truncate">
								Quick search across admin data...
							</span>
							<kbd className="ml-auto hidden rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm md:inline-flex">
								Ctrl K
							</kbd>
						</button>
					</div>

					<div className="flex flex-none items-center gap-2 sm:gap-3">
						<button
							onClick={() => setShowNotifications(true)}
							className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
							aria-label="Open notifications"
							aria-haspopup="dialog"
							aria-expanded={showNotifications}
						>
							<Bell className="h-5 w-5" />
							{unreadCount > 0 && (
								<span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</button>

						<div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex">
							<div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
								{(user?.email || "A").substring(0, 1).toUpperCase()}
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
										{user?.email || "Admin"}
									</p>
									<Badge
										variant="default"
										size="sm"
										className="bg-slate-100 text-slate-600"
									>
										{user?.type || "ADMIN"}
									</Badge>
								</div>
								<p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
									<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
									Secure admin session
								</p>
							</div>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={handleLogout}
							className="h-10 rounded-xl border border-transparent px-2 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900 sm:px-3"
						>
							<LogOut className="h-4 w-4" />
							<span className="ml-2 hidden sm:inline">Logout</span>
						</Button>
					</div>
				</div>
			</header>

			<NotificationsDrawer
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
		</>
	);
};
