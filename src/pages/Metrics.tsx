import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	Activity,
	AlertCircle,
	BarChart3,
	CheckCircle2,
	Clock,
	Database,
	Filter,
	Gauge,
	RefreshCw,
	Search,
	Server,
	Timer,
	TrendingUp,
	X,
	Zap,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";
import { metricsApi } from "../api/metrics";
import { parsePrometheusText, getMetricSeries } from "../lib/metrics";
import { METRICS_REFRESH_INTERVALS } from "../lib/constants";
import { cn } from "../lib/utils";

type MetricType = "counter" | "gauge" | "histogram" | "summary";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";
type MetricPoint = {
	timestamp: number;
	value: number;
	labels?: Record<string, string>;
};

function formatRefreshLabel(value: number) {
	return `${Math.round(value / 1000)}s`;
}

function formatMilliseconds(seconds: number | null) {
	if (seconds === null || Number.isNaN(seconds)) return "—";
	const ms = seconds * 1000;
	if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
	return `${ms.toFixed(2)}ms`;
}

function formatMetricValue(value: unknown) {
	if (typeof value !== "number") return String(value ?? "—");
	if (!Number.isFinite(value)) return "—";
	if (Math.abs(value) >= 1000)
		return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Math.abs(value) >= 1) return value.toFixed(2);
	if (Math.abs(value) >= 0.001) return value.toFixed(4);
	return value.toExponential(2);
}

function metricTypeVariant(
	type: string,
): "default" | "success" | "warning" | "danger" | "info" {
	if (type === "counter") return "info";
	if (type === "histogram") return "success";
	if (type === "summary") return "warning";
	if (type === "gauge") return "default";
	return "default";
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
	icon: ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				{icon}
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
		</div>
	);
}

function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<section className="rounded-md border border-red-200 bg-red-50 p-5">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-3">
					<AlertCircle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
					<div>
						<p className="text-sm font-semibold text-red-900">
							Failed to load metrics
						</p>
						<p className="mt-1 text-sm leading-6 text-red-700">{message}</p>
					</div>
				</div>
				<Button
					variant="secondary"
					size="sm"
					onClick={onRetry}
					className="shrink-0 rounded-md border-red-200 bg-white text-red-700 shadow-none hover:bg-red-100"
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		</section>
	);
}

function ChartPanel({
	title,
	description,
	average,
	data,
	stroke,
	icon,
	emptyIcon,
	emptyTitle,
	yLabel,
}: {
	title: string;
	description: string;
	average: number | null;
	data: MetricPoint[];
	stroke: string;
	icon: ReactNode;
	emptyIcon: ReactNode;
	emptyTitle: string;
	yLabel: string;
}) {
	return (
		<section className="rounded-md border border-slate-200 bg-white">
			<div className="border-b border-slate-200 px-5 py-4">
				<div className="flex items-start gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
						{icon}
					</span>
					<div>
						<h2 className="text-base font-semibold text-slate-950">{title}</h2>
						<p className="mt-1 text-sm leading-6 text-slate-500">
							{description}
						</p>
					</div>
				</div>
			</div>
			<div className="p-5">
				{data.length > 0 ? (
					<>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
							<div>
								<p className="text-sm font-semibold text-slate-900">
									{data.length} data point{data.length !== 1 ? "s" : ""}
								</p>
								<p className="mt-1 text-xs text-slate-500">
									Average value: {formatMilliseconds(average)}
								</p>
							</div>
							<Badge variant="info" size="sm">
								Live scrape
							</Badge>
						</div>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart
								data={data}
								margin={{ top: 8, right: 20, bottom: 8, left: 0 }}
							>
								<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis
									dataKey="timestamp"
									tickFormatter={(value) =>
										new Date(value).toLocaleTimeString()
									}
									stroke="#64748b"
									tick={{ fontSize: 11 }}
								/>
								<YAxis
									stroke="#64748b"
									tick={{ fontSize: 11 }}
									tickFormatter={(value) =>
										`${(Number(value) * 1000).toFixed(0)}ms`
									}
									label={{
										value: yLabel,
										angle: -90,
										position: "insideLeft",
										style: { fontSize: "11px", fill: "#64748b" },
									}}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#ffffff",
										border: "1px solid #cbd5e1",
										borderRadius: "6px",
										boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
										color: "#0f172a",
									}}
									labelFormatter={(value) => new Date(value).toLocaleString()}
									formatter={(value: any) => [
										`${(Number(value) * 1000).toFixed(2)}ms`,
										yLabel,
									]}
								/>
								<Line
									type="monotone"
									dataKey="value"
									stroke={stroke}
									strokeWidth={2}
									dot={false}
									activeDot={{ r: 5, fill: stroke }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</>
				) : (
					<EmptyState
						title={emptyTitle}
						description="Data will appear here after the backend exposes matching Prometheus samples."
						icon={emptyIcon}
					/>
				)}
			</div>
		</section>
	);
}

