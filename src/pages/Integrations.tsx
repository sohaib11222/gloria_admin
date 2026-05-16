import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	AlertTriangle,
	CheckCircle2,
	Copy as CopyIcon,
	Globe2,
	KeyRound,
	LockKeyhole,
	Network,
	Plus,
	RefreshCw,
	Shield,
	ShieldCheck,
	Trash2,
	XCircle,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Copy } from "../components/ui/Copy";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { whitelistApi, WhitelistEntry } from "../api/whitelist";
import http from "../lib/http";
import { cn, formatDate } from "../lib/utils";

type OwnerType = "agent" | "source" | "admin";
type ApiKeyStatus = "active" | "revoked";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

type ApiKey = {
	id: string;
	name: string;
	ownerType: OwnerType;
	ownerId: string;
	status: ApiKeyStatus;
	createdAt: string;
	key?: string;
};

function normalizeOwnerType(value: unknown): OwnerType {
	const normalized = String(value || "admin").toLowerCase();
	if (
		normalized === "agent" ||
		normalized === "source" ||
		normalized === "admin"
	)
		return normalized;
	return "admin";
}

function normalizeApiKey(item: any, fallbackName = "API Key"): ApiKey {
	const status =
		String(item?.status || "active").toLowerCase() === "revoked"
			? "revoked"
			: "active";
	return {
		id: String(item?.id || ""),
		name: item?.name || fallbackName,
		ownerType: normalizeOwnerType(item?.ownerType || item?.owner_type),
		ownerId: item?.ownerId || item?.owner_id || "default",
		status,
		createdAt: item?.createdAt || item?.created_at || new Date().toISOString(),
		key: item?.key,
	};
}

const apiKeysApi = {
	list: async (): Promise<ApiKey[]> => {
		const { data } = await http.get("/admin/api-keys");
		return (data.items || []).map((item: any) => normalizeApiKey(item));
	},
	create: async (name?: string): Promise<ApiKey> => {
		const requestedName = name?.trim() || "API Key";
		const { data } = await http.post("/admin/api-keys", {
			name: requestedName,
			owner_type: "admin",
			owner_id: "default",
		});
		return normalizeApiKey(
			{
				...data,
				name: data.name || requestedName,
				ownerType: data.ownerType || "admin",
				ownerId: data.ownerId || "default",
				status: data.status || "active",
			},
			requestedName,
		);
	},
	revoke: async (id: string): Promise<void> => {
		await http.delete(`/admin/api-keys/${id}`);
	},
};

function formatDateSafe(value?: string) {
	if (!value) return "—";
	try {
		return formatDate(value);
	} catch {
		return new Date(value).toLocaleString();
	}
}

