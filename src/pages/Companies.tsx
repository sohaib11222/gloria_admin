import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Download,
	Building2,
	RefreshCw,
	Plus,
	Search,
	Filter,
	Users,
	CheckCircle,
	Clock,
	XCircle,
	MoreVertical,
	Eye,
	Edit,
	Check,
	X,
	Trash2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Loader } from "../components/ui/Loader";
import { companiesApi, Company } from "../api/companies";
import { branchImportApi } from "../api/whitelist";
import { formatDate } from "../lib/utils";
import { uploadsPublicUrl } from "../lib/uploadsPublicUrl";
import toast from "react-hot-toast";

function companyStatusLabelAdmin(status: string): string {
	if (status === "ACTIVE") return "Active";
	if (status === "PENDING_VERIFICATION") return "Pending verification";
	if (status === "SUSPENDED") return "Suspended";
	return status;
}

function approvalStatusLabelAdmin(status?: string): string {
	if (status === "APPROVED") return "Approved";
	if (status === "REJECTED") return "Rejected";
	return "Pending";
}

function companyTypeLabelAdmin(type: string): string {
	if (type === "SOURCE") return "Source";
	if (type === "AGENT") return "Agent";
	return type;
}

function companyStatusVariant(
	status?: string,
): "default" | "success" | "warning" | "danger" | "info" {
	if (status === "ACTIVE") return "success";
	if (status === "PENDING_VERIFICATION") return "warning";
	if (status === "SUSPENDED") return "danger";
	return "default";
}

function approvalStatusVariant(
	status?: string,
): "default" | "success" | "warning" | "danger" | "info" {
	if (status === "APPROVED") return "success";
	if (status === "REJECTED") return "danger";
	return "warning";
}

function typeVariant(
	type?: string,
): "default" | "success" | "warning" | "danger" | "info" {
	return type === "SOURCE" ? "info" : "default";
}

interface CompanyDetailModalProps {
	company: Company | null;
	isOpen: boolean;
	onClose: () => void;
}

interface CompanyFormModalProps {
	company: Company | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
}

const getInitialFormData = () => ({
	companyName: "",
	email: "",
	type: "AGENT" as "AGENT" | "SOURCE",
	password: "",
	adapterType: "" as "" | "grpc" | "http",
	grpcEndpoint: "",
	httpEndpoint: "",
	companyCode: "",
	registrationBranchName: "",
	companyAddress: "",
	companyWebsiteUrl: "",
	billingCountryCode: "",
	status: "ACTIVE" as "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED",
});

