import React, { useMemo, useState } from "react";
import { Input } from "../components/ui/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Loader } from "../components/ui/Loader";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { locationsApi } from "../api/locations";
import { agreementsApi } from "../api/agreements";
import { unlocodesApi, CreateUNLocodeRequest } from "../api/unlocodes";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface AddLocationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const [formData, setFormData] = useState<CreateUNLocodeRequest>({
		unlocode: "",
		country: "",
		place: "",
		iataCode: null,
		latitude: null,
		longitude: null,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data: CreateUNLocodeRequest) => unlocodesApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["locations"] });
			queryClient.invalidateQueries({ queryKey: ["locations", "all"] });
			queryClient.invalidateQueries({ queryKey: ["unlocodes"] });
			toast.success("Location added successfully");
			setFormData({
				unlocode: "",
				country: "",
				place: "",
				iataCode: null,
				latitude: null,
				longitude: null,
			});
			setErrors({});
			onSuccess();
			onClose();
		},
		onError: (error: any) => {
			const errorMessage =
				error.response?.data?.message || "Failed to add location";
			const errorCode = error.response?.data?.error;

			if (errorCode === "UNLOCODE_EXISTS") {
				setErrors({ unlocode: "This UN/LOCODE already exists" });
			} else if (errorCode === "VALIDATION_ERROR") {
				const details = error.response?.data?.details || [];
				const newErrors: Record<string, string> = {};
				details.forEach((err: any) => {
					if (err.path) {
						newErrors[err.path[0]] = err.message;
					}
				});
				setErrors(newErrors);
			} else {
				toast.error(errorMessage);
			}
		},
	});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (
			!formData.unlocode ||
			formData.unlocode.length < 2 ||
			formData.unlocode.length > 10
		) {
			newErrors.unlocode = "UN/LOCODE must be between 2 and 10 characters";
		}

		if (!formData.country || formData.country.length !== 2) {
			newErrors.country =
				"Country code must be exactly 2 characters (e.g., GB, US)";
		}

		if (!formData.place || formData.place.trim().length === 0) {
			newErrors.place = "Place name is required";
		}

		if (formData.iataCode && formData.iataCode.length > 3) {
			newErrors.iataCode = "IATA code must be 3 characters or less";
		}

		if (
			formData.latitude != null &&
			(formData.latitude < -90 || formData.latitude > 90)
		) {
			newErrors.latitude = "Latitude must be between -90 and 90";
		}

		if (
			formData.longitude != null &&
			(formData.longitude < -180 || formData.longitude > 180)
		) {
			newErrors.longitude = "Longitude must be between -180 and 180";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validateForm()) {
			createMutation.mutate(formData);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Location">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="UN/LOCODE *"
						placeholder="e.g., GBMAN"
						value={formData.unlocode}
						onChange={(e) =>
							setFormData({
								...formData,
								unlocode: e.target.value.toUpperCase(),
							})
						}
						error={errors.unlocode}
						required
						helperText="2-10 characters, will be converted to uppercase"
					/>
					<Input
						label="Country Code *"
						placeholder="e.g., GB"
						value={formData.country}
						onChange={(e) =>
							setFormData({
								...formData,
								country: e.target.value.toUpperCase(),
							})
						}
						error={errors.country}
						required
						helperText="2-letter ISO country code"
						maxLength={2}
					/>
				</div>

				<Input
					label="Place Name *"
					placeholder="e.g., Manchester"
					value={formData.place}
					onChange={(e) => setFormData({ ...formData, place: e.target.value })}
					error={errors.place}
					required
				/>

				<div className="grid grid-cols-3 gap-4">
					<Input
						label="IATA Code"
						placeholder="e.g., MAN"
						value={formData.iataCode || ""}
						onChange={(e) =>
							setFormData({
								...formData,
								iataCode: e.target.value.toUpperCase() || null,
							})
						}
						error={errors.iataCode}
						helperText="Optional, 3 characters"
						maxLength={3}
					/>
					<Input
						label="Latitude"
						type="number"
						step="any"
						placeholder="e.g., 53.3656"
						value={
							formData.latitude != null ? formData.latitude.toString() : ""
						}
						onChange={(e) => {
							const val = e.target.value;
							setFormData({
								...formData,
								latitude: val ? parseFloat(val) : null,
							});
						}}
						error={errors.latitude}
						helperText="Optional, -90 to 90"
					/>
					<Input
						label="Longitude"
						type="number"
						step="any"
						placeholder="e.g., -2.2729"
						value={
							formData.longitude != null ? formData.longitude.toString() : ""
						}
						onChange={(e) => {
							const val = e.target.value;
							setFormData({
								...formData,
								longitude: val ? parseFloat(val) : null,
							});
						}}
						error={errors.longitude}
						helperText="Optional, -180 to 180"
					/>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
					<Button
						type="button"
						variant="secondary"
						onClick={onClose}
						disabled={createMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						disabled={createMutation.isPending}
						loading={createMutation.isPending}
					>
						{createMutation.isPending ? "Adding..." : "Add Location"}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

export default function Locations() {
	const [tab, setTab] = useState<"all" | "byAgreement" | "bySource">("all");
	const [agreementId, setAgreementId] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");
	const [countryFilter, setCountryFilter] = useState<string>("");
	const [allLocationsPage, setAllLocationsPage] = useState(0);
	const [allLocationsLimit, setAllLocationsLimit] = useState(25);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const normalizedSearchQuery = searchQuery.trim();
	const normalizedCountryFilter = countryFilter.trim().toUpperCase();

	const { data: agreements } = useQuery({
		queryKey: ["agreements"],
		queryFn: () => agreementsApi.listAgreements(),
	});

	const {
		data: allLocations,
		isLoading: allLoading,
		isFetching: allFetching,
		error: allLocationsError,
	} = useQuery({
		queryKey: [
			"locations",
			"all",
			normalizedSearchQuery,
			normalizedCountryFilter,
			allLocationsPage,
			allLocationsLimit,
		],
		queryFn: () =>
			unlocodesApi.list({
				query: normalizedSearchQuery || undefined,
				country: normalizedCountryFilter || undefined,
				limit: allLocationsLimit,
				offset: allLocationsPage * allLocationsLimit,
			}),
		enabled: tab === "all",
		placeholderData: (previousData) => previousData,
	});

	const { data: byAgreementLocations, isLoading: byAgreementLoading } =
		useQuery({
			queryKey: ["locations", "agreement", agreementId],
			queryFn: () =>
				agreementId
					? locationsApi.getAgreementLocations(agreementId)
					: Promise.resolve({ items: [], inherited: false }),
			enabled: tab === "byAgreement",
		});

	const { data: sourceCounts, isLoading: bySourceLoading } = useQuery({
		queryKey: ["locations", "by-source"],
		queryFn: () => locationsApi.listSourcesLocationCounts(),
		enabled: tab === "bySource",
	});

	const isLoading =
		tab === "all"
			? allLoading
			: tab === "byAgreement"
				? byAgreementLoading
				: bySourceLoading;

	const allLocationRows = useMemo(
		() => allLocations?.items ?? [],
		[allLocations],
	);
	const allLocationsTotal = allLocations?.total ?? 0;
	const allLocationsTotalPages = Math.max(
		1,
		Math.ceil(allLocationsTotal / allLocationsLimit),
	);
	const allLocationsStart =
		allLocationsTotal === 0 ? 0 : allLocationsPage * allLocationsLimit + 1;
	const allLocationsEnd =
		allLocationsTotal === 0
			? 0
			: Math.min((allLocationsPage + 1) * allLocationsLimit, allLocationsTotal);
	const hasActiveAllLocationFilters = Boolean(
		normalizedSearchQuery || normalizedCountryFilter,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-gray-100 rounded">
							<svg
								className="w-6 h-6 text-gray-700"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</div>
						<div>
							<h1 className="text-2xl font-semibold text-gray-900">
								Locations
							</h1>
							<p className="mt-1 text-sm text-gray-600">
								Manage supported locations and UN/LOCODE data
							</p>
						</div>
					</div>
					{tab === "all" && (
						<Button
							variant="primary"
							onClick={() => setIsAddModalOpen(true)}
							className="flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Add Location
						</Button>
					)}
				</div>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gray-100 rounded">
							<svg
								className="w-5 h-5 text-gray-700"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
								/>
							</svg>
						</div>
						<div>
							<CardTitle className="text-lg font-semibold text-gray-900">
								Location Management
							</CardTitle>
							<p className="text-sm text-gray-600 mt-1">
								Browse and filter locations by different criteria
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					<div className="mb-6 space-y-4">
						{/* Tab Buttons */}
						<div className="flex items-center gap-3 flex-wrap">
							<Button
								variant={tab === "all" ? "primary" : "secondary"}
								size="sm"
								onClick={() => setTab("all")}
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
									/>
								</svg>
								All LOCODE
							</Button>
							<Button
								variant={tab === "byAgreement" ? "primary" : "secondary"}
								size="sm"
								onClick={() => setTab("byAgreement")}
								className={tab === "byAgreement" ? "shadow-md" : ""}
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								By Agreement
							</Button>
							<Button
								variant={tab === "bySource" ? "primary" : "secondary"}
								size="sm"
								onClick={() => setTab("bySource")}
								className={tab === "bySource" ? "shadow-md" : ""}
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
									/>
								</svg>
								By Source
							</Button>
							{tab === "byAgreement" && (
								<div className="w-72">
									<Select
										label="Agreement"
										value={agreementId}
										onChange={(e) => setAgreementId(e.target.value)}
										options={[{ value: "", label: "Select agreement" }].concat(
											(agreements?.data ?? []).map((a) => ({
												value: a.id,
												label: `${a.agreementRef} (${a.status})`,
											})),
										)}
									/>
								</div>
							)}
						</div>
						{tab === "all" && (
							<>
								<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_150px_auto] md:items-end">
									<Input
										label="Search"
										placeholder="Search by UN/LOCODE, city, country, or IATA code..."
										value={searchQuery}
										onChange={(e) => {
											setSearchQuery(e.target.value);
											setAllLocationsPage(0);
										}}
									/>
									<Input
										label="Country Code"
										placeholder="All"
										value={countryFilter}
										onChange={(e) => {
											setCountryFilter(e.target.value.toUpperCase());
											setAllLocationsPage(0);
										}}
										maxLength={2}
										helperText="Optional ISO code"
									/>
									<Select
										label="Rows per page"
										value={String(allLocationsLimit)}
										onChange={(e) => {
											setAllLocationsLimit(Number(e.target.value));
											setAllLocationsPage(0);
										}}
										options={[
											{ value: "25", label: "25 rows" },
											{ value: "50", label: "50 rows" },
											{ value: "100", label: "100 rows" },
										]}
									/>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="secondary"
											onClick={() =>
												queryClient.invalidateQueries({
													queryKey: ["locations", "all"],
												})
											}
											disabled={allFetching}
											className="whitespace-nowrap"
										>
											<RefreshCw
												className={`mr-2 h-4 w-4 ${allFetching ? "animate-spin" : ""}`}
											/>
											Refresh
										</Button>
										{hasActiveAllLocationFilters && (
											<Button
												type="button"
												variant="secondary"
												onClick={() => {
													setSearchQuery("");
													setCountryFilter("");
													setAllLocationsPage(0);
												}}
												className="whitespace-nowrap"
											>
												Clear
											</Button>
										)}
									</div>
								</div>
								<div className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
									<span>
										{allLocationsTotal > 0 ? (
											<>
												Showing{" "}
												<span className="font-semibold text-slate-900">
													{allLocationsStart}
												</span>{" "}
												to{" "}
												<span className="font-semibold text-slate-900">
													{allLocationsEnd}
												</span>{" "}
												of{" "}
												<span className="font-semibold text-slate-900">
													{allLocationsTotal.toLocaleString()}
												</span>{" "}
												locations
											</>
										) : (
											"No locations match the current filters"
										)}
									</span>
									{hasActiveAllLocationFilters && (
										<span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
											Filters active
										</span>
									)}
								</div>
							</>
						)}
					</div>

					{isLoading ? (
						<Loader className="min-h-48" />
					) : (
						<>
							{tab === "all" && (
								<div>
									{allLocationsError ? (
										<ErrorDisplay
											error={allLocationsError}
											title="Failed to load locations"
										/>
									) : allLocationRows.length === 0 ? (
										<div className="text-center py-16">
											<div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
												<svg
													className="h-8 w-8 text-gray-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
											</div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												No locations found
											</h3>
											{hasActiveAllLocationFilters ? (
												<p className="text-sm text-gray-500 mb-4">
													Try adjusting the search, country code, or
													rows-per-page setting.
												</p>
											) : (
												<p className="text-sm text-gray-500 mb-4">
													Add a location to start building the UN/LOCODE
													reference table.
												</p>
											)}
											{hasActiveAllLocationFilters && (
												<Button
													variant="secondary"
													size="sm"
													onClick={() => {
														setSearchQuery("");
														setCountryFilter("");
														setAllLocationsPage(0);
													}}
												>
													Clear Filters
												</Button>
											)}
										</div>
									) : (
										<>
											<div className="overflow-x-auto rounded border border-gray-200">
												<table className="min-w-full divide-y divide-gray-200">
													<thead className="bg-gray-50">
														<tr>
															<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
																UN/LOCODE
															</th>
															<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
																Name
															</th>
															<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
																Country
															</th>
															<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
																IATA Code
															</th>
															<th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
																Usage
															</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-gray-200">
														{allLocationRows.map((loc, index) => (
															<tr
																key={loc.unlocode}
																className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
															>
																<td className="px-6 py-4 whitespace-nowrap">
																	<code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">
																		{loc.unlocode}
																	</code>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	<div className="text-sm font-semibold text-gray-900">
																		{loc.place || "—"}
																	</div>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	<Badge variant="info" size="sm">
																		{loc.country}
																	</Badge>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	{loc.iataCode ? (
																		<Badge variant="success" size="sm">
																			{loc.iataCode}
																		</Badge>
																	) : (
																		<span className="text-xs text-gray-400">
																			—
																		</span>
																	)}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-right">
																	<span className="text-sm font-semibold text-gray-700">
																		{loc.usageCount ?? 0}
																	</span>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>

											<div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
												<div className="text-sm text-gray-600">
													Showing{" "}
													<span className="font-semibold text-gray-900">
														{allLocationsStart}
													</span>{" "}
													to{" "}
													<span className="font-semibold text-gray-900">
														{allLocationsEnd}
													</span>{" "}
													of{" "}
													<span className="font-semibold text-gray-900">
														{allLocationsTotal.toLocaleString()}
													</span>{" "}
													locations
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="secondary"
														size="sm"
														onClick={() =>
															setAllLocationsPage((current) =>
																Math.max(0, current - 1),
															)
														}
														disabled={allLocationsPage === 0 || allFetching}
														className="rounded border-gray-300 shadow-none"
													>
														<ChevronLeft className="mr-1 h-4 w-4" />
														Previous
													</Button>
													<span className="rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
														Page {allLocationsPage + 1} of{" "}
														{allLocationsTotalPages}
													</span>
													<Button
														variant="secondary"
														size="sm"
														onClick={() =>
															setAllLocationsPage((current) => current + 1)
														}
														disabled={!allLocations?.hasMore || allFetching}
														className="rounded border-gray-300 shadow-none"
													>
														Next
														<ChevronRight className="ml-1 h-4 w-4" />
													</Button>
												</div>
											</div>
										</>
									)}
								</div>
							)}

							{tab === "byAgreement" && (
								<div>
									{byAgreementLocations?.inherited && (
										<div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
											<div className="flex items-center gap-2">
												<svg
													className="w-4 h-4 text-amber-600"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												<span className="text-sm font-semibold text-amber-900">
													Locations inherited from global coverage
												</span>
											</div>
										</div>
									)}
									{(byAgreementLocations?.items ?? []).length === 0 ? (
										<div className="text-center py-16">
											<div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
												<svg
													className="h-8 w-8 text-gray-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
											</div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												No locations found
											</h3>
											<p className="text-sm text-gray-500">
												This agreement has no specific locations assigned
											</p>
										</div>
									) : (
										<div className="overflow-x-auto rounded border border-gray-200">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
															UN/LOCODE
														</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{(byAgreementLocations?.items ?? []).map(
														(loc: any, index: number) => (
															<tr
																key={loc.unlocode}
																className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
															>
																<td className="px-6 py-4 whitespace-nowrap">
																	<code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">
																		{loc.unlocode}
																	</code>
																</td>
															</tr>
														),
													)}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)}

							{tab === "bySource" && (
								<div>
									{(sourceCounts?.items ?? []).length === 0 ? (
										<div className="text-center py-16">
											<div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
												<svg
													className="h-8 w-8 text-gray-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
													/>
												</svg>
											</div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												No source data available
											</h3>
											<p className="text-sm text-gray-500">
												No location counts found for sources
											</p>
										</div>
									) : (
										<div className="overflow-x-auto rounded border border-gray-200">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
															Source
														</th>
														<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
															Status
														</th>
														<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
															Locations
														</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{(sourceCounts?.items ?? []).map(
														(s: any, index: number) => (
															<tr
																key={s.sourceId}
																className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
															>
																<td className="px-6 py-4 whitespace-nowrap">
																	<div className="text-sm font-semibold text-gray-900">
																		{s.companyName}
																	</div>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	<Badge
																		variant={
																			s.status === "ACTIVE"
																				? "success"
																				: s.status === "PENDING_VERIFICATION"
																					? "warning"
																					: "default"
																		}
																		size="sm"
																	>
																		{s.status}
																	</Badge>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	<div className="flex items-center gap-2">
																		<div className="text-2xl font-semibold text-gray-900">
																			{s.locations}
																		</div>
																		<span className="text-xs text-gray-500">
																			locations
																		</span>
																	</div>
																</td>
															</tr>
														),
													)}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<AddLocationModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSuccess={() => {
					// Query invalidation is handled in the mutation's onSuccess
				}}
			/>
		</div>
	);
}
