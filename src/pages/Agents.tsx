import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Building2,
	Edit,
	FileText,
	Plus,
	RefreshCw,
	Search,
	Users,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { companiesApi, Company } from "../api/companies";
import { agreementsApi, Agreement } from "../api/agreements";
import { agentBillingApi } from "../api/billing";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";

interface AgentFormModalProps {
	agent: Company | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
}

const getInitialFormData = () => ({
	companyName: "",
	email: "",
	password: "",
	grpcEndpoint: "",
	billingCountryCode: "",
	status: "ACTIVE" as "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED",
});

const statusLabel = (status?: string) => {
	if (status === "ACTIVE") return "Active";
	if (status === "PENDING_VERIFICATION") return "Pending verification";
	if (status === "SUSPENDED") return "Suspended";
	return status || "Unknown";
};

const statusVariant = (
	status?: string,
): "default" | "success" | "warning" | "danger" | "info" => {
	if (status === "ACTIVE" || status === "ACCEPTED") return "success";
	if (
		status === "PENDING_VERIFICATION" ||
		status === "OFFERED" ||
		status === "DRAFT"
	)
		return "warning";
	if (status === "SUSPENDED" || status === "EXPIRED" || status === "REJECTED")
		return "danger";
	return "default";
};

const isLiveAgreement = (status?: string) =>
	status === "ACTIVE" || status === "ACCEPTED";

