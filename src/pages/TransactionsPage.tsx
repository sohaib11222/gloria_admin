import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";
import { transactionsApi, BillingTransaction } from "../api/billing";
import { cn, formatDate } from "../lib/utils";
import {
	AlertCircle,
	ArrowUpRight,
	CalendarDays,
	CheckCircle2,
	CreditCard,
	ExternalLink,
	FileText,
	Filter,
	Receipt,
	RefreshCw,
	Search,
} from "lucide-react";

const STATUS_VARIANTS: Record<
	string,
	"success" | "warning" | "default" | "danger" | "info"
> = {
	paid: "success",
	open: "warning",
	draft: "default",
	uncollectible: "danger",
	void: "default",
};

const STATUS_LABELS: Record<string, string> = {
	paid: "Paid",
	open: "Open",
	draft: "Draft",
	uncollectible: "Uncollectible",
	void: "Void",
};

type StatusFilter =
	| "ALL"
	| "paid"
	| "open"
	| "draft"
	| "uncollectible"
	| "void";
type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

function formatAmount(cents: number, currency: string): string {
	const code =
		currency?.toUpperCase() === "EUR"
			? "EUR"
			: currency?.toUpperCase() || "EUR";
	return new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency: code,
		minimumFractionDigits: 2,
	}).format((Number.isFinite(cents) ? cents : 0) / 100);
}

function transactionAmount(t: BillingTransaction): number {
	return t.amountPaid || t.amountDue || 0;
}

function compactDate(value: string | null): string {
	if (!value) return "—";
	return formatDate(value).split(" ")[0];
}

function statusLabel(status: string): string {
	return STATUS_LABELS[status] || status || "Unknown";
}

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
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<Receipt className="h-8 w-8" />
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}

