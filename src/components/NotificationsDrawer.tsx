import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Bell,
	Building2,
	Check,
	CheckCheck,
	Clock,
	ExternalLink,
	FileText,
	Inbox,
	MapPin,
	Settings,
	X,
} from "lucide-react";
import http from "../lib/http";
import { cn } from "../lib/utils";
import { formatDate, formatRelativeTime } from "../lib/utils";

interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	actionUrl?: string;
}

type NotificationTone = {
	label: string;
	Icon: React.ComponentType<{ className?: string }>;
	className: string;
};

const getNotificationTone = (notification: Notification): NotificationTone => {
	const key = `${notification.type} ${notification.title}`.toLowerCase();

	if (key.includes("location")) {
		return {
			label: "Location",
			Icon: MapPin,
			className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
		};
	}

	if (
		key.includes("company") ||
		key.includes("source") ||
		key.includes("agent")
	) {
		return {
			label: "Company",
			Icon: Building2,
			className: "bg-indigo-50 text-indigo-700 ring-indigo-100",
		};
	}

	if (key.includes("agreement") || key.includes("contract")) {
		return {
			label: "Agreement",
			Icon: FileText,
			className: "bg-sky-50 text-sky-700 ring-sky-100",
		};
	}

	if (
		key.includes("health") ||
		key.includes("error") ||
		key.includes("warning")
	) {
		return {
			label: "Alert",
			Icon: AlertTriangle,
			className: "bg-amber-50 text-amber-700 ring-amber-100",
		};
	}

	return {
		label: "System",
		Icon: Settings,
		className: "bg-slate-100 text-slate-700 ring-slate-200",
	};
};

