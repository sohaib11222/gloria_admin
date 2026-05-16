import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	Building2,
	Calendar,
	Car,
	CheckCircle,
	Clock,
	DollarSign,
	MapPin,
	Package,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Copy as CopyButton } from "../components/ui/Copy";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { availabilityApi } from "../api/availability";
import { unlocodesApi } from "../api/unlocodes";
import { AvailabilitySchema, type AvailabilityForm } from "../lib/validators";
import { cn } from "../lib/utils";
import { StoredAvailabilitySamplesPanel } from "./StoredAvailabilitySamplesPanel";

interface AvailabilityOffer {
	supplier_offer_ref: string;
	source_id: string;
	agreement_ref: string;
	pickup_location: string;
	dropoff_location: string;
	vehicle_class: string;
	vehicle_make_model: string;
	rate_plan_code: string;
	total_price: number;
	currency: string;
	availability_status: string;
	supplier_name: string;
}

type AvailabilityPageTab = "live" | "stored";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

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
	icon: React.ReactNode;
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

function statusVariant(
	status: string,
): "success" | "warning" | "danger" | "default" {
	const normalized = status?.toUpperCase();
	if (normalized === "AVAILABLE" || normalized === "COMPLETE") return "success";
	if (
		normalized === "ERROR" ||
		normalized === "FAILED" ||
		normalized === "TIMEOUT"
	)
		return "danger";
	if (normalized) return "warning";
	return "default";
}

