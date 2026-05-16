import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	ClipboardList,
	FileText,
	HeartPulse,
	ListChecks,
	Server,
	Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { companiesApi } from "../api/companies";
import { agreementsApi } from "../api/agreements";
import { healthApi } from "../api/health";
import { verificationApi } from "../api/verification";
import { logsApi } from "../api/logs";
import { formatDate, cn } from "../lib/utils";
import http from "../lib/http";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type IconComponent = React.ComponentType<{ className?: string }>;

const tone = {
	default: {
		dot: "bg-slate-400",
		border: "border-l-slate-300",
		text: "text-slate-700",
	},
	success: {
		dot: "bg-emerald-600",
		border: "border-l-emerald-600",
		text: "text-emerald-700",
	},
	warning: {
		dot: "bg-amber-500",
		border: "border-l-amber-500",
		text: "text-amber-700",
	},
	danger: {
		dot: "bg-red-600",
		border: "border-l-red-600",
		text: "text-red-700",
	},
	info: {
		dot: "bg-blue-600",
		border: "border-l-blue-600",
		text: "text-blue-700",
	},
} satisfies Record<BadgeVariant, { dot: string; border: string; text: string }>;

const statusVariant = (status?: string): BadgeVariant => {
	const normalized = status?.toUpperCase();

	if (!normalized) return "default";
	if (
		[
			"ACTIVE",
			"CONFIRMED",
			"PASSED",
			"HEALTHY",
			"OPERATIONAL",
			"IDLE",
		].includes(normalized)
	)
		return "success";
	if (["PROCESSING", "INFO", "RUNNING"].includes(normalized)) return "info";
	if (
		["PENDING", "OFFERED", "SLOW", "WARN", "WARNING", "DEGRADED"].includes(
			normalized,
		)
	)
		return "warning";
	if (
		["ERROR", "FAILED", "CANCELLED", "EXCLUDED", "DOWN", "UNHEALTHY"].includes(
			normalized,
		)
	)
		return "danger";
	return "default";
};

const formatStatusLabel = (status?: string) =>
	(status || "UNKNOWN").replace(/_/g, " ").toUpperCase();

const safeFormatDate = (value?: string | number | Date | null) => {
	if (!value) return "—";

	try {
		return formatDate(value instanceof Date ? value : String(value));
	} catch {
		return String(value);
	}
};

const Panel = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<section
		className={cn(
			"rounded-md border border-slate-200 bg-white shadow-none",
			className,
		)}
	>
		{children}
	</section>
);

const SectionHeader = ({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: IconComponent;
	title: string;
	description: string;
	action?: React.ReactNode;
}) => (
	<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
		<div className="flex min-w-0 items-start gap-3">
			<span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
				<Icon className="h-5 w-5" />
			</span>
			<div className="min-w-0">
				<h2 className="text-base font-semibold text-slate-950">{title}</h2>
				<p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
			</div>
		</div>
		{action}
	</div>
);

const EmptyState = ({
	icon: Icon,
	title,
	message,
}: {
	icon: IconComponent;
	title: string;
	message: string;
}) => (
	<div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
		<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
			<Icon className="h-6 w-6" />
		</span>
		<h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
		<p className="mt-1 max-w-md text-sm leading-5 text-slate-500">{message}</p>
	</div>
);

const ErrorState = ({ message }: { message: string }) => (
	<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
		<div className="flex items-center gap-2 font-semibold">
			<AlertTriangle className="h-4 w-4" />
			Unable to load data
		</div>
		<p className="mt-1 text-red-700">{message}</p>
	</div>
);

const MetricCard = ({
	label,
	value,
	helper,
	icon: Icon,
	variant = "default",
	to,
}: {
	label: string;
	value: React.ReactNode;
	helper: string;
	icon: IconComponent;
	variant?: BadgeVariant;
	to?: string;
}) => {
	const content = (
		<article className="h-full rounded-md border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
						{label}
					</p>
					<p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
						{value}
					</p>
				</div>
				<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
					<Icon className="h-5 w-5" />
				</span>
			</div>
			<div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
				<span className={cn("h-2 w-2 rounded-full", tone[variant].dot)} />
				<span>{helper}</span>
			</div>
		</article>
	);

	if (!to) return content;

	return (
		<Link
			to={to}
			className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
		>
			{content}
		</Link>
	);
};

