import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { healthApi, SourceHealth } from "../api/health";
import { formatDate, cn } from "../lib/utils";
import toast from "react-hot-toast";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
	Activity,
	AlertCircle,
	BarChart3,
	CheckCircle2,
	Clock,
	Database,
	Filter,
	HeartPulse,
	RefreshCw,
	RotateCcw,
	Search,
	Shield,
	TrendingUp,
	Zap,
} from "lucide-react";

type StatusFilter = "ALL" | "HEALTHY" | "SLOW" | "EXCLUDED";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

type NormalizedCheck = {
	name: string;
	status: "PASS" | "FAIL" | "WARN";
	message?: string;
	responseTime?: number;
};

function statusLabel(status: SourceHealth["status"]) {
	if (status === "HEALTHY") return "Healthy";
	if (status === "SLOW") return "Slow";
	if (status === "EXCLUDED") return "Excluded";
	return status;
}

function sourceStatusVariant(
	status: SourceHealth["status"],
): "success" | "warning" | "danger" {
	if (status === "HEALTHY") return "success";
	if (status === "SLOW") return "warning";
	return "danger";
}

function checkVariant(
	status: NormalizedCheck["status"],
): "success" | "warning" | "danger" {
	if (status === "PASS") return "success";
	if (status === "WARN") return "warning";
	return "danger";
}