const AgentFormModal: React.FC<AgentFormModalProps> = ({
	agent,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState(getInitialFormData);

	useEffect(() => {
		if (isOpen) {
			if (agent) {
				setFormData({
					companyName: agent.companyName || "",
					email: agent.email || "",
					password: "",
					grpcEndpoint: agent.grpcEndpoint || "",
					billingCountryCode: agent.billingCountryCode || "",
					status: agent.status || "ACTIVE",
				});
			} else {
				setFormData(getInitialFormData());
			}
		} else {
			setFormData(getInitialFormData());
		}
	}, [agent, isOpen]);

	const createMutation = useMutation({
		mutationFn: (data: any) => companiesApi.createCompany(data),
		onSuccess: () => {
			toast.success("Agent created successfully");
			onSave();
			onClose();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to create agent");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			companiesApi.updateCompanyDetails(id, data),
		onSuccess: () => {
			toast.success("Agent updated successfully");
			onSave();
			onClose();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to update agent");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formData.companyName ||
			!formData.email ||
			(!agent && !formData.password)
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		const dataToSend: any = {
			companyName: formData.companyName,
			email: formData.email,
			type: "AGENT",
			status: formData.status,
			billingCountryCode: formData.billingCountryCode.trim() || null,
		};

		if (formData.password) dataToSend.password = formData.password;
		if (formData.grpcEndpoint) dataToSend.grpcEndpoint = formData.grpcEndpoint;

		if (agent) {
			updateMutation.mutate({ id: agent.id, data: dataToSend });
		} else {
			createMutation.mutate(dataToSend);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={agent ? "Edit Agent" : "Create Agent"}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Input
						label="Company name"
						value={formData.companyName}
						onChange={(e) =>
							setFormData({ ...formData, companyName: e.target.value })
						}
						required
					/>
					<Input
						label="Email"
						type="email"
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						required
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Input
						label="Password"
						type="password"
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						required={!agent}
						helperText={
							agent ? "Leave blank to keep current password" : undefined
						}
					/>
					<Select
						label="Status"
						value={formData.status}
						onChange={(e) =>
							setFormData({ ...formData, status: e.target.value as any })
						}
						options={[
							{ value: "ACTIVE", label: "Active" },
							{ value: "PENDING_VERIFICATION", label: "Pending verification" },
							{ value: "SUSPENDED", label: "Suspended" },
						]}
					/>
				</div>

				<Input
					label="gRPC endpoint"
					placeholder="localhost:51062"
					value={formData.grpcEndpoint}
					onChange={(e) =>
						setFormData({ ...formData, grpcEndpoint: e.target.value })
					}
					helperText="Optional. Format: host:port"
				/>

				<Input
					label="Billing country"
					placeholder="e.g. US, IN"
					value={formData.billingCountryCode}
					onChange={(e) =>
						setFormData({
							...formData,
							billingCountryCode: e.target.value.toUpperCase().slice(0, 2),
						})
					}
					helperText="ISO 3166-1 alpha-2. Used for agent plan pricing."
				/>

				<div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
					<Button variant="secondary" onClick={onClose} type="button">
						Cancel
					</Button>
					<Button
						type="submit"
						loading={createMutation.isPending || updateMutation.isPending}
					>
						{agent ? "Update" : "Create"}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

export default function Agents() {
	const [selectedAgent, setSelectedAgent] = useState<Company | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [agentToEdit, setAgentToEdit] = useState<Company | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED"
	>("ALL");
	const [form, setForm] = useState({
		agreementRef: "",
		sourceId: "",
		validFrom: "",
		validTo: "",
	});
	const [isCreating, setIsCreating] = useState(false);
	const [planByAgentId, setPlanByAgentId] = useState<
		Record<string, string | null>
	>({});

	const queryClient = useQueryClient();

	const {
		data: agents,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["agents"],
		queryFn: () => companiesApi.listAgents(),
	});

	const { data: sources } = useQuery({
		queryKey: ["sources"],
		queryFn: () => companiesApi.listSources(),
	});

	const { data: agreements } = useQuery({
		queryKey: ["agreements"],
		queryFn: () => agreementsApi.listAgreements(),
	});

	const filteredAgents = useMemo(() => {
		if (!agents?.data) return [];
		const query = searchQuery.trim().toLowerCase();
		return agents.data.filter((agent) => {
			const matchesSearch =
				!query ||
				agent.companyName?.toLowerCase().includes(query) ||
				agent.email?.toLowerCase().includes(query);
			const matchesStatus =
				statusFilter === "ALL" || agent.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [agents?.data, searchQuery, statusFilter]);

	const filteredAgentIds = useMemo(
		() => filteredAgents.map((agent) => agent.id).join(","),
		[filteredAgents],
	);

	useEffect(() => {
		const list = filteredAgents.slice(0, 30);
		if (list.length === 0) {
			setPlanByAgentId({});
			return;
		}
		let cancelled = false;
		const next: Record<string, string | null> = {};
		Promise.all(
			list.map(async (agent) => {
				try {
					const data = (await agentBillingApi.getAgentSubscription(
						agent.id,
					)) as any;
					if (cancelled) return;
					next[agent.id] =
						data?.subscription === null
							? null
							: (data?.agentPlan?.name ?? null);
				} catch {
					if (!cancelled) next[agent.id] = null;
				}
			}),
		).then(() => {
			if (!cancelled) setPlanByAgentId(next);
		});
		return () => {
			cancelled = true;
		};
	}, [filteredAgentIds]);

	const agreementStatsByAgent = useMemo(() => {
		const map: Record<
			string,
			{ total: number; live: number; pending: number; latest?: Agreement }
		> = {};
		(agreements?.data || []).forEach((agreement) => {
			if (!map[agreement.agentId])
				map[agreement.agentId] = { total: 0, live: 0, pending: 0 };
			map[agreement.agentId].total += 1;
			if (isLiveAgreement(agreement.status)) map[agreement.agentId].live += 1;
			if (agreement.status === "DRAFT" || agreement.status === "OFFERED")
				map[agreement.agentId].pending += 1;
			if (
				!map[agreement.agentId].latest ||
				new Date(agreement.createdAt).getTime() >
					new Date(map[agreement.agentId].latest!.createdAt).getTime()
			) {
				map[agreement.agentId].latest = agreement;
			}
		});
		return map;
	}, [agreements?.data]);

	const createAgreementMutation = useMutation({
		mutationFn: (data: any) => agreementsApi.createAgreement(data),
		onSuccess: () => {
			toast.success("Agreement record created successfully");
			setIsModalOpen(false);
			setForm({ agreementRef: "", sourceId: "", validFrom: "", validTo: "" });
			setSelectedAgent(null);
			queryClient.invalidateQueries({ queryKey: ["agreements"] });
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to create agreement",
			);
		},
	});

	const handleCreate = async () => {
		if (
			!form.agreementRef ||
			!form.sourceId ||
			!form.validFrom ||
			!form.validTo
		) {
			toast.error("Please fill all required fields");
			return;
		}
		if (!selectedAgent) {
			toast.error("Agent not selected");
			return;
		}

		setIsCreating(true);
		try {
			const dup = await agreementsApi.checkDuplicate({
				agreementRef: form.agreementRef,
				agentId: selectedAgent.id,
				sourceId: form.sourceId,
			});

			if (dup?.duplicate) {
				const proceed = window.confirm(
					"This agreement reference already exists for this agent/source combination. Do you want to proceed?",
				);
				if (!proceed) return;
			}

			await createAgreementMutation.mutateAsync({
				agreementRef: form.agreementRef,
				agentId: selectedAgent.id,
				sourceId: form.sourceId,
				validFrom: form.validFrom,
				validTo: form.validTo,
			});
		} catch (createError) {
			console.error("Failed to create agreement:", createError);
		} finally {
			setIsCreating(false);
		}
	};

	const totalAgents = agents?.data?.length || 0;
	const stats = {
		total: totalAgents,
		active:
			agents?.data?.filter((agent) => agent.status === "ACTIVE").length || 0,
		pending:
			agents?.data?.filter((agent) => agent.status === "PENDING_VERIFICATION")
				.length || 0,
		suspended:
			agents?.data?.filter((agent) => agent.status === "SUSPENDED").length || 0,
		liveAgreements:
			agreements?.data?.filter((agreement) => isLiveAgreement(agreement.status))
				.length || 0,
	};
	const filtersApplied = Boolean(searchQuery.trim()) || statusFilter !== "ALL";

	if (isLoading) {
		return (
			<div className="space-y-6">
				<section className="rounded-md border border-slate-200 bg-white p-6">
					<div className="flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Users className="h-5 w-5" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Agent registry
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
								Agents
							</h1>
						</div>
					</div>
				</section>
				<section className="flex min-h-72 items-center justify-center rounded-md border border-slate-200 bg-white p-8">
					<Loader />
				</section>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
							Agent registry
						</p>
						<div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-slate-950">
									Agents
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Manage agent companies, billing plan visibility, and their
									source agreement records.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									onClick={() =>
										queryClient.invalidateQueries({ queryKey: ["agents"] })
									}
									className="rounded-md border-slate-300 shadow-none"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
								<Button
									onClick={() => setIsCreateModalOpen(true)}
									className="rounded-md shadow-none"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create agent
								</Button>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Total agents
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.total}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Registered agent companies
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Active
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.active}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Can access platform services
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Pending
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.pending}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Awaiting verification
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Live agreements
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.liveAgreements}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Active or accepted records
								</p>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-slate-950">
									Operational summary
								</h2>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Use this page to confirm agents are active before linking
									agreements.
								</p>
							</div>
							<Badge
								variant={stats.suspended > 0 ? "warning" : "success"}
								size="sm"
							>
								{stats.suspended} suspended
							</Badge>
						</div>
						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-l-4 border-l-emerald-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Ready agents
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Active and available for agreements.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.active}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-amber-500 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Pending verification
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Review before enabling traffic.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.pending}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-blue-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Agreement records
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Visible from admin agreements data.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{agreements?.data?.length || 0}
									</span>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div className="flex items-center gap-3">
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<Users className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									Agent directory
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Showing {filteredAgents.length} of {totalAgents} agents
									{filtersApplied ? " after filters" : ""}.
								</p>
							</div>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Search by company name or email"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
							<Select
								label="Status"
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as any)}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All statuses" },
									{ value: "ACTIVE", label: "Active" },
									{
										value: "PENDING_VERIFICATION",
										label: "Pending verification",
									},
									{ value: "SUSPENDED", label: "Suspended" },
								]}
							/>
						</div>
					</div>
				</div>

				<div className="p-0">
					{error ? (
						<div className="p-5">
							<ErrorDisplay error={error} title="Failed to load agents" />
						</div>
					) : filteredAgents.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Agent
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Plan
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Agreements
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
									{filteredAgents.map((agent) => {
										const agreementStats = agreementStatsByAgent[agent.id] || {
											total: 0,
											live: 0,
											pending: 0,
										};
										return (
											<tr
												key={agent.id}
												className="transition hover:bg-slate-50"
											>
												<td className="px-5 py-4 align-top">
													<div className="flex items-start gap-3">
														<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
															<Building2 className="h-5 w-5" />
														</span>
														<div className="min-w-0">
															<p className="max-w-xs truncate text-sm font-semibold text-slate-950">
																{agent.companyName}
															</p>
															<p className="mt-1 max-w-xs truncate text-sm text-slate-500">
																{agent.email}
															</p>
															{agent.billingCountryCode && (
																<code className="mt-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
																	Billing: {agent.billingCountryCode}
																</code>
															)}
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top text-sm text-slate-700">
													{planByAgentId[agent.id] || "No active plan"}
												</td>
												<td className="px-5 py-4 align-top">
													<div className="space-y-2">
														<div className="text-sm font-semibold text-slate-950">
															{agreementStats.total} total
														</div>
														<div className="flex flex-wrap gap-2">
															<Badge
																variant={
																	agreementStats.live > 0
																		? "success"
																		: "default"
																}
																size="sm"
															>
																{agreementStats.live} live
															</Badge>
															<Badge
																variant={
																	agreementStats.pending > 0
																		? "warning"
																		: "default"
																}
																size="sm"
															>
																{agreementStats.pending} pending
															</Badge>
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge variant={statusVariant(agent.status)}>
														{statusLabel(agent.status)}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top text-sm text-slate-600">
													{formatDate(agent.createdAt)}
												</td>
												<td className="px-5 py-4 align-top">
													<div className="flex flex-wrap justify-end gap-2">
														<Button
															size="sm"
															variant="secondary"
															onClick={() => {
																setSelectedAgent(agent);
																setForm({
																	agreementRef: "",
																	sourceId: "",
																	validFrom: "",
																	validTo: "",
																});
																setIsModalOpen(true);
															}}
															disabled={agent.status !== "ACTIVE"}
															className="rounded-md shadow-none"
														>
															<FileText className="mr-1 h-4 w-4" />
															Agreement
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => {
																setAgentToEdit(agent);
																setIsEditModalOpen(true);
															}}
															className="rounded-md"
														>
															<Edit className="mr-1 h-4 w-4" />
															Edit
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
								<Users className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-950">
								No agents found
							</h3>
							<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
								{filtersApplied
									? "Try clearing filters or searching with a different agent name or email."
									: "Create the first agent company to begin linking source agreements."}
							</p>
							<div className="mt-5 flex flex-wrap justify-center gap-2">
								{filtersApplied && (
									<Button
										variant="secondary"
										onClick={() => {
											setSearchQuery("");
											setStatusFilter("ALL");
										}}
										className="rounded-md shadow-none"
									>
										Clear filters
									</Button>
								)}
								{!filtersApplied && (
									<Button
										onClick={() => setIsCreateModalOpen(true)}
										className="rounded-md shadow-none"
									>
										<Plus className="mr-2 h-4 w-4" />
										Create agent
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			</section>

			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedAgent(null);
					setForm({
						agreementRef: "",
						sourceId: "",
						validFrom: "",
						validTo: "",
					});
				}}
				title="Create agreement record"
				size="lg"
			>
				<div className="space-y-4">
					{selectedAgent && (
						<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								Agent
							</p>
							<p className="mt-1 text-sm font-semibold text-slate-950">
								{selectedAgent.companyName}
							</p>
							<p className="text-sm text-slate-500">{selectedAgent.email}</p>
						</div>
					)}

					<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
						Source-created operational agreements are the primary flow. Use this
						admin action only when you need to register a relationship manually.
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<Input
							label="Agreement reference"
							placeholder="e.g., AG-REF-001"
							value={form.agreementRef}
							onChange={(e) =>
								setForm({ ...form, agreementRef: e.target.value })
							}
						/>
						<Select
							label="Source company"
							value={form.sourceId}
							onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
							options={[
								{ value: "", label: "Select source" },
								...(sources?.data || []).map((source) => ({
									value: source.id,
									label: `${source.companyName}${source.status !== "ACTIVE" ? ` (${statusLabel(source.status)})` : ""}`,
								})),
							]}
						/>
						<div>
							<label className="mb-1 block text-sm font-medium text-slate-700">
								Valid from
							</label>
							<input
								type="datetime-local"
								className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
								value={form.validFrom}
								onChange={(e) =>
									setForm({ ...form, validFrom: e.target.value })
								}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-slate-700">
								Valid to
							</label>
							<input
								type="datetime-local"
								className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
								value={form.validTo}
								onChange={(e) => setForm({ ...form, validTo: e.target.value })}
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
						<Button
							variant="secondary"
							onClick={() => {
								setIsModalOpen(false);
								setSelectedAgent(null);
								setForm({
									agreementRef: "",
									sourceId: "",
									validFrom: "",
									validTo: "",
								});
							}}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							loading={isCreating}
							disabled={isCreating}
						>
							Create record
						</Button>
					</div>
				</div>
			</Modal>

			<AgentFormModal
				key="create-agent-modal"
				agent={null}
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onSave={() => queryClient.invalidateQueries({ queryKey: ["agents"] })}
			/>

			<AgentFormModal
				key={`edit-agent-modal-${agentToEdit?.id || "new"}`}
				agent={agentToEdit}
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setAgentToEdit(null);
				}}
				onSave={() => queryClient.invalidateQueries({ queryKey: ["agents"] })}
			/>
		</div>
	);
}
