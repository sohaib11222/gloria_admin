import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";
import http from "../lib/http";
import { cn, formatDate } from "../lib/utils";
import {
	Activity as ActivityIcon,
	AlertTriangle,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	RefreshCw,
	Search,
	Server,
	Shield,
	Users,
	X,
	XCircle,
	Zap,
} from "lucide-react";

type ActivityType = "all" | "booking" | "availability" | "health" | "admin";
type ActivityActor = "agent" | "source" | "admin" | "system";
type ActivityResult = "success" | "error" | "warning";
type StatTone = "slate" | "blue" | "emerald" | "red";

interface ActivityEntry {
	id: string;
	timestamp: string;
	actor: ActivityActor;
	action: string;
	resource: string;
	result: ActivityResult;
	details?: string;
}

function StatCard({
	label,
	value,
	helper,
	icon,
	tone = "slate",
}: {
	label: string;
	value: ReactNode;
	helper: ReactNode;
	icon: ReactNode;
	tone?: StatTone;
}) {
	const tones: Record<StatTone, string> = {
		slate: "border-slate-200 bg-slate-50 text-slate-700",
		blue: "border-blue-200 bg-blue-50 text-blue-700",
		emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
		red: "border-red-200 bg-red-50 text-red-700",
	};

	return (
		<div className="rounded-md border border-slate-200 bg-white p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
						{label}
					</p>
					<div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
						{value}
					</div>
				</div>
				<span
					className={cn(
						"inline-flex h-10 w-10 items-center justify-center rounded-md border",
						tones[tone],
					)}
				>
					{icon}
				</span>
			</div>
			<div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
				{helper}
			</div>
		</div>
	);
}

function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<ActivityIcon className="h-8 w-8" />
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}

function getActorMeta(actor: ActivityActor) {
	const meta = {
		agent: { variant: "info" as const, label: "Agent", icon: Users },
		source: { variant: "warning" as const, label: "Source", icon: Server },
		admin: { variant: "default" as const, label: "Admin", icon: Shield },
		system: { variant: "default" as const, label: "System", icon: Zap },
	};
	return meta[actor] || meta.system;
}

function getResultMeta(result: ActivityResult) {
	const meta = {
		success: {
			variant: "success" as const,
			label: "Success",
			icon: CheckCircle,
		},
		error: { variant: "danger" as const, label: "Error", icon: XCircle },
		warning: {
			variant: "warning" as const,
			label: "Warning",
			icon: AlertTriangle,
		},
	};
	return meta[result];
}

