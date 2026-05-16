import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Edit,
	Play,
	RefreshCw,
	Shield,
	MapPin,
	Plus,
	Download,
	Search,
	X,
	CheckCircle,
	AlertCircle,
	AlertTriangle,
	Server,
	Activity,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { Loader } from "../components/ui/Loader";
import { companiesApi } from "../api/companies";
import { agreementsApi, Agreement } from "../api/agreements";
import { whitelistApi, branchImportApi } from "../api/whitelist";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EndpointSchema, WhitelistIPSchema } from "../lib/validators";
import toast from "react-hot-toast";

interface EditSourceModalProps {
	source: any;
	isOpen: boolean;
	onClose: () => void;
}

const EditSourceModal: React.FC<EditSourceModalProps> = ({
	source,
	isOpen,
	onClose,
}) => {
	const queryClient = useQueryClient();
	const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(EndpointSchema),
		defaultValues: {
			api_base_url: source?.api_base_url || "",
		},
	});

	const updateMutation = useMutation({
		mutationFn: (data: any) => companiesApi.updateCompany(source.id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sources"] });
			toast.success("Source updated successfully");
			onClose();
		},
	});

	const onSubmit = (data: any) => {
		updateMutation.mutate(data);
	};

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose} title="Edit Source" size="md">
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Input
						label="API Base URL"
						placeholder="https://api.example.com"
						error={errors.api_base_url?.message as string | undefined}
						{...register("api_base_url")}
					/>

					<div className="flex justify-end space-x-3">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={updateMutation.isPending}>
							Save Changes
						</Button>
					</div>
				</form>

				<div className="mt-6 pt-6 border-t border-gray-200">
					<Button
						variant="secondary"
						onClick={() => setIsWhitelistOpen(true)}
						className="w-full"
					>
						<Shield className="h-4 w-4 mr-2" />
						Manage IP Whitelist
					</Button>
				</div>
			</Modal>

			<WhitelistModal
				companyId={source?.id}
				companyType={source?.type?.toLowerCase() || "source"}
				isOpen={isWhitelistOpen}
				onClose={() => setIsWhitelistOpen(false)}
			/>
		</>
	);
};