function toTitle(value: string) {
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeChecks(payload: any): NormalizedCheck[] {
	const checks = payload?.checks;
	if (!checks || typeof checks !== "object") return [];

	return Object.entries(checks).map(([key, raw]) => {
		if (typeof raw === "string") {
			const ok = raw.toLowerCase() === "ok" || raw.toLowerCase() === "pass";
			return {
				name: toTitle(key),
				status: ok ? "PASS" : "FAIL",
				message: raw,
			};
		}

		const check = raw as any;
		const rawStatus = String(check?.status || "").toUpperCase();
		return {
			name: check?.name || toTitle(key),
			status:
				rawStatus === "FAIL" ? "FAIL" : rawStatus === "WARN" ? "WARN" : "PASS",
			message: check?.message,
			responseTime: check?.response_time,
		};
	});
}

function systemOverall(payload: any): {
	label: string;
	variant: "success" | "warning" | "danger" | "default";
} {
	if (!payload) return { label: "Unavailable", variant: "default" };
	if (payload.ok === true || payload.overall_status === "HEALTHY")
		return { label: "Operational", variant: "success" };
	if (payload.overall_status === "DEGRADED")
		return { label: "Degraded", variant: "warning" };
	return { label: "Unhealthy", variant: "danger" };
}

function StatCard({
	label,
	value,
	helper,
	icon,
	tone = "slate",
}: {
	label: string;
	value: React.ReactNode;
	helper: React.ReactNode;
	icon: React.ReactNode;
	tone?: StatTone;
}) {
	const tones: Record<StatTone, string> = {
		slate: "border-slate-200 bg-slate-50 text-slate-700",
		blue: "border-blue-200 bg-blue-50 text-blue-700",
		emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
		amber: "border-amber-200 bg-amber-50 text-amber-700",
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
	icon,
}: {
	title: string;
	description: string;
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				{icon || <HeartPulse className="h-8 w-8" />}
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
		</div>
	);
}

function SlowRateBar({ value }: { value: number }) {
	const percent = Math.max(0, Math.min(value * 100, 100));
	const tone =
		value > 0.3
			? "bg-red-500"
			: value > 0.1
				? "bg-amber-500"
				: "bg-emerald-500";

	return (
		<div className="min-w-[150px]">
			<div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
				<span>Slow rate</span>
				<span className="font-semibold text-slate-700">
					{(value * 100).toFixed(1)}%
				</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-slate-200">
				<div
					className={cn("h-full rounded-full", tone)}
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}

export default function Health() {
	const [showExcludedOnly, setShowExcludedOnly] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const queryClient = useQueryClient();

	const {
		data: sourceHealth,
		isLoading: sourcesLoading,
		error: sourcesError,
		refetch: refetchSources,
		isFetching: sourcesFetching,
	} = useQuery({
		queryKey: ["health"],
		queryFn: () => healthApi.getSourceHealth(),
	});

	const {
		data: systemHealth,
		isLoading: systemLoading,
		error: systemError,
		refetch: refetchSystem,
		isFetching: systemFetching,
	} = useQuery({
		queryKey: ["admin-health-status"],
		queryFn: () => healthApi.getHealthStatus(),
		retry: 1,
	});

	const resetHealthMutation = useMutation({
		mutationFn: (companyId?: string) => healthApi.resetHealth(companyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["health"] });
			queryClient.invalidateQueries({ queryKey: ["admin-health-status"] });
			toast.success("Health reset completed");
		},
	});

	const runHealthCheckMutation = useMutation({
		mutationFn: (companyId: string) => healthApi.runHealthCheck(companyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["health"] });
			toast.success("Health check completed");
		},
		onError: () => toast.error("Health check failed"),
	});

	const rowsAll = useMemo<SourceHealth[]>(() => {
		if (!sourceHealth) return [];
		return Array.isArray(sourceHealth)
			? sourceHealth
			: ((sourceHealth as any)?.items ?? []);
	}, [sourceHealth]);

	const filteredRows = useMemo(() => {
		let filtered = rowsAll;

		if (showExcludedOnly) {
			filtered = filtered.filter((source) => source.status === "EXCLUDED");
		}

		if (statusFilter !== "ALL") {
			filtered = filtered.filter((source) => source.status === statusFilter);
		}

		const query = searchQuery.trim().toLowerCase();
		if (query) {
			filtered = filtered.filter(
				(source) =>
					source.companyName?.toLowerCase().includes(query) ||
					source.companyId?.toLowerCase().includes(query),
			);
		}

		return filtered;
	}, [rowsAll, searchQuery, showExcludedOnly, statusFilter]);

	const stats = useMemo(() => {
		const healthy = rowsAll.filter(
			(source) => source.status === "HEALTHY",
		).length;
		const slow = rowsAll.filter((source) => source.status === "SLOW").length;
		const excluded = rowsAll.filter(
			(source) => source.status === "EXCLUDED",
		).length;
		const totalSamples = rowsAll.reduce(
			(sum, source) => sum + (source.sampleCount || 0),
			0,
		);
		const averageSlowRate = rowsAll.length
			? rowsAll.reduce((sum, source) => sum + (source.slowRate || 0), 0) /
				rowsAll.length
			: 0;
		return {
			healthy,
			slow,
			excluded,
			totalSamples,
			averageSlowRate,
			total: rowsAll.length,
		};
	}, [rowsAll]);

	const systemChecks = useMemo(
		() => normalizeChecks(systemHealth),
		[systemHealth],
	);
	const overall = systemOverall(systemHealth);
	const filtersApplied =
		Boolean(searchQuery.trim()) || statusFilter !== "ALL" || showExcludedOnly;
	const isRefreshing = sourcesFetching || systemFetching;

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("ALL");
		setShowExcludedOnly(false);
	};

	const refreshAll = () => {
		refetchSources();
		refetchSystem();
	};

	return (
		<div className="space-y-6 pb-8">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<HeartPulse className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Monitoring
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										System health
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Monitor source performance, backoff state, exclusion
										windows, and core platform checks in one operational view.
									</p>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={refreshAll}
									disabled={isRefreshing}
									className="rounded-md border-slate-300 shadow-none"
								>
									<RefreshCw
										className={cn(
											"mr-2 h-4 w-4",
											isRefreshing && "animate-spin",
										)}
									/>
									Refresh
								</Button>
								<Button
									onClick={() => resetHealthMutation.mutate(undefined)}
									loading={resetHealthMutation.isPending}
									variant="secondary"
									size="sm"
									className="rounded-md border-slate-300 shadow-none"
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									Reset all health
								</Button>
							</div>
						</div>

						<div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
								<span className="font-semibold text-slate-900">
									Health policy:
								</span>
								<Badge variant="warning" size="sm">
									Backoff
								</Badge>
								<span>
									Slow or failing sources can be temporarily excluded until
									their backoff window expires.
								</span>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-slate-950">
									Platform checks
								</h2>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Database, gRPC, mailer, and other core services.
								</p>
							</div>
							<Badge variant={overall.variant}>{overall.label}</Badge>
						</div>

						<div className="mt-5 space-y-3">
							{systemLoading ? (
								<div className="flex items-center justify-center rounded-md border border-slate-200 bg-white p-6">
									<Loader />
								</div>
							) : systemError ? (
								<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
									Could not load platform health checks.
								</div>
							) : systemChecks.length > 0 ? (
								systemChecks.map((check) => (
									<div
										key={check.name}
										className="rounded-md border border-slate-200 bg-white p-3"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<Database className="h-4 w-4 shrink-0 text-slate-500" />
												<span className="truncate text-sm font-semibold text-slate-950">
													{check.name}
												</span>
											</div>
											<Badge variant={checkVariant(check.status)} size="sm">
												{check.status}
											</Badge>
										</div>
										{check.message || check.responseTime ? (
											<p className="mt-1 text-xs text-slate-500">
												{check.message || "Check completed"}
												{check.responseTime ? ` · ${check.responseTime}ms` : ""}
											</p>
										) : null}
									</div>
								))
							) : (
								<div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
									No platform check details returned.
								</div>
							)}
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total sources"
					value={stats.total}
					helper={`${stats.healthy} healthy · ${stats.slow} slow · ${stats.excluded} excluded`}
					icon={<Activity className="h-5 w-5" />}
				/>
				<StatCard
					label="Healthy sources"
					value={stats.healthy}
					helper="Sources currently available for search and booking flow"
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="Needs attention"
					value={stats.slow + stats.excluded}
					helper={
						stats.excluded > 0
							? `${stats.excluded} excluded by backoff policy`
							: "Slow sources should be reviewed"
					}
					icon={<AlertCircle className="h-5 w-5" />}
					tone={stats.slow + stats.excluded > 0 ? "amber" : "slate"}
				/>
				<StatCard
					label="Avg slow rate"
					value={`${(stats.averageSlowRate * 100).toFixed(1)}%`}
					helper={`${stats.totalSamples} samples used for current health scoring`}
					icon={<TrendingUp className="h-5 w-5" />}
					tone="blue"
				/>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<div className="flex items-center gap-3">
								<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<BarChart3 className="h-5 w-5" />
								</span>
								<div>
									<h2 className="text-base font-semibold text-slate-950">
										Source health status
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Showing {filteredRows.length} of {rowsAll.length} sources
										{filtersApplied ? " after filters" : ""}.
									</p>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Healthy {stats.healthy}</Badge>
							<Badge variant="warning">Slow {stats.slow}</Badge>
							<Badge variant="danger">Excluded {stats.excluded}</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Filter className="h-4 w-4 text-slate-500" />
								Filter sources
							</div>
							{filtersApplied && (
								<button
									type="button"
									onClick={clearFilters}
									className="text-sm font-semibold text-slate-600 hover:text-slate-950"
								>
									Clear filters
								</button>
							)}
						</div>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<Input
										placeholder="Company name or source ID"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10 text-slate-900 placeholder:text-slate-400"
									/>
								</div>
							</div>
							<Select
								label="Status"
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as StatusFilter)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All statuses" },
									{ value: "HEALTHY", label: "Healthy" },
									{ value: "SLOW", label: "Slow" },
									{ value: "EXCLUDED", label: "Excluded" },
								]}
							/>
							<label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
								<input
									type="checkbox"
									checked={showExcludedOnly}
									onChange={(e) => setShowExcludedOnly(e.target.checked)}
									className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
								/>
								<span className="font-medium">Only excluded</span>
							</label>
						</div>
					</div>
				</div>

				<div className="p-0">
					{sourcesLoading ? (
						<div className="flex min-h-72 items-center justify-center p-8">
							<Loader />
						</div>
					) : sourcesError ? (
						<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600">
								<AlertCircle className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-950">
								Failed to load source health
							</h3>
							<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
								Please refresh or check the middleware health endpoint.
							</p>
							<Button
								variant="secondary"
								onClick={() => refetchSources()}
								className="mt-5 rounded-md border-slate-300 shadow-none"
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Try again
							</Button>
						</div>
					) : filteredRows.length === 0 ? (
						<EmptyState
							title={
								rowsAll.length === 0
									? "No source health data"
									: "No sources match these filters"
							}
							description={
								rowsAll.length === 0
									? "Health monitoring will appear after sources process requests."
									: "Try clearing filters or searching with another company name or source ID."
							}
							icon={<Search className="h-8 w-8" />}
						/>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-sm">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Source
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Status
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Slow rate
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Samples
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Backoff
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Excluded until
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{filteredRows.map((source) => {
										const slowRate = source.slowRate || 0;
										return (
											<tr key={source.companyId} className="hover:bg-slate-50">
												<td className="px-5 py-4 align-top">
													<div className="flex items-start gap-3">
														<span
															className={cn(
																"mt-1 h-2.5 w-2.5 flex-none rounded-full",
																source.status === "HEALTHY"
																	? "bg-emerald-500"
																	: source.status === "SLOW"
																		? "bg-amber-500"
																		: "bg-red-500",
															)}
														/>
														<div className="min-w-0">
															<div className="max-w-xs truncate font-semibold text-slate-950">
																{source.companyName}
															</div>
															<div className="mt-1 max-w-xs truncate font-mono text-xs text-slate-500">
																{source.companyId}
															</div>
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge variant={sourceStatusVariant(source.status)}>
														{source.status === "HEALTHY" && (
															<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
														)}
														{source.status === "SLOW" && (
															<Clock className="mr-1 h-3.5 w-3.5" />
														)}
														{source.status === "EXCLUDED" && (
															<Shield className="mr-1 h-3.5 w-3.5" />
														)}
														{statusLabel(source.status)}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top">
													<SlowRateBar value={slowRate} />
												</td>
												<td className="px-5 py-4 align-top">
													<div className="inline-flex items-center gap-2 text-slate-700">
														<Activity className="h-4 w-4 text-slate-400" />
														<span className="font-semibold text-slate-950">
															{source.sampleCount}
														</span>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<span
														className={cn(
															"inline-flex rounded border px-2 py-1 text-xs font-semibold",
															source.backoffLevel === 0
																? "border-emerald-200 bg-emerald-50 text-emerald-700"
																: source.backoffLevel <= 2
																	? "border-amber-200 bg-amber-50 text-amber-700"
																	: "border-red-200 bg-red-50 text-red-700",
														)}
													>
														Level {source.backoffLevel}
													</span>
												</td>
												<td className="px-5 py-4 align-top text-slate-600">
													{source.excludedUntil ? (
														<span className="inline-flex items-center gap-2 whitespace-nowrap">
															<Clock className="h-4 w-4 text-slate-400" />
															{formatDate(source.excludedUntil)}
														</span>
													) : (
														<span className="text-slate-400">—</span>
													)}
												</td>
												<td className="px-5 py-4 align-top text-right">
													<div className="flex flex-wrap justify-end gap-2">
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																runHealthCheckMutation.mutate(source.companyId)
															}
															loading={runHealthCheckMutation.isPending}
															className="rounded-md border border-slate-200 px-3 text-slate-700 hover:bg-slate-50"
														>
															<Zap className="mr-2 h-3.5 w-3.5" />
															Check
														</Button>
														<Button
															size="sm"
															variant="secondary"
															onClick={() =>
																resetHealthMutation.mutate(source.companyId)
															}
															loading={resetHealthMutation.isPending}
															className="rounded-md border-slate-300 shadow-none"
														>
															<RotateCcw className="mr-2 h-3.5 w-3.5" />
															Reset
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
