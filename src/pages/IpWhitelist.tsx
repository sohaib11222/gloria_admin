import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import {
	AlertTriangle,
	CheckCircle2,
	Filter,
	Globe2,
	Info,
	Plus,
	RefreshCw,
	Search,
	Server,
	Shield,
	ShieldCheck,
	Trash2,
	Users,
	X,
	XCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Loader } from "../components/ui/Loader";
import { whitelistApi, WhitelistEntry } from "../api/whitelist";
import { cn, formatDate } from "../lib/utils";

type WhitelistType = "agent" | "source" | "admin";
type TypeFilter = "ALL" | WhitelistType;
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

const WhitelistIPSchema = z
	.string()
	.trim()
	.min(1, "IP address or domain is required");

function formatDateSafe(value?: string) {
	if (!value) return "—";
	try {
		return formatDate(value);
	} catch {
		return new Date(value).toLocaleString();
	}
}

function typeLabel(type: WhitelistType) {
	if (type === "agent") return "Agent";
	if (type === "source") return "Source";
	return "Admin";
}

function typeDescription(type: WhitelistType) {
	if (type === "agent") return "Agent-side requests and partner agent tools";
	if (type === "source")
		return "Source endpoints, inventory feeds, and supplier traffic";
	return "Admin console and internal administrative tools";
}