function toTitle(value: string) {
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ownerVariant(ownerType: OwnerType): "default" | "info" | "warning" {
	if (ownerType === "agent") return "info";
	if (ownerType === "source") return "warning";
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
		<div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
			<span className="inline-flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
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
	title,
	description,
	onRetry,
}: {
	title: string;
	description: string;
	onRetry: () => void;
}) {
	return (
		<div className="rounded-md border border-red-200 bg-red-50 p-4">
			<div className="flex items-start gap-3">
				<XCircle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-red-900">{title}</p>
					<p className="mt-1 text-sm leading-6 text-red-700">{description}</p>
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

export default function Integrations() {
	const queryClient = useQueryClient();
	const [newIp, setNewIp] = useState("");
	const [ipType, setIpType] = useState<OwnerType>("admin");
	const [keyName, setKeyName] = useState("");
	const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

	const {
		data: apiKeys,
		isLoading: keysLoading,
		error: keysError,
		refetch: refetchKeys,
		isFetching: keysFetching,
	} = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => apiKeysApi.list(),
	});

	const {
		data: whitelist,
		isLoading: wlLoading,
		error: wlError,
		refetch: refetchWhitelist,
		isFetching: whitelistFetching,
	} = useQuery({
		queryKey: ["whitelist"],
		queryFn: () => whitelistApi.listWhitelist(),
	});

	const createKey = useMutation({
		mutationFn: () => apiKeysApi.create(keyName || undefined),
		onSuccess: (data) => {
			setNewlyCreatedKey(data);
			setKeyName("");
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
			toast.success(
				"API key created. Copy it now — it will not be shown again.",
			);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to create API key");
		},
	});

	const revokeKey = useMutation({
		mutationFn: (id: string) => apiKeysApi.revoke(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["api-keys"] });
			toast.success("API key revoked successfully");
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to revoke API key";
			toast.error(errorMessage);
			console.error("Failed to revoke API key:", error);
		},
	});

	const addIp = useMutation({
		mutationFn: () => {
			const ip = newIp.trim();
			if (!ip) throw new Error("IP address or domain is required");
			return whitelistApi.addWhitelistEntry({
				ip,
				type: ipType,
				enabled: true,
			});
		},
		onSuccess: () => {
			setNewIp("");
			queryClient.invalidateQueries({ queryKey: ["whitelist"] });
			toast.success("IP address added to whitelist");
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to add IP address";
			toast.error(errorMessage);
			console.error("Failed to add IP address:", error);
		},
	});

	const removeIp = useMutation({
		mutationFn: (entryId: string) => whitelistApi.removeWhitelistEntry(entryId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["whitelist"] });
			toast.success("IP address removed from whitelist");
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to remove IP address";
			toast.error(errorMessage);
			console.error("Failed to remove IP address:", error);
		},
	});

	const keys = apiKeys || [];
	const whitelistEntries = whitelist || [];

	const stats = useMemo(() => {
		const activeKeys = keys.filter((key) => key.status === "active").length;
		const revokedKeys = keys.filter((key) => key.status === "revoked").length;
		const enabledWhitelist = whitelistEntries.filter(
			(entry) => entry.enabled,
		).length;
		const byType = {
			admin: whitelistEntries.filter((entry) => entry.type === "admin").length,
			agent: whitelistEntries.filter((entry) => entry.type === "agent").length,
			source: whitelistEntries.filter((entry) => entry.type === "source")
				.length,
		};
		return { activeKeys, revokedKeys, enabledWhitelist, byType };
	}, [keys, whitelistEntries]);

	const refreshAll = () => {
		refetchKeys();
		refetchWhitelist();
	};

	const handleCreateKey = () => {
		createKey.mutate();
	};

	const handleAddIp = () => {
		if (!newIp.trim()) {
			toast.error("Please enter an IP address or domain");
			return;
		}
		addIp.mutate();
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Network className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Administration
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Integrations & access controls
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Manage API keys for backend access and control which admin,
										agent, and source endpoints are allowed through the global
										IP whitelist.
									</p>
								</div>
							</div>
							<Button
								variant="secondary"
								size="sm"
								onClick={refreshAll}
								disabled={keysFetching || whitelistFetching}
								className="shrink-0 rounded-md border-slate-300 shadow-none"
							>
								<RefreshCw
									className={cn(
										"mr-2 h-4 w-4",
										(keysFetching || whitelistFetching) && "animate-spin",
									)}
								/>
								Refresh all
							</Button>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
								<div className="flex items-start gap-3">
									<KeyRound className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
									<div>
										<p className="text-sm font-semibold text-blue-950">
											API keys are shown one time
										</p>
										<p className="mt-1 text-sm leading-6 text-blue-800">
											After a key is created, copy it immediately and store it
											securely. Revoked keys cannot be used again.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-md border border-amber-200 bg-amber-50 p-4">
								<div className="flex items-start gap-3">
									<ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-amber-700" />
									<div>
										<p className="text-sm font-semibold text-amber-950">
											Whitelist is global
										</p>
										<p className="mt-1 text-sm leading-6 text-amber-800">
											Entries are grouped by admin, agent, or source so teams
											can understand which traffic path each rule protects.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Quick guide
						</h2>
						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<LockKeyhole className="h-4 w-4 text-slate-500" />
									Create keys carefully
								</div>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Use clear names such as Production API or Internal Tools.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Globe2 className="h-4 w-4 text-slate-500" />
									Add trusted origins
								</div>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Use IP addresses or domains that should be allowed by the
									platform.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="API keys"
					value={keys.length}
					helper={`${stats.activeKeys} active · ${stats.revokedKeys} revoked`}
					icon={<KeyRound className="h-5 w-5" />}
					tone="blue"
				/>
				<StatCard
					label="Active keys"
					value={stats.activeKeys}
					helper="Keys currently accepted by the API"
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="Whitelist entries"
					value={whitelistEntries.length}
					helper={`${stats.enabledWhitelist} enabled entries`}
					icon={<Shield className="h-5 w-5" />}
					tone="slate"
				/>
				<StatCard
					label="Rule split"
					value={`${stats.byType.agent}/${stats.byType.source}`}
					helper={`${stats.byType.admin} admin · Agent / Source rules`}
					icon={<Globe2 className="h-5 w-5" />}
					tone="amber"
				/>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div className="flex items-start gap-3">
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<KeyRound className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									API keys
								</h2>
								<p className="mt-1 text-sm leading-6 text-slate-500">
									Create and revoke keys used by trusted internal services or
									integration tools.
								</p>
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => refetchKeys()}
							disabled={keysFetching}
							className="rounded-md border-slate-300 shadow-none"
						>
							<RefreshCw
								className={cn("mr-2 h-4 w-4", keysFetching && "animate-spin")}
							/>
							Refresh keys
						</Button>
					</div>
				</div>

				<div className="space-y-5 p-5">
					{newlyCreatedKey?.key && (
						<div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
							<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
								<div className="flex items-start gap-3">
									<AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
									<div>
										<p className="text-sm font-semibold text-emerald-950">
											New API key created
										</p>
										<p className="mt-1 text-sm leading-6 text-emerald-800">
											Copy this value now. For security, the full key will not
											be shown again after you dismiss this message.
										</p>
									</div>
								</div>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setNewlyCreatedKey(null)}
									className="rounded-md border-emerald-200 bg-white text-emerald-800 shadow-none hover:bg-emerald-100"
								>
									Dismiss
								</Button>
							</div>
							<div className="mt-4 flex flex-col gap-3 rounded-md border border-emerald-200 bg-white p-3 lg:flex-row lg:items-center">
								<code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-slate-800">
									{newlyCreatedKey.key}
								</code>
								<Copy
									text={newlyCreatedKey.key}
									label="Copy key"
									className="shrink-0 rounded-md text-slate-700"
								/>
							</div>
						</div>
					)}

					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
							<Input
								label="Key name"
								value={keyName}
								onChange={(event) => setKeyName(event.target.value)}
								placeholder="Production API, CI pipeline, internal tools"
								helperText="Use a clear name so other admins can understand where the key is used."
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Button
								onClick={handleCreateKey}
								loading={createKey.isPending}
								disabled={createKey.isPending}
								className="rounded-md shadow-none"
							>
								<Plus className="mr-2 h-4 w-4" />
								Create key
							</Button>
						</div>
					</div>

					{keysLoading ? (
						<div className="flex min-h-56 items-center justify-center">
							<Loader />
						</div>
					) : keysError ? (
						<ErrorState
							title="Unable to load API keys"
							description="The API key list could not be loaded. Check the backend connection and try again."
							onRetry={() => refetchKeys()}
						/>
					) : keys.length === 0 ? (
						<EmptyState
							title="No API keys yet"
							description="Create a key above when an integration needs authenticated API access."
							icon={<KeyRound className="h-7 w-7" />}
						/>
					) : (
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-slate-200 text-sm">
									<thead className="bg-slate-50">
										<tr>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Name
											</th>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Owner
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
										{keys.map((key) => (
											<tr key={key.id} className="hover:bg-slate-50">
												<td className="px-5 py-4 align-top">
													<div className="font-semibold text-slate-950">
														{key.name || "Unnamed key"}
													</div>
													<div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
														<CopyIcon className="h-3.5 w-3.5" />
														ID: {key.id.slice(0, 12)}…
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={ownerVariant(key.ownerType)}
														size="sm"
														className="capitalize"
													>
														{key.ownerType}
													</Badge>
													<p className="mt-1 text-xs text-slate-500">
														{key.ownerId}
													</p>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={
															key.status === "active" ? "success" : "danger"
														}
														size="sm"
														className="capitalize"
													>
														{key.status === "active" ? (
															<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
														) : (
															<XCircle className="mr-1 h-3.5 w-3.5" />
														)}
														{key.status}
													</Badge>
												</td>
												<td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
													{formatDateSafe(key.createdAt)}
												</td>
												<td className="px-5 py-4 align-top text-right">
													{key.status === "active" ? (
														<Button
															variant="danger"
															size="sm"
															onClick={() => {
																if (
																	window.confirm(
																		"Are you sure you want to revoke this API key? This action cannot be undone.",
																	)
																) {
																	revokeKey.mutate(key.id);
																}
															}}
															loading={revokeKey.isPending}
															disabled={revokeKey.isPending}
															className="rounded-md shadow-none"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Revoke
														</Button>
													) : (
														<span className="text-xs font-medium text-slate-400">
															No action
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div className="flex items-start gap-3">
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<Shield className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									IP whitelist
								</h2>
								<p className="mt-1 text-sm leading-6 text-slate-500">
									Allow trusted IP addresses or domains and label each entry by
									the integration traffic type.
								</p>
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => refetchWhitelist()}
							disabled={whitelistFetching}
							className="rounded-md border-slate-300 shadow-none"
						>
							<RefreshCw
								className={cn(
									"mr-2 h-4 w-4",
									whitelistFetching && "animate-spin",
								)}
							/>
							Refresh whitelist
						</Button>
					</div>
				</div>

				<div className="space-y-5 p-5">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Traffic type
								</label>
								<select
									value={ipType}
									onChange={(event) =>
										setIpType(event.target.value as OwnerType)
									}
									className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-none focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
								>
									<option value="admin">Admin</option>
									<option value="agent">Agent</option>
									<option value="source">Source</option>
								</select>
							</div>
							<Input
								label="IP address or domain"
								value={newIp}
								onChange={(event) => setNewIp(event.target.value)}
								placeholder="192.168.1.1 or partner.example.com"
								helperText="Use the origin that should be allowed through the global whitelist."
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Button
								onClick={handleAddIp}
								disabled={!newIp.trim() || addIp.isPending}
								loading={addIp.isPending}
								className="rounded-md shadow-none"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add entry
							</Button>
						</div>
					</div>

					{wlLoading ? (
						<div className="flex min-h-56 items-center justify-center">
							<Loader />
						</div>
					) : wlError ? (
						<ErrorState
							title="Unable to load whitelist"
							description="The whitelist entries could not be loaded. Check the backend connection and try again."
							onRetry={() => refetchWhitelist()}
						/>
					) : whitelistEntries.length === 0 ? (
						<EmptyState
							title="No whitelist entries"
							description="Add trusted IP addresses or domains above so users can see which origins are allowed."
							icon={<Shield className="h-7 w-7" />}
						/>
					) : (
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-slate-200 text-sm">
									<thead className="bg-slate-50">
										<tr>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												IP / Domain
											</th>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Type
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
										{whitelistEntries.map((entry: WhitelistEntry) => (
											<tr key={entry.id} className="hover:bg-slate-50">
												<td className="px-5 py-4 align-top">
													<code
														className="inline-flex max-w-md truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700"
														title={entry.ip}
													>
														{entry.ip}
													</code>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge variant={ownerVariant(entry.type)} size="sm">
														{toTitle(entry.type)}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={entry.enabled ? "success" : "default"}
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
																removeIp.mutate(entry.id);
															}
														}}
														loading={removeIp.isPending}
														disabled={removeIp.isPending}
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
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
