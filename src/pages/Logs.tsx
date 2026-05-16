import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Database,
	Eye,
	FileText,
	Filter,
	Hash,
	RefreshCw,
	Search,
	Server,
	Timer,
	X,
	XCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { Input } from "../components/ui/Input";
import { logsApi, LogEntry } from "../api/logs";
import { cn, formatDate } from "../lib/utils";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";

type LogResult = "success" | "warning" | "error";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

type AdminLogEntry = LogEntry & {
	companyName?: string | null;
	companyType?: string | null;
	companyCode?: string | null;
	sourceName?: string | null;
	sourceType?: string | null;
	sourceCode?: string | null;
	agreementRef?: string | null;
	duration_ms?: number | null;
	createdAt?: string;
	rawRequest?: string;
	rawResponse?: string;
};

function formatDateSafe(value?: string) {
	if (!value) return "—";
	try {
		return formatDate(value);
	} catch {
		return new Date(value).toLocaleString();
	}
}

function formatEndpoint(endpoint?: string) {
	if (!endpoint) return "Unknown endpoint";
	return endpoint
		.replace(/[._-]+/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDurationMs(log: AdminLogEntry) {
	const value = log.duration_ms ?? (log as any).durationMs;
	return typeof value === "number" ? value : Number(value || 0);
}

function getLogResult(log: AdminLogEntry): LogResult {
	const httpStatus = Number(log.http_status || (log as any).httpStatus || 0);
	const grpcStatus = log.grpc_status ?? (log as any).grpcStatus;
	const level = String(log.level || "").toUpperCase();

	if (httpStatus >= 400 || level === "ERROR") return "error";
	if (httpStatus >= 300 || level === "WARN") return "warning";
	if (
		grpcStatus !== undefined &&
		grpcStatus !== null &&
		String(grpcStatus) !== "" &&
		String(grpcStatus) !== "0"
	)
		return "error";
	return "success";
}

function getStatusLabel(log: AdminLogEntry) {
	const httpStatus = log.http_status ?? (log as any).httpStatus;
	const grpcStatus = log.grpc_status ?? (log as any).grpcStatus;
	if (httpStatus) return `HTTP ${httpStatus}`;
	if (
		grpcStatus !== undefined &&
		grpcStatus !== null &&
		String(grpcStatus) !== ""
	)
		return `gRPC ${grpcStatus}`;
	return log.level || "OK";
}

function resultMeta(result: LogResult) {
	if (result === "error")
		return { variant: "danger" as const, label: "Error", icon: XCircle };
	if (result === "warning")
		return {
			variant: "warning" as const,
			label: "Warning",
			icon: AlertTriangle,
		};
	return { variant: "success" as const, label: "Success", icon: CheckCircle2 };
}

function stringifyPayload(payload: unknown) {
	if (payload === undefined || payload === null || payload === "") return "N/A";
	if (typeof payload === "string") {
		try {
			return JSON.stringify(JSON.parse(payload), null, 2);
		} catch {
			return payload;
		}
	}
	try {
		return JSON.stringify(payload, null, 2);
	} catch {
		return String(payload);
	}
}

function DetailItem({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
			<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
				{label}
			</p>
			<div className="mt-2 text-sm font-medium text-slate-900">{children}</div>
		</div>
	);
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
	action,
}: {
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<FileText className="h-8 w-8" />
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="rounded-md border border-red-200 bg-red-50 p-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-3">
					<XCircle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
					<div>
						<p className="text-sm font-semibold text-red-900">
							Logs could not be loaded
						</p>
						<p className="mt-1 text-sm leading-6 text-red-700">
							The backend endpoint /admin/logs is unavailable or returned an
							error. Check the backend connection and try again.
						</p>
					</div>
				</div>
				<Button
					variant="secondary"
					size="sm"
					onClick={onRetry}
					className="shrink-0 rounded-md border-red-200 bg-white text-red-700 shadow-none hover:bg-red-100"
				>
					Retry
				</Button>
			</div>
		</div>
	);
}

const endpointOptions = [
	{ value: "", label: "All endpoints" },
	{ value: "availability", label: "Availability" },
	{ value: "booking", label: "Booking" },
	{ value: "locations", label: "Locations" },
	{ value: "agreements", label: "Agreements" },
];

export default function Logs() {
	const [requestId, setRequestId] = useState("");
	const [companyId, setCompanyId] = useState("");
	const [endpoint, setEndpoint] = useState("");
	const [selected, setSelected] = useState<AdminLogEntry | null>(null);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [cursorHistory, setCursorHistory] = useState<string[]>([]);
	const [limit, setLimit] = useState(50);

	const {
		data: logs,
		isLoading,
		error,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["logs", requestId, companyId, endpoint, cursor, limit],
		queryFn: () =>
			logsApi.listLogs({
				limit,
				cursor: cursor || undefined,
				q: requestId || undefined,
				companyId: companyId || undefined,
				endpoint: endpoint || undefined,
			} as any),
	});

	useEffect(() => {
		setCursor(undefined);
		setCursorHistory([]);
	}, [requestId, companyId, endpoint]);

	const pageIndex = cursorHistory.length + 1;
	const rows = (logs?.data || []) as AdminLogEntry[];
	const rowCount = rows.length;
	const totalCount = typeof logs?.total === "number" ? logs.total : 0;
	const rangeStart = rowCount === 0 ? 0 : (pageIndex - 1) * limit + 1;
	const rangeEnd = rowCount === 0 ? 0 : (pageIndex - 1) * limit + rowCount;
	const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
	const canGoNext = Boolean(logs?.nextCursor && logs.nextCursor !== "");
	const canGoPrevious = pageIndex > 1;
	const hasActiveFilters = Boolean(
		requestId.trim() || companyId.trim() || endpoint,
	);

	const stats = useMemo(() => {
		const errors = rows.filter((log) => getLogResult(log) === "error").length;
		const warnings = rows.filter(
			(log) => getLogResult(log) === "warning",
		).length;
		const success = rows.filter(
			(log) => getLogResult(log) === "success",
		).length;
		const durations = rows
			.map(getDurationMs)
			.filter((value) => Number.isFinite(value) && value > 0);
		const avgDuration =
			durations.length > 0
				? Math.round(
						durations.reduce((sum, value) => sum + value, 0) / durations.length,
					)
				: 0;
		const endpointCount = new Set(
			rows.map((log) => log.endpoint).filter(Boolean),
		).size;
		return { errors, warnings, success, avgDuration, endpointCount };
	}, [rows]);

	const handleFirstPage = () => {
		setCursor(undefined);
		setCursorHistory([]);
	};

	const handleNext = () => {
		if (logs?.nextCursor) {
			setCursorHistory([...cursorHistory, cursor || ""]);
			setCursor(logs.nextCursor);
		}
	};

	const handlePrevious = () => {
		if (cursorHistory.length > 0) {
			const newHistory = [...cursorHistory];
			const prevCursor = newHistory.pop();
			setCursorHistory(newHistory);
			setCursor(prevCursor === "" ? undefined : prevCursor);
		} else {
			setCursor(undefined);
			setCursorHistory([]);
		}
	};

	const clearFilters = () => {
		setRequestId("");
		setCompanyId("");
		setEndpoint("");
		setCursor(undefined);
		setCursorHistory([]);
	};

	const applyFilters = () => {
		setCursor(undefined);
		setCursorHistory([]);
		refetch();
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<FileText className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Operations
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										System logs
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Review request traces, endpoint activity, response status,
										payloads, and timing details for platform troubleshooting.
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

						<div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
								<div>
									<p className="text-sm font-semibold text-blue-950">
										How to use this page
									</p>
									<p className="mt-1 text-sm leading-6 text-blue-800">
										Start with a request ID when investigating a single issue.
										Use company and endpoint filters to narrow broader
										integration problems.
									</p>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							What each row shows
						</h2>
						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Hash className="h-4 w-4 text-slate-500" />
									Request trace
								</div>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Request ID, company, source, and agreement reference.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Timer className="h-4 w-4 text-slate-500" />
									Performance
								</div>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									HTTP/gRPC result and duration for each logged request.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Loaded rows"
					value={rowCount}
					helper={
						totalCount > 0
							? `${totalCount.toLocaleString()} matching log entries`
							: "Rows loaded for this page"
					}
					icon={<Database className="h-5 w-5" />}
					tone="blue"
				/>
				<StatCard
					label="Errors"
					value={stats.errors}
					helper={`${stats.warnings} warnings in current page`}
					icon={<XCircle className="h-5 w-5" />}
					tone={stats.errors > 0 ? "red" : "slate"}
				/>
				<StatCard
					label="Average duration"
					value={stats.avgDuration ? `${stats.avgDuration}ms` : "—"}
					helper="Based on visible rows with timings"
					icon={<Clock className="h-5 w-5" />}
					tone="amber"
				/>
				<StatCard
					label="Endpoints"
					value={stats.endpointCount}
					helper={`${stats.success} successful visible rows`}
					icon={<Server className="h-5 w-5" />}
					tone="emerald"
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
									Filters
								</h2>
								<p className="mt-1 text-sm leading-6 text-slate-500">
									Search by request text, company, endpoint, and page size.
								</p>
							</div>
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
				</div>
				<div className="p-5">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr_180px_auto] xl:items-end">
							<Input
								label="Request ID or text"
								placeholder="req_..., endpoint, or payload text"
								value={requestId}
								onChange={(event) => setRequestId(event.target.value)}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Input
								label="Company ID"
								placeholder="Company UUID"
								value={companyId}
								onChange={(event) => setCompanyId(event.target.value)}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Select
								label="Endpoint"
								value={endpoint}
								onChange={(event) => setEndpoint(event.target.value)}
								options={endpointOptions}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Select
								label="Rows per page"
								value={limit.toString()}
								onChange={(event) => {
									setLimit(Number(event.target.value));
									setCursor(undefined);
									setCursorHistory([]);
								}}
								options={[
									{ value: "25", label: "25 rows" },
									{ value: "50", label: "50 rows" },
									{ value: "100", label: "100 rows" },
								]}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Button
								onClick={applyFilters}
								loading={isFetching}
								className="rounded-md shadow-none"
							>
								<Search className="mr-2 h-4 w-4" />
								Apply
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<h2 className="text-base font-semibold text-slate-950">
								Log results
							</h2>
							<p className="mt-1 text-sm leading-6 text-slate-500">
								{rowCount > 0
									? `Showing ${rangeStart}-${rangeEnd}${totalCount > 0 ? ` of ${totalCount.toLocaleString()}` : ""}`
									: "No rows loaded"}
								.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Success {stats.success}</Badge>
							<Badge variant="warning">Warnings {stats.warnings}</Badge>
							<Badge variant={stats.errors > 0 ? "danger" : "default"}>
								Errors {stats.errors}
							</Badge>
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="flex min-h-72 items-center justify-center p-8">
						<Loader />
					</div>
				) : error ? (
					<div className="p-5">
						<ErrorState onRetry={() => refetch()} />
					</div>
				) : rows.length === 0 ? (
					<EmptyState
						title={
							hasActiveFilters
								? "No logs match these filters"
								: "No logs available"
						}
						description={
							hasActiveFilters
								? "Try clearing filters or searching with a different request ID, company, or endpoint."
								: "System request logs will appear here after API activity is recorded."
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
											Endpoint
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Request
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Company / Source
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Result
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Duration
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{rows.map((log) => {
										const result = getLogResult(log);
										const meta = resultMeta(result);
										const ResultIcon = meta.icon;
										const duration = getDurationMs(log);

										return (
											<tr key={log.id} className="hover:bg-slate-50">
												<td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
													<div className="flex items-center gap-2">
														<Clock className="h-4 w-4 text-slate-400" />
														{formatDateSafe(log.timestamp || log.createdAt)}
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="font-semibold text-slate-950">
														{formatEndpoint(log.endpoint)}
													</div>
													<code
														className="mt-1 inline-flex max-w-[220px] truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600"
														title={log.endpoint || ""}
													>
														{log.endpoint || "—"}
													</code>
												</td>
												<td className="px-5 py-4 align-top">
													<div
														className="max-w-[240px] truncate font-mono text-xs text-slate-700"
														title={log.requestId || ""}
													>
														{log.requestId || "—"}
													</div>
													{log.agreementRef ? (
														<div className="mt-1 text-xs text-blue-700">
															Agreement {log.agreementRef}
														</div>
													) : null}
												</td>
												<td className="px-5 py-4 align-top">
													<div className="font-semibold text-slate-950">
														{log.companyName || log.companyId || "—"}
													</div>
													<div className="mt-1 text-xs text-slate-500">
														{log.companyCode ? `${log.companyCode} · ` : ""}
														{log.companyType || "Company"}
													</div>
													{(log.sourceName || log.sourceId) && (
														<div className="mt-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
															Source: {log.sourceName || log.sourceId}
														</div>
													)}
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={meta.variant}
														size="sm"
														className="gap-1"
													>
														<ResultIcon className="h-3.5 w-3.5" />
														{getStatusLabel(log)}
													</Badge>
												</td>
												<td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
													{duration ? `${duration}ms` : "—"}
												</td>
												<td className="px-5 py-4 align-top text-right">
													<Button
														variant="secondary"
														size="sm"
														onClick={() => setSelected(log)}
														className="rounded-md border-slate-300 shadow-none"
													>
														<Eye className="mr-2 h-4 w-4" />
														Details
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
							<p className="text-sm text-slate-600">
								Page{" "}
								<span className="font-semibold text-slate-900">
									{pageIndex}
								</span>
								{totalPages > 0 ? (
									<>
										{" "}
										of{" "}
										<span className="font-semibold text-slate-900">
											{totalPages.toLocaleString()}
										</span>
									</>
								) : null}
							</p>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={handleFirstPage}
									disabled={pageIndex <= 1 || isLoading || isFetching}
									className="rounded-md border-slate-300 shadow-none"
								>
									First
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handlePrevious}
									disabled={!canGoPrevious || isLoading || isFetching}
									className="rounded-md border-slate-300 shadow-none"
								>
									<ChevronLeft className="mr-1 h-4 w-4" />
									Previous
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleNext}
									disabled={!canGoNext || isLoading || isFetching}
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

			<Modal
				isOpen={!!selected}
				onClose={() => setSelected(null)}
				title="Log details"
				size="full"
			>
				{selected ? (
					<div className="space-y-6">
						<div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
									Request trace
								</p>
								<h3 className="mt-1 text-lg font-semibold text-slate-950">
									{formatEndpoint(selected.endpoint)}
								</h3>
								<p className="mt-1 max-w-3xl text-sm text-slate-600">
									Review masked request and response payloads for this log
									entry.
								</p>
							</div>
							<Badge
								variant={resultMeta(getLogResult(selected)).variant}
								className="w-fit"
							>
								{getStatusLabel(selected)}
							</Badge>
						</div>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							<DetailItem label="Time">
								{formatDateSafe(selected.timestamp || selected.createdAt)}
							</DetailItem>
							<DetailItem label="Request ID">
								<code className="font-mono text-xs">
									{selected.requestId || "—"}
								</code>
							</DetailItem>
							<DetailItem label="Endpoint">
								<code className="font-mono text-xs">
									{selected.endpoint || "—"}
								</code>
							</DetailItem>
							<DetailItem label="Duration">
								{getDurationMs(selected) ? `${getDurationMs(selected)}ms` : "—"}
							</DetailItem>
							<DetailItem label="Company">
								<div>{selected.companyName || selected.companyId || "—"}</div>
								<p className="mt-1 text-xs text-slate-500">
									{selected.companyCode || selected.companyType || ""}
								</p>
							</DetailItem>
							<DetailItem label="Source">
								<div>{selected.sourceName || selected.sourceId || "—"}</div>
								<p className="mt-1 text-xs text-slate-500">
									{selected.sourceCode || selected.sourceType || ""}
								</p>
							</DetailItem>
							<DetailItem label="Agreement">
								<code className="font-mono text-xs">
									{selected.agreementRef || "—"}
								</code>
							</DetailItem>
							<DetailItem label="Status">{getStatusLabel(selected)}</DetailItem>
						</div>

						<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
							<div>
								<div className="mb-2 flex items-center justify-between gap-2">
									<h4 className="text-sm font-semibold text-slate-950">
										Masked request
									</h4>
									<Badge variant="default" size="sm">
										Request
									</Badge>
								</div>
								<pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
									{stringifyPayload(
										selected.maskedRequest || selected.rawRequest,
									)}
								</pre>
							</div>
							<div>
								<div className="mb-2 flex items-center justify-between gap-2">
									<h4 className="text-sm font-semibold text-slate-950">
										Masked response
									</h4>
									<Badge variant="default" size="sm">
										Response
									</Badge>
								</div>
								<pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
									{stringifyPayload(
										selected.maskedResponse || selected.rawResponse,
									)}
								</pre>
							</div>
						</div>
					</div>
				) : null}
			</Modal>
		</div>
	);
}
