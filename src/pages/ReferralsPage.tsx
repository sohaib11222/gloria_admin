import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Loader } from "../components/ui/Loader";
import { Modal } from "../components/ui/Modal";
import {
	referralsApi,
	ReferralLink,
	ReferralSignupCompany,
} from "../api/referrals";
import toast from "react-hot-toast";
import {
	Building2,
	CheckCircle2,
	Copy,
	Filter,
	Link2,
	Plus,
	Search,
	ShieldCheck,
	ToggleLeft,
	ToggleRight,
	Users,
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";

/** Default public register pages (subdomains + Vite base paths /agent, /source). Override via env if needed. */
const DEFAULT_AGENT_REGISTER_PAGE =
	"https://agent.gloriaconnect.com/agent/register";
const DEFAULT_SOURCE_REGISTER_PAGE =
	"https://source.gloriaconnect.com/source/register";

function getRegisterPageUrls() {
	const agent =
		(import.meta.env.VITE_AGENT_REGISTER_URL as string | undefined)?.trim() ||
		DEFAULT_AGENT_REGISTER_PAGE;
	const source =
		(import.meta.env.VITE_SOURCE_REGISTER_URL as string | undefined)?.trim() ||
		DEFAULT_SOURCE_REGISTER_PAGE;
	return { agent, source };
}

function withReferralRef(registerPageUrl: string, slug: string): string {
	const u = new URL(registerPageUrl);
	u.searchParams.set("ref", slug);
	return u.href;
}

function registerUrlExamples(slug: string) {
	const { agent: agentBase, source: sourceBase } = getRegisterPageUrls();
	const dev = !import.meta.env.PROD;
	return {
		agent: withReferralRef(agentBase, slug),
		source: withReferralRef(sourceBase, slug),
		hint: dev
			? "For local testing, set VITE_AGENT_REGISTER_URL and VITE_SOURCE_REGISTER_URL to full register page URLs."
			: "Share register URLs, not login URLs. Signups count when the referral is valid during registration.",
	};
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type AudienceFilter = "ALL" | "BOTH" | "AGENT" | "SOURCE";

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
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<Link2 className="h-8 w-8" />
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}

function referralAudienceLabel(row: ReferralLink) {
	if (row.restrictToType === "AGENT") return "Agent only";
	if (row.restrictToType === "SOURCE") return "Source only";
	return "Agents and sources";
}

function signupTypeVariant(type: "AGENT" | "SOURCE"): "default" | "info" {
	return type === "AGENT" ? "info" : "default";
}

export default function ReferralsPage() {
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [slug, setSlug] = useState("");
	const [label, setLabel] = useState("");
	const [restrict, setRestrict] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("ALL");

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "referral-links"],
		queryFn: () => referralsApi.list(),
	});

	const items = data?.items ?? [];

	const createMutation = useMutation({
		mutationFn: () =>
			referralsApi.create({
				slug,
				label: label.trim() || null,
				restrictToType:
					restrict === "AGENT" || restrict === "SOURCE" ? restrict : null,
			}),
		onSuccess: () => {
			toast.success("Referral link created");
			queryClient.invalidateQueries({ queryKey: ["admin", "referral-links"] });
			setCreateOpen(false);
			setSlug("");
			setLabel("");
			setRestrict("");
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to create link"),
	});

	const patchMutation = useMutation({
		mutationFn: ({ id, body }: { id: string; body: { active?: boolean } }) =>
			referralsApi.patch(id, body),
		onSuccess: () => {
			toast.success("Updated");
			queryClient.invalidateQueries({ queryKey: ["admin", "referral-links"] });
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Update failed"),
	});

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Copied");
		} catch {
			toast.error("Could not copy");
		}
	};

	const stats = useMemo(() => {
		const active = items.filter((item) => item.active).length;
		const agentSignups = items.reduce(
			(sum, item) => sum + (item.signupsByType?.AGENT ?? 0),
			0,
		);
		const sourceSignups = items.reduce(
			(sum, item) => sum + (item.signupsByType?.SOURCE ?? 0),
			0,
		);
		const totalSignups = agentSignups + sourceSignups;
		return {
			total: items.length,
			active,
			inactive: items.length - active,
			totalSignups,
			agentSignups,
			sourceSignups,
		};
	}, [items]);

	const filteredItems = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return items.filter((item) => {
			const matchesSearch =
				!query ||
				item.slug.toLowerCase().includes(query) ||
				(item.label || "").toLowerCase().includes(query);
			const matchesStatus =
				statusFilter === "ALL" ||
				(statusFilter === "ACTIVE" && item.active) ||
				(statusFilter === "INACTIVE" && !item.active);
			const matchesAudience =
				audienceFilter === "ALL" ||
				(audienceFilter === "BOTH" && !item.restrictToType) ||
				item.restrictToType === audienceFilter;
			return matchesSearch && matchesStatus && matchesAudience;
		});
	}, [audienceFilter, items, searchQuery, statusFilter]);

	const filtersApplied =
		Boolean(searchQuery.trim()) ||
		statusFilter !== "ALL" ||
		audienceFilter !== "ALL";
	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("ALL");
		setAudienceFilter("ALL");
	};

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<Link2 className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Commercial referrals
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Referral links
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Create trackable registration links for campaigns, partners,
										and account teams. Each link appends a referral code to the
										Agent or Source registration page.
									</p>
								</div>
							</div>
							<Button
								type="button"
								variant="primary"
								onClick={() => setCreateOpen((v) => !v)}
								className="shrink-0 rounded-md shadow-none"
							>
								<Plus className="mr-2 h-4 w-4" />
								{createOpen ? "Close form" : "New referral link"}
							</Button>
						</div>

						<div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
							<div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
								<span className="font-semibold text-slate-900">
									Share format:
								</span>
								<code className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
									?ref=your-code
								</code>
								<span>Use full registration URLs, not login URLs.</span>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							How it works
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Keep links simple and campaign-specific so signups are easy to
							audit later.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<ShieldCheck className="h-4 w-4 text-slate-500" />
									Restrict audience
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Use Agent-only or Source-only when a partner should register
									one account type.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Users className="h-4 w-4 text-slate-500" />
									Track signups
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Open a link row to review all companies created with that
									referral code.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total links"
					value={stats.total}
					helper={`${stats.active} active · ${stats.inactive} inactive`}
					icon={<Link2 className="h-5 w-5" />}
				/>
				<StatCard
					label="Active links"
					value={stats.active}
					helper="Currently accepted during registration"
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone={stats.active > 0 ? "emerald" : "slate"}
				/>
				<StatCard
					label="Total signups"
					value={stats.totalSignups}
					helper="Companies registered using referral links"
					icon={<Users className="h-5 w-5" />}
					tone="blue"
				/>
				<StatCard
					label="Signup split"
					value={`${stats.agentSignups}/${stats.sourceSignups}`}
					helper="Agent signups / Source signups"
					icon={<Building2 className="h-5 w-5" />}
					tone="slate"
				/>
			</div>

			{createOpen && (
				<section className="rounded-md border border-slate-200 bg-white">
					<div className="border-b border-slate-200 px-5 py-4">
						<h2 className="text-base font-semibold text-slate-950">
							Create referral link
						</h2>
						<p className="mt-1 text-sm leading-6 text-slate-500">
							Slugs are normalized by the backend to lowercase letters, numbers,
							and hyphens. Example:{" "}
							<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
								partner-jane
							</code>
							.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1fr_1fr_260px_auto] lg:items-end">
						<Input
							label="Slug"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="e.g. partner-jane"
							autoComplete="off"
						/>
						<Input
							label="Internal label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Q2 partner campaign"
							helperText="Optional. Shown only to admins."
						/>
						<Select
							label="Audience"
							value={restrict}
							onChange={(e) => setRestrict(e.target.value)}
							options={[
								{ value: "", label: "Agents and sources" },
								{ value: "AGENT", label: "Agent only" },
								{ value: "SOURCE", label: "Source only" },
							]}
						/>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setCreateOpen(false)}
								className="rounded-md shadow-none"
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="primary"
								onClick={() => createMutation.mutate()}
								disabled={!slug.trim() || createMutation.isPending}
								className="rounded-md shadow-none"
							>
								{createMutation.isPending ? "Creating…" : "Create"}
							</Button>
						</div>
					</div>
				</section>
			)}

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
										Referral directory
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Showing {filteredItems.length} of {items.length} links
										{filtersApplied ? " after filters" : ""}.
									</p>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success">Active {stats.active}</Badge>
							<Badge variant="default">Inactive {stats.inactive}</Badge>
							<Badge variant="info">Signups {stats.totalSignups}</Badge>
						</div>
					</div>

					<div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<Filter className="h-4 w-4 text-slate-500" />
								Filter links
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
										placeholder="Slug or label"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									/>
								</div>
							</div>
							<Select
								label="Status"
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as StatusFilter)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All statuses" },
									{ value: "ACTIVE", label: "Active" },
									{ value: "INACTIVE", label: "Inactive" },
								]}
							/>
							<Select
								label="Audience"
								value={audienceFilter}
								onChange={(e) =>
									setAudienceFilter(e.target.value as AudienceFilter)
								}
								className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
								options={[
									{ value: "ALL", label: "All audiences" },
									{ value: "BOTH", label: "Agents and sources" },
									{ value: "AGENT", label: "Agent only" },
									{ value: "SOURCE", label: "Source only" },
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
					) : filteredItems.length === 0 ? (
						<EmptyState
							title={
								items.length === 0
									? "No referral links yet"
									: "No links match these filters"
							}
							description={
								items.length === 0
									? "Create a referral link to start tracking agent and source registrations."
									: "Try clearing filters or searching with a different slug or label."
							}
							action={
								items.length === 0 ? (
									<Button
										type="button"
										variant="primary"
										onClick={() => setCreateOpen(true)}
										className="rounded-md shadow-none"
									>
										<Plus className="mr-2 h-4 w-4" />
										Create referral link
									</Button>
								) : filtersApplied ? (
									<Button
										type="button"
										variant="secondary"
										onClick={clearFilters}
										className="rounded-md shadow-none"
									>
										Clear filters
									</Button>
								) : null
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-sm">
								<thead className="bg-slate-50">
									<tr>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Referral
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Audience
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Status
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Signups
										</th>
										<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											Share links
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
									{filteredItems.map((row: ReferralLink) => (
										<ReferralRow
											key={row.id}
											row={row}
											onCopy={copy}
											onToggleActive={(id, active) =>
												patchMutation.mutate({ id, body: { active } })
											}
											isToggling={patchMutation.isPending}
										/>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}

function ReferralSignupsModal({
	linkId,
	slug,
	open,
	onClose,
}: {
	linkId: string;
	slug: string;
	open: boolean;
	onClose: () => void;
}) {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["admin", "referral-signups", linkId],
		queryFn: () => referralsApi.getSignups(linkId),
		enabled: open,
	});
	const items = data?.items ?? [];
	const agentCount = items.filter((item) => item.type === "AGENT").length;
	const sourceCount = items.filter((item) => item.type === "SOURCE").length;

	return (
		<Modal
			isOpen={open}
			onClose={onClose}
			title={`Referral signups · ${slug}`}
			size="xl"
		>
			<div className="space-y-4">
				<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-semibold text-slate-950">
								Companies registered with this referral
							</p>
							<p className="mt-1 text-sm text-slate-500">
								Use this list to review downstream company approval and account
								status.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="info">Agent {agentCount}</Badge>
							<Badge variant="default">Source {sourceCount}</Badge>
							<Badge variant="success">Total {items.length}</Badge>
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="flex min-h-32 items-center justify-center">
						<Loader />
					</div>
				) : isError ? (
					<div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						Could not load signups.
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => refetch()}
						>
							Retry
						</Button>
					</div>
				) : items.length === 0 ? (
					<EmptyState
						title="No signups yet"
						description="No companies have registered with this referral slug yet."
					/>
				) : (
					<div className="overflow-x-auto rounded-md border border-slate-200">
						<table className="min-w-full divide-y divide-slate-200 text-sm">
							<thead className="bg-slate-50">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Company
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Type
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Account status
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Approval
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Company code
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
										Registered
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{items.map((c: ReferralSignupCompany) => (
									<tr key={c.id} className="hover:bg-slate-50">
										<td className="px-4 py-3 align-top">
											<div className="font-semibold text-slate-950">
												{c.companyName}
											</div>
											<div className="mt-1 text-xs text-slate-500">
												{c.email}
											</div>
										</td>
										<td className="px-4 py-3 align-top">
											<Badge variant={signupTypeVariant(c.type)}>
												{c.type === "AGENT" ? "Agent" : "Source"}
											</Badge>
										</td>
										<td className="px-4 py-3 align-top text-slate-700">
											{c.status}
										</td>
										<td className="px-4 py-3 align-top text-slate-700">
											{c.approvalStatus}
										</td>
										<td className="px-4 py-3 align-top font-mono text-xs text-slate-700">
											{c.companyCode || "—"}
										</td>
										<td className="whitespace-nowrap px-4 py-3 align-top text-slate-600">
											{formatDate(c.createdAt)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</Modal>
	);
}

function ShareButton({
	label,
	url,
	onCopy,
}: {
	label: string;
	url: string;
	onCopy: (t: string) => void;
}) {
	return (
		<Button
			type="button"
			variant="secondary"
			size="sm"
			className="justify-start gap-1 rounded-md border-slate-300 shadow-none"
			onClick={() => onCopy(url)}
		>
			<Copy className="h-3.5 w-3.5" />
			{label}
		</Button>
	);
}

function ReferralRow({
	row,
	onCopy,
	onToggleActive,
	isToggling,
}: {
	row: ReferralLink;
	onCopy: (t: string) => void;
	onToggleActive: (id: string, active: boolean) => void;
	isToggling: boolean;
}) {
	const [signupsOpen, setSignupsOpen] = useState(false);
	const urls = useMemo(() => registerUrlExamples(row.slug), [row.slug]);
	const canShareAgent = !row.restrictToType || row.restrictToType === "AGENT";
	const canShareSource = !row.restrictToType || row.restrictToType === "SOURCE";

	return (
		<tr className="align-top hover:bg-slate-50">
			<td className="px-5 py-4">
				<div className="flex items-start gap-3">
					<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
						<Link2 className="h-5 w-5" />
					</span>
					<div className="min-w-0">
						<div className="font-mono text-sm font-semibold text-slate-950">
							{row.slug}
						</div>
						<div className="mt-1 max-w-xs truncate text-sm text-slate-500">
							{row.label || "No internal label"}
						</div>
					</div>
				</div>
			</td>
			<td className="px-5 py-4">
				{!row.restrictToType ? (
					<Badge variant="default">Both</Badge>
				) : (
					<Badge variant="info">
						{row.restrictToType === "AGENT" ? "Agent only" : "Source only"}
					</Badge>
				)}
				<p className="mt-1 text-xs text-slate-500">
					{referralAudienceLabel(row)}
				</p>
			</td>
			<td className="px-5 py-4">
				{row.active ? (
					<Badge variant="success">Active</Badge>
				) : (
					<Badge variant="default">Inactive</Badge>
				)}
			</td>
			<td className="px-5 py-4">
				<button
					type="button"
					onClick={() => setSignupsOpen(true)}
					className="text-left hover:underline"
					title="View signups"
				>
					<div className="text-base font-semibold text-slate-950">
						{row.signupCount}
					</div>
					<div className="text-xs text-slate-500">
						Agent {row.signupsByType.AGENT} · Source {row.signupsByType.SOURCE}
					</div>
				</button>
			</td>
			<td className="px-5 py-4">
				<div className="flex flex-col gap-2">
					{canShareAgent && (
						<ShareButton
							label="Copy agent URL"
							url={urls.agent}
							onCopy={onCopy}
						/>
					)}
					{canShareSource && (
						<ShareButton
							label="Copy source URL"
							url={urls.source}
							onCopy={onCopy}
						/>
					)}
				</div>
				<p className="mt-2 max-w-xs text-[11px] leading-4 text-slate-500">
					{urls.hint}
				</p>
			</td>
			<td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
				{formatDate(row.createdAt)}
			</td>
			<td className="px-5 py-4 text-right">
				<div className="flex flex-col items-end gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="gap-1 rounded-md border-slate-300 shadow-none"
						onClick={() => setSignupsOpen(true)}
					>
						<Users className="h-3.5 w-3.5" />
						View signups
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={isToggling}
						className={cn(
							"gap-1 rounded-md",
							row.active
								? "text-red-700 hover:bg-red-50"
								: "text-emerald-700 hover:bg-emerald-50",
						)}
						onClick={() => onToggleActive(row.id, !row.active)}
					>
						{row.active ? (
							<ToggleLeft className="h-3.5 w-3.5" />
						) : (
							<ToggleRight className="h-3.5 w-3.5" />
						)}
						{row.active ? "Deactivate" : "Activate"}
					</Button>
				</div>
				<ReferralSignupsModal
					linkId={row.id}
					slug={row.slug}
					open={signupsOpen}
					onClose={() => setSignupsOpen(false)}
				/>
			</td>
		</tr>
	);
}
