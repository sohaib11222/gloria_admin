import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Car,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Database,
	RefreshCw,
	Search,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";
import {
	availabilitySamplesApi,
	type AdminAvailabilitySampleItem,
} from "../api/availabilitySamples";
import { companiesApi } from "../api/companies";
import { formatDate } from "../lib/utils";

const PAGE_SIZE = 25;

function coerceOfferRows(summary: unknown): Array<Record<string, unknown>> {
	if (summary == null) return [];
	if (Array.isArray(summary)) {
		return summary.filter(
			(item): item is Record<string, unknown> =>
				item != null && typeof item === "object" && !Array.isArray(item),
		);
	}
	if (typeof summary === "object" && summary !== null && "offers" in summary) {
		const offers = (summary as Record<string, unknown>).offers;
		if (Array.isArray(offers)) {
			return offers.filter(
				(item): item is Record<string, unknown> =>
					item != null && typeof item === "object" && !Array.isArray(item),
			);
		}
	}
	return [];
}

function pickStr(o: Record<string, unknown>, keys: string[]): string {
	for (const key of keys) {
		const value = o[key];
		if (value != null && String(value).trim() !== "") return String(value);
	}
	return "";
}

function OfferMiniCard({ offer }: { offer: Record<string, unknown> }) {
	const title =
		pickStr(offer, [
			"vehicle_make_model",
			"makeModel",
			"description",
			"vehicleDescription",
			"acriss",
			"acrissCode",
		]) || "Vehicle offer";
	const vclass = pickStr(offer, [
		"vehicle_class",
		"vehicleClass",
		"group",
		"category",
	]);
	const price =
		offer.total_price ??
		offer.totalPrice ??
		offer.price ??
		offer.estimatedTotalAmount ??
		offer.amount;
	const currency = pickStr(offer, ["currency", "currencyCode"]) || "—";
	const status = pickStr(offer, [
		"availability_status",
		"status",
		"availStatus",
	]);

	return (
		<div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-start gap-2">
					<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
						<Car className="h-4 w-4" />
					</span>
					<div className="min-w-0">
						<div className="truncate font-semibold text-slate-950">{title}</div>
						{vclass ? (
							<div className="mt-0.5 text-xs text-slate-500">{vclass}</div>
						) : null}
					</div>
				</div>
				{status ? (
					<Badge
						variant={
							status.toUpperCase().includes("AVAILABLE") ? "success" : "warning"
						}
						size="sm"
						className="shrink-0"
					>
						{status}
					</Badge>
				) : null}
			</div>
			{price != null && price !== "" ? (
				<div className="mt-3 border-t border-slate-100 pt-2 text-base font-semibold text-slate-950">
					{currency}{" "}
					{typeof price === "number" ? price.toFixed(2) : String(price)}
				</div>
			) : null}
		</div>
	);
}