function formatEndpointAction(endpoint: string) {
	if (!endpoint) return "System event";
	const cleaned = endpoint.replace(/[._-]+/g, " ");
	return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function detectActivityType(activity: ActivityEntry): ActivityType | "other" {
	const text =
		`${activity.action} ${activity.resource} ${activity.details || ""}`.toLowerCase();
	if (text.includes("booking")) return "booking";
	if (text.includes("availability")) return "availability";
	if (text.includes("health")) return "health";
	if (activity.actor === "admin" || text.includes("admin")) return "admin";
	return "other";
}

export default function Activity() {
	const [selectedType, setSelectedType] = useState<ActivityType>("all");
	const [selectedActor, setSelectedActor] = useState<ActivityActor | "all">(
		"all",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(25);

	const {
		data: logsData,
		isLoading: logsLoading,
		error: logsError,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["activity-logs", selectedType, selectedActor, searchQuery],
		queryFn: async () => {
			const { data } = await http.get("/admin/logs", {
				params: {
					limit: 200,
					...(selectedType === "booking" && { endpoint: "booking" }),
					...(selectedType === "availability" && { endpoint: "availability" }),
					...(selectedType === "health" && { endpoint: "health" }),
					...(selectedType === "admin" && { endpoint: "admin" }),
					...(searchQuery && { q: searchQuery }),
				},
			});
			return data;
		},
		refetchInterval: 30000,
		retry: 1,
	});

	const activities: ActivityEntry[] = useMemo(() => {
		if (!logsData) return [];
		const rawActivities = logsData.activities || logsData.items || [];

		return rawActivities.map((item: any) => {
			if (item.actor && item.action && item.resource && item.result) {
				return {
					id: item.id,
					timestamp: item.timestamp || item.createdAt,
					actor: item.actor as ActivityActor,
					action: item.action,
					resource: item.resource,
					result: item.result as ActivityResult,
					details: item.details,
				};
			}

			const endpoint = item.endpoint || "";
			let actor: ActivityActor = "system";
			if (endpoint.startsWith("admin.")) actor = "admin";
			else if (item.companyType === "AGENT") actor = "agent";
			else if (item.companyType === "SOURCE" || item.sourceType === "SOURCE")
				actor = "source";

			let resource = "System resource";
			if (item.agreementRef) resource = `Agreement ${item.agreementRef}`;
			else if (item.requestId)
				resource = `Request ${String(item.requestId).slice(0, 16)}…`;
			else if (item.companyName) resource = item.companyName;
			else if (item.sourceName) resource = item.sourceName;
			else if (endpoint.includes("booking")) resource = "Booking operation";
			else if (endpoint.includes("availability"))
				resource = "Availability request";
			else if (endpoint.includes("agreement")) resource = "Agreement";
			else if (endpoint.includes("health")) resource = "Health check";
			else if (endpoint.includes("location")) resource = "Location sync";

			const result: ActivityResult =
				(item.httpStatus && item.httpStatus >= 400) ||
				(item.grpcStatus && item.grpcStatus !== 0)
					? "error"
					: item.httpStatus && item.httpStatus >= 300
						? "warning"
						: "success";

			const detailParts: string[] = [];
			if (item.durationMs) detailParts.push(`Duration ${item.durationMs}ms`);
			if (item.httpStatus) detailParts.push(`HTTP ${item.httpStatus}`);
			if (item.grpcStatus && item.grpcStatus !== 0)
				detailParts.push(`gRPC ${item.grpcStatus}`);

			return {
				id: item.id,
				timestamp: item.timestamp || item.createdAt,
				actor,
				action: formatEndpointAction(endpoint),
				resource,
				result,
				details: detailParts.length > 0 ? detailParts.join(" · ") : undefined,
			};
		});
	}, [logsData]);

	const filteredActivities = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return activities.filter((activity) => {
			const matchesType =
				selectedType === "all" || detectActivityType(activity) === selectedType;
			const matchesActor =
				selectedActor === "all" || activity.actor === selectedActor;
			const matchesSearch =
				!query ||
				activity.action.toLowerCase().includes(query) ||
				activity.resource.toLowerCase().includes(query) ||
				(activity.details || "").toLowerCase().includes(query);
			return matchesType && matchesActor && matchesSearch;
		});
	}, [activities, searchQuery, selectedActor, selectedType]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredActivities.length / itemsPerPage),
	);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [selectedType, selectedActor, searchQuery, itemsPerPage]);

	useEffect(() => {
		if (currentPage > totalPages) setCurrentPage(totalPages);
	}, [currentPage, totalPages]);

	const stats = useMemo(() => {
		const total = activities.length;
		const success = activities.filter(
			(activity) => activity.result === "success",
		).length;
		const errors = activities.filter(
			(activity) => activity.result === "error",
		).length;
		const warnings = activities.filter(
			(activity) => activity.result === "warning",
		).length;
		const actorTotal = {
			agent: activities.filter((activity) => activity.actor === "agent").length,
			source: activities.filter((activity) => activity.actor === "source")
				.length,
			admin: activities.filter((activity) => activity.actor === "admin").length,
			system: activities.filter((activity) => activity.actor === "system")
				.length,
		};
		return { total, success, errors, warnings, actorTotal };
	}, [activities]);

	const hasActiveFilters =
		selectedType !== "all" ||
		selectedActor !== "all" ||
		Boolean(searchQuery.trim());
	const successRate =
		stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

	const clearFilters = () => {
		setSelectedType("all");
		setSelectedActor("all");
		setSearchQuery("");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<ActivityIcon className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Audit trail
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Activity & audit log
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Review platform events, integration requests, admin actions,
										and system results from the latest audit log stream.
									</p>
								</div>
							</div>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => refetch()}
								disabled={isFetching}
								className="shrink-0 rounded-md border-slate-300 shadow-none"
							>
								<RefreshCw
									className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
								/>
								Refresh
							</Button>
						</div>

						<div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
								<span className="font-semibold text-slate-900">
									Auto-refresh:
								</span>
								<Badge variant="info" size="sm">
									30 seconds
								</Badge>
								<span>
									Use filters to narrow down events by type, actor, action, or
									resource.
								</span>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Activity categories
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Events are grouped by operational area and actor to make
							troubleshooting faster.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Server className="h-4 w-4 text-slate-500" />
									Integrations
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Availability, booking, health, and location events.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Shield className="h-4 w-4 text-slate-500" />
									Administration
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Admin and system operations are shown separately from partner
									traffic.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total events"
					value={stats.total}
					helper={`${filteredActivities.length} events in current filtered view`}
					icon={<ActivityIcon className="h-5 w-5" />}
				/>
				<StatCard
					label="Success rate"
					value={`${successRate}%`}
					helper={`${stats.success} successful events`}
					icon={<CheckCircle className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="Errors"
					value={stats.errors}
					helper={
						stats.warnings > 0
							? `${stats.warnings} warning events also detected`
							: "No warnings in loaded events"
					}
					icon={<XCircle className="h-5 w-5" />}
					tone={stats.errors > 0 ? "red" : "slate"}
				/>
				<StatCard
					label="Actor split"
					value={`${stats.actorTotal.agent}/${stats.actorTotal.source}`}
					helper={`Agent / Source events · ${stats.actorTotal.admin} admin`}
					icon={<Users className="h-5 w-5" />}
					tone="blue"
				/>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div className="flex items-center gap-3">
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<Filter className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									Activity ledger
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Showing {filteredActivities.length} of {activities.length}{" "}
									loaded events{hasActiveFilters ? " after filters" : ""}.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Success {stats.success}</Badge>
							<Badge variant="warning">Warnings {stats.warnings}</Badge>
							<Badge variant={stats.errors > 0 ? "danger" : "default"}>
								Errors {stats.errors}
							</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Filter className="h-4 w-4 text-slate-500" />
								Filter events
							</div>
							{hasActiveFilters && (
								<button
									type="button"
									onClick={clearFilters}
									className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950"
								>
									<X className="h-4 w-4" />
									Clear filters
								</button>
							)}
						</div>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<Select
								label="Activity type"
								value={selectedType}
								onChange={(e) =>
									setSelectedType(e.target.value as ActivityType)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "all", label: "All types" },
									{ value: "booking", label: "Booking" },
									{ value: "availability", label: "Availability" },
									{ value: "health", label: "Health" },
									{ value: "admin", label: "Admin" },
								]}
							/>
							<Select
								label="Actor"
								value={selectedActor}
								onChange={(e) =>
									setSelectedActor(e.target.value as ActivityActor | "all")
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "all", label: "All actors" },
									{ value: "agent", label: "Agent" },
									{ value: "source", label: "Source" },
									{ value: "admin", label: "Admin" },
									{ value: "system", label: "System" },
								]}
							/>
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Action, resource, or status detail"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{logsLoading ? (
					<div className="flex min-h-72 items-center justify-center p-8">
						<Loader />
					</div>
				) : logsError && activities.length === 0 ? (
					<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
						<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600">
							<XCircle className="h-8 w-8" />
						</span>
						<h3 className="mt-4 text-base font-semibold text-slate-950">
							Unable to load activity data
						</h3>
						<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
							The backend endpoint /admin/logs is unavailable or returned an
							error.
						</p>
						<Button
							variant="secondary"
							onClick={() => refetch()}
							className="mt-5 rounded-md border-slate-300 shadow-none"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Try again
						</Button>
					</div>
				) : filteredActivities.length === 0 ? (
					<EmptyState
						title={
							activities.length === 0
								? "No activity data available"
								: "No activity matches these filters"
						}
						description={
							activities.length === 0
								? "Activity logs will appear after platform requests and admin actions occur."
								: "Try clearing filters or searching with another action or resource."
						}
						action={
							hasActiveFilters ? (
								<Button
									variant="secondary"
									onClick={clearFilters}
									className="rounded-md border-slate-300 shadow-none"
								>
									Clear filters
								</Button>
							) : undefined
						}
					/>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-sm">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Time
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Actor
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Action
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Resource
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Result
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{paginatedActivities.map((activity) => {
										const actorMeta = getActorMeta(activity.actor);
										const resultMeta = getResultMeta(activity.result);
										const ActorIcon = actorMeta.icon;
										const ResultIcon = resultMeta.icon;

										return (
											<tr key={activity.id} className="hover:bg-slate-50">
												<td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
													<span className="inline-flex items-center gap-2">
														<Clock className="h-4 w-4 text-slate-400" />
														{formatDate(activity.timestamp)}
													</span>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={actorMeta.variant}
														size="sm"
														className="gap-1"
													>
														<ActorIcon className="h-3.5 w-3.5" />
														{actorMeta.label}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="font-semibold text-slate-950">
														{activity.action}
													</div>
													{activity.details ? (
														<div className="mt-1 text-xs text-slate-500">
															{activity.details}
														</div>
													) : null}
												</td>
												<td className="px-5 py-4 align-top">
													<code
														className="inline-flex max-w-md truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700"
														title={activity.resource}
													>
														{activity.resource}
													</code>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={resultMeta.variant}
														size="sm"
														className="gap-1"
													>
														<ResultIcon className="h-3.5 w-3.5" />
														{resultMeta.label}
													</Badge>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex flex-wrap items-center gap-3">
								<label className="text-sm font-medium text-slate-700">
									Rows per page
								</label>
								<select
									value={itemsPerPage}
									onChange={(e) => setItemsPerPage(Number(e.target.value))}
									className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
								>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
								<span className="text-sm text-slate-500">
									Showing {startIndex + 1}-
									{Math.min(endIndex, filteredActivities.length)} of{" "}
									{filteredActivities.length}
								</span>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={() =>
										setCurrentPage((prev) => Math.max(1, prev - 1))
									}
									disabled={currentPage === 1}
									className="rounded-md border-slate-300 shadow-none"
								>
									<ChevronLeft className="mr-1 h-4 w-4" />
									Previous
								</Button>
								<span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant="secondary"
									size="sm"
									onClick={() =>
										setCurrentPage((prev) => Math.min(totalPages, prev + 1))
									}
									disabled={currentPage === totalPages}
									className="rounded-md border-slate-300 shadow-none"
								>
									Next
									<ChevronRight className="ml-1 h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				)}
			</section>
		</div>
	);
}