const normalizeActionPath = (actionUrl?: string) => {
	if (!actionUrl) return null;

	try {
		const url = actionUrl.startsWith("http")
			? new URL(actionUrl)
			: new URL(actionUrl, window.location.origin);

		if (url.origin !== window.location.origin) {
			return actionUrl;
		}

		const path = `${url.pathname}${url.search}${url.hash}`.replace(
			/^\/admin(?=\/|$)/,
			"",
		);
		return path || "/";
	} catch {
		const path = actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`;
		return path.replace(/^\/admin(?=\/|$)/, "") || "/";
	}
};

const getNotificationTime = (timestamp: string) => {
	try {
		return {
			relative: formatRelativeTime(timestamp),
			absolute: formatDate(timestamp),
		};
	} catch {
		return {
			relative: "Recently",
			absolute: timestamp,
		};
	}
};

export const NotificationsDrawer: React.FC<{
	isOpen: boolean;
	onClose: () => void;
}> = ({ isOpen, onClose }) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			loadNotifications();
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const loadNotifications = async () => {
		setIsLoading(true);
		try {
			const { data } = await http.get("/admin/notifications", {
				params: { limit: 50 },
			});

			const rawItems =
				data?.items || data?.data?.items || data?.data || data || [];
			const items = Array.isArray(rawItems) ? rawItems : [];

			const formattedNotifications = items.map((notif: any) => ({
				id: String(notif.id || `notif-${Date.now()}-${Math.random()}`),
				type: String(notif.type || notif.category || "system"),
				title: String(notif.title || "Notification"),
				message: String(notif.message || notif.description || ""),
				timestamp: String(
					notif.timestamp ||
						notif.createdAt ||
						notif.created_at ||
						new Date().toISOString(),
				),
				read:
					notif.read !== undefined
						? Boolean(notif.read)
						: Boolean(notif.readAt || notif.read_at),
				actionUrl: notif.actionUrl || notif.action_url || notif.url,
			}));

			setNotifications(formattedNotifications);
		} catch (error: any) {
			console.error("Error loading notifications:", error);
			setNotifications([]);
		} finally {
			setIsLoading(false);
		}
	};

	const markAsRead = async (id: string) => {
		const previousNotifications = notifications;
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);

		try {
			await http.post(`/admin/notifications/${id}/read`);
			queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
		} catch (error) {
			console.error("Error marking notification as read:", error);
			setNotifications(previousNotifications);
		}
	};

	const markAllAsRead = async () => {
		const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
		if (unreadIds.length === 0) return;

		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

		try {
			await Promise.all(
				unreadIds.map((id) =>
					http.post(`/admin/notifications/${id}/read`).catch(() => {}),
				),
			);
			queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		}
	};

	const unreadCount = notifications.filter((n) => !n.read).length;
	const readCount = notifications.length - unreadCount;

	const sortedNotifications = useMemo(() => {
		return [...notifications].sort((a, b) => {
			const readSort = Number(a.read) - Number(b.read);
			if (readSort !== 0) return readSort;
			const aTime = Date.parse(a.timestamp) || 0;
			const bTime = Date.parse(b.timestamp) || 0;
			return bTime - aTime;
		});
	}, [notifications]);

	if (!isOpen) return null;

	const drawerContent = (
		<>
			<div
				className="fixed inset-0 z-40 bg-slate-950/5 backdrop-blur-[1px]"
				onClick={onClose}
				aria-hidden="true"
			/>

			<aside
				role="dialog"
				aria-modal="true"
				aria-label="Notifications"
				className="fixed inset-y-3 right-3 z-50 flex w-[min(440px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 sm:inset-y-4 sm:right-4"
			>
				<div className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white">
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="flex items-center gap-2">
								<span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
									<Bell className="h-4 w-4" />
								</span>
								<div>
									<h2 className="text-base font-semibold tracking-tight">
										Notifications
									</h2>
									<p className="text-xs text-slate-300">
										Operational updates and approvals
									</p>
								</div>
							</div>
						</div>
						<button
							onClick={onClose}
							className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
							aria-label="Close notifications"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="mt-5 grid grid-cols-2 gap-3">
						<div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
							<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
								Unread
							</p>
							<p className="mt-1 text-2xl font-semibold text-white">
								{unreadCount}
							</p>
						</div>
						<div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
							<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
								Resolved
							</p>
							<p className="mt-1 text-2xl font-semibold text-white">
								{readCount}
							</p>
						</div>
					</div>

					<button
						onClick={markAllAsRead}
						disabled={unreadCount === 0}
						className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400 disabled:shadow-none"
					>
						<CheckCheck className="h-4 w-4" />
						Mark all as read
					</button>
				</div>

				<div className="flex-1 overflow-y-auto bg-slate-50/80">
					{isLoading ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
							<p className="mt-4 text-sm font-medium text-slate-700">
								Loading notifications...
							</p>
						</div>
					) : notifications.length === 0 ? (
						<div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
								<Inbox className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-900">
								You are all caught up
							</h3>
							<p className="mt-1 text-sm text-slate-500">
								New approvals, system alerts, and requests will appear here.
							</p>
						</div>
					) : (
						<div className="divide-y divide-slate-100">
							{sortedNotifications.map((notification) => {
								const tone = getNotificationTone(notification);
								const NotificationIcon = tone.Icon;
								const time = getNotificationTime(notification.timestamp);
								const actionPath = normalizeActionPath(notification.actionUrl);

								const openNotification = () => {
									if (!notification.read) {
										markAsRead(notification.id);
									}

									if (actionPath) {
										if (actionPath.startsWith("http")) {
											window.open(actionPath, "_blank", "noopener,noreferrer");
										} else {
											navigate(actionPath);
										}
										onClose();
									}
								};

								return (
									<div
										key={notification.id}
										role="button"
										tabIndex={0}
										onClick={openNotification}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												openNotification();
											}
										}}
										className={cn(
											"group block w-full cursor-pointer bg-white px-5 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50",
											!notification.read && "bg-blue-50/70 hover:bg-blue-50",
										)}
									>
										<div className="flex gap-3">
											<span
												className={cn(
													"mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1",
													tone.className,
												)}
											>
												<NotificationIcon className="h-5 w-5" />
											</span>

											<span className="min-w-0 flex-1">
												<span className="flex items-start justify-between gap-3">
													<span className="min-w-0">
														<span className="flex items-center gap-2">
															<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
																{tone.label}
															</span>
															{!notification.read && (
																<span
																	className="inline-flex h-2 w-2 rounded-full bg-blue-600 shadow-sm shadow-blue-600/40"
																	aria-label="Unread"
																/>
															)}
														</span>
														<span className="mt-1 block text-sm font-semibold leading-5 text-slate-950">
															{notification.title}
														</span>
													</span>

													{actionPath && (
														<ExternalLink className="mt-1 h-4 w-4 flex-none text-slate-300 transition group-hover:text-slate-500" />
													)}
												</span>

												{notification.message && (
													<span className="mt-2 block text-sm leading-5 text-slate-600">
														{notification.message}
													</span>
												)}

												<span className="mt-3 flex items-center justify-between gap-3">
													<span
														className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
														title={time.relative}
													>
														<Clock className="h-3.5 w-3.5" />
														{time.absolute}
													</span>

													{!notification.read && (
														<button
															type="button"
															onClick={(event) => {
																event.stopPropagation();
																markAsRead(notification.id);
															}}
															className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 opacity-0 transition hover:bg-blue-100 group-hover:opacity-100 focus:opacity-100"
														>
															<Check className="h-3.5 w-3.5" />
															Read
														</button>
													)}
												</span>
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</aside>
		</>
	);

	return createPortal(drawerContent, document.body);
};