export function StoredAvailabilitySamplesPanel() {
	const [sourceId, setSourceId] = useState("");
	const [page, setPage] = useState(0);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: sourcesRes } = useQuery({
		queryKey: ["admin", "companies", "sources-for-samples"],
		queryFn: () => companiesApi.listSources(),
	});

	const sources = sourcesRes?.data ?? [];

	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey: ["admin", "availability-samples", sourceId, page],
		queryFn: () =>
			availabilitySamplesApi.list({
				sourceId: sourceId || undefined,
				limit: PAGE_SIZE,
				offset: page * PAGE_SIZE,
			}),
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
	const end = Math.min((page + 1) * PAGE_SIZE, total);

	return (
		<section className="rounded-md border border-slate-200 bg-white">
			<div className="border-b border-slate-200 px-5 py-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex items-start gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<Database className="h-5 w-5" />
						</span>
						<div>
							<h2 className="text-base font-semibold text-slate-950">
								Stored availability and pricing samples
							</h2>
							<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
								Review source-provided pricing snapshots from the source Pricing
								tab, including criteria, vehicle details, and raw offer
								summaries.
							</p>
						</div>
					</div>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => refetch()}
						loading={isFetching}
						className="rounded-md border-slate-300 shadow-none"
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>

				<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-end">
						<Select
							label="Source"
							value={sourceId}
							onChange={(event) => {
								setSourceId(event.target.value);
								setPage(0);
								setExpandedId(null);
							}}
							options={[
								{ value: "", label: "All sources" },
								...sources.map((source) => ({
									value: source.id,
									label: `${source.companyName}${source.companyCode ? ` (${source.companyCode})` : ""}`,
								})),
							]}
							className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
						/>
						<div className="text-sm text-slate-500 lg:text-right">
							Showing{" "}
							<span className="font-semibold text-slate-900">
								{start}-{end}
							</span>{" "}
							of <span className="font-semibold text-slate-900">{total}</span>{" "}
							samples
						</div>
					</div>
				</div>
			</div>

			<div className="p-5">
				{isLoading ? (
					<div className="flex min-h-72 items-center justify-center">
						<Loader />
					</div>
				) : error ? (
					<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
						Failed to load samples. Check that you are authenticated as admin.
					</div>
				) : items.length === 0 ? (
					<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
						<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
							<Search className="h-8 w-8" />
						</span>
						<h3 className="mt-4 text-base font-semibold text-slate-950">
							No stored samples yet
						</h3>
						<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
							Sources create samples from the source portal under Pricing. Once
							saved, they appear here for admin review.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-slate-200 text-sm">
									<thead className="bg-slate-50">
										<tr>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Source
											</th>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Pickup → return
											</th>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Updated
											</th>
											<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Offers
											</th>
											<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
												Details
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 bg-white">
										{items.map((row: AdminAvailabilitySampleItem) => {
											const route =
												[
													row.pickupLoc || row.pickupIso,
													row.returnLoc || row.returnIso,
												]
													.filter(Boolean)
													.join(" → ") || "—";
											const offers = coerceOfferRows(row.offersSummary);
											const open = expandedId === row.id;
											return (
												<React.Fragment key={row.id}>
													<tr className="hover:bg-slate-50">
														<td className="px-5 py-4 align-top">
															<div className="font-semibold text-slate-950">
																{row.source.companyName}
															</div>
															{row.source.companyCode ? (
																<div className="mt-1 font-mono text-xs text-slate-500">
																	{row.source.companyCode}
																</div>
															) : null}
														</td>
														<td className="max-w-sm px-5 py-4 align-top text-slate-700">
															<span className="line-clamp-2" title={route}>
																{route}
															</span>
														</td>
														<td className="whitespace-nowrap px-5 py-4 align-top text-xs text-slate-600">
															{formatDate(row.updatedAt)}
														</td>
														<td className="px-5 py-4 align-top">
															<Badge variant="info" size="sm">
																{row.offersCount} offers
															</Badge>
															{offers.length > 0 ? (
																<span className="ml-2 text-xs text-slate-500">
																	{offers.length} structured
																</span>
															) : null}
														</td>
														<td className="px-5 py-4 align-top text-right">
															<Button
																type="button"
																variant="secondary"
																size="sm"
																className="rounded-md border-slate-300 shadow-none"
																onClick={() =>
																	setExpandedId(open ? null : row.id)
																}
															>
																{open ? (
																	<ChevronUp className="h-4 w-4" />
																) : (
																	<ChevronDown className="h-4 w-4" />
																)}
															</Button>
														</td>
													</tr>
													{open && (
														<tr className="bg-slate-50">
															<td colSpan={5} className="p-5">
																<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
																	<div>
																		<div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
																			Criteria
																		</div>
																		<pre className="max-h-56 overflow-auto rounded-md border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">
																			{JSON.stringify(
																				row.criteria ?? {},
																				null,
																				2,
																			)}
																		</pre>
																	</div>
																	<div>
																		<div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
																			Offer summary (
																			{offers.length || row.offersCount})
																		</div>
																		{offers.length > 0 ? (
																			<div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
																				{offers
																					.slice(0, 12)
																					.map((offer, index) => (
																						<OfferMiniCard
																							key={index}
																							offer={offer}
																						/>
																					))}
																				{offers.length > 12 && (
																					<p className="py-1 text-xs text-slate-500">
																						Showing 12 of {offers.length}; full
																						JSON below.
																					</p>
																				)}
																			</div>
																		) : (
																			<p className="mb-2 text-xs text-slate-500">
																				No structured offer list in summary; see
																				raw JSON.
																			</p>
																		)}
																	</div>
																</div>
																<div className="mt-4">
																	<div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
																		Raw offersSummary
																	</div>
																	<pre className="max-h-72 overflow-auto rounded-md border border-slate-900 bg-slate-950 p-3 font-mono text-xs text-slate-100">
																		{JSON.stringify(row.offersSummary, null, 2)}
																	</pre>
																</div>
															</td>
														</tr>
													)}
												</React.Fragment>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>

						{total > PAGE_SIZE && (
							<div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
								<span>
									Showing {start}–{end} of {total}
								</span>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										disabled={page === 0}
										onClick={() => setPage((current) => current - 1)}
										className="rounded-md border-slate-300 shadow-none"
									>
										<ChevronLeft className="mr-1 h-4 w-4" />
										Previous
									</Button>
									<Button
										variant="secondary"
										size="sm"
										disabled={!data?.hasMore}
										onClick={() => setPage((current) => current + 1)}
										className="rounded-md border-slate-300 shadow-none"
									>
										Next
										<ChevronRight className="ml-1 h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</section>
	);
}