const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
	company,
	isOpen,
	onClose,
	onSave,
}) => {
	const [formData, setFormData] = useState(getInitialFormData);
	const [registrationPhotoDataUrl, setRegistrationPhotoDataUrl] = useState<
		string | null
	>(null);
	const [registrationPhotoName, setRegistrationPhotoName] = useState<
		string | null
	>(null);
	const [removeRegistrationPhoto, setRemoveRegistrationPhoto] = useState(false);
	const registrationPhotoInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const clearPhotoDraft = () => {
			setRegistrationPhotoDataUrl(null);
			setRegistrationPhotoName(null);
			setRemoveRegistrationPhoto(false);
			if (registrationPhotoInputRef.current) {
				registrationPhotoInputRef.current.value = "";
			}
		};

		if (isOpen) {
			clearPhotoDraft();
			if (company) {
				// Edit mode: populate with company data
				setFormData({
					companyName: company.companyName || "",
					email: company.email || "",
					type: company.type || "AGENT",
					password: "",
					adapterType:
						company.adapterType === "grpc" || company.adapterType === "http"
							? company.adapterType
							: "",
					grpcEndpoint: company.grpcEndpoint || "",
					httpEndpoint: company.httpEndpoint || "",
					companyCode: company.companyCode || "",
					registrationBranchName: company.registrationBranchName || "",
					companyAddress: company.companyAddress || "",
					companyWebsiteUrl: company.companyWebsiteUrl || "",
					billingCountryCode: (company as any).billingCountryCode || "",
					status: company.status || "ACTIVE",
				});
			} else {
				// Create mode: reset to empty defaults
				setFormData(getInitialFormData());
			}
		} else {
			// Reset form when modal closes
			setFormData(getInitialFormData());
			clearPhotoDraft();
		}
	}, [company, isOpen]);

	const createMutation = useMutation({
		mutationFn: (data: any) => companiesApi.createCompany(data),
		onSuccess: () => {
			toast.success("Company created successfully");
			onSave();
			onClose();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to create company");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			companiesApi.updateCompanyDetails(id, data),
		onSuccess: () => {
			toast.success("Company updated successfully");
			onSave();
			onClose();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to update company");
		},
	});

	const handleRegistrationPhotoChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) {
			setRegistrationPhotoDataUrl(null);
			setRegistrationPhotoName(null);
			return;
		}

		const maxBytes = 2 * 1024 * 1024;
		if (file.size > maxBytes) {
			toast.error("Image must be 2 MB or smaller.");
			e.target.value = "";
			setRegistrationPhotoDataUrl(null);
			setRegistrationPhotoName(null);
			return;
		}

		const reader = new FileReader();
		reader.onerror = () => {
			toast.error("Could not read this image. Try another file.");
			e.target.value = "";
			setRegistrationPhotoDataUrl(null);
			setRegistrationPhotoName(null);
		};
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") {
				setRegistrationPhotoDataUrl(result);
				setRegistrationPhotoName(file.name);
				setRemoveRegistrationPhoto(false);
			}
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formData.companyName ||
			!formData.email ||
			(!company && !formData.password)
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (formData.type === "SOURCE") {
			if (
				!formData.registrationBranchName.trim() ||
				!formData.companyAddress.trim() ||
				!formData.companyWebsiteUrl.trim()
			) {
				toast.error(
					"Please add the source registration branch, address, and website.",
				);
				return;
			}

			try {
				new URL(formData.companyWebsiteUrl.trim());
			} catch {
				toast.error("Enter a valid company website URL including https://");
				return;
			}
		}

		const dataToSend: any = {
			companyName: formData.companyName.trim(),
			email: formData.email.trim(),
			type: formData.type,
			status: formData.status,
		};

		if (formData.type === "SOURCE") {
			dataToSend.adapterType = formData.adapterType || null;
			dataToSend.grpcEndpoint = formData.grpcEndpoint.trim() || null;
			dataToSend.httpEndpoint = formData.httpEndpoint.trim() || null;
			dataToSend.companyCode = formData.companyCode.trim() || null;
			dataToSend.registrationBranchName =
				formData.registrationBranchName.trim() || null;
			dataToSend.companyAddress = formData.companyAddress.trim() || null;
			dataToSend.companyWebsiteUrl = formData.companyWebsiteUrl.trim() || null;
			if (registrationPhotoDataUrl) {
				dataToSend.registrationPhotoDataUrl = registrationPhotoDataUrl;
			}
			if (company && removeRegistrationPhoto && !registrationPhotoDataUrl) {
				dataToSend.removeRegistrationPhoto = true;
			}
		}

		if (formData.password) {
			dataToSend.password = formData.password;
		}

		if (formData.type === "AGENT") {
			dataToSend.billingCountryCode =
				formData.billingCountryCode.trim() || null;
		}

		if (company) {
			updateMutation.mutate({ id: company.id, data: dataToSend });
		} else {
			createMutation.mutate(dataToSend);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={company ? "Edit Company" : "Create Company"}
			size="xl"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Company Name"
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

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Type
						</label>
						<select
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={formData.type}
							onChange={(e) =>
								setFormData({ ...formData, type: e.target.value as any })
							}
						>
							<option value="AGENT">Agent</option>
							<option value="SOURCE">Source</option>
						</select>
					</div>
					<Input
						label="Password"
						type="password"
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						required={!company}
						helperText={
							company ? "Leave blank to keep current password" : undefined
						}
					/>
				</div>

				{formData.type === "SOURCE" && (
					<>
						<div className="grid grid-cols-1 gap-4">
							<Input
								label="Primary branch name (registration)"
								placeholder="Main depot / HQ branch"
								value={formData.registrationBranchName}
								onChange={(e) =>
									setFormData({
										...formData,
										registrationBranchName: e.target.value,
									})
								}
								required
								helperText="Main branch or office name captured during source registration."
							/>
							<Input
								label="Company address"
								placeholder="Street, city, postal code, country"
								value={formData.companyAddress}
								onChange={(e) =>
									setFormData({ ...formData, companyAddress: e.target.value })
								}
								required
							/>
							<Input
								label="Company website URL"
								placeholder="https://www.example.com"
								type="url"
								value={formData.companyWebsiteUrl}
								onChange={(e) =>
									setFormData({
										...formData,
										companyWebsiteUrl: e.target.value,
									})
								}
								required
								helperText="Public website URL; include https://."
							/>
							<div className="rounded border border-slate-200 bg-slate-50 p-4">
								<label className="block text-sm font-medium text-gray-700">
									Registration photo
									<span className="ml-1 font-normal text-gray-500">
										(optional)
									</span>
								</label>
								<input
									ref={registrationPhotoInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50"
									onChange={handleRegistrationPhotoChange}
								/>
								<p className="mt-1 text-xs text-gray-500">
									JPEG, PNG, or WebP up to 2 MB. Used as the registration review
									photo.
								</p>
								{registrationPhotoDataUrl && (
									<div className="mt-3 rounded border border-slate-200 bg-white p-3">
										<div className="flex items-center justify-between gap-3">
											<p
												className="min-w-0 flex-1 truncate text-xs text-gray-700"
												title={registrationPhotoName ?? undefined}
											>
												{registrationPhotoName
													? `Selected: ${registrationPhotoName}`
													: "Selected registration photo"}
											</p>
											<button
												type="button"
												className="text-xs font-medium text-slate-700 underline hover:text-slate-900"
												onClick={() => {
													setRegistrationPhotoDataUrl(null);
													setRegistrationPhotoName(null);
													if (registrationPhotoInputRef.current) {
														registrationPhotoInputRef.current.value = "";
													}
												}}
											>
												Remove
											</button>
										</div>
										<img
											src={registrationPhotoDataUrl}
											alt="Registration photo preview"
											className="mt-3 max-h-40 rounded border border-slate-200 bg-white object-contain p-2"
										/>
									</div>
								)}
								{company?.registrationPhotoUrl &&
									!registrationPhotoDataUrl &&
									!removeRegistrationPhoto && (
										<div className="mt-3 flex items-center gap-3 rounded border border-slate-200 bg-white p-3">
											<img
												src={
													uploadsPublicUrl(company.registrationPhotoUrl) ??
													undefined
												}
												alt="Current registration"
												className="h-16 w-16 rounded border border-slate-200 object-cover"
											/>
											<div className="min-w-0 flex-1">
												<a
													href={
														uploadsPublicUrl(company.registrationPhotoUrl) ??
														"#"
													}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm font-medium text-blue-700 hover:underline"
												>
													View current photo
												</a>
												<p className="text-xs text-gray-500">
													Upload a new file to replace it.
												</p>
											</div>
											<button
												type="button"
												className="text-xs font-medium text-red-600 underline hover:text-red-700"
												onClick={() => setRemoveRegistrationPhoto(true)}
											>
												Remove
											</button>
										</div>
									)}
								{removeRegistrationPhoto && !registrationPhotoDataUrl && (
									<div className="mt-3 flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
										<span>Current registration photo will be removed.</span>
										<button
											type="button"
											className="text-xs font-semibold underline"
											onClick={() => setRemoveRegistrationPhoto(false)}
										>
											Undo
										</button>
									</div>
								)}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Adapter Type
								</label>
								<select
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={formData.adapterType}
									onChange={(e) =>
										setFormData({
											...formData,
											adapterType: e.target.value as any,
										})
									}
								>
									<option value="grpc">gRPC</option>
									<option value="http">HTTP</option>
								</select>
							</div>
							<Input
								label="Company Code"
								placeholder="CMP00023"
								value={formData.companyCode}
								onChange={(e) =>
									setFormData({ ...formData, companyCode: e.target.value })
								}
								helperText="Required for branch import (e.g., CMP00023)"
								required={formData.type === "SOURCE"}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="gRPC Endpoint"
								placeholder="localhost:51062"
								value={formData.grpcEndpoint}
								onChange={(e) =>
									setFormData({ ...formData, grpcEndpoint: e.target.value })
								}
								helperText="Format: host:port"
							/>
							<Input
								label="HTTP Endpoint"
								placeholder="https://api.example.com/locations"
								value={formData.httpEndpoint}
								onChange={(e) =>
									setFormData({ ...formData, httpEndpoint: e.target.value })
								}
								helperText="Required for branch import"
							/>
						</div>
					</>
				)}

				{formData.type === "AGENT" && (
					<Input
						label="Billing country (ISO 3166-1 alpha-2)"
						placeholder="e.g. US, IN"
						value={formData.billingCountryCode}
						onChange={(e) =>
							setFormData({
								...formData,
								billingCountryCode: e.target.value.toUpperCase().slice(0, 2),
							})
						}
						helperText="Used for agent plan pricing. Leave blank for default."
					/>
				)}

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Status
					</label>
					<select
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={formData.status}
						onChange={(e) =>
							setFormData({ ...formData, status: e.target.value as any })
						}
					>
						<option value="ACTIVE">Active</option>
						<option value="PENDING_VERIFICATION">Pending Verification</option>
						<option value="SUSPENDED">Suspended</option>
					</select>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose} type="button">
						Cancel
					</Button>
					<Button
						type="submit"
						loading={createMutation.isPending || updateMutation.isPending}
					>
						{company ? "Update" : "Create"}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
	company,
	isOpen,
	onClose,
}) => {
	if (!company) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`Company Details - ${company.companyName}`}
			size="lg"
		>
			<div className="space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="text-sm font-medium text-gray-700">
							Company Name
						</label>
						<p className="text-sm text-gray-900">{company.companyName}</p>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Email</label>
						<p className="text-sm text-gray-900">{company.email}</p>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Type</label>
						<p className="text-sm text-gray-900">{company.type}</p>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">Status</label>
						<Badge
							variant={
								company.status === "ACTIVE"
									? "success"
									: company.status === "PENDING_VERIFICATION"
										? "warning"
										: "danger"
							}
						>
							{company.status}
						</Badge>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Approval Status
						</label>
						<Badge
							variant={
								company.approvalStatus === "APPROVED"
									? "success"
									: company.approvalStatus === "REJECTED"
										? "danger"
										: "warning"
							}
						>
							{company.approvalStatus || "PENDING"}
						</Badge>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Email Verified
						</label>
						<Badge variant={company.emailVerified ? "success" : "warning"}>
							{company.emailVerified ? "Yes" : "No"}
						</Badge>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Adapter Type
						</label>
						<p className="text-sm text-gray-900">
							{company.adapterType || "N/A"}
						</p>
					</div>
					{company.type === "SOURCE" && (
						<>
							<div className="col-span-2 border-t border-gray-100 pt-4 mt-1">
								<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
									Registration profile
								</h4>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Primary branch name
								</label>
								<p className="text-sm text-gray-900">
									{company.registrationBranchName || "—"}
								</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Company website
								</label>
								{company.companyWebsiteUrl ? (
									<a
										href={company.companyWebsiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline break-all"
									>
										{company.companyWebsiteUrl}
									</a>
								) : (
									<p className="text-sm text-gray-900">—</p>
								)}
							</div>
							<div className="col-span-2">
								<label className="text-sm font-medium text-gray-700">
									Company address
								</label>
								<p className="text-sm text-gray-900 whitespace-pre-wrap">
									{company.companyAddress || "—"}
								</p>
							</div>
							<div className="col-span-2">
								<label className="text-sm font-medium text-gray-700">
									Registration photo
								</label>
								{company.registrationPhotoUrl ? (
									<a
										href={uploadsPublicUrl(company.registrationPhotoUrl) ?? "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-2 inline-block"
									>
										<img
											src={
												uploadsPublicUrl(company.registrationPhotoUrl) ??
												undefined
											}
											alt="Registration upload"
											className="max-h-48 max-w-full rounded border border-gray-200 object-contain bg-gray-50"
										/>
									</a>
								) : (
									<p className="text-sm text-gray-900 mt-1">—</p>
								)}
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Company Code
								</label>
								<p className="text-sm text-gray-900 font-mono">
									{company.companyCode || "Not set"}
								</p>
								{!company.companyCode && (
									<p className="text-xs text-red-600 mt-1">
										Required for branch import
									</p>
								)}
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									HTTP Endpoint
								</label>
								<p className="text-sm text-gray-900 break-all">
									{company.httpEndpoint || "Not configured"}
								</p>
								{!company.httpEndpoint && (
									<p className="text-xs text-red-600 mt-1">
										Required for branch import
									</p>
								)}
							</div>
						</>
					)}
					<div>
						<label className="text-sm font-medium text-gray-700">
							gRPC Endpoint
						</label>
						<p className="text-sm text-gray-900">
							{company.grpcEndpoint || "Not configured"}
						</p>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Created At
						</label>
						<p className="text-sm text-gray-900">
							{formatDate(company.createdAt)}
						</p>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Updated At
						</label>
						<p className="text-sm text-gray-900">
							{formatDate(company.updatedAt)}
						</p>
					</div>
				</div>

				{company.users && company.users.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">Users</h4>
						<div className="space-y-2">
							{company.users.map((user) => (
								<div key={user.id} className="p-3 bg-gray-50 rounded-lg">
									<div className="flex justify-between items-center">
										<div>
											<p className="text-sm font-medium text-gray-900">
												{user.email}
											</p>
											<p className="text-xs text-gray-500">Role: {user.role}</p>
										</div>
										<div className="text-xs text-gray-500">
											Created: {formatDate(user.createdAt)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{company.agentAgreements && company.agentAgreements.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Agent Agreements
						</h4>
						<p className="text-sm text-gray-600">
							{company.agentAgreements.length} agreement(s)
						</p>
					</div>
				)}

				{company.sourceAgreements && company.sourceAgreements.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Source Agreements
						</h4>
						<p className="text-sm text-gray-600">
							{company.sourceAgreements.length} agreement(s)
						</p>
					</div>
				)}

				{company.sourceLocations && company.sourceLocations.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Source Locations
						</h4>
						<p className="text-sm text-gray-600">
							{company.sourceLocations.length} location(s)
						</p>
					</div>
				)}
			</div>
		</Modal>
	);
};

export default function Companies() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
	const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
	const [highlightCompanyId, setHighlightCompanyId] = useState<string | null>(
		null,
	);
	const [filterType, setFilterType] = useState<"ALL" | "SOURCE" | "AGENT">(
		"ALL",
	);
	const [filterStatus, setFilterStatus] = useState<
		"ALL" | "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED"
	>("ALL");
	const [filterApproval, setFilterApproval] = useState<
		"ALL" | "PENDING" | "APPROVED" | "REJECTED"
	>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [statusChangeModal, setStatusChangeModal] = useState<{
		company: Company;
		previousStatus: Company["status"];
		nextStatus: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
	} | null>(null);
	const [statusNotifyMessage, setStatusNotifyMessage] = useState("");
	const [statusNotifyByEmail, setStatusNotifyByEmail] = useState(true);

	// Read initial filter values from URL query parameters
	useEffect(() => {
		const statusParam = searchParams.get("status");
		const highlightParam = searchParams.get("highlight");

		if (
			statusParam &&
			["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"].includes(statusParam)
		) {
			setFilterStatus(
				statusParam as "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED",
			);
		}

		if (highlightParam) {
			setHighlightCompanyId(highlightParam);
			// Clear highlight after 3 seconds
			setTimeout(() => {
				setHighlightCompanyId(null);
				// Remove highlight from URL
				const newParams = new URLSearchParams(searchParams);
				newParams.delete("highlight");
				setSearchParams(newParams, { replace: true });
			}, 3000);
		}
	}, [searchParams, setSearchParams]);

	const queryClient = useQueryClient();

	const { data: companies, isLoading } = useQuery({
		queryKey: ["companies"],
		queryFn: () => companiesApi.listCompanies(),
	});

	const updateStatusMutation = useMutation({
		mutationFn: ({
			id,
			status,
			notifyMessage,
			notifyByEmail,
		}: {
			id: string;
			status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
			notifyMessage?: string;
			notifyByEmail: boolean;
		}) =>
			companiesApi.updateCompanyStatus(id, status, {
				notifyMessage,
				notifyByEmail,
			}),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			setStatusChangeModal(null);
			setStatusNotifyMessage("");
			setStatusNotifyByEmail(true);
			toast.success("Company status updated successfully.");
			if (variables.notifyByEmail) {
				if (data.emailSent) {
					if (data.emailError) {
						toast.success(`Status updated. ${data.emailError}`, {
							duration: 7000,
						});
					} else {
						toast.success("Notification email sent to company contacts.", {
							duration: 4500,
						});
					}
				} else {
					toast.error(
						data.emailError ||
							"Status saved, but the notification email could not be sent. Check SMTP / mail API configuration.",
						{ duration: 7000 },
					);
				}
			}
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to update company status",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => companiesApi.deleteCompany(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			toast.success("Company deleted successfully");
			setCompanyToDelete(null);
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to delete company");
		},
	});

	const approveMutation = useMutation({
		mutationFn: (id: string) => companiesApi.approveCompany(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			toast.success("Company approved and email verified successfully");
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message || "Failed to approve company";
			toast.error(errorMessage);
		},
	});

	const rejectMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			companiesApi.rejectCompany(id, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			toast.success("Company rejected successfully");
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to reject company");
		},
	});

	const importBranchesMutation = useMutation({
		mutationFn: (sourceId: string) => branchImportApi.importBranches(sourceId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
			toast.success(
				`Branches imported successfully: ${data.imported} new, ${data.updated} updated, ${data.total} total`,
				{ duration: 5000 },
			);
		},
		onError: (error: any) => {
			const errorData = error.response?.data;
			const errorCode = errorData?.error;
			const errorMessage = errorData?.message || "Failed to import branches";

			// Handle specific error codes with helpful messages
			let userMessage = errorMessage;
			if (errorCode === "NOT_APPROVED") {
				userMessage =
					'Source must be approved before importing branches. Click the "Approve" button next to the source to approve it first.';
			} else if (errorCode === "EMAIL_NOT_VERIFIED") {
				userMessage =
					"Source email must be verified before importing branches.";
			} else if (errorCode === "HTTP_ENDPOINT_NOT_CONFIGURED") {
				userMessage =
					"Source HTTP endpoint must be configured before importing branches.";
			} else if (errorCode === "COMPANY_CODE_MISSING") {
				userMessage =
					"Source company code is missing. Please set it in the Edit form.";
			} else if (errorCode === "COMPANY_CODE_MISMATCH") {
				const expectedCode = errorData?.message?.match(
					/Expected CompanyCode (.+?),/,
				)?.[1];
				const gotCode = errorData?.message?.match(/got (.+)$/)?.[1];
				userMessage = `CompanyCode mismatch: Source has "${expectedCode || "unknown"}" but branches have "${gotCode || "unknown"}". Please update the source's Company Code to match the branch data.`;
			} else if (errorCode === "VALIDATION_FAILED") {
				const errorCount = errorData?.errors?.length || 0;
				const firstError = errorData?.errors?.[0]?.error?.error;
				if (firstError === "CompanyCode mismatch") {
					userMessage = `${errorCount} branch(es) have CompanyCode mismatch. The CompanyCode in each branch must match the source's Company Code. Please check the source's Company Code in the Edit form.`;
				} else {
					userMessage = `${errorCount} branch(es) failed validation: ${firstError || "See details below"}`;
				}
				// Show validation errors in console for debugging
				if (errorData?.errors) {
					console.error("Branch validation errors:", errorData.errors);
				}
			} else if (errorCode === "WHITELIST_VIOLATION") {
				userMessage =
					"Source endpoint is not whitelisted. Please add it to the IP whitelist first.";
			} else if (errorCode === "NO_BRANCHES") {
				userMessage =
					"No branches found in supplier response. Check supplier endpoint configuration.";
			} else if (errorCode === "TIMEOUT") {
				userMessage =
					"Supplier endpoint timeout after 30s. Check network connectivity and endpoint availability.";
			} else if (errorCode === "SUPPLIER_ERROR") {
				userMessage = `Supplier endpoint error: ${errorMessage}`;
			}

			toast.error(userMessage, { duration: 6000 });
		},
	});

	const openStatusChangeModal = (
		company: Company,
		nextStatus: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED",
	) => {
		if (nextStatus === company.status) return;
		setStatusNotifyMessage("");
		setStatusNotifyByEmail(true);
		setStatusChangeModal({
			company,
			previousStatus: company.status,
			nextStatus,
		});
	};

	const handleCompanyClick = (company: Company) => {
		setSelectedCompany(company);
		setIsDetailModalOpen(true);
	};

	const handleEditClick = (company: Company) => {
		setCompanyToEdit(company);
		setIsEditModalOpen(true);
	};

	const handleDeleteClick = (company: Company) => {
		setCompanyToDelete(company);
	};

	const confirmDelete = () => {
		if (companyToDelete) {
			deleteMutation.mutate(companyToDelete.id);
		}
	};

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["companies"] });
	};

	const filteredCompanies =
		companies?.data?.filter((company) => {
			const typeMatch = filterType === "ALL" || company.type === filterType;
			const statusMatch =
				filterStatus === "ALL" || company.status === filterStatus;
			const approval = company.approvalStatus || "PENDING";
			const approvalMatch =
				filterApproval === "ALL" || approval === filterApproval;
			const query = searchQuery.trim().toLowerCase();
			const searchMatch =
				!query ||
				company.companyName?.toLowerCase().includes(query) ||
				company.email?.toLowerCase().includes(query) ||
				company.companyCode?.toLowerCase().includes(query);
			return typeMatch && statusMatch && approvalMatch && searchMatch;
		}) || [];

	if (isLoading) {
		return (
			<div className="space-y-6">
				<section className="rounded-md border border-slate-200 bg-white p-6">
					<div className="flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Building2 className="h-5 w-5" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Company registry
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
								Companies
							</h1>
						</div>
					</div>
				</section>
				<section className="flex min-h-72 items-center justify-center rounded-md border border-slate-200 bg-white p-8">
					<div className="text-center">
						<Loader className="mx-auto" />
						<p className="mt-4 text-sm font-medium text-slate-700">
							Loading companies...
						</p>
					</div>
				</section>
			</div>
		);
	}

	const allCompanies = companies?.data || [];
	const stats = {
		total: allCompanies.length,
		sources: allCompanies.filter((c) => c.type === "SOURCE").length,
		agents: allCompanies.filter((c) => c.type === "AGENT").length,
		active: allCompanies.filter((c) => c.status === "ACTIVE").length,
		pending: allCompanies.filter((c) => c.status === "PENDING_VERIFICATION")
			.length,
		suspended: allCompanies.filter((c) => c.status === "SUSPENDED").length,
		pendingApproval: allCompanies.filter(
			(c) => c.approvalStatus === "PENDING" || !c.approvalStatus,
		).length,
		approved: allCompanies.filter((c) => c.approvalStatus === "APPROVED")
			.length,
		rejected: allCompanies.filter((c) => c.approvalStatus === "REJECTED")
			.length,
	};

	const filtersApplied =
		Boolean(searchQuery.trim()) ||
		filterType !== "ALL" ||
		filterStatus !== "ALL" ||
		filterApproval !== "ALL";
	const sourceReadyForImport = allCompanies.filter(
		(c) =>
			c.type === "SOURCE" &&
			c.status === "ACTIVE" &&
			c.approvalStatus === "APPROVED",
	).length;
	const reviewQueueCount =
		stats.pendingApproval + stats.pending + stats.suspended + stats.rejected;

	const clearFilters = () => {
		setSearchQuery("");
		setFilterType("ALL");
		setFilterStatus("ALL");
		setFilterApproval("ALL");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
							Company registry
						</p>
						<div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-slate-950">
									Companies
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Manage sources and agents, verify approvals, update account
									status, and review integration readiness.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									onClick={handleRefresh}
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
									Create company
								</Button>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<div className="rounded-md border border-slate-200 bg-white p-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Total companies
										</p>
										<p className="mt-3 text-3xl font-semibold text-slate-950">
											{stats.total}
										</p>
									</div>
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<Users className="h-5 w-5" />
									</span>
								</div>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									{stats.sources} sources · {stats.agents} agents
								</p>
							</div>

							<div className="rounded-md border border-slate-200 bg-white p-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Active accounts
										</p>
										<p className="mt-3 text-3xl font-semibold text-slate-950">
											{stats.active}
										</p>
									</div>
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<CheckCircle className="h-5 w-5" />
									</span>
								</div>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Ready for platform access
								</p>
							</div>

							<div className="rounded-md border border-slate-200 bg-white p-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Pending approval
										</p>
										<p className="mt-3 text-3xl font-semibold text-slate-950">
											{stats.pendingApproval}
										</p>
									</div>
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<Clock className="h-5 w-5" />
									</span>
								</div>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Requires admin decision
								</p>
							</div>

							<div className="rounded-md border border-slate-200 bg-white p-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Suspended
										</p>
										<p className="mt-3 text-3xl font-semibold text-slate-950">
											{stats.suspended}
										</p>
									</div>
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<XCircle className="h-5 w-5" />
									</span>
								</div>
								<p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
									Access restricted
								</p>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-slate-950">
									Review queue
								</h2>
								<p className="mt-1 text-sm leading-5 text-slate-500">
									Important company states that may need follow-up.
								</p>
							</div>
							<Badge
								variant={reviewQueueCount > 0 ? "warning" : "success"}
								size="sm"
							>
								{reviewQueueCount} items
							</Badge>
						</div>

						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-l-4 border-l-amber-500 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Approval pending
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Companies waiting for approve/reject.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.pendingApproval}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-blue-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Sources ready to import
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Approved active sources.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{sourceReadyForImport}
									</span>
								</div>
							</div>
							<div className="rounded-md border border-l-4 border-l-red-600 border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-950">
											Rejected accounts
										</p>
										<p className="mt-1 text-sm text-slate-500">
											Registrations not approved.
										</p>
									</div>
									<span className="text-xl font-semibold text-slate-950">
										{stats.rejected}
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
						<div>
							<div className="flex items-center gap-3">
								<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Building2 className="h-5 w-5" />
								</span>
								<div>
									<h2 className="text-base font-semibold text-slate-950">
										Company directory
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Showing {filteredCompanies.length} of {stats.total}{" "}
										companies{filtersApplied ? " after filters" : ""}.
									</p>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="default" className="bg-slate-100 text-slate-700">
								Approved {stats.approved}
							</Badge>
							<Badge variant="warning">Pending {stats.pendingApproval}</Badge>
							<Badge variant="danger">Rejected {stats.rejected}</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Filter className="h-4 w-4 text-slate-500" />
								Filter companies
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
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
							<div className="lg:col-span-1">
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Name, email, code"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
							<Select
								label="Company type"
								value={filterType}
								onChange={(e) => setFilterType(e.target.value as any)}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All types" },
									{ value: "SOURCE", label: "Sources" },
									{ value: "AGENT", label: "Agents" },
								]}
							/>
							<Select
								label="Account status"
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value as any)}
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
								value={filterApproval}
								onChange={(e) => setFilterApproval(e.target.value as any)}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All approvals" },
									{ value: "PENDING", label: "Pending" },
									{ value: "APPROVED", label: "Approved" },
									{ value: "REJECTED", label: "Rejected" },
								]}
							/>
						</div>
					</div>
				</div>

				<div className="p-0">
					{filteredCompanies.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Company
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Type
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Account status
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Approval
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Integration
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
									{filteredCompanies.map((company) => {
										const approvalStatus = company.approvalStatus || "PENDING";
										const integrationValue =
											company.type === "SOURCE"
												? company.httpEndpoint ||
													company.grpcEndpoint ||
													"Not configured"
												: company.grpcEndpoint ||
													(company as any).billingCountryCode ||
													"Not configured";

										return (
											<tr
												key={company.id}
												className={`cursor-pointer transition hover:bg-slate-50 ${highlightCompanyId === company.id ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : ""}`}
												onClick={() => handleCompanyClick(company)}
											>
												<td className="px-5 py-4 align-top">
													<div className="flex items-start gap-3">
														<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
															<Building2 className="h-5 w-5" />
														</span>
														<div className="min-w-0">
															<div className="max-w-xs truncate text-sm font-semibold text-slate-950">
																{company.companyName}
															</div>
															<div className="mt-1 max-w-xs truncate text-sm text-slate-500">
																{company.email}
															</div>
															{company.companyCode && (
																<code className="mt-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
																	{company.companyCode}
																</code>
															)}
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge variant={typeVariant(company.type)}>
														{companyTypeLabelAdmin(company.type)}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top">
													<Badge variant={companyStatusVariant(company.status)}>
														{companyStatusLabelAdmin(company.status)}
													</Badge>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="space-y-2">
														<Badge
															variant={approvalStatusVariant(approvalStatus)}
														>
															{approvalStatusLabelAdmin(approvalStatus)}
														</Badge>
														<div className="text-xs text-slate-500">
															Email{" "}
															{company.emailVerified
																? "verified"
																: "not verified"}
														</div>
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div
														className="max-w-xs truncate text-sm text-slate-700"
														title={integrationValue}
													>
														{integrationValue}
													</div>
													{company.type === "SOURCE" && (
														<div className="mt-1 text-xs text-slate-500">
															{company.status === "ACTIVE" &&
															approvalStatus === "APPROVED"
																? "Ready for branch import"
																: "Approve and activate before import"}
														</div>
													)}
												</td>
												<td className="px-5 py-4 align-top text-sm text-slate-600">
													{formatDate(company.createdAt)}
												</td>
												<td className="px-5 py-4 align-top">
													<div
														className="relative flex justify-end"
														onClick={(e) => e.stopPropagation()}
													>
														<button
															onClick={() =>
																setOpenMenuId(
																	openMenuId === company.id ? null : company.id,
																)
															}
															className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-100"
															aria-label="Actions menu"
														>
															<MoreVertical className="h-4 w-4" />
														</button>

														{openMenuId === company.id && (
															<>
																<div
																	className="fixed inset-0 z-10"
																	onClick={() => setOpenMenuId(null)}
																/>
																<div className="absolute right-0 top-10 z-20 w-60 rounded-md border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
																	<button
																		onClick={() => {
																			handleCompanyClick(company);
																			setOpenMenuId(null);
																		}}
																		className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
																	>
																		<Eye className="h-4 w-4" />
																		View details
																	</button>

																	<button
																		onClick={() => {
																			handleEditClick(company);
																			setOpenMenuId(null);
																		}}
																		className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
																	>
																		<Edit className="h-4 w-4" />
																		Edit company
																	</button>

																	{company.approvalStatus !== "APPROVED" && (
																		<>
																			<button
																				onClick={() => {
																					approveMutation.mutate(company.id);
																					setOpenMenuId(null);
																				}}
																				disabled={approveMutation.isPending}
																				className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
																			>
																				<Check className="h-4 w-4" />
																				{approveMutation.isPending
																					? "Approving..."
																					: "Approve"}
																			</button>

																			{company.approvalStatus !==
																				"REJECTED" && (
																				<button
																					onClick={() => {
																						const reason = prompt(
																							"Enter rejection reason (optional):",
																						);
																						rejectMutation.mutate({
																							id: company.id,
																							reason: reason || undefined,
																						});
																						setOpenMenuId(null);
																					}}
																					disabled={rejectMutation.isPending}
																					className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
																				>
																					<X className="h-4 w-4" />
																					{rejectMutation.isPending
																						? "Rejecting..."
																						: "Reject"}
																				</button>
																			)}
																		</>
																	)}

																	{company.type === "SOURCE" && (
																		<button
																			onClick={() => {
																				if (company.status !== "ACTIVE") {
																					toast.error(
																						"Source must be ACTIVE to import branches",
																					);
																					setOpenMenuId(null);
																					return;
																				}
																				if (
																					company.approvalStatus !== "APPROVED"
																				) {
																					toast.error(
																						"Source must be APPROVED to import branches",
																					);
																					setOpenMenuId(null);
																					return;
																				}
																				importBranchesMutation.mutate(
																					company.id,
																				);
																				setOpenMenuId(null);
																			}}
																			disabled={
																				importBranchesMutation.isPending ||
																				company.status !== "ACTIVE" ||
																				company.approvalStatus !== "APPROVED"
																			}
																			className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
																		>
																			<Download className="h-4 w-4" />
																			{importBranchesMutation.isPending
																				? "Importing..."
																				: "Import branches"}
																		</button>
																	)}

																	<div className="my-1 border-t border-slate-200" />
																	<div className="px-4 py-2">
																		<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
																			Account status
																		</label>
																		<select
																			value={
																				statusChangeModal?.company.id ===
																				company.id
																					? statusChangeModal.previousStatus
																					: company.status
																			}
																			onChange={(e) => {
																				const next = e.target.value as
																					| "ACTIVE"
																					| "PENDING_VERIFICATION"
																					| "SUSPENDED";
																				openStatusChangeModal(company, next);
																				setOpenMenuId(null);
																			}}
																			disabled={updateStatusMutation.isPending}
																			className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
																		>
																			<option value="ACTIVE">Active</option>
																			<option value="PENDING_VERIFICATION">
																				Pending verification
																			</option>
																			<option value="SUSPENDED">
																				Suspended
																			</option>
																		</select>
																	</div>

																	<div className="my-1 border-t border-slate-200" />
																	<button
																		onClick={() => {
																			handleDeleteClick(company);
																			setOpenMenuId(null);
																		}}
																		className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
																	>
																		<Trash2 className="h-4 w-4" />
																		Delete
																	</button>
																</div>
															</>
														)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
								<Building2 className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-950">
								No companies found
							</h3>
							<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
								{filtersApplied
									? "Try clearing filters or searching with a different company name, email, or code."
									: "Create the first company to begin onboarding sources and agents."}
							</p>
							<div className="mt-5 flex flex-wrap justify-center gap-2">
								{filtersApplied && (
									<Button
										variant="secondary"
										onClick={clearFilters}
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
										Create company
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			</section>

			<CompanyDetailModal
				company={selectedCompany}
				isOpen={isDetailModalOpen}
				onClose={() => {
					setIsDetailModalOpen(false);
					setSelectedCompany(null);
				}}
			/>

			<CompanyFormModal
				key="create-company-modal"
				company={null}
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
				}}
				onSave={handleRefresh}
			/>

			<CompanyFormModal
				key={`edit-company-modal-${companyToEdit?.id || "new"}`}
				company={companyToEdit}
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setCompanyToEdit(null);
				}}
				onSave={handleRefresh}
			/>

			<Modal
				isOpen={!!companyToDelete}
				onClose={() => setCompanyToDelete(null)}
				title="Delete Company"
			>
				<div className="space-y-4">
					<p className="text-sm text-gray-700">
						Are you sure you want to delete{" "}
						<strong>{companyToDelete?.companyName}</strong>? This action cannot
						be undone.
					</p>
					<div className="flex justify-end gap-2">
						<Button
							variant="secondary"
							onClick={() => setCompanyToDelete(null)}
							type="button"
						>
							Cancel
						</Button>
						<Button
							variant="danger"
							onClick={confirmDelete}
							loading={deleteMutation.isPending}
						>
							Delete
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={!!statusChangeModal}
				onClose={() => {
					if (!updateStatusMutation.isPending) {
						setStatusChangeModal(null);
						setStatusNotifyMessage("");
						setStatusNotifyByEmail(true);
					}
				}}
				title="Update company status"
			>
				{statusChangeModal && (
					<div className="space-y-4">
						<p className="text-sm text-gray-700">
							<span className="font-medium text-gray-900">
								{statusChangeModal.company.companyName}
							</span>
							<span className="text-gray-600"> — </span>
							<span className="text-gray-600">
								{statusChangeModal.company.email}
							</span>
						</p>
						<p className="text-sm text-gray-800">
							Status will change from{" "}
							<strong>
								{companyStatusLabelAdmin(statusChangeModal.previousStatus)}
							</strong>{" "}
							to{" "}
							<strong>
								{companyStatusLabelAdmin(statusChangeModal.nextStatus)}
							</strong>
							.
						</p>
						<div>
							<label
								htmlFor="status-notify-message"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Message to the company{" "}
								<span className="font-normal text-gray-500">(optional)</span>
							</label>
							<textarea
								id="status-notify-message"
								rows={5}
								value={statusNotifyMessage}
								onChange={(e) => setStatusNotifyMessage(e.target.value)}
								placeholder="Add context for this change (shown in the email when notifications are enabled)."
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
								disabled={updateStatusMutation.isPending}
							/>
						</div>
						<label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
							<input
								type="checkbox"
								className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								checked={statusNotifyByEmail}
								onChange={(e) => setStatusNotifyByEmail(e.target.checked)}
								disabled={updateStatusMutation.isPending}
							/>
							<span>
								Send email to company contacts (primary address and all users on
								this account). Uses your configured SMTP / SendGrid / Resend
								settings.
							</span>
						</label>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="secondary"
								type="button"
								onClick={() => {
									setStatusChangeModal(null);
									setStatusNotifyMessage("");
									setStatusNotifyByEmail(true);
								}}
								disabled={updateStatusMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="button"
								loading={updateStatusMutation.isPending}
								onClick={() => {
									const msg = statusNotifyMessage.trim();
									updateStatusMutation.mutate({
										id: statusChangeModal.company.id,
										status: statusChangeModal.nextStatus,
										notifyByEmail: statusNotifyByEmail,
										...(msg ? { notifyMessage: msg } : {}),
									});
								}}
							>
								Save status
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