function typeBadgeVariant(
	type: WhitelistType,
): "default" | "info" | "warning" | "danger" {
	if (type === "admin") return "danger";
	if (type === "source") return "info";
	if (type === "agent") return "warning";
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
	action,
}: {
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<Shield className="h-8 w-8" />
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
							Failed to load whitelist entries
						</p>
						<p className="mt-1 text-sm leading-6 text-red-700">
							The admin whitelist endpoint did not respond successfully. Check
							the backend connection and try again.
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

export default function IpWhitelist() {
	const [newIp, setNewIp] = useState("");
	const [ipType, setIpType] = useState<WhitelistType>("source");
	const [ipError, setIpError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
	const queryClient = useQueryClient();

	const {
		data: whitelist,
		isLoading,
		error,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["whitelist"],
		queryFn: () => whitelistApi.listWhitelist(),
	});

	const entries = whitelist || [];

	const filteredWhitelist = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return entries.filter((entry) => {
			const matchesSearch = !query || entry.ip?.toLowerCase().includes(query);
			const matchesType = typeFilter === "ALL" || entry.type === typeFilter;
			return matchesSearch && matchesType;
		});
	}, [entries, searchQuery, typeFilter]);

	const stats = useMemo(() => {
		const enabled = entries.filter((entry) => entry.enabled).length;
		const disabled = entries.length - enabled;
		const byType = {
			source: entries.filter((entry) => entry.type === "source").length,
			agent: entries.filter((entry) => entry.type === "agent").length,
			admin: entries.filter((entry) => entry.type === "admin").length,
		};
		return { enabled, disabled, byType };
	}, [entries]);

	const addMutation = useMutation({
		mutationFn: (data: {
			ip: string;
			type: WhitelistType;
			enabled?: boolean;
		}) => whitelistApi.addWhitelistEntry(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["whitelist"] });
			setNewIp("");
			setIpError("");
			toast.success("Whitelist entry added");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to add entry to whitelist",
			);
		},
	});

	const removeMutation = useMutation({
		mutationFn: (entryId: string) => whitelistApi.removeWhitelistEntry(entryId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["whitelist"] });
			toast.success("Whitelist entry removed");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Failed to remove entry from whitelist",
			);
		},
	});

	const hasActiveFilters = Boolean(searchQuery.trim()) || typeFilter !== "ALL";

	const clearFilters = () => {
		setSearchQuery("");
		setTypeFilter("ALL");
	};

	const handleAddIp = () => {
		try {
			const ip = WhitelistIPSchema.parse(newIp);
			setIpError("");
			addMutation.mutate({ ip, type: ipType, enabled: true });
		} catch (error) {
			if (error instanceof z.ZodError) {
				setIpError(error.issues[0]?.message || "Invalid IP address or domain");
				return;
			}
			setIpError("Invalid IP address or domain");
		}
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<ShieldCheck className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Access control
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										IP whitelist management
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Add and review trusted IP addresses, hostnames, and wildcard
										domains that can access admin, agent, or source traffic
										paths.
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

						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
								<div className="flex items-start gap-3">
									<Info className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
									<div>
										<p className="text-sm font-semibold text-blue-950">
											What this controls
										</p>
										<p className="mt-1 text-sm leading-6 text-blue-800">
											Only trusted origins should be added. Entries are grouped
											by the traffic type they protect.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-md border border-amber-200 bg-amber-50 p-4">
								<div className="flex items-start gap-3">
									<AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-700" />
									<div>
										<p className="text-sm font-semibold text-amber-950">
											Supported values
										</p>
										<p className="mt-1 text-sm leading-6 text-amber-800">
											Use IPs like 192.168.1.1, hostnames like localhost, or
											wildcards like *.example.com.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Traffic type guide
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Choose the type based on the system area that will use the entry.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Server className="h-4 w-4 text-blue-600" />
									Source
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Supplier inventory, location, and source endpoint traffic.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Users className="h-4 w-4 text-amber-600" />
									Agent
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Agent partner tools and agency-facing requests.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Shield className="h-4 w-4 text-red-600" />
									Admin
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Admin console and internal administrative access.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total entries"
					value={entries.length}
					helper={`${filteredWhitelist.length} shown in current view`}
					icon={<Globe2 className="h-5 w-5" />}
					tone="blue"
				/>
				<StatCard
					label="Enabled"
					value={stats.enabled}
					helper={`${stats.disabled} disabled entries`}
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="Source / Agent"
					value={`${stats.byType.source}/${stats.byType.agent}`}
					helper="Source rules / Agent rules"
					icon={<Server className="h-5 w-5" />}
					tone="amber"
				/>
				<StatCard
					label="Admin rules"
					value={stats.byType.admin}
					helper="Entries protecting admin traffic"
					icon={<Shield className="h-5 w-5" />}
					tone={stats.byType.admin > 0 ? "red" : "slate"}
				/>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex items-start gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Plus className="h-5 w-5" />
						</span>
						<div>
							<h2 className="text-base font-semibold text-slate-950">
								Add trusted origin
							</h2>
							<p className="mt-1 text-sm leading-6 text-slate-500">
								Create a whitelist entry and label which traffic path it applies
								to.
							</p>
						</div>
					</div>
				</div>
				<div className="p-5">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-start">
							<Input
								label="IP address or domain"
								placeholder="192.168.1.1, localhost, or *.example.com"
								value={newIp}
								onChange={(event) => {
									setNewIp(event.target.value);
									if (ipError) setIpError("");
								}}
								error={ipError}
								helperText="Use an exact IP, hostname, or wildcard domain."
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								onKeyDown={(event) => {
									if (event.key === "Enter") handleAddIp();
								}}
							/>
							<Select
								label="Traffic type"
								value={ipType}
								onChange={(event) =>
									setIpType(event.target.value as WhitelistType)
								}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								helperText={typeDescription(ipType)}
								options={[
									{ value: "source", label: "Source" },
									{ value: "agent", label: "Agent" },
									{ value: "admin", label: "Admin" },
								]}
							/>
							<Button
								onClick={handleAddIp}
								loading={addMutation.isPending}
								disabled={addMutation.isPending || !newIp.trim()}
								className="mt-0 rounded-md shadow-none lg:mt-6"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add entry
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div className="flex items-start gap-3">
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<Filter className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									Whitelisted IPs and domains
								</h2>
								<p className="mt-1 text-sm leading-6 text-slate-500">
									Showing {filteredWhitelist.length} of {entries.length} entries
									{hasActiveFilters ? " after filters" : ""}.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Enabled {stats.enabled}</Badge>
							<Badge variant="default">Disabled {stats.disabled}</Badge>
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
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Search IP address or domain"
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-none focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
							<Select
								label="Filter by type"
								value={typeFilter}
								onChange={(event) =>
									setTypeFilter(event.target.value as TypeFilter)
								}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All types" },
									{ value: "source", label: "Source" },
									{ value: "agent", label: "Agent" },
									{ value: "admin", label: "Admin" },
								]}
							/>
						</div>
					</div>
				</div>

				<div className="p-0">
					{isLoading ? (
						<div className="flex min-h-72 items-center justify-center p-8">
							<Loader />
						</div>
					) : error ? (
						<div className="p-5">
							<ErrorState onRetry={() => refetch()} />
						</div>
					) : filteredWhitelist.length === 0 ? (
						<EmptyState
							title={
								entries.length === 0
									? "No whitelist entries yet"
									: "No whitelist entries match your filters"
							}
							description={
								entries.length === 0
									? "Add an IP address, hostname, or wildcard domain above to define trusted origins."
									: "Try clearing filters or searching for a different IP address or domain."
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
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-sm">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											IP / Domain
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Traffic type
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Status
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Created
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{filteredWhitelist.map((entry: WhitelistEntry) => (
										<tr key={entry.id} className="hover:bg-slate-50">
											<td className="px-5 py-4 align-top">
												<code
													className="inline-flex max-w-lg truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700"
													title={entry.ip}
												>
													{entry.ip}
												</code>
											</td>
											<td className="px-5 py-4 align-top">
												<Badge variant={typeBadgeVariant(entry.type)} size="sm">
													{typeLabel(entry.type)}
												</Badge>
												<p className="mt-1 text-xs text-slate-500">
													{typeDescription(entry.type)}
												</p>
											</td>
											<td className="px-5 py-4 align-top">
												<Badge
													variant={entry.enabled ? "success" : "warning"}
													size="sm"
												>
													{entry.enabled ? (
														<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
													) : (
														<XCircle className="mr-1 h-3.5 w-3.5" />
													)}
													{entry.enabled ? "Enabled" : "Disabled"}
												</Badge>
											</td>
											<td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
												{formatDateSafe(entry.createdAt)}
											</td>
											<td className="px-5 py-4 align-top text-right">
												<Button
													variant="danger"
													size="sm"
													onClick={() => {
														if (
															window.confirm(
																`Are you sure you want to remove ${entry.ip} from the whitelist?`,
															)
														) {
															removeMutation.mutate(entry.id);
														}
													}}
													loading={removeMutation.isPending}
													disabled={removeMutation.isPending}
													className="rounded-md shadow-none"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Remove
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white p-5">
				<div className="flex items-start gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
						<Info className="h-5 w-5" />
					</span>
					<div>
						<h2 className="text-base font-semibold text-slate-950">
							How to use this page
						</h2>
						<p className="mt-1 text-sm leading-6 text-slate-600">
							Keep entries specific where possible. Wildcards are useful for
							partner domains, but exact IPs are easier to audit. Whitelist
							enforcement may also depend on backend environment configuration.
						</p>
						<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
								<span className="font-semibold text-slate-900">
									IP address:
								</span>{" "}
								192.168.1.1
							</div>
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
								<span className="font-semibold text-slate-900">Hostname:</span>{" "}
								localhost
							</div>
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
								<span className="font-semibold text-slate-900">Wildcard:</span>{" "}
								*.example.com
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