export default function Metrics() {
	const [refreshInterval, setRefreshInterval] = useState<number>(
		METRICS_REFRESH_INTERVALS.NORMAL,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const {
		data: metricsText,
		isLoading,
		error,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["metrics"],
		queryFn: () => metricsApi.fetchMetrics(),
		refetchInterval: refreshInterval,
		retry: 2,
	});

	const metrics = useMemo(
		() => (metricsText ? parsePrometheusText(metricsText) : []),
		[metricsText],
	);
	const latencySeries = useMemo(
		() => getMetricSeries(metrics, "adapter_latency_seconds"),
		[metrics],
	);
	const httpDurationSeries = useMemo(
		() => getMetricSeries(metrics, "http_request_duration_seconds"),
		[metrics],
	);

	const summaryStats = useMemo(() => {
		const totalMetrics = metrics.length;
		const byType = metrics.reduce(
			(acc, metric) => {
				acc[metric.type] = (acc[metric.type] || 0) + 1;
				return acc;
			},
			{} as Record<MetricType | string, number>,
		);
		const totalSamples = metrics.reduce(
			(sum, metric) => sum + metric.samples.length,
			0,
		);
		const metricsWithData = metrics.filter(
			(metric) => metric.samples.length > 0,
		).length;
		const avgLatency =
			latencySeries.length > 0
				? latencySeries.reduce((sum, sample) => sum + sample.value, 0) /
					latencySeries.length
				: null;
		const avgHttpDuration =
			httpDurationSeries.length > 0
				? httpDurationSeries.reduce((sum, sample) => sum + sample.value, 0) /
					httpDurationSeries.length
				: null;

		return {
			totalMetrics,
			byType,
			totalSamples,
			metricsWithData,
			avgLatency,
			avgHttpDuration,
		};
	}, [httpDurationSeries, latencySeries, metrics]);

	const filteredMetrics = useMemo(() => {
		let filtered = metrics;
		if (typeFilter !== "all")
			filtered = filtered.filter((metric) => metric.type === typeFilter);
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(metric) =>
					metric.name.toLowerCase().includes(query) ||
					metric.help?.toLowerCase().includes(query) ||
					metric.type.toLowerCase().includes(query),
			);
		}
		return filtered;
	}, [metrics, searchQuery, typeFilter]);

	const groupedMetrics = useMemo(() => {
		const groups = filteredMetrics.reduce<
			Record<string, typeof filteredMetrics>
		>((acc, metric) => {
			const prefix = metric.name.split("_")[0] || "other";
			if (!acc[prefix]) acc[prefix] = [];
			acc[prefix].push(metric);
			return acc;
		}, {});

		return Object.entries(groups)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(
				([prefix, groupMetrics]) =>
					[
						prefix,
						[...groupMetrics].sort((a, b) => a.name.localeCompare(b.name)),
					] as const,
			);
	}, [filteredMetrics]);

	const hasActiveFilters = Boolean(searchQuery.trim()) || typeFilter !== "all";
	const errorMessage =
		error instanceof Error
			? error.message
			: "The metrics endpoint did not return data successfully.";

	const clearFilters = () => {
		setSearchQuery("");
		setTypeFilter("all");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<BarChart3 className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Monitoring
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										System metrics
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Monitor live Prometheus metrics, latency trends, request
										duration, and the raw metric inventory exposed by the
										backend.
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
								Refresh now
							</Button>
						</div>

						<div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
							<div className="flex items-start gap-3">
								<Activity className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
								<div>
									<p className="text-sm font-semibold text-blue-950">
										Live operational metrics
									</p>
									<p className="mt-1 text-sm leading-6 text-blue-800">
										Use this page to verify whether the metrics endpoint is
										responding, inspect metric names, and spot slow latency or
										request duration patterns.
									</p>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Refresh interval
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Choose how often the metrics endpoint should be polled.
						</p>
						<div className="mt-5 grid grid-cols-3 gap-2">
							{[
								METRICS_REFRESH_INTERVALS.FAST,
								METRICS_REFRESH_INTERVALS.NORMAL,
								METRICS_REFRESH_INTERVALS.SLOW,
							].map((value) => (
								<Button
									key={value}
									variant={refreshInterval === value ? "primary" : "secondary"}
									size="sm"
									onClick={() => setRefreshInterval(value)}
									className="rounded-md shadow-none"
								>
									{formatRefreshLabel(value)}
								</Button>
							))}
						</div>
						<div className="mt-5 rounded-md border border-slate-200 bg-white p-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
								<Clock className="h-4 w-4 text-slate-500" />
								Current setting
							</div>
							<p className="mt-1 text-sm text-slate-500">
								Auto-refresh every {formatRefreshLabel(refreshInterval)}.
							</p>
						</div>
					</aside>
				</div>
			</section>

			{isLoading ? (
				<section className="rounded-md border border-slate-200 bg-white">
					<div className="flex min-h-96 items-center justify-center p-8">
						<Loader />
					</div>
				</section>
			) : error ? (
				<ErrorState message={errorMessage} onRetry={() => refetch()} />
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<StatCard
							label="Total metrics"
							value={summaryStats.totalMetrics}
							helper={`${summaryStats.metricsWithData} metrics include samples`}
							icon={<Database className="h-5 w-5" />}
							tone="blue"
						/>
						<StatCard
							label="Samples"
							value={summaryStats.totalSamples.toLocaleString()}
							helper="Data points in the latest scrape"
							icon={<Activity className="h-5 w-5" />}
							tone="emerald"
						/>
						<StatCard
							label="Adapter latency"
							value={formatMilliseconds(summaryStats.avgLatency)}
							helper="Average adapter operation latency"
							icon={<Timer className="h-5 w-5" />}
							tone="amber"
						/>
						<StatCard
							label="HTTP duration"
							value={formatMilliseconds(summaryStats.avgHttpDuration)}
							helper="Average request processing duration"
							icon={<Gauge className="h-5 w-5" />}
							tone="slate"
						/>
					</div>

					<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
						<ChartPanel
							title="Adapter latency"
							description="Response time for adapter operations, displayed in milliseconds."
							average={summaryStats.avgLatency}
							data={latencySeries}
							stroke="#2563eb"
							icon={<Activity className="h-5 w-5" />}
							emptyIcon={<Activity className="h-8 w-8" />}
							emptyTitle="No adapter latency data"
							yLabel="Latency (ms)"
						/>
						<ChartPanel
							title="HTTP request duration"
							description="Time taken for HTTP requests to complete, displayed in milliseconds."
							average={summaryStats.avgHttpDuration}
							data={httpDurationSeries}
							stroke="#059669"
							icon={<TrendingUp className="h-5 w-5" />}
							emptyIcon={<TrendingUp className="h-8 w-8" />}
							emptyTitle="No HTTP duration data"
							yLabel="Duration (ms)"
						/>
					</div>

					<section className="rounded-md border border-slate-200 bg-white">
						<div className="border-b border-slate-200 px-5 py-4">
							<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
								<div className="flex items-start gap-3">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<Filter className="h-5 w-5" />
									</span>
									<div>
										<h2 className="text-base font-semibold text-slate-950">
											Available metrics
										</h2>
										<p className="mt-1 text-sm leading-6 text-slate-500">
											Showing {filteredMetrics.length} of {metrics.length}{" "}
											metric definitions
											{hasActiveFilters ? " after filters" : ""}.
										</p>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant="default">
										Counters {summaryStats.byType.counter || 0}
									</Badge>
									<Badge variant="info">
										Gauges {summaryStats.byType.gauge || 0}
									</Badge>
									<Badge variant="success">
										Histograms {summaryStats.byType.histogram || 0}
									</Badge>
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
							</div>

							<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
								<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
									<div>
										<label className="mb-1 block text-sm font-medium text-slate-700">
											Search metrics
										</label>
										<div className="relative">
											<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
											<Input
												type="text"
												placeholder="Search by metric name, type, or description"
												value={searchQuery}
												onChange={(event) => setSearchQuery(event.target.value)}
												className="rounded-md border-slate-300 bg-white pl-10 shadow-none focus:ring-blue-100"
											/>
											{searchQuery && (
												<button
													type="button"
													onClick={() => setSearchQuery("")}
													className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
													aria-label="Clear metric search"
												>
													<X className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
									<Select
										label="Metric type"
										value={typeFilter}
										onChange={(event) => setTypeFilter(event.target.value)}
										className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
										options={[
											{ value: "all", label: "All types" },
											{ value: "counter", label: "Counter" },
											{ value: "gauge", label: "Gauge" },
											{ value: "histogram", label: "Histogram" },
											{ value: "summary", label: "Summary" },
										]}
									/>
								</div>
							</div>
						</div>

						<div className="p-5">
							{filteredMetrics.length > 0 ? (
								<div className="space-y-5">
									{groupedMetrics.map(([prefix, groupMetrics]) => (
										<div
											key={prefix}
											className="rounded-md border border-slate-200 bg-white"
										>
											<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
												<div className="flex items-center gap-2">
													<span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
														<Zap className="h-4 w-4" />
													</span>
													<div>
														<h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">
															{prefix}
														</h3>
														<p className="text-xs text-slate-500">
															Metric group prefix
														</p>
													</div>
												</div>
												<Badge variant="default" size="sm">
													{groupMetrics.length} metric
													{groupMetrics.length !== 1 ? "s" : ""}
												</Badge>
											</div>
											<div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2 2xl:grid-cols-3">
												{groupMetrics.map((metric) => {
													const sampleCount = metric.samples.length;
													const latestValue =
														metric.samples[metric.samples.length - 1]?.value;
													return (
														<article
															key={metric.name}
															className="rounded-md border border-slate-200 bg-white p-4 hover:bg-slate-50"
														>
															<div className="min-h-[42px] font-mono text-xs font-semibold leading-5 text-slate-950 break-all">
																{metric.name}
															</div>
															<div className="mt-3 flex flex-wrap items-center gap-2">
																<Badge
																	variant={metricTypeVariant(metric.type)}
																	size="sm"
																	className="capitalize"
																>
																	{metric.type}
																</Badge>
																<Badge variant="default" size="sm">
																	{sampleCount} sample
																	{sampleCount !== 1 ? "s" : ""}
																</Badge>
															</div>
															<div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
																<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
																	Current value
																</p>
																<p className="mt-2 font-mono text-sm font-semibold text-slate-950">
																	{formatMetricValue(latestValue)}
																</p>
															</div>
															{metric.help && (
																<p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
																	{metric.help}
																</p>
															)}
														</article>
													);
												})}
											</div>
										</div>
									))}
								</div>
							) : hasActiveFilters ? (
								<EmptyState
									title="No metrics match these filters"
									description="Try clearing filters or searching with another metric name, type, or description."
									icon={<Search className="h-8 w-8" />}
								/>
							) : (
								<EmptyState
									title="No metrics available"
									description="Make sure the backend /metrics endpoint is enabled and returning Prometheus text data."
									icon={<BarChart3 className="h-8 w-8" />}
								/>
							)}
						</div>
					</section>
				</>
			)}
		</div>
	);
}