const StatusCard = ({
	title,
	message,
	status,
}: {
	title: string;
	message?: string;
	status?: string;
}) => {
	const variant = statusVariant(status);

	return (
		<article
			className={cn(
				"rounded-md border border-l-4 border-slate-200 bg-white p-4",
				tone[variant].border,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-semibold text-slate-950">{title}</p>
					<p className="mt-1 text-sm leading-5 text-slate-500">
						{message || "No status message available."}
					</p>
				</div>
				<Badge variant={variant} size="sm" className="flex-none">
					{formatStatusLabel(status)}
				</Badge>
			</div>
		</article>
	);
};

const RowShell = ({
	children,
	variant = "default",
}: {
	children: React.ReactNode;
	variant?: BadgeVariant;
}) => (
	<div
		className={cn(
			"rounded-md border border-l-4 border-slate-200 bg-white px-4 py-3",
			tone[variant].border,
		)}
	>
		{children}
	</div>
);

const HeaderActionLink = ({
	to,
	children,
}: {
	to: string;
	children: React.ReactNode;
}) => (
	<Link
		to={to}
		className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-950"
	>
		{children}
		<ArrowRight className="h-3.5 w-3.5" />
	</Link>
);

export default function Dashboard() {
	const { data: sources, isLoading: sourcesLoading } = useQuery({
		queryKey: ["sources"],
		queryFn: () => companiesApi.listSources(),
	});

	const { data: agents, isLoading: agentsLoading } = useQuery({
		queryKey: ["agents"],
		queryFn: () => companiesApi.listAgents(),
	});

	const { data: agreements, isLoading: agreementsLoading } = useQuery({
		queryKey: ["agreements"],
		queryFn: () => agreementsApi.listAgreements(),
	});

	const {
		data: health,
		isLoading: healthLoading,
		error: healthError,
	} = useQuery({
		queryKey: ["health"],
		queryFn: () => healthApi.getSourceHealth(),
		retry: 1,
	});

	const {
		data: verificationStatus,
		isLoading: verificationLoading,
		error: verificationError,
	} = useQuery({
		queryKey: ["verification-status"],
		queryFn: () => verificationApi.getVerificationStatus(),
		retry: 1,
	});

	const {
		data: recentLogs,
		isLoading: logsLoading,
		error: logsError,
	} = useQuery({
		queryKey: ["logs", "recent-10"],
		queryFn: () => logsApi.listLogs({ limit: 10 }),
		retry: 1,
	});

	const {
		data: lastBookings,
		isLoading: bookingsLoading,
		error: bookingsError,
	} = useQuery({
		queryKey: ["bookings", "last-5"],
		queryFn: async () => {
			try {
				const { data } = await http.get("/bookings", { params: { limit: 5 } });
				if (Array.isArray(data)) return data;
				if (data?.data && Array.isArray(data.data)) return data.data;
				if (data?.items && Array.isArray(data.items)) return data.items;
				return [];
			} catch (error: any) {
				console.error("Error fetching bookings:", error);
				return [];
			}
		},
		retry: 1,
	});

	const { data: systemStatus, isLoading: systemStatusLoading } = useQuery({
		queryKey: ["system-status"],
		queryFn: async () => {
			const { data } = await http.get("/admin/system-status");
			return data;
		},
		retry: 1,
		refetchInterval: 30000,
	});

	const recentVerifications = React.useMemo(() => {
		if (!verificationStatus) return [];
		if (verificationStatus.report?.test_results)
			return verificationStatus.report.test_results.slice(0, 5);

		const statusAny = verificationStatus as any;
		if (statusAny.steps && Array.isArray(statusAny.steps)) {
			return statusAny.steps.slice(0, 5).map((step: any) => ({
				name: step.name || step.step || "Test",
				description: step.detail || step.message || "",
				status: step.passed ? "PASSED" : "FAILED",
				duration_ms: step.latency || 0,
			}));
		}
		return [];
	}, [verificationStatus]);

	const healthItems = Array.isArray(health) ? health : [];
	const logItems = Array.isArray(recentLogs?.data) ? recentLogs.data : [];
	const bookingItems = Array.isArray(lastBookings) ? lastBookings : [];

	const sourcesCount = sources?.data?.length || 0;
	const agentsCount = agents?.data?.length || 0;
	const agreementsCount = agreements?.data?.length || 0;

	const activeSources = React.useMemo(() => {
		if (!sources?.data || !Array.isArray(sources.data)) return 0;
		return sources.data.filter((source) => source.status === "ACTIVE").length;
	}, [sources?.data]);

	const activeAgents = React.useMemo(() => {
		if (!agents?.data || !Array.isArray(agents.data)) return 0;
		return agents.data.filter((agent) => agent.status === "ACTIVE").length;
	}, [agents?.data]);

	const activeAgreements = React.useMemo(() => {
		if (!agreements?.data || !Array.isArray(agreements.data)) return 0;
		return agreements.data.filter((agreement) => agreement.status === "ACTIVE")
			.length;
	}, [agreements?.data]);

	const excludedSources = React.useMemo(() => {
		return healthItems.filter((item: any) => item.status === "EXCLUDED").length;
	}, [healthItems]);

	const failedVerificationCount = recentVerifications.filter(
		(test: any) => statusVariant(test.status) === "danger",
	).length;
	const unhealthySourceCount = healthItems.filter(
		(item: any) => statusVariant(item.status) !== "success",
	).length;
	const errorLogCount = logItems.filter(
		(log: any) => log.level === "ERROR" || log.http_status >= 400,
	).length;
	const hasBookingErrors = logItems.some(
		(log: any) =>
			(log.endpoint || "").toLowerCase().includes("booking") &&
			(log.level === "ERROR" || (log.http_status && log.http_status >= 400)),
	);

	const attentionItems = [
		{
			show: excludedSources > 0,
			title: "Excluded sources",
			description: `${excludedSources} source(s) are excluded from routing.`,
			to: "/health",
			variant: "danger" as BadgeVariant,
		},
		{
			show: failedVerificationCount > 0,
			title: "Verification failures",
			description: `${failedVerificationCount} recent verification check(s) failed.`,
			to: "/verification",
			variant: "danger" as BadgeVariant,
		},
		{
			show: hasBookingErrors,
			title: "Booking errors",
			description: "Recent logs include booking-related errors.",
			to: "/booking-logs",
			variant: "warning" as BadgeVariant,
		},
		{
			show: errorLogCount > 0,
			title: "Error logs",
			description: `${errorLogCount} recent log item(s) need review.`,
			to: "/logs",
			variant: "warning" as BadgeVariant,
		},
	].filter((item) => item.show);

	const isLoading =
		sourcesLoading ||
		agentsLoading ||
		agreementsLoading ||
		healthLoading ||
		verificationLoading ||
		logsLoading ||
		bookingsLoading ||
		systemStatusLoading;
	const platformVariant: BadgeVariant =
		attentionItems.length > 0 ? "warning" : "success";
	const platformStatus = attentionItems.length > 0 ? "Needs review" : "Stable";

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Panel className="p-6">
					<div className="flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Activity className="h-5 w-5" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Admin overview
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
								Dashboard
							</h1>
						</div>
					</div>
				</Panel>
				<Panel className="flex min-h-72 items-center justify-center p-8">
					<div className="text-center">
						<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
						<p className="mt-4 text-sm font-medium text-slate-700">
							Loading dashboard data...
						</p>
					</div>
				</Panel>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Panel className="overflow-hidden">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
							Admin overview
						</p>
						<div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-slate-950">
									Dashboard
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Monitor companies, agreements, service status, bookings, and
									recent platform activity from one place.
								</p>
							</div>
							<Badge variant={platformVariant} size="md">
								Platform {platformStatus}
							</Badge>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<MetricCard
								label="Sources"
								value={sourcesCount}
								helper={`${activeSources} active`}
								icon={Server}
								variant={
									activeSources === sourcesCount && sourcesCount > 0
										? "success"
										: "default"
								}
								to="/sources"
							/>
							<MetricCard
								label="Agents"
								value={agentsCount}
								helper={`${activeAgents} active`}
								icon={Users}
								variant={
									activeAgents === agentsCount && agentsCount > 0
										? "success"
										: "default"
								}
								to="/agents"
							/>
							<MetricCard
								label="Agreements"
								value={activeAgreements}
								helper={`${agreementsCount} total`}
								icon={FileText}
								variant="info"
								to="/agreements-management"
							/>
							<MetricCard
								label="Health issues"
								value={excludedSources}
								helper={excludedSources > 0 ? "Needs review" : "No exclusions"}
								icon={AlertTriangle}
								variant={excludedSources > 0 ? "danger" : "success"}
								to="/health"
							/>
						</div>
					</div>

					<aside className="bg-slate-50/60 p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-slate-950">
									Needs attention
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Items that may require admin review.
								</p>
							</div>
							<Badge
								variant={attentionItems.length > 0 ? "warning" : "success"}
								size="sm"
							>
								{attentionItems.length} open
							</Badge>
						</div>

						<div className="mt-4 space-y-3">
							{attentionItems.length > 0 ? (
								attentionItems.map((item) => (
									<Link
										key={item.title}
										to={item.to}
										className={cn(
											"block rounded-md border border-l-4 border-slate-200 bg-white p-3 transition hover:border-slate-300",
											tone[item.variant].border,
										)}
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-sm font-semibold text-slate-950">
													{item.title}
												</p>
												<p className="mt-1 text-sm leading-5 text-slate-500">
													{item.description}
												</p>
											</div>
											<ArrowRight className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
										</div>
									</Link>
								))
							) : (
								<div className="rounded-md border border-slate-200 bg-white p-4">
									<div className="flex gap-3">
										<CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
										<div>
											<p className="text-sm font-semibold text-slate-950">
												No immediate action required
											</p>
											<p className="mt-1 text-sm leading-5 text-slate-500">
												Core dashboard checks are currently clear.
											</p>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="mt-5 border-t border-slate-200 pt-5">
							<h3 className="text-sm font-semibold text-slate-950">
								Common actions
							</h3>
							<div className="mt-3 space-y-2">
								{[
									{
										to: "/verification",
										label: "Run source verification",
										icon: ListChecks,
									},
									{
										to: "/health",
										label: "Review health dashboard",
										icon: HeartPulse,
									},
									{
										to: "/metrics",
										label: "Open platform metrics",
										icon: BarChart3,
									},
								].map((action) => {
									const ActionIcon = action.icon;
									return (
										<Link
											key={action.to}
											to={action.to}
											className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
										>
											<span className="flex items-center gap-2">
												<ActionIcon className="h-4 w-4 text-slate-500" />
												{action.label}
											</span>
											<ArrowRight className="h-4 w-4 text-slate-400" />
										</Link>
									);
								})}
							</div>
						</div>
					</aside>
				</div>
			</Panel>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Panel className="xl:col-span-2">
					<SectionHeader
						icon={Server}
						title="System status"
						description="Core service status. Review this first when platform activity looks unusual."
					/>
					<div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
						{systemStatus ? (
							<>
								<StatusCard
									title="gRPC services"
									status={systemStatus.grpcServices?.status}
									message={
										systemStatus.grpcServices?.message ||
										"Checking service availability."
									}
								/>
								<StatusCard
									title="Job queue"
									status={systemStatus.jobQueue?.status}
									message={
										systemStatus.jobQueue?.message || "No active jobs reported."
									}
								/>
								<StatusCard
									title="Location sync"
									status={
										systemStatus.locationSync?.lastSync ? "ACTIVE" : "PENDING"
									}
									message={
										systemStatus.locationSync?.message ||
										"No location syncs recorded."
									}
								/>
							</>
						) : (
							<div className="col-span-full">
								<EmptyState
									icon={Server}
									title="System status unavailable"
									message="The dashboard could not read current service status."
								/>
							</div>
						)}
					</div>
				</Panel>

				<Panel>
					<SectionHeader
						icon={HeartPulse}
						title="Source health"
						description={`${unhealthySourceCount} source item(s) need review.`}
						action={<HeaderActionLink to="/health">View all</HeaderActionLink>}
					/>
					<div className="space-y-3 p-5">
						{healthError ? (
							<ErrorState message="Source health data is currently unavailable." />
						) : healthItems.length > 0 ? (
							healthItems.slice(0, 4).map((source: any) => {
								const variant = statusVariant(source.status);
								return (
									<RowShell
										key={
											source.companyId || source.sourceId || source.companyName
										}
										variant={variant}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-slate-950">
													{source.companyName || "Unknown source"}
												</p>
												<p className="mt-1 text-sm text-slate-500">
													{source.sampleCount || 0} samples ·{" "}
													{(source.slowRate || 0).toFixed(2)}% slow
												</p>
											</div>
											<Badge variant={variant} size="sm" className="flex-none">
												{formatStatusLabel(source.status)}
											</Badge>
										</div>
									</RowShell>
								);
							})
						) : (
							<EmptyState
								icon={HeartPulse}
								title="No health data"
								message="Health monitoring will appear after sources process requests."
							/>
						)}
					</div>
				</Panel>
			</div>

			<Panel>
				<SectionHeader
					icon={ClipboardList}
					title="Recent bookings"
					description="Latest booking transactions. Use this section to quickly verify recent operational flow."
					action={
						<HeaderActionLink to="/booking-logs">
							Open bookings
						</HeaderActionLink>
					}
				/>
				<div className="p-5">
					{bookingsError ? (
						<ErrorState message="Booking data is currently unavailable." />
					) : bookingItems.length > 0 ? (
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 md:grid">
								<span className="col-span-5">Booking</span>
								<span className="col-span-2">Status</span>
								<span className="col-span-2">Source</span>
								<span className="col-span-3 text-right">Created</span>
							</div>
							{bookingItems.map((booking: any, index: number) => {
								const status = formatStatusLabel(booking.status || "PENDING");
								const variant = statusVariant(status);
								const bookingRef = String(
									booking.booking_ref ||
										booking.bookingRef ||
										booking.id ||
										`Booking ${index + 1}`,
								);
								const vehicleInfo =
									booking.vehicle_info?.vehicle_make_model ||
									booking.vehicle_make_model ||
									"Vehicle not specified";
								const sourceId = String(
									booking.source_id || booking.sourceId || "unknown",
								);
								const createdAt = booking.created_at || booking.createdAt;

								return (
									<div
										key={booking.id || bookingRef}
										className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-12 md:items-center"
									>
										<div className="md:col-span-5">
											<p className="text-sm font-semibold text-slate-950">
												{vehicleInfo}
											</p>
											<code className="mt-1 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
												{bookingRef.slice(0, 18)}
											</code>
										</div>
										<div className="md:col-span-2">
											<Badge variant={variant} size="sm">
												{status}
											</Badge>
										</div>
										<div className="text-sm text-slate-600 md:col-span-2">
											{sourceId.slice(0, 12)}
										</div>
										<div className="text-sm text-slate-500 md:col-span-3 md:text-right">
											{safeFormatDate(createdAt)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<EmptyState
							icon={ClipboardList}
							title="No recent bookings"
							message="Bookings will appear here once they are created."
						/>
					)}
				</div>
			</Panel>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Panel>
					<SectionHeader
						icon={ListChecks}
						title="Verification results"
						description="Latest source verification checks and outcomes."
						action={
							<HeaderActionLink to="/verification">View all</HeaderActionLink>
						}
					/>
					<div className="space-y-3 p-5">
						{verificationError ? (
							<ErrorState message="Verification status is currently unavailable." />
						) : recentVerifications.length > 0 ? (
							recentVerifications.map((test: any, index: number) => {
								const variant = statusVariant(test.status);
								return (
									<RowShell key={`${test.name}-${index}`} variant={variant}>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-slate-950">
													{test.name || "Verification test"}
												</p>
												{test.description && (
													<p className="mt-1 text-sm text-slate-500">
														{test.description}
													</p>
												)}
											</div>
											<div className="flex flex-none items-center gap-2">
												<Badge variant={variant} size="sm">
													{formatStatusLabel(test.status)}
												</Badge>
												{test.duration_ms > 0 && (
													<span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
														{test.duration_ms}ms
													</span>
												)}
											</div>
										</div>
									</RowShell>
								);
							})
						) : (
							<EmptyState
								icon={ListChecks}
								title="No verification results"
								message="Run a verification check to see source test results here."
							/>
						)}
					</div>
				</Panel>

				<Panel>
					<SectionHeader
						icon={FileText}
						title="Recent logs"
						description="Latest system events with request and company references."
						action={<HeaderActionLink to="/logs">Open logs</HeaderActionLink>}
					/>
					<div className="space-y-3 p-5">
						{logsError ? (
							<ErrorState message="System logs are currently unavailable." />
						) : logItems.length > 0 ? (
							logItems.slice(0, 6).map((log: any) => {
								const variant = statusVariant(log.level || "INFO");
								return (
									<RowShell
										key={
											log.id ||
											log.requestId ||
											`${log.endpoint}-${log.timestamp}`
										}
										variant={variant}
									>
										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<div className="flex min-w-0 items-start gap-3">
												<Badge
													variant={variant}
													size="sm"
													className="mt-0.5 flex-none"
												>
													{log.level || "INFO"}
												</Badge>
												<div className="min-w-0">
													<p className="truncate text-sm font-semibold text-slate-950">
														{log.endpoint || log.message || "System event"}
													</p>
													<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
														{log.companyId && (
															<span>
																Company:{" "}
																<span className="font-mono font-medium text-slate-700">
																	{String(log.companyId).slice(0, 8)}
																</span>
															</span>
														)}
														{log.requestId && (
															<code className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">
																{String(log.requestId).slice(0, 10)}
															</code>
														)}
													</div>
												</div>
											</div>
											{log.timestamp && (
												<span className="text-sm text-slate-500">
													{safeFormatDate(log.timestamp)}
												</span>
											)}
										</div>
									</RowShell>
								);
							})
						) : (
							<EmptyState
								icon={FileText}
								title="No logs available"
								message="System logs will appear here as requests are processed."
							/>
						)}
					</div>
				</Panel>
			</div>
		</div>
	);
}