export default function TransactionsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [documentFilter, setDocumentFilter] = useState<
		"ALL" | "HAS_INVOICE" | "NO_INVOICE"
	>("ALL");

	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey: ["admin", "transactions"],
		queryFn: () => transactionsApi.listAdmin(),
	});

	const items: BillingTransaction[] = data?.items ?? [];

	const stats = useMemo(() => {
		const paid = items.filter((t) => t.status === "paid");
		const open = items.filter((t) => t.status === "open");
		const failed = items.filter((t) => t.status === "uncollectible");
		const invoiceDocs = items.filter(
			(t) => t.hostedInvoiceUrl || t.invoicePdf,
		).length;
		const paidAmount = paid.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
		const dueAmount = items
			.filter((t) => t.status !== "paid")
			.reduce((sum, t) => sum + (t.amountDue || 0), 0);
		const currency = items[0]?.currency || "EUR";
		return {
			total: items.length,
			paidCount: paid.length,
			openCount: open.length,
			failedCount: failed.length,
			invoiceDocs,
			paidAmount,
			dueAmount,
			currency,
		};
	}, [items]);

	const filtered = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return items.filter((t) => {
			const matchesSearch =
				!query ||
				(t.sourceName || "").toLowerCase().includes(query) ||
				(t.customerEmail || "").toLowerCase().includes(query) ||
				(t.planName || "").toLowerCase().includes(query) ||
				(t.stripeInvoiceId || "").toLowerCase().includes(query);
			const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
			const hasInvoice = Boolean(t.hostedInvoiceUrl || t.invoicePdf);
			const matchesDocument =
				documentFilter === "ALL" ||
				(documentFilter === "HAS_INVOICE" && hasInvoice) ||
				(documentFilter === "NO_INVOICE" && !hasInvoice);
			return matchesSearch && matchesStatus && matchesDocument;
		});
	}, [documentFilter, items, searchQuery, statusFilter]);

	const filtersApplied =
		Boolean(searchQuery.trim()) ||
		statusFilter !== "ALL" ||
		documentFilter !== "ALL";
	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("ALL");
		setDocumentFilter("ALL");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Receipt className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Commercial ledger
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Transactions
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Review Stripe invoices, payment status, billing periods,
										customer details, and invoice documents in one clear ledger.
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

						<div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
								<span className="font-semibold text-slate-900">
									Ledger source:
								</span>
								<Badge variant="info" size="sm">
									Stripe invoices
								</Badge>
								<span>
									Amounts are displayed in the transaction currency and divided
									from minor units.
								</span>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							What to review
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Use the filters to quickly identify invoices needing action.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<CheckCircle2 className="h-4 w-4 text-slate-500" />
									Paid invoices
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Confirm successful payments and export/view invoice documents.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<AlertCircle className="h-4 w-4 text-slate-500" />
									Open or failed invoices
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Follow up when invoices remain open, past due, or
									uncollectible.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total transactions"
					value={stats.total}
					helper={`${stats.paidCount} paid · ${stats.openCount} open`}
					icon={<Receipt className="h-5 w-5" />}
				/>
				<StatCard
					label="Paid amount"
					value={formatAmount(stats.paidAmount, stats.currency)}
					helper="Sum of paid invoice amounts"
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="Outstanding"
					value={formatAmount(stats.dueAmount, stats.currency)}
					helper={
						stats.failedCount > 0
							? `${stats.failedCount} uncollectible invoice${stats.failedCount === 1 ? "" : "s"}`
							: "Open or unpaid invoice amount"
					}
					icon={<CreditCard className="h-5 w-5" />}
					tone={stats.dueAmount > 0 ? "amber" : "slate"}
				/>
				<StatCard
					label="Invoice documents"
					value={stats.invoiceDocs}
					helper="Rows with hosted invoice or PDF links"
					icon={<FileText className="h-5 w-5" />}
					tone="blue"
				/>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-5 py-4">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<div className="flex items-center gap-3">
								<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Filter className="h-5 w-5" />
								</span>
								<div>
									<h2 className="text-base font-semibold text-slate-950">
										Transaction ledger
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Showing {filtered.length} of {items.length} transactions
										{filtersApplied ? " after filters" : ""}.
									</p>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Paid {stats.paidCount}</Badge>
							<Badge variant="warning">Open {stats.openCount}</Badge>
							<Badge variant={stats.failedCount > 0 ? "danger" : "default"}>
								Uncollectible {stats.failedCount}
							</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Filter className="h-4 w-4 text-slate-500" />
								Filter transactions
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
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="Source, email, plan, invoice ID"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
							<Select
								label="Invoice status"
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as StatusFilter)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All statuses" },
									{ value: "paid", label: "Paid" },
									{ value: "open", label: "Open" },
									{ value: "draft", label: "Draft" },
									{ value: "uncollectible", label: "Uncollectible" },
									{ value: "void", label: "Void" },
								]}
							/>
							<Select
								label="Documents"
								value={documentFilter}
								onChange={(e) =>
									setDocumentFilter(
										e.target.value as "ALL" | "HAS_INVOICE" | "NO_INVOICE",
									)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All transactions" },
									{ value: "HAS_INVOICE", label: "Has invoice link/PDF" },
									{ value: "NO_INVOICE", label: "Missing invoice document" },
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
						<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600">
								<AlertCircle className="h-8 w-8" />
							</span>
							<h3 className="mt-4 text-base font-semibold text-slate-950">
								Failed to load transactions
							</h3>
							<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
								Please refresh the ledger or check the backend/Stripe
								connection.
							</p>
							<Button
								variant="secondary"
								onClick={() => refetch()}
								className="mt-5 rounded-md border-slate-300 shadow-none"
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Try again
							</Button>
						</div>
					) : filtered.length === 0 ? (
						<EmptyState
							title={
								items.length === 0
									? "No transactions yet"
									: "No transactions match these filters"
							}
							description={
								items.length === 0
									? "Transactions will appear here when sources pay for plans through Stripe."
									: "Try clearing filters or searching with a different source, email, plan, or invoice ID."
							}
							action={
								filtersApplied ? (
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
											Invoice
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Customer
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Plan
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Status
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Amount
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Billing period
										</th>
										<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Documents
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{filtered.map((t) => {
										const amount = transactionAmount(t);
										const hasDocuments = Boolean(
											t.hostedInvoiceUrl || t.invoicePdf,
										);
										return (
											<tr key={t.id} className="hover:bg-slate-50">
												<td className="px-5 py-4 align-top">
													<div className="font-semibold text-slate-950">
														{t.createdAt
															? formatDate(t.createdAt)
															: "No invoice date"}
													</div>
													<div
														className="mt-1 max-w-[220px] truncate font-mono text-xs text-slate-500"
														title={t.stripeInvoiceId || t.id}
													>
														{t.stripeInvoiceId || t.id}
													</div>
												</td>
												<td className="px-5 py-4 align-top">
													<div className="max-w-xs truncate font-semibold text-slate-950">
														{t.sourceName ?? "Unknown source"}
													</div>
													{t.customerEmail ? (
														<div className="mt-1 max-w-xs truncate text-xs text-slate-500">
															{t.customerEmail}
														</div>
													) : null}
												</td>
												<td className="px-5 py-4 align-top text-slate-700">
													{t.planName ?? "—"}
												</td>
												<td className="px-5 py-4 align-top">
													<Badge
														variant={STATUS_VARIANTS[t.status] ?? "default"}
													>
														{statusLabel(t.status)}
													</Badge>
													{!hasDocuments ? (
														<p className="mt-1 text-xs text-slate-500">
															No invoice document
														</p>
													) : null}
												</td>
												<td className="px-5 py-4 align-top text-right">
													<div className="font-semibold text-slate-950">
														{formatAmount(amount, t.currency)}
													</div>
													{t.amountPaid && t.amountDue ? (
														<div className="mt-1 text-xs text-slate-500">
															Due {formatAmount(t.amountDue, t.currency)}
														</div>
													) : null}
												</td>
												<td className="px-5 py-4 align-top text-slate-600">
													{t.periodStart && t.periodEnd ? (
														<div className="inline-flex items-center gap-2 whitespace-nowrap">
															<CalendarDays className="h-4 w-4 text-slate-400" />
															{compactDate(t.periodStart)} –{" "}
															{compactDate(t.periodEnd)}
														</div>
													) : (
														"—"
													)}
												</td>
												<td className="px-5 py-4 align-top text-right">
													{hasDocuments ? (
														<div className="flex flex-wrap justify-end gap-2">
															{t.hostedInvoiceUrl && (
																<a
																	href={t.hostedInvoiceUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
																>
																	<ExternalLink className="h-3.5 w-3.5" />
																	View
																	<ArrowUpRight className="h-3 w-3 text-slate-400" />
																</a>
															)}
															{t.invoicePdf && (
																<a
																	href={t.invoicePdf}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
																>
																	<FileText className="h-3.5 w-3.5" />
																	PDF
																</a>
															)}
														</div>
													) : (
														<span className="text-slate-400">—</span>
													)}
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
		</div>
	);
}