export default function AvailabilityTester() {
	const [pageTab, setPageTab] = useState<AvailabilityPageTab>("live");
	const [requestId, setRequestId] = useState<string | null>(null);
	const [offers, setOffers] = useState<AvailabilityOffer[]>([]);
	const [isPolling, setIsPolling] = useState(false);
	const [pollingStatus, setPollingStatus] = useState<string>("");
	const [locationSearch, setLocationSearch] = useState({
		pickup: "",
		dropoff: "",
	});

	const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
		queryKey: ["unlocodes", "all"],
		queryFn: async () => {
			const result = await unlocodesApi.list({ limit: 1000 });
			return result.items;
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<AvailabilityForm>({
		resolver: zodResolver(AvailabilitySchema),
	});

	const pickupUnlocode = watch("pickup_unlocode");
	const dropoffUnlocode = watch("dropoff_unlocode");

	const filteredPickupLocations = useMemo(() => {
		const search = locationSearch.pickup.toLowerCase();
		return (locationsData || []).filter((loc) => {
			if (!search) return true;
			return (
				loc.unlocode.toLowerCase().includes(search) ||
				loc.place.toLowerCase().includes(search) ||
				loc.country.toLowerCase().includes(search) ||
				Boolean(loc.iataCode && loc.iataCode.toLowerCase().includes(search))
			);
		});
	}, [locationSearch.pickup, locationsData]);

	const filteredDropoffLocations = useMemo(() => {
		const search = locationSearch.dropoff.toLowerCase();
		return (locationsData || []).filter((loc) => {
			if (!search) return true;
			return (
				loc.unlocode.toLowerCase().includes(search) ||
				loc.place.toLowerCase().includes(search) ||
				loc.country.toLowerCase().includes(search) ||
				Boolean(loc.iataCode && loc.iataCode.toLowerCase().includes(search))
			);
		});
	}, [locationSearch.dropoff, locationsData]);

	const pickupOptions = [
		{ value: "", label: "Select pickup location" },
		...filteredPickupLocations.map((loc) => ({
			value: loc.unlocode,
			label: `${loc.unlocode} — ${loc.place}, ${loc.country}${loc.iataCode ? ` (${loc.iataCode})` : ""}`,
		})),
	];

	const dropoffOptions = [
		{ value: "", label: "Select dropoff location" },
		...filteredDropoffLocations.map((loc) => ({
			value: loc.unlocode,
			label: `${loc.unlocode} — ${loc.place}, ${loc.country}${loc.iataCode ? ` (${loc.iataCode})` : ""}`,
		})),
	];

	const submitMutation = useMutation({
		mutationFn: availabilityApi.submit,
		onSuccess: (data) => {
			setRequestId(data.request_id);
			setOffers([]);
			setIsPolling(true);
			setPollingStatus("Starting availability search");
			toast.success("Availability request submitted");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Failed to submit availability request",
			);
		},
	});

	const pollMutation = useMutation({
		mutationFn: (params: {
			requestId: string;
			sinceSeq?: number;
			waitMs?: number;
		}) => availabilityApi.poll(params),
		onSuccess: (data) => {
			if (data.offers && data.offers.length > 0) {
				setOffers((prev) => [...prev, ...data.offers]);
			}

			setPollingStatus(data.status);

			if (data.complete) {
				setIsPolling(false);
				toast.success("Availability search completed");
			}
		},
		onError: () => {
			setIsPolling(false);
			setPollingStatus("ERROR");
			toast.error("Polling failed");
		},
	});

	useEffect(() => {
		if (!isPolling || !requestId) return;

		const poll = async () => {
			try {
				await pollMutation.mutateAsync({
					requestId,
					sinceSeq: offers.length,
					waitMs: 1500,
				});
			} catch {
				// Mutation handles UI and toast state.
			}
		};

		const interval = setInterval(poll, 2000);
		return () => clearInterval(interval);
	}, [isPolling, requestId, offers.length]);

	useEffect(() => {
		if (!isPolling) return;

		const timeout = setTimeout(() => {
			setIsPolling(false);
			setPollingStatus("TIMEOUT");
			toast.error("Availability search timed out after 120 seconds");
		}, 120000);

		return () => clearTimeout(timeout);
	}, [isPolling]);

	const onSubmit = (data: AvailabilityForm) => {
		const payload = {
			...data,
			pickup_iso: new Date(data.pickup_iso).toISOString(),
			dropoff_iso: new Date(data.dropoff_iso).toISOString(),
			driver_age: 30,
			residency_country: "US",
			vehicle_classes: [],
		};
		submitMutation.mutate(payload);
	};

	const handleReset = () => {
		setRequestId(null);
		setOffers([]);
		setIsPolling(false);
		setPollingStatus("");
		setLocationSearch({ pickup: "", dropoff: "" });
		reset();
	};

	const stats = {
		total: offers.length,
		available: offers.filter(
			(offer) => offer.availability_status === "AVAILABLE",
		).length,
		unavailable: offers.filter(
			(offer) => offer.availability_status !== "AVAILABLE",
		).length,
		avgPrice:
			offers.length > 0
				? offers.reduce((sum, offer) => sum + offer.total_price, 0) /
					offers.length
				: 0,
	};

	const currentStatus = isPolling ? "Polling" : pollingStatus || "Idle";

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Search className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Network operations
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Availability & pricing
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Run a live availability search across connected sources or
										review stored source pricing samples in a structured admin
										view.
									</p>
								</div>
							</div>
							<div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
								<button
									type="button"
									onClick={() => setPageTab("live")}
									className={cn(
										"rounded px-3 py-2 text-sm font-semibold transition",
										pageTab === "live"
											? "bg-white text-slate-950 shadow-sm"
											: "text-slate-600 hover:text-slate-950",
									)}
								>
									Live test
								</button>
								<button
									type="button"
									onClick={() => setPageTab("stored")}
									className={cn(
										"rounded px-3 py-2 text-sm font-semibold transition",
										pageTab === "stored"
											? "bg-white text-slate-950 shadow-sm"
											: "text-slate-600 hover:text-slate-950",
									)}
								>
									Stored samples
								</button>
							</div>
						</div>

						<div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
							<div className="flex items-start gap-3">
								<Clock className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
								<div>
									<p className="text-sm font-semibold text-blue-950">
										How to use this page
									</p>
									<p className="mt-1 text-sm leading-6 text-blue-800">
										Choose pickup and dropoff locations, set dates, submit the
										request, then watch live source offers populate in the
										results panel.
									</p>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Current request
						</h2>
						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Status
								</p>
								<Badge variant={statusVariant(pollingStatus)} className="mt-2">
									{currentStatus}
								</Badge>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Request ID
								</p>
								<p className="mt-2 break-all font-mono text-xs text-slate-700">
									{requestId || "No request submitted"}
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			{pageTab === "stored" ? <StoredAvailabilitySamplesPanel /> : null}

			{pageTab === "live" && (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<StatCard
							label="Total offers"
							value={stats.total}
							helper="Offers returned by connected sources"
							icon={<Package className="h-5 w-5" />}
							tone="blue"
						/>
						<StatCard
							label="Available"
							value={stats.available}
							helper="Offers marked as available"
							icon={<CheckCircle className="h-5 w-5" />}
							tone="emerald"
						/>
						<StatCard
							label="Unavailable"
							value={stats.unavailable}
							helper="Returned but not currently bookable"
							icon={<XCircle className="h-5 w-5" />}
							tone={stats.unavailable > 0 ? "amber" : "slate"}
						/>
						<StatCard
							label="Average price"
							value={stats.avgPrice > 0 ? `$${stats.avgPrice.toFixed(2)}` : "—"}
							helper="Average visible offer total"
							icon={<DollarSign className="h-5 w-5" />}
							tone="slate"
						/>
					</div>

					<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
						<section className="rounded-md border border-slate-200 bg-white">
							<div className="border-b border-slate-200 px-5 py-4">
								<div className="flex items-start gap-3">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
										<Search className="h-5 w-5" />
									</span>
									<div>
										<h2 className="text-base font-semibold text-slate-950">
											Availability request
										</h2>
										<p className="mt-1 text-sm leading-6 text-slate-500">
											Search for vehicles using UN/LOCODE locations and rental
											dates.
										</p>
									</div>
								</div>
							</div>
							<div className="p-5">
								<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										<div>
											<label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
												<MapPin className="h-4 w-4 text-slate-500" />
												Pickup location
											</label>
											<div className="relative mb-2">
												<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
												<input
													type="text"
													placeholder="Search pickup location"
													value={locationSearch.pickup}
													onChange={(event) =>
														setLocationSearch({
															...locationSearch,
															pickup: event.target.value,
														})
													}
													className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
												/>
											</div>
											<Select
												options={pickupOptions}
												error={errors.pickup_unlocode?.message}
												value={pickupUnlocode || ""}
												onChange={(event) => {
													setValue("pickup_unlocode", event.target.value);
													if (event.target.value)
														setLocationSearch({
															...locationSearch,
															pickup: "",
														});
												}}
												disabled={isLoadingLocations}
												className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
											/>
										</div>

										<div>
											<label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
												<MapPin className="h-4 w-4 text-slate-500" />
												Dropoff location
											</label>
											<div className="relative mb-2">
												<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
												<input
													type="text"
													placeholder="Search dropoff location"
													value={locationSearch.dropoff}
													onChange={(event) =>
														setLocationSearch({
															...locationSearch,
															dropoff: event.target.value,
														})
													}
													className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
												/>
											</div>
											<Select
												options={dropoffOptions}
												error={errors.dropoff_unlocode?.message}
												value={dropoffUnlocode || ""}
												onChange={(event) => {
													setValue("dropoff_unlocode", event.target.value);
													if (event.target.value)
														setLocationSearch({
															...locationSearch,
															dropoff: "",
														});
												}}
												disabled={isLoadingLocations}
												className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
											/>
										</div>
									</div>

									{isLoadingLocations && (
										<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
											<Clock className="mr-2 inline h-4 w-4 animate-spin text-slate-400" />
											Loading location catalog…
										</div>
									)}

									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										<div>
											<label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
												<Calendar className="h-4 w-4 text-slate-500" />
												Pickup date & time
											</label>
											<Input
												type="datetime-local"
												error={errors.pickup_iso?.message}
												className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
												{...register("pickup_iso")}
											/>
										</div>
										<div>
											<label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
												<Calendar className="h-4 w-4 text-slate-500" />
												Dropoff date & time
											</label>
											<Input
												type="datetime-local"
												error={errors.dropoff_iso?.message}
												className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
												{...register("dropoff_iso")}
											/>
										</div>
									</div>

									<div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
										<Button
											type="submit"
											loading={submitMutation.isPending}
											disabled={isPolling}
											className="rounded-md shadow-none sm:flex-1"
										>
											<Search className="mr-2 h-4 w-4" />
											Search availability
										</Button>
										<Button
											type="button"
											variant="secondary"
											onClick={handleReset}
											disabled={isPolling}
											className="rounded-md border-slate-300 shadow-none"
										>
											<RefreshCw className="mr-2 h-4 w-4" />
											Reset
										</Button>
									</div>
								</form>

								{requestId && (
									<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
										<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
											<div className="flex min-w-0 items-start gap-3">
												<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
													<Building2 className="h-4 w-4" />
												</span>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-slate-950">
														Submitted request
													</p>
													<code className="mt-1 block break-all font-mono text-xs text-slate-600">
														{requestId}
													</code>
												</div>
											</div>
											<CopyButton text={requestId} label="Copy ID" />
										</div>
										<div className="mt-4 flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
											{isPolling ? (
												<Clock className="h-5 w-5 animate-spin text-blue-600" />
											) : pollingStatus === "COMPLETE" ? (
												<CheckCircle className="h-5 w-5 text-emerald-600" />
											) : (
												<XCircle className="h-5 w-5 text-red-600" />
											)}
											<div>
												<p className="text-sm font-semibold text-slate-950">
													{isPolling
														? pollingStatus
														: pollingStatus || "Waiting"}
												</p>
												<p className="text-xs text-slate-500">
													{isPolling
														? "Collecting source responses."
														: "Request status is no longer polling."}
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</section>

						<section className="rounded-md border border-slate-200 bg-white">
							<div className="border-b border-slate-200 px-5 py-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="flex items-start gap-3">
										<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
											<Package className="h-5 w-5" />
										</span>
										<div>
											<h2 className="text-base font-semibold text-slate-950">
												Results
											</h2>
											<p className="mt-1 text-sm leading-6 text-slate-500">
												Real-time availability offers returned by sources.
											</p>
										</div>
									</div>
									<Badge variant="info" className="w-fit">
										{offers.length} {offers.length === 1 ? "offer" : "offers"}
									</Badge>
								</div>
							</div>
							<div className="p-5">
								{offers.length > 0 ? (
									<div className="max-h-[680px] space-y-4 overflow-y-auto pr-1">
										{offers.map((offer, index) => (
											<article
												key={`${offer.supplier_offer_ref || index}`}
												className="rounded-md border border-slate-200 bg-white p-4 hover:bg-slate-50"
											>
												<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
													<div className="flex min-w-0 items-start gap-3">
														<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
															<Car className="h-5 w-5" />
														</span>
														<div className="min-w-0">
															<h3 className="truncate text-base font-semibold text-slate-950">
																{offer.vehicle_make_model || "Unknown vehicle"}
															</h3>
															<p className="mt-1 text-sm text-slate-500">
																{offer.vehicle_class ||
																	"Vehicle class not provided"}{" "}
																· {offer.supplier_name || "Unknown supplier"}
															</p>
														</div>
													</div>
													<Badge
														variant={
															offer.availability_status === "AVAILABLE"
																? "success"
																: "warning"
														}
														size="sm"
														className="w-fit"
													>
														{offer.availability_status || "Unknown"}
													</Badge>
												</div>

												<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
													<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
															Route
														</p>
														<p
															className="mt-1 truncate text-sm font-medium text-slate-800"
															title={`${offer.pickup_location} → ${offer.dropoff_location}`}
														>
															{offer.pickup_location} → {offer.dropoff_location}
														</p>
													</div>
													<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
															Rate plan
														</p>
														<p className="mt-1 truncate text-sm font-medium text-slate-800">
															{offer.rate_plan_code || "N/A"}
														</p>
													</div>
												</div>

												<div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-end sm:justify-between">
													<div>
														<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
															Total price
														</p>
														<p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
															{offer.currency}{" "}
															{Number(offer.total_price || 0).toFixed(2)}
														</p>
														{offer.supplier_offer_ref ? (
															<p className="mt-1 font-mono text-xs text-slate-500">
																Ref: {offer.supplier_offer_ref}
															</p>
														) : null}
													</div>
													<CopyButton
														text={JSON.stringify(offer, null, 2)}
														label="Copy JSON"
													/>
												</div>
											</article>
										))}
									</div>
								) : requestId ? (
									<EmptyState
										title="No offers found"
										description="The request completed but no offers were returned. Try adjusting dates, route, or source coverage."
										icon={<Search className="h-8 w-8" />}
									/>
								) : (
									<EmptyState
										title="No offers yet"
										description="Submit an availability request to see live supplier responses and pricing here."
										icon={<Package className="h-8 w-8" />}
									/>
								)}
							</div>
						</section>
					</div>
				</>
			)}
		</div>
	);
}