interface AddSourceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const [formData, setFormData] = useState({
		companyName: "",
		email: "",
		password: "",
		adapterType: "" as "" | "grpc" | "http",
		grpcEndpoint: "",
		httpEndpoint: "",
		companyCode: "",
	});

	const createMutation = useMutation({
		mutationFn: async (data: any) => {
			const createdCompany = await companiesApi.createCompany({
				...data,
				type: "SOURCE",
			});

			// After successful creation, update companyCode and httpEndpoint if provided
			if (formData.companyCode || formData.httpEndpoint) {
				try {
					const updateData: any = {};
					if (formData.companyCode) {
						updateData.companyCode = formData.companyCode;
					}
					if (formData.httpEndpoint) {
						updateData.httpEndpoint = formData.httpEndpoint;
					}
					if (Object.keys(updateData).length > 0) {
						await companiesApi.updateCompanyDetails(
							createdCompany.id,
							updateData,
						);
					}
				} catch (error) {
					// Log error but don't fail the creation
					console.error("Failed to update company details:", error);
					toast.error("Source created but failed to update additional details");
				}
			}

			return createdCompany;
		},
		onSuccess: () => {
			toast.success("Source created successfully");
			onSuccess();
			onClose();
			// Reset form
			setFormData({
				companyName: "",
				email: "",
				password: "",
				adapterType: "",
				grpcEndpoint: "",
				httpEndpoint: "",
				companyCode: "",
			});
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to create source";
			toast.error(errorMessage);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields
		if (!formData.companyName || !formData.email || !formData.password) {
			toast.error(
				"Please fill in all required fields (Company Name, Email, Password)",
			);
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		// Validate password length
		if (formData.password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		// Validate adapter type specific fields
		if (formData.adapterType === "grpc" && !formData.grpcEndpoint) {
			toast.error("gRPC endpoint is required when adapter type is gRPC");
			return;
		}

		const dataToSend: any = {
			companyName: formData.companyName,
			email: formData.email,
			password: formData.password,
			type: "SOURCE",
			adapterType: formData.adapterType,
		};

		// Only send grpcEndpoint if adapter type is grpc
		if (formData.adapterType === "grpc" && formData.grpcEndpoint) {
			dataToSend.grpcEndpoint = formData.grpcEndpoint;
		}

		createMutation.mutate(dataToSend);
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Source" size="lg">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Company Name"
						placeholder="Enter company name"
						value={formData.companyName}
						onChange={(e) =>
							setFormData({ ...formData, companyName: e.target.value })
						}
						required
					/>
					<Input
						label="Email"
						type="email"
						placeholder="company@example.com"
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						required
					/>
				</div>

				<Input
					label="Password"
					type="password"
					placeholder="Minimum 6 characters"
					value={formData.password}
					onChange={(e) =>
						setFormData({ ...formData, password: e.target.value })
					}
					required
					helperText="Password must be at least 6 characters long"
				/>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Adapter Type
						</label>
						<select
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={formData.adapterType}
							onChange={(e) =>
								setFormData({ ...formData, adapterType: e.target.value as any })
							}
						>
							<option value="grpc">gRPC</option>
							<option value="http">HTTP</option>
						</select>
						<p className="mt-1 text-xs text-gray-500">
							Select the adapter type for this source
						</p>
					</div>
					<Input
						label="Company Code"
						placeholder="CMP00023"
						value={formData.companyCode}
						onChange={(e) =>
							setFormData({ ...formData, companyCode: e.target.value })
						}
						helperText="Required for branch import (e.g., CMP00023)"
					/>
				</div>

				{formData.adapterType === "grpc" && (
					<Input
						label="gRPC Endpoint"
						placeholder="localhost:9090"
						value={formData.grpcEndpoint}
						onChange={(e) =>
							setFormData({ ...formData, grpcEndpoint: e.target.value })
						}
						required={formData.adapterType === "grpc"}
						helperText="gRPC server address (e.g., localhost:9090)"
					/>
				)}

				{formData.adapterType === "http" && (
					<Input
						label="HTTP Endpoint"
						placeholder="https://api.example.com"
						value={formData.httpEndpoint}
						onChange={(e) =>
							setFormData({ ...formData, httpEndpoint: e.target.value })
						}
						helperText="HTTP API base URL (e.g., https://api.example.com)"
					/>
				)}

				<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" loading={createMutation.isPending}>
						Create Source
					</Button>
				</div>
			</form>
		</Modal>
	);
};

interface WhitelistModalProps {
	companyId: string;
	companyType?: "source" | "agent" | "admin";
	isOpen: boolean;
	onClose: () => void;
}

const WhitelistModal: React.FC<WhitelistModalProps> = ({
	companyId,
	companyType = "source",
	isOpen,
	onClose,
}) => {
	const [newIp, setNewIp] = useState("");
	const [ipType, setIpType] = useState<"agent" | "source" | "admin">(
		companyType as "agent" | "source" | "admin",
	);
	const [ipError, setIpError] = useState("");

	const {
		data: whitelist,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["whitelist"],
		queryFn: () => whitelistApi.listWhitelist(),
		enabled: isOpen,
	});

	// Filter whitelist by company type
	const filteredWhitelist = whitelist?.filter((entry) => {
		// Show entries that match the company type or are admin entries
		return entry.type === ipType || entry.type === "admin";
	});

	const addMutation = useMutation({
		mutationFn: (data: {
			ip: string;
			type: "agent" | "source" | "admin";
			enabled?: boolean;
		}) => whitelistApi.addWhitelistEntry(data),
		onSuccess: () => {
			refetch();
			setNewIp("");
			setIpError("");
			toast.success("IP address added to whitelist");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to add IP to whitelist",
			);
		},
	});

	const removeMutation = useMutation({
		mutationFn: (entryId: string) => whitelistApi.removeWhitelistEntry(entryId),
		onSuccess: () => {
			refetch();
			toast.success("IP address removed from whitelist");
		},
	});

	const testMutation = useMutation({
		mutationFn: () => whitelistApi.testWhitelist(companyId),
		onSuccess: (results) => {
			if (!results || results.length === 0) {
				toast.error("No test results returned");
				return;
			}
			const accessible = results.every((r) => r.accessible);
			const failed = results.filter((r) => !r.accessible);
			if (accessible) {
				toast.success(`All ${results.length} endpoint(s) are accessible`);
			} else {
				toast.error(
					`${failed.length} of ${results.length} endpoint(s) are not accessible. Check whitelist configuration.`,
				);
			}
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to test whitelist access",
			);
		},
	});

	const handleAddIp = () => {
		const trimmedIp = newIp.trim();
		if (!trimmedIp) {
			setIpError("IP address or domain is required");
			return;
		}

		try {
			WhitelistIPSchema.parse(trimmedIp);
			setIpError("");
			addMutation.mutate({
				ip: trimmedIp,
				type: ipType,
				enabled: true,
			});
		} catch (error: any) {
			if (error.errors && error.errors.length > 0) {
				setIpError(error.errors[0].message);
			} else if (error.message) {
				setIpError(error.message);
			} else {
				setIpError(
					"Invalid format. Enter an IP address (IPv4/IPv6), domain name, or wildcard domain (e.g., *.example.com)",
				);
			}
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="IP Whitelist Management"
			size="lg"
		>
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex space-x-2">
						<Input
							placeholder="192.168.1.1, example.com, or *.example.com"
							value={newIp}
							onChange={(e: any) => {
								setNewIp(e.target.value);
								if (ipError) setIpError(""); // Clear error on input
							}}
							onKeyDown={(e: any) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddIp();
								}
							}}
							error={ipError}
							className="flex-1"
						/>
						<select
							value={ipType}
							onChange={(e) =>
								setIpType(e.target.value as "agent" | "source" | "admin")
							}
							className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="source">Source</option>
							<option value="agent">Agent</option>
							<option value="admin">Admin</option>
						</select>
						<Button onClick={handleAddIp} loading={addMutation.isPending}>
							Add IP
						</Button>
					</div>
					<p className="text-xs text-gray-500">
						Add IP addresses or domains to whitelist. Supports wildcards like
						*.example.com
					</p>
				</div>

				<div className="flex justify-between items-center">
					<h4 className="font-medium">Current Whitelist</h4>
					{companyId && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => testMutation.mutate()}
							loading={testMutation.isPending}
						>
							Test Access
						</Button>
					)}
				</div>

				{isLoading ? (
					<Loader />
				) : (
					<div className="space-y-2">
						{filteredWhitelist && filteredWhitelist.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
												IP/Domain
											</th>
											<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
												Type
											</th>
											<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
												Status
											</th>
											<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredWhitelist.map((entry) => (
											<tr key={entry.id}>
												<td className="px-4 py-2">
													<span className="font-mono text-sm">{entry.ip}</span>
												</td>
												<td className="px-4 py-2">
													<Badge variant="info" size="sm">
														{entry.type}
													</Badge>
												</td>
												<td className="px-4 py-2">
													<Badge
														variant={entry.enabled ? "success" : "warning"}
														size="sm"
													>
														{entry.enabled ? "Enabled" : "Disabled"}
													</Badge>
												</td>
												<td className="px-4 py-2">
													<Button
														variant="danger"
														size="sm"
														onClick={() => removeMutation.mutate(entry.id)}
														loading={removeMutation.isPending}
													>
														Remove
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="text-center py-6">
								<p className="text-gray-500 mb-2">
									No IPs in whitelist for this type
								</p>
								<p className="text-xs text-gray-400">
									Add IP addresses, domains, or wildcard domains (e.g.,
									*.example.com) above
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
};

export default function Sources() {
	const [editingSource, setEditingSource] = useState<any>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED"
	>("ALL");
	const [approvalFilter, setApprovalFilter] = useState<
		"ALL" | "APPROVED" | "PENDING" | "REJECTED"
	>("ALL");
	const queryClient = useQueryClient();

	const {
		data: sources,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["sources"],
		queryFn: () => companiesApi.listSources(),
	});

	const { data: agreements } = useQuery({
		queryKey: ["agreements"],
		queryFn: () => agreementsApi.listAgreements(),
	});

	const filteredSources = React.useMemo(() => {
		if (!sources?.data) return [];
		return sources.data.filter((source) => {
			const matchesSearch =
				!searchQuery ||
				source.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				source.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				source.companyCode?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus =
				statusFilter === "ALL" || source.status === statusFilter;
			const matchesApproval =
				approvalFilter === "ALL" ||
				(approvalFilter === "APPROVED" &&
					source.approvalStatus === "APPROVED") ||
				(approvalFilter === "PENDING" &&
					(!source.approvalStatus || source.approvalStatus === "PENDING")) ||
				(approvalFilter === "REJECTED" && source.approvalStatus === "REJECTED");

			return matchesSearch && matchesStatus && matchesApproval;
		});
	}, [sources?.data, searchQuery, statusFilter, approvalFilter]);

	const healthCheckMutation = useMutation({
		mutationFn: (companyId: string) => companiesApi.runHealthCheck(companyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sources"] });
			toast.success("Health check completed");
		},
	});

	const resetHealthMutation = useMutation({
		mutationFn: (companyId: string) => companiesApi.resetHealth(companyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sources"] });
			toast.success("Health reset completed");
		},
	});

	const syncLocationsMutation = useMutation({
		mutationFn: (companyId: string) => companiesApi.syncLocations(companyId),
		onSuccess: () => {
			toast.success("Location sync completed");
		},
	});

	const importBranchesMutation = useMutation({
		mutationFn: (sourceId: string) => branchImportApi.importBranches(sourceId),
		onSuccess: (data, sourceId) => {
			queryClient.invalidateQueries({ queryKey: ["sources"] });
			toast.success(
				`Branches imported successfully: ${data.imported} new, ${data.updated} updated, ${data.total} total`,
				{
					duration: 5000,
					id: `import-branches-success-${sourceId}`, // Use ID to prevent duplicate toasts
				},
			);
		},
		onError: (error: any, sourceId: string) => {
			const errorData = error.response?.data;
			const errorCode = errorData?.error;
			const errorMessage = errorData?.message || "Failed to import branches";

			// Get source details for better error messages
			const source = sources?.data?.find((s: any) => s.id === sourceId);

			// Handle specific error codes with helpful messages
			let userMessage = errorMessage;
			if (errorCode === "NOT_APPROVED") {
				userMessage =
					"Source must be approved before importing branches. Please approve the source first.";
			} else if (errorCode === "EMAIL_NOT_VERIFIED") {
				userMessage =
					"Source email must be verified before importing branches.";
			} else if (errorCode === "HTTP_ENDPOINT_NOT_CONFIGURED") {
				userMessage =
					"Source HTTP endpoint must be configured before importing branches.";
			} else if (errorCode === "COMPANY_CODE_MISSING") {
				userMessage =
					"Source company code is missing. Please verify the source registration.";
			} else if (errorCode === "WHITELIST_VIOLATION") {
				userMessage =
					"Source endpoint is not whitelisted. Please add it to the IP whitelist first.";
			} else if (errorCode === "VALIDATION_FAILED") {
				const errorCount = errorData?.errors?.length || 0;
				userMessage = `${errorCount} branch(es) failed validation. Check the details below.`;
				// Show validation errors in console for debugging
				if (errorData?.errors) {
					console.error("Branch validation errors:", errorData.errors);
				}
			} else if (errorCode === "COMPANY_CODE_MISMATCH") {
				userMessage = `Company code mismatch: ${errorMessage}`;
			} else if (errorCode === "NO_BRANCHES") {
				userMessage =
					"No branches found in supplier response. Check supplier endpoint configuration.";
			} else if (errorCode === "TIMEOUT") {
				userMessage =
					"Supplier endpoint timeout after 30s. Check network connectivity and endpoint availability.";
			} else if (errorCode === "SUPPLIER_ERROR") {
				// Provide more helpful message for 404 errors
				if (errorMessage.includes("404")) {
					userMessage = `Supplier endpoint not found (404). Please verify the HTTP endpoint is correct and the supplier service is running.${source?.httpEndpoint ? ` Endpoint: ${source.httpEndpoint}` : " Endpoint not configured."}`;
				} else {
					userMessage = `Supplier endpoint error: ${errorMessage}. Please check the HTTP endpoint configuration and ensure the supplier service is accessible.${source?.httpEndpoint ? ` Endpoint: ${source.httpEndpoint}` : ""}`;
				}
			}

			toast.error(userMessage, {
				duration: 8000,
				id: `import-branches-${sourceId}`, // Use ID to prevent duplicate toasts
			});
		},
	});

	// Calculate stats - MUST be before any early returns to maintain hook order
	const sourceAgreementStats = React.useMemo(() => {
		const map: Record<
			string,
			{ total: number; live: number; pending: number; latest?: Agreement }
		> = {};
		(agreements?.data || []).forEach((agreement) => {
			if (!map[agreement.sourceId])
				map[agreement.sourceId] = { total: 0, live: 0, pending: 0 };
			map[agreement.sourceId].total += 1;
			if (agreement.status === "ACTIVE" || agreement.status === "ACCEPTED")
				map[agreement.sourceId].live += 1;
			if (agreement.status === "DRAFT" || agreement.status === "OFFERED")
				map[agreement.sourceId].pending += 1;
			if (
				!map[agreement.sourceId].latest ||
				new Date(agreement.createdAt).getTime() >
					new Date(map[agreement.sourceId].latest!.createdAt).getTime()
			) {
				map[agreement.sourceId].latest = agreement;
			}
		});
		return map;
	}, [agreements?.data]);

	const stats = React.useMemo(() => {
		if (!sources?.data)
			return {
				total: 0,
				active: 0,
				ready: 0,
				pending: 0,
				suspended: 0,
				activeAgreements: 0,
			};
		const total = sources.data.length;
		const active = sources.data.filter((s) => s.status === "ACTIVE").length;
		const ready = sources.data.filter((s) => {
			const isApproved = s.approvalStatus === "APPROVED";
			const isEmailVerified = s.emailVerified === true;
			const hasHttpEndpoint = !!s.httpEndpoint;
			const hasCompanyCode = !!s.companyCode;
			const isActive = s.status === "ACTIVE";
			return (
				isActive &&
				isApproved &&
				isEmailVerified &&
				hasHttpEndpoint &&
				hasCompanyCode
			);
		}).length;
		const pending = sources.data.filter(
			(s) => s.approvalStatus === "PENDING" || !s.approvalStatus,
		).length;
		const suspended = sources.data.filter(
			(s) => s.status === "SUSPENDED",
		).length;
		const activeAgreements = (agreements?.data || []).filter(
			(a) => a.status === "ACTIVE" || a.status === "ACCEPTED",
		).length;
		return { total, active, ready, pending, suspended, activeAgreements };
	}, [sources?.data, agreements?.data]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<section className="rounded-md border border-slate-200 bg-white p-6">
					<div className="flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Server className="h-5 w-5" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Source registry
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
								Sources
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

	const hasActiveFilters =
		Boolean(searchQuery.trim()) ||
		statusFilter !== "ALL" ||
		approvalFilter !== "ALL";
	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("ALL");
		setApprovalFilter("ALL");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
							Source registry
						</p>
						<div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-slate-950">
									Sources
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Manage supplier/source companies, integration readiness,
									branch import prerequisites, and agreement coverage.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									onClick={() =>
										queryClient.invalidateQueries({ queryKey: ["sources"] })
									}
									className="rounded-md border-slate-300 shadow-none"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
								<Button
									onClick={() => setIsAddModalOpen(true)}
									className="rounded-md shadow-none"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add source
								</Button>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Total sources
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.total}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Registered suppliers
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
									Available for routing
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Import ready
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.ready}
								</p>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Meets branch prerequisites
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Live agreements
								</p>
								<p className="mt-3 text-3xl font-semibold text-slate-950">
									{stats.activeAgreements}
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
									Readiness queue
								</h2>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Review approval, endpoint, and branch import status.
								</p>
							</div>
							<Badge
								variant={
									stats.pending > 0 || stats.suspended > 0
										? "warning"
										: "success"
								}
								size="sm"
							>
								{stats.pending + stats.suspended} items
							</Badge>
						</div>

						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-l-4 border-l-amber-500 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Pending approval
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Must be approved before imports.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.pending}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-emerald-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Import ready
										</p>
										<p className="mt-1 text-sm text-slate-500">
											HTTP endpoint, code, approval, and email ready.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.ready}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-red-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Suspended
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Not available for routing.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.suspended}
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
								<Server className="h-5 w-5" />
							</span>
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									Source directory
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Showing {filteredSources.length} of{" "}
									{sources?.data?.length || 0} sources
									{hasActiveFilters ? " after filters" : ""}.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="success">Ready {stats.ready}</Badge>
							<Badge variant="warning">Pending {stats.pending}</Badge>
							<Badge variant="default" className="bg-slate-100 text-slate-700">
								Active {stats.active}
							</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Search className="h-4 w-4 text-slate-500" />
								Filter sources
							</div>
							{hasActiveFilters && (
								<button
									type="button"
									onClick={clearFilters}
									className="text-sm font-semibold text-slate-600 hover:text-slate-950"
								>
									Clear filters
								</button>
							)}
						</div>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Name, email, company code"
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
							<Select
								label="Approval"
								value={approvalFilter}
								onChange={(e) => setApprovalFilter(e.target.value as any)}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All approvals" },
									{ value: "APPROVED", label: "Approved" },
									{ value: "PENDING", label: "Pending" },
									{ value: "REJECTED", label: "Rejected" },
								]}
							/>
						</div>
					</div>
				</div>

				<div className="p-0">
					{error ? (
						<div className="p-5">
							<ErrorDisplay error={error} title="Failed to load sources" />
						</div>
					) : filteredSources.length === 0 ? (
						<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
								<Server className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-950">
								No sources found
							</h3>
							<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
								{hasActiveFilters
									? "Try clearing filters or searching with another source name, email, or company code."
									: "Add the first source company to begin supplier onboarding."}
							</p>
							<div className="mt-5 flex flex-wrap justify-center gap-2">
								{hasActiveFilters && (
									<Button
										variant="secondary"
										onClick={clearFilters}
										className="rounded-md shadow-none"
									>
										<X className="mr-2 h-4 w-4" />
										Clear filters
									</Button>
								)}
								{!hasActiveFilters && (
									<Button
										onClick={() => setIsAddModalOpen(true)}
										className="rounded-md shadow-none"
									>
										<Plus className="mr-2 h-4 w-4" />
										Add source
									</Button>
								)}
							</div>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Source
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Readiness
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Endpoints
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Agreements
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Status
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{filteredSources.map((source) => {
										const isApproved = source.approvalStatus === "APPROVED";
										const isEmailVerified = source.emailVerified === true;
										const hasHttpEndpoint = !!source.httpEndpoint;
										const hasCompanyCode = !!source.companyCode;
										const isActive = source.status === "ACTIVE";
										const canImportBranches =
											isActive &&
											isApproved &&
											isEmailVerified &&
											hasHttpEndpoint &&
											hasCompanyCode;
										const missingRequirements: string[] = [];
										if (!isActive) missingRequirements.push("active status");
										if (!isApproved) missingRequirements.push("approval");
										if (!isEmailVerified)
											missingRequirements.push("verified email");
										if (!hasHttpEndpoint)
											missingRequirements.push("HTTP endpoint");
										if (!hasCompanyCode)
											missingRequirements.push("company code");
										const agreementStats = sourceAgreementStats[source.id] || {
											total: 0,
											live: 0,
											pending: 0,
										};

										return (
											<tr
												key={source.id}
												className="transition hover:bg-slate-50"
											>
												<td className="px-5 py-4 align-top">
													<div className="flex items-start gap-3">
														<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
															<Server className="h-5 w-5" />
														</span>
														<div className="min-w-0">
															<p className="max-w-xs truncate text-sm font-semibold text-slate-950">
																{source.companyName}
															</p>
															<p className="mt-1 max-w-xs truncate text-sm text-slate-500">
																{source.email}
															</p>
															{source.companyCode && (
																<code className="mt-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
																	{source.companyCode}
																</code>
															)}
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													{canImportBranches ? (
														<div className="space-y-2">
															<Badge variant="success" size="sm">
																<CheckCircle className="mr-1 h-3.5 w-3.5" />
																Ready
															</Badge>
															<p className="text-xs text-slate-500">
																All import prerequisites met
															</p>
														</div>
													) : (
														<div className="max-w-xs space-y-2">
															<Badge variant="warning" size="sm">
																<AlertCircle className="mr-1 h-3.5 w-3.5" />
																Not ready
															</Badge>
															<p className="text-xs leading-5 text-slate-500">
																Missing: {missingRequirements.join(", ")}
															</p>
														</div>
													)}
												</td>
												<td className="px-5 py-4 align-top">
													<div className="max-w-xs space-y-2">
														{source.httpEndpoint ? (
															<div className="flex items-start gap-2">
																<Badge variant="info" size="sm">
																	HTTP
																</Badge>
																<code
																	className="truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
																	title={source.httpEndpoint}
																>
																	{source.httpEndpoint}
																</code>
															</div>
														) : (
															<div className="flex items-center gap-2 text-xs text-slate-500">
																<Badge variant="warning" size="sm">
																	HTTP
																</Badge>
																Not configured
															</div>
														)}
														{source.grpcEndpoint && (
															<div className="flex items-start gap-2">
																<Badge variant="info" size="sm">
																	gRPC
																</Badge>
																<code
																	className="truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
																	title={source.grpcEndpoint}
																>
																	{source.grpcEndpoint}
																</code>
															</div>
														)}
														{source.adapterType === "mock" && (
															<Badge variant="danger" size="sm">
																<AlertTriangle className="mr-1 h-3.5 w-3.5" />
																Mock adapter
															</Badge>
														)}
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="space-y-2">
														<p className="text-sm font-semibold text-slate-950">
															{agreementStats.total} total
														</p>
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
													<div className="space-y-2">
														<Badge
															variant={
																source.status === "ACTIVE"
																	? "success"
																	: source.status === "SUSPENDED"
																		? "danger"
																		: "warning"
															}
														>
															{source.status === "PENDING_VERIFICATION"
																? "Pending verification"
																: source.status}
														</Badge>
														<Badge
															variant={
																source.approvalStatus === "APPROVED"
																	? "success"
																	: source.approvalStatus === "REJECTED"
																		? "danger"
																		: "warning"
															}
															size="sm"
														>
															{source.approvalStatus || "PENDING"}
														</Badge>
														<div className="text-xs text-slate-500">
															Email{" "}
															{source.emailVerified
																? "verified"
																: "not verified"}
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="flex flex-wrap justify-end gap-2">
														<Button
															size="sm"
															variant="ghost"
															onClick={() => setEditingSource(source)}
															title="Edit source"
															className="rounded-md border border-slate-200 px-2"
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																healthCheckMutation.mutate(source.id)
															}
															loading={healthCheckMutation.isPending}
															title="Run health check"
															className="rounded-md border border-slate-200 px-2"
														>
															<Play className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																resetHealthMutation.mutate(source.id)
															}
															loading={resetHealthMutation.isPending}
															title="Reset health"
															className="rounded-md border border-slate-200 px-2"
														>
															<RefreshCw className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																syncLocationsMutation.mutate(source.id)
															}
															loading={syncLocationsMutation.isPending}
															title="Sync locations"
															className="rounded-md border border-slate-200 px-2"
														>
															<MapPin className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="secondary"
															onClick={() => {
																if (!canImportBranches) {
																	toast.error(
																		`Cannot import branches. Missing: ${missingRequirements.join(", ")}`,
																	);
																	return;
																}
																importBranchesMutation.mutate(source.id);
															}}
															loading={importBranchesMutation.isPending}
															disabled={!canImportBranches}
															title={
																canImportBranches
																	? "Import branches from supplier endpoint"
																	: `Cannot import branches. Missing: ${missingRequirements.join(", ")}`
															}
															className="rounded-md shadow-none"
														>
															<Download className="mr-1 h-4 w-4" />
															Import
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

			<EditSourceModal
				source={editingSource}
				isOpen={!!editingSource}
				onClose={() => setEditingSource(null)}
			/>

			<AddSourceModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSuccess={() => {
					queryClient.invalidateQueries({ queryKey: ["sources"] });
				}}
			/>
		</div>
	);
}
