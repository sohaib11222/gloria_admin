import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Loader } from "../components/ui/Loader";
import {
	billingApi,
	agentBillingApi,
	Plan,
	PlanInterval,
	SourceSubscription,
	SubscriptionStatus,
	CreatePlanBody,
	UpdatePlanBody,
	SetSourceSubscriptionBody,
	AgentPlan,
	AgentSubscription,
	CreateAgentPlanBody,
	UpdateAgentPlanBody,
	SetAgentSubscriptionBody,
} from "../api/billing";
import { Company } from "../api/companies";
import http from "../lib/http";
import { cn, formatDate } from "../lib/utils";
import toast from "react-hot-toast";
import {
	AlertTriangle,
	Building2,
	CalendarDays,
	CheckCircle2,
	CreditCard,
	Edit,
	Euro,
	Infinity as InfinityIcon,
	Layers,
	MapPin,
	Plus,
	Settings,
	Users,
} from "lucide-react";

const INTERVAL_LABELS: Record<PlanInterval, string> = {
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	YEARLY: "Yearly",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
	active: "Active",
	canceled: "Canceled",
	past_due: "Past due",
	trialing: "Trialing",
};

const STATUS_VARIANTS: Record<
	SubscriptionStatus,
	"success" | "default" | "warning" | "info"
> = {
	active: "success",
	canceled: "default",
	past_due: "warning",
	trialing: "info",
};

function formatCurrency(cents: number) {
	return new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
	}).format(cents / 100);
}

/** Plain EUR string for admin text fields (e.g. 6.5, not cents). */
function formatEurInputFromCents(cents: number): string {
	if (!Number.isFinite(cents)) return "";
	const euros = Math.round(cents) / 100;
	if (Number.isInteger(euros)) return String(euros);
	const rounded = Math.round(euros * 10_000) / 10_000;
	return String(rounded)
		.replace(/(\.\d*?)0+$/, "$1")
		.replace(/\.$/, "");
}

/** Accepts "6.5", "6,5", "10.25". Returns integer cents or null if invalid. */
function parseEurAmountToCents(raw: string): number | null {
	const s = raw.trim().replace(/,/g, ".");
	if (s === "") return null;
	const euros = Number(s);
	if (!Number.isFinite(euros) || euros < 0) return null;
	return Math.round(euros * 100);
}

function planEffectivePriceCents(
	plan: Pick<Plan, "amountCents" | "pricePerBranchCents">,
): number {
	const per = plan.pricePerBranchCents ?? 0;
	return per > 0 ? per : plan.amountCents;
}

type BillingTab = "source" | "agent";

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
	helper?: React.ReactNode;
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
			{helper ? (
				<div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
					{helper}
				</div>
			) : null}
		</div>
	);
}

function SectionHeader({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
			<div>
				<h2 className="text-base font-semibold text-slate-950">{title}</h2>
				<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
					{description}
				</p>
			</div>
			{action ? (
				<div className="flex shrink-0 flex-wrap gap-2">{action}</div>
			) : null}
		</div>
	);
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
	if (limit <= 0) {
		return (
			<span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
				Unlimited
			</span>
		);
	}

	const percent = Math.round((used / limit) * 100);
	const isOver = used > limit;
	const isHigh = percent >= 80;

	return (
		<div className="min-w-[150px]">
			<div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
				<span>{used} used</span>
				<span>{limit} limit</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-slate-200">
				<div
					className={cn(
						"h-full rounded-full",
						isOver ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-emerald-500",
					)}
					style={{ width: `${Math.min(percent, 100)}%` }}
				/>
			</div>
		</div>
	);
}

function EmptyState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
			<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				<CreditCard className="h-6 w-6" />
			</span>
			<h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
		</div>
	);
}

export default function BillingPage() {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<BillingTab>("source");
	const [planModalOpen, setPlanModalOpen] = useState(false);
	const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const [selectedSource, setSelectedSource] = useState<Company | null>(null);
	const [selectedSub, setSelectedSub] = useState<SourceSubscription | null>(
		null,
	);
	const [subForm, setSubForm] = useState({
		planId: "",
		subscribedBranchCount: 1,
		status: "active" as SubscriptionStatus,
		currentPeriodEnd: "",
	});
	const [planForm, setPlanForm] = useState<CreatePlanBody>({
		name: "",
		interval: "MONTHLY",
		amountCents: 0,
		pricePerBranchCents: 500,
		branchLimit: 0,
	});
	/** Single EUR field in plan modal; both amountCents and pricePerBranchCents are set from this on save. */
	const [planPriceEurInput, setPlanPriceEurInput] = useState("");

	const { data: plansData, isLoading: plansLoading } = useQuery({
		queryKey: ["admin", "plans"],
		queryFn: () => billingApi.listPlans(),
	});
	const plans = plansData?.items ?? [];

	const { data: sourcesWithSubs, isLoading: sourcesLoading } = useQuery({
		queryKey: ["admin", "companies", "SOURCE", "subscriptions"],
		queryFn: async () => {
			const res = await http.get("/admin/companies", {
				params: { type: "SOURCE", limit: 500 },
			});
			const sourcesList: Company[] = Array.isArray(res.data?.items)
				? res.data.items
				: Array.isArray(res.data)
					? res.data
					: [];
			const subs: Record<string, SourceSubscription | null> = {};
			await Promise.all(
				sourcesList.slice(0, 100).map(async (s) => {
					try {
						const sub = await billingApi.getSourceSubscription(s.id);
						subs[s.id] = sub;
					} catch {
						subs[s.id] = null;
					}
				}),
			);
			return { sources: sourcesList, subscriptionsBySource: subs };
		},
	});
	const sources: Company[] = sourcesWithSubs?.sources ?? [];
	const subscriptionsBySource: Record<string, SourceSubscription | null> =
		sourcesWithSubs?.subscriptionsBySource ?? {};

	// Agent billing state
	const [agentPlanModalOpen, setAgentPlanModalOpen] = useState(false);
	const [editingAgentPlan, setEditingAgentPlan] = useState<AgentPlan | null>(
		null,
	);
	const [agentPlanForm, setAgentPlanForm] = useState<CreateAgentPlanBody>({
		name: "",
		interval: "MONTHLY",
		branchLimit: 0,
		defaultPriceCents: 500,
	});
	const [countryPrices, setCountryPrices] = useState<
		Array<{ countryCode: string; pricePerBranchCents: number }>
	>([]);
	const [agentSubscriptionModalOpen, setAgentSubscriptionModalOpen] =
		useState(false);
	const [selectedAgent, setSelectedAgent] = useState<Company | null>(null);
	const [selectedAgentSub, setSelectedAgentSub] = useState<
		(AgentSubscription & { effectiveBranchCount?: number }) | null
	>(null);
	const [agentSubForm, setAgentSubForm] = useState({
		planId: "",
		subscribedBranchCount: 1,
		status: "active" as SubscriptionStatus,
		currentPeriodEnd: "",
	});

	const { data: agentPlansData, isLoading: agentPlansLoading } = useQuery({
		queryKey: ["admin", "agent-plans"],
		queryFn: () => agentBillingApi.listAgentPlans(),
		enabled: activeTab === "agent",
	});
	const agentPlans = agentPlansData?.items ?? [];

	const { data: agentsRes, isLoading: agentsLoading } = useQuery({
		queryKey: ["admin", "companies", "AGENT"],
		queryFn: async () => {
			const res = await http.get("/admin/companies", {
				params: { type: "AGENT", limit: 500 },
			});
			return res.data;
		},
		enabled: activeTab === "agent",
	});
	const agents: Company[] = Array.isArray(agentsRes?.items)
		? agentsRes.items
		: Array.isArray(agentsRes)
			? agentsRes
			: [];
	const [agentSubsByAgent, setAgentSubsByAgent] = useState<
		Record<
			string,
			(AgentSubscription & { effectiveBranchCount?: number }) | null
		>
	>({});
	const [agentSubsVersion, setAgentSubsVersion] = useState(0);

	useEffect(() => {
		if (activeTab !== "agent" || agents.length === 0) return;
		let cancelled = false;
		const subs: Record<
			string,
			(AgentSubscription & { effectiveBranchCount?: number }) | null
		> = {};
		Promise.all(
			agents.slice(0, 100).map(async (a) => {
				try {
					const data = (await agentBillingApi.getAgentSubscription(
						a.id,
					)) as any;
					if (cancelled) return;
					if (data.subscription === null) subs[a.id] = null;
					else if (data.id && data.agentId) subs[a.id] = data;
					else subs[a.id] = null;
				} catch {
					if (!cancelled) subs[a.id] = null;
				}
			}),
		).then(() => {
			if (!cancelled) setAgentSubsByAgent(subs);
		});
		return () => {
			cancelled = true;
		};
	}, [activeTab, agents.length, agentSubsVersion]);

	const createPlanMutation = useMutation({
		mutationFn: (body: CreatePlanBody) => billingApi.createPlan(body),
		onSuccess: () => {
			toast.success("Plan created");
			queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
			setPlanModalOpen(false);
			setPlanForm({
				name: "",
				interval: "MONTHLY",
				amountCents: 0,
				pricePerBranchCents: 500,
				branchLimit: 0,
			});
			setPlanPriceEurInput(formatEurInputFromCents(500));
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to create plan"),
	});

	const updatePlanMutation = useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdatePlanBody }) =>
			billingApi.updatePlan(id, body),
		onSuccess: () => {
			toast.success("Plan updated");
			queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
			setPlanModalOpen(false);
			setEditingPlan(null);
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to update plan"),
	});

	const setSubscriptionMutation = useMutation({
		mutationFn: ({
			sourceId,
			body,
		}: {
			sourceId: string;
			body: SetSourceSubscriptionBody;
		}) => billingApi.setSourceSubscription(sourceId, body),
		onSuccess: () => {
			toast.success("Subscription updated");
			queryClient.invalidateQueries({ queryKey: ["admin"] });
			setSubscriptionModalOpen(false);
			setSelectedSource(null);
			setSelectedSub(null);
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to update subscription"),
	});

	const createAgentPlanMutation = useMutation({
		mutationFn: ({
			body,
			prices,
		}: {
			body: CreateAgentPlanBody;
			prices: Array<{ countryCode: string; pricePerBranchCents: number }>;
		}) =>
			agentBillingApi.createAgentPlan(body).then(async (plan) => {
				if (prices.length > 0) {
					await agentBillingApi.setAgentPlanCountryPrices(plan.id, {
						prices: prices.map((p) => ({ ...p, stripePriceId: null })),
					});
				}
				return plan;
			}),
		onSuccess: () => {
			toast.success("Agent plan created");
			queryClient.invalidateQueries({ queryKey: ["admin", "agent-plans"] });
			setAgentPlanModalOpen(false);
			setAgentPlanForm({
				name: "",
				interval: "MONTHLY",
				branchLimit: 0,
				defaultPriceCents: 500,
			});
			setCountryPrices([]);
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to create agent plan"),
	});

	const updateAgentPlanMutation = useMutation({
		mutationFn: async ({
			id,
			body,
			prices,
		}: {
			id: string;
			body: UpdateAgentPlanBody;
			prices?: Array<{ countryCode: string; pricePerBranchCents: number }>;
		}) => {
			await agentBillingApi.updateAgentPlan(id, body);
			if (prices && prices.length > 0) {
				await agentBillingApi.setAgentPlanCountryPrices(id, {
					prices: prices.map((p) => ({ ...p, stripePriceId: null })),
				});
			}
		},
		onSuccess: () => {
			toast.success("Agent plan updated");
			queryClient.invalidateQueries({ queryKey: ["admin", "agent-plans"] });
			setAgentPlanModalOpen(false);
			setEditingAgentPlan(null);
		},
		onError: (e: any) =>
			toast.error(e.response?.data?.message || "Failed to update agent plan"),
	});

	const setAgentSubscriptionMutation = useMutation({
		mutationFn: ({
			agentId,
			body,
		}: {
			agentId: string;
			body: SetAgentSubscriptionBody;
		}) => agentBillingApi.setAgentSubscription(agentId, body),
		onSuccess: () => {
			toast.success("Agent subscription updated");
			queryClient.invalidateQueries({ queryKey: ["admin"] });
			queryClient.invalidateQueries({
				queryKey: ["admin", "companies", "AGENT"],
			});
			setAgentSubsVersion((v) => v + 1);
			setAgentSubscriptionModalOpen(false);
			setSelectedAgent(null);
			setSelectedAgentSub(null);
		},
		onError: (e: any) =>
			toast.error(
				e.response?.data?.message || "Failed to update agent subscription",
			),
	});

	const openEditPlan = (plan: Plan) => {
		setEditingPlan(plan);
		const effective = planEffectivePriceCents(plan);
		setPlanForm({
			name: plan.name,
			interval: plan.interval,
			amountCents: plan.amountCents,
			pricePerBranchCents: plan.pricePerBranchCents ?? plan.amountCents,
			branchLimit: plan.branchLimit ?? 0,
		});
		setPlanPriceEurInput(formatEurInputFromCents(effective));
		setPlanModalOpen(true);
	};

	const openCreatePlan = () => {
		setEditingPlan(null);
		setPlanForm({
			name: "",
			interval: "MONTHLY",
			amountCents: 0,
			pricePerBranchCents: 500,
			branchLimit: 0,
		});
		setPlanPriceEurInput(formatEurInputFromCents(500));
		setPlanModalOpen(true);
	};

	const handleSavePlan = () => {
		const cents = parseEurAmountToCents(planPriceEurInput);
		if (cents === null) {
			toast.error("Enter a valid price in EUR (e.g. 6.5 or 10.25)");
			return;
		}
		const payload: CreatePlanBody = {
			...planForm,
			amountCents: cents,
			pricePerBranchCents: cents,
		};
		if (editingPlan) {
			const prevEffective = planEffectivePriceCents(editingPlan);
			const pricingChanged =
				cents !== prevEffective || planForm.interval !== editingPlan.interval;
			updatePlanMutation.mutate({
				id: editingPlan.id,
				body: {
					name: payload.name,
					interval: payload.interval,
					amountCents: payload.amountCents,
					pricePerBranchCents: payload.pricePerBranchCents,
					branchLimit: payload.branchLimit,
					// Drop cached Stripe price so checkout recreates an EUR price for the new per-branch amount / interval.
					...(pricingChanged && editingPlan.stripePriceId
						? { stripePriceId: null as null }
						: {}),
				},
			});
		} else {
			createPlanMutation.mutate(payload);
		}
	};

	const openEditSubscription = (source: Company) => {
		const sub = subscriptionsBySource[source.id];
		setSelectedSource(source);
		setSelectedSub(sub ?? null);
		setSubForm({
			planId: sub?.planId || (plans[0]?.id ?? ""),
			subscribedBranchCount: sub?.subscribedBranchCount ?? 1,
			status: sub?.status ?? "active",
			currentPeriodEnd: sub?.currentPeriodEnd
				? new Date(sub.currentPeriodEnd).toISOString().slice(0, 16)
				: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
						.toISOString()
						.slice(0, 16),
		});
		setSubscriptionModalOpen(true);
	};

	const handleSaveSubscription = () => {
		if (!selectedSource || !subForm.planId) return;
		const body: SetSourceSubscriptionBody = {
			planId: subForm.planId,
			subscribedBranchCount: subForm.subscribedBranchCount,
			status: subForm.status,
		};
		if (subForm.currentPeriodEnd) {
			body.currentPeriodEnd = new Date(subForm.currentPeriodEnd).toISOString();
		}
		setSubscriptionMutation.mutate({
			sourceId: selectedSource.id,
			body,
		});
	};

	const openCreateAgentPlan = () => {
		setEditingAgentPlan(null);
		setAgentPlanForm({
			name: "",
			interval: "MONTHLY",
			branchLimit: 0,
			defaultPriceCents: 500,
		});
		setCountryPrices([]);
		setAgentPlanModalOpen(true);
	};

	const openEditAgentPlan = (plan: AgentPlan) => {
		setEditingAgentPlan(plan);
		setAgentPlanForm({
			name: plan.name,
			interval: plan.interval,
			branchLimit: plan.branchLimit,
			defaultPriceCents: plan.defaultPriceCents,
		});
		setCountryPrices(
			(plan.countryPrices ?? []).map((p) => ({
				countryCode: p.countryCode,
				pricePerBranchCents: p.pricePerBranchCents,
			})),
		);
		setAgentPlanModalOpen(true);
	};

	const handleSaveAgentPlan = () => {
		if (editingAgentPlan) {
			updateAgentPlanMutation.mutate({
				id: editingAgentPlan.id,
				body: {
					name: agentPlanForm.name,
					interval: agentPlanForm.interval,
					branchLimit: agentPlanForm.branchLimit,
					defaultPriceCents: agentPlanForm.defaultPriceCents,
				},
				prices: countryPrices,
			});
		} else {
			createAgentPlanMutation.mutate({
				body: agentPlanForm,
				prices: countryPrices,
			});
		}
	};

	const openEditAgentSubscription = (agent: Company) => {
		const sub = agentSubsByAgent[agent.id];
		setSelectedAgent(agent);
		setSelectedAgentSub(sub ?? null);
		setAgentSubForm({
			planId: sub?.agentPlanId ?? agentPlans[0]?.id ?? "",
			subscribedBranchCount: sub?.subscribedBranchCount ?? 1,
			status: (sub?.status ?? "active") as SubscriptionStatus,
			currentPeriodEnd: sub?.currentPeriodEnd
				? new Date(sub.currentPeriodEnd).toISOString().slice(0, 16)
				: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
						.toISOString()
						.slice(0, 16),
		});
		setAgentSubscriptionModalOpen(true);
	};

	const handleSaveAgentSubscription = () => {
		if (!selectedAgent || !agentSubForm.planId) return;
		const body: SetAgentSubscriptionBody = {
			planId: agentSubForm.planId,
			subscribedBranchCount: agentSubForm.subscribedBranchCount,
			status: agentSubForm.status,
		};
		if (agentSubForm.currentPeriodEnd) {
			body.currentPeriodEnd = new Date(
				agentSubForm.currentPeriodEnd,
			).toISOString();
		}
		setAgentSubscriptionMutation.mutate({ agentId: selectedAgent.id, body });
	};

	const totalSources = sources.length;
	const activeSubs = sources.filter(
		(s) => subscriptionsBySource[s.id]?.status === "active",
	).length;
	const unassignedSources = sources.filter(
		(s) => !subscriptionsBySource[s.id],
	).length;
	const totalBranches = sources.reduce(
		(sum, s) => sum + (subscriptionsBySource[s.id]?.branchCount ?? 0),
		0,
	);
	const totalLocations = sources.reduce(
		(sum, s) => sum + (subscriptionsBySource[s.id]?.locationCount ?? 0),
		0,
	);

	const agentSubscriptions = Object.values(agentSubsByAgent).filter(
		Boolean,
	) as Array<AgentSubscription & { effectiveBranchCount?: number }>;
	const activeAgentSubs = agentSubscriptions.filter(
		(s) => s.status === "active",
	).length;
	const totalAgentBranches = agentSubscriptions.reduce(
		(sum, s) => sum + (s.effectiveBranchCount ?? 0),
		0,
	);
	const unassignedAgents = Math.max(
		agents.length - agentSubscriptions.length,
		0,
	);

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex items-start gap-4">
							<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<CreditCard className="h-6 w-6" />
							</span>
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
									Admin billing
								</p>
								<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
									Billing & plans
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Configure source and agent plans, assign subscriptions, track
									branch usage, and keep billing status easy to review.
								</p>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
							<button
								type="button"
								onClick={() => setActiveTab("source")}
								className={cn(
									"rounded-md border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100",
									activeTab === "source"
										? "border-blue-300 bg-blue-50 shadow-sm"
										: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
											<Building2 className="h-4 w-4 text-blue-700" />
											Source billing
										</div>
										<p className="mt-2 text-sm leading-5 text-slate-600">
											Supplier plans, branch quotas, and source subscription
											status.
										</p>
									</div>
									<Badge
										variant={activeTab === "source" ? "info" : "default"}
										size="sm"
									>
										{sources.length} sources
									</Badge>
								</div>
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("agent")}
								className={cn(
									"rounded-md border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100",
									activeTab === "agent"
										? "border-blue-300 bg-blue-50 shadow-sm"
										: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
											<Users className="h-4 w-4 text-blue-700" />
											Agent billing
										</div>
										<p className="mt-2 text-sm leading-5 text-slate-600">
											Agent plans, country prices, and agent subscription
											limits.
										</p>
									</div>
									<Badge
										variant={activeTab === "agent" ? "info" : "default"}
										size="sm"
									>
										{agents.length} agents
									</Badge>
								</div>
							</button>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Billing rules
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Use this page for operational billing controls. Checkout and
							invoices remain driven by Stripe.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Euro className="h-4 w-4 text-slate-500" />
									EUR pricing
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Source plans store a per-branch EUR amount per interval.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<InfinityIcon className="h-4 w-4 text-slate-500" />
									Locations unlimited
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Only branch limits are enforced. Location count is shown for
									context.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<AlertTriangle className="h-4 w-4 text-slate-500" />
									Review unassigned accounts
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Accounts without a plan cannot be billed correctly.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			{activeTab === "source" && (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<StatCard
							label="Total sources"
							value={totalSources}
							helper={`${plans.length} source plan${plans.length === 1 ? "" : "s"} configured`}
							icon={<Building2 className="h-5 w-5" />}
						/>
						<StatCard
							label="Active subscriptions"
							value={activeSubs}
							helper={
								unassignedSources > 0
									? `${unassignedSources} source${unassignedSources === 1 ? "" : "s"} without a plan`
									: "Every source has a billing record"
							}
							icon={<CheckCircle2 className="h-5 w-5" />}
							tone={unassignedSources > 0 ? "amber" : "emerald"}
						/>
						<StatCard
							label="Imported branches"
							value={totalBranches}
							helper="Used to compare against subscribed branch limits"
							icon={<Layers className="h-5 w-5" />}
							tone="blue"
						/>
						<StatCard
							label="Locations tracked"
							value={totalLocations}
							helper="Unlimited across all source plans"
							icon={<MapPin className="h-5 w-5" />}
							tone="slate"
						/>
					</div>

					<section className="rounded-md border border-slate-200 bg-white">
						<SectionHeader
							title="Source plan catalog"
							description="Create the reusable plan templates that are assigned to source companies. Pricing is per branch and per interval."
							action={
								<Button
									onClick={openCreatePlan}
									variant="primary"
									size="sm"
									className="rounded-md shadow-none"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create plan
								</Button>
							}
						/>
						<div className="p-0">
							{plansLoading ? (
								<div className="flex min-h-40 items-center justify-center p-8">
									<Loader />
								</div>
							) : plans.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-slate-200 text-sm">
										<thead className="bg-slate-50">
											<tr>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Plan
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Billing interval
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Price / branch
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Default branch limit
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Locations
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
											{plans.map((plan) => (
												<tr key={plan.id} className="hover:bg-slate-50">
													<td className="px-5 py-4 align-top">
														<div className="font-semibold text-slate-950">
															{plan.name}
														</div>
														<div className="mt-1 text-xs text-slate-500">
															ID {plan.id.slice(0, 8)}
														</div>
													</td>
													<td className="px-5 py-4 align-top text-slate-700">
														{INTERVAL_LABELS[plan.interval]}
													</td>
													<td className="px-5 py-4 align-top font-semibold text-slate-950">
														{formatCurrency(planEffectivePriceCents(plan))}
													</td>
													<td className="px-5 py-4 align-top text-slate-700">
														{plan.branchLimit === 0
															? "Set per subscription"
															: `${plan.branchLimit} branches`}
													</td>
													<td className="px-5 py-4 align-top">
														<Badge variant="info" size="sm">
															Unlimited
														</Badge>
													</td>
													<td className="px-5 py-4 align-top">
														<Badge
															variant={plan.active ? "success" : "default"}
														>
															{plan.active ? "Active" : "Inactive"}
														</Badge>
													</td>
													<td className="px-5 py-4 align-top text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditPlan(plan)}
															className="rounded-md text-slate-700 hover:bg-slate-100"
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<EmptyState
									title="No source plans yet"
									description="Create a source plan before assigning billing to source companies."
								/>
							)}
						</div>
					</section>

					<section className="rounded-md border border-slate-200 bg-white">
						<SectionHeader
							title="Source subscriptions"
							description="Assign a plan to each source, set branch quotas, and review expiry or usage problems at a glance."
						/>
						<div className="p-0">
							{sourcesLoading ? (
								<div className="flex min-h-48 items-center justify-center p-8">
									<Loader />
								</div>
							) : sources.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-slate-200 text-sm">
										<thead className="bg-slate-50">
											<tr>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Source
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Assigned plan
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Branch usage
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Locations
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Billing status
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Expires
												</th>
												<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 bg-white">
											{sources.map((source) => {
												const sub = subscriptionsBySource[source.id];
												const isExpired = sub?.currentPeriodEnd
													? new Date(sub.currentPeriodEnd) < new Date()
													: true;
												const branchCount = sub?.branchCount ?? 0;
												const locationCount = sub?.locationCount ?? 0;
												const branchLimit = sub?.subscribedBranchCount ?? 0;
												const isOverLimit =
													branchLimit > 0 && branchCount > branchLimit;

												return (
													<tr key={source.id} className="hover:bg-slate-50">
														<td className="px-5 py-4 align-top">
															<div className="max-w-xs truncate font-semibold text-slate-950">
																{source.companyName}
															</div>
															<div className="mt-1 max-w-xs truncate text-xs text-slate-500">
																{source.email}
															</div>
															{source.companyCode ? (
																<code className="mt-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
																	{source.companyCode}
																</code>
															) : null}
														</td>
														<td className="px-5 py-4 align-top">
															{sub?.plan?.name ? (
																<div>
																	<div className="font-medium text-slate-900">
																		{sub.plan.name}
																	</div>
																	<div className="mt-1 text-xs text-slate-500">
																		{formatCurrency(
																			planEffectivePriceCents(sub.plan),
																		)}{" "}
																		/ branch
																	</div>
																</div>
															) : (
																<Badge variant="warning" size="sm">
																	No plan assigned
																</Badge>
															)}
														</td>
														<td className="px-5 py-4 align-top">
															{sub ? (
																<UsageBar
																	used={branchCount}
																	limit={branchLimit}
																/>
															) : (
																<span className="text-slate-400">—</span>
															)}
															{isOverLimit ? (
																<p className="mt-1 text-xs font-medium text-red-600">
																	Over limit
																</p>
															) : null}
														</td>
														<td className="px-5 py-4 align-top">
															{sub ? (
																<div className="flex items-center gap-2 text-slate-700">
																	<span className="font-medium">
																		{locationCount}
																	</span>
																	<Badge variant="info" size="sm">
																		Unlimited
																	</Badge>
																</div>
															) : (
																<span className="text-slate-400">—</span>
															)}
														</td>
														<td className="px-5 py-4 align-top">
															{sub ? (
																<Badge
																	variant={
																		sub.status === "active" && !isExpired
																			? "success"
																			: sub.status === "past_due" || isExpired
																				? "warning"
																				: STATUS_VARIANTS[sub.status]
																	}
																>
																	{STATUS_LABELS[sub.status] || sub.status}
																	{isExpired && sub.status === "active"
																		? " · expired"
																		: ""}
																</Badge>
															) : (
																<Badge variant="default">Unassigned</Badge>
															)}
														</td>
														<td className="px-5 py-4 align-top text-sm text-slate-600">
															{sub?.currentPeriodEnd ? (
																<span className="inline-flex items-center gap-1.5">
																	<CalendarDays className="h-4 w-4 text-slate-400" />
																	{formatDate(sub.currentPeriodEnd)}
																</span>
															) : (
																"—"
															)}
														</td>
														<td className="px-5 py-4 align-top text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => openEditSubscription(source)}
																className="rounded-md text-slate-700 hover:bg-slate-100"
															>
																<Settings className="mr-2 h-4 w-4" />
																Manage
															</Button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							) : (
								<EmptyState
									title="No source companies"
									description="Create or approve source companies before assigning source billing."
								/>
							)}
						</div>
					</section>

					<Modal
						isOpen={planModalOpen}
						onClose={() => {
							setPlanModalOpen(false);
							setEditingPlan(null);
						}}
						title={editingPlan ? "Edit source plan" : "Create source plan"}
						size="lg"
					>
						<div className="space-y-5">
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
								Source plans define the default billing template. Actual branch
								allowance can still be set per source subscription.
							</div>
							<Input
								label="Plan name"
								value={planForm.name}
								onChange={(e) =>
									setPlanForm((f) => ({ ...f, name: e.target.value }))
								}
								placeholder="e.g. Monthly supplier plan"
							/>
							<Select
								label="Billing interval"
								value={planForm.interval}
								onChange={(e) =>
									setPlanForm((f) => ({
										...f,
										interval: e.target.value as PlanInterval,
									}))
								}
								options={[
									{ value: "WEEKLY", label: "Weekly" },
									{ value: "MONTHLY", label: "Monthly" },
									{ value: "YEARLY", label: "Yearly" },
								]}
							/>
							<Input
								label="Price per branch (EUR)"
								type="text"
								inputMode="decimal"
								autoComplete="off"
								value={planPriceEurInput}
								onChange={(e) => setPlanPriceEurInput(e.target.value)}
								placeholder="e.g. 6.5"
								helperText="Decimals are allowed. The backend stores this as cents for Stripe."
							/>
							<Input
								label="Default branch limit"
								type="number"
								value={planForm.branchLimit}
								onChange={(e) =>
									setPlanForm((f) => ({
										...f,
										branchLimit: parseInt(e.target.value, 10) || 0,
									}))
								}
								helperText="Use 0 to set the branch limit individually on each source subscription."
							/>
							<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
								<strong>Locations are unlimited.</strong> Only branch count
								affects source subscription limits.
							</div>
							<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
								<strong>Stripe note:</strong> Source checkout uses EUR recurring
								prices. Changing amount or interval clears cached Stripe price
								IDs when required.
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="secondary"
									onClick={() => setPlanModalOpen(false)}
									className="rounded-md shadow-none"
								>
									Cancel
								</Button>
								<Button
									variant="primary"
									onClick={handleSavePlan}
									disabled={!planForm.name}
									className="rounded-md shadow-none"
								>
									{editingPlan ? "Update plan" : "Create plan"}
								</Button>
							</div>
						</div>
					</Modal>

					<Modal
						isOpen={subscriptionModalOpen}
						onClose={() => {
							setSubscriptionModalOpen(false);
							setSelectedSource(null);
							setSelectedSub(null);
						}}
						title={
							selectedSource
								? `Manage source subscription · ${selectedSource.companyName}`
								: "Manage source subscription"
						}
						size="lg"
					>
						<div className="space-y-5">
							{selectedSub ? (
								<div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Current branches
										</p>
										<p className="mt-1 font-semibold text-slate-950">
											{selectedSub.branchCount ?? 0}
										</p>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Current locations
										</p>
										<p className="mt-1 font-semibold text-slate-950">
											{selectedSub.locationCount ?? 0}{" "}
											<span className="font-normal text-slate-500">
												unlimited
											</span>
										</p>
									</div>
								</div>
							) : null}

							<Select
								label="Plan"
								value={subForm.planId}
								onChange={(e) =>
									setSubForm((f) => ({ ...f, planId: e.target.value }))
								}
								options={
									plans.length > 0
										? plans.map((p) => ({
												value: p.id,
												label: `${p.name} (${formatCurrency(planEffectivePriceCents(p))} / branch / ${p.interval.toLowerCase()})`,
											}))
										: [{ value: "", label: "No source plans available" }]
								}
							/>
							<Input
								label="Branch limit"
								type="number"
								min={0}
								value={subForm.subscribedBranchCount}
								onChange={(e) =>
									setSubForm((f) => ({
										...f,
										subscribedBranchCount: parseInt(e.target.value, 10) || 0,
									}))
								}
								helperText="Set to 0 for unlimited branches on this source."
							/>
							<Select
								label="Subscription status"
								value={subForm.status}
								onChange={(e) =>
									setSubForm((f) => ({
										...f,
										status: e.target.value as SubscriptionStatus,
									}))
								}
								options={[
									{ value: "active", label: "Active" },
									{ value: "trialing", label: "Trialing" },
									{ value: "past_due", label: "Past due" },
									{ value: "canceled", label: "Canceled" },
								]}
							/>
							<Input
								label="Expiry date"
								type="datetime-local"
								value={subForm.currentPeriodEnd}
								onChange={(e) =>
									setSubForm((f) => ({
										...f,
										currentPeriodEnd: e.target.value,
									}))
								}
							/>
							<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
								Locations remain unlimited. This form only changes plan, status,
								expiry, and branch allowance.
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="secondary"
									onClick={() => setSubscriptionModalOpen(false)}
									className="rounded-md shadow-none"
								>
									Cancel
								</Button>
								<Button
									variant="primary"
									onClick={handleSaveSubscription}
									disabled={
										!selectedSource ||
										!subForm.planId ||
										setSubscriptionMutation.isPending
									}
									className="rounded-md shadow-none"
								>
									{setSubscriptionMutation.isPending
										? "Saving..."
										: "Save subscription"}
								</Button>
							</div>
						</div>
					</Modal>
				</>
			)}

			{activeTab === "agent" && (
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<StatCard
							label="Total agents"
							value={agents.length}
							helper={`${agentPlans.length} agent plan${agentPlans.length === 1 ? "" : "s"} configured`}
							icon={<Users className="h-5 w-5" />}
						/>
						<StatCard
							label="Active subscriptions"
							value={activeAgentSubs}
							helper={
								unassignedAgents > 0
									? `${unassignedAgents} agent${unassignedAgents === 1 ? "" : "s"} without a plan`
									: "Every loaded agent has a billing record"
							}
							icon={<CheckCircle2 className="h-5 w-5" />}
							tone={unassignedAgents > 0 ? "amber" : "emerald"}
						/>
						<StatCard
							label="Effective branches"
							value={totalAgentBranches}
							helper="Calculated from agent subscription coverage"
							icon={<Layers className="h-5 w-5" />}
							tone="blue"
						/>
						<StatCard
							label="Country pricing"
							value={agentPlans.reduce(
								(sum, p) => sum + (p.countryPrices?.length ?? 0),
								0,
							)}
							helper="Overrides default plan prices by billing country"
							icon={<Euro className="h-5 w-5" />}
							tone="slate"
						/>
					</div>

					<section className="rounded-md border border-slate-200 bg-white">
						<SectionHeader
							title="Agent plan catalog"
							description="Define pricing templates for agents. Country-specific overrides can be added when a country needs a custom per-branch price."
							action={
								<Button
									onClick={openCreateAgentPlan}
									variant="primary"
									size="sm"
									className="rounded-md shadow-none"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create agent plan
								</Button>
							}
						/>
						<div className="p-0">
							{agentPlansLoading ? (
								<div className="flex min-h-40 items-center justify-center p-8">
									<Loader />
								</div>
							) : agentPlans.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-slate-200 text-sm">
										<thead className="bg-slate-50">
											<tr>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Plan
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Interval
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Branch limit
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Default price
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Country overrides
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
											{agentPlans.map((plan) => (
												<tr key={plan.id} className="hover:bg-slate-50">
													<td className="px-5 py-4 align-top">
														<div className="font-semibold text-slate-950">
															{plan.name}
														</div>
														<div className="mt-1 text-xs text-slate-500">
															ID {plan.id.slice(0, 8)}
														</div>
													</td>
													<td className="px-5 py-4 align-top text-slate-700">
														{INTERVAL_LABELS[plan.interval]}
													</td>
													<td className="px-5 py-4 align-top text-slate-700">
														{plan.branchLimit === 0
															? "Unlimited"
															: `${plan.branchLimit} branches`}
													</td>
													<td className="px-5 py-4 align-top font-semibold text-slate-950">
														{formatCurrency(plan.defaultPriceCents)}
													</td>
													<td className="px-5 py-4 align-top">
														{plan.countryPrices?.length ? (
															<div className="flex flex-wrap gap-1.5">
																{plan.countryPrices.slice(0, 4).map((p) => (
																	<span
																		key={p.id}
																		className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
																	>
																		{p.countryCode}:{" "}
																		{formatCurrency(p.pricePerBranchCents)}
																	</span>
																))}
																{plan.countryPrices.length > 4 ? (
																	<span className="text-xs text-slate-500">
																		+{plan.countryPrices.length - 4} more
																	</span>
																) : null}
															</div>
														) : (
															<span className="text-slate-400">None</span>
														)}
													</td>
													<td className="px-5 py-4 align-top">
														<Badge
															variant={plan.active ? "success" : "default"}
														>
															{plan.active ? "Active" : "Inactive"}
														</Badge>
													</td>
													<td className="px-5 py-4 align-top text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditAgentPlan(plan)}
															className="rounded-md text-slate-700 hover:bg-slate-100"
														>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<EmptyState
									title="No agent plans yet"
									description="Create an agent plan before assigning billing to agent companies."
								/>
							)}
						</div>
					</section>

					<section className="rounded-md border border-slate-200 bg-white">
						<SectionHeader
							title="Agent subscriptions"
							description="Assign each agent to a billing plan and review subscribed vs effective branch counts."
						/>
						<div className="p-0">
							{agentsLoading ? (
								<div className="flex min-h-48 items-center justify-center p-8">
									<Loader />
								</div>
							) : agents.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-slate-200 text-sm">
										<thead className="bg-slate-50">
											<tr>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Agent
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Assigned plan
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Subscribed branches
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Effective branches
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Billing status
												</th>
												<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Expires
												</th>
												<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 bg-white">
											{agents.map((agent) => {
												const sub = agentSubsByAgent[agent.id];
												const isExpired = sub?.currentPeriodEnd
													? new Date(sub.currentPeriodEnd) < new Date()
													: false;
												return (
													<tr key={agent.id} className="hover:bg-slate-50">
														<td className="px-5 py-4 align-top">
															<div className="max-w-xs truncate font-semibold text-slate-950">
																{agent.companyName}
															</div>
															<div className="mt-1 max-w-xs truncate text-xs text-slate-500">
																{agent.email}
															</div>
															{agent.billingCountryCode ? (
																<code className="mt-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
																	Billing {agent.billingCountryCode}
																</code>
															) : null}
														</td>
														<td className="px-5 py-4 align-top">
															{sub?.agentPlan?.name ? (
																<div>
																	<div className="font-medium text-slate-900">
																		{sub.agentPlan.name}
																	</div>
																	<div className="mt-1 text-xs text-slate-500">
																		{formatCurrency(
																			sub.agentPlan.defaultPriceCents,
																		)}{" "}
																		default
																	</div>
																</div>
															) : (
																<Badge variant="warning" size="sm">
																	No plan assigned
																</Badge>
															)}
														</td>
														<td className="px-5 py-4 align-top text-slate-700">
															{sub
																? sub.subscribedBranchCount === 0
																	? "Unlimited"
																	: sub.subscribedBranchCount
																: "—"}
														</td>
														<td className="px-5 py-4 align-top font-medium text-slate-950">
															{sub?.effectiveBranchCount ?? "—"}
														</td>
														<td className="px-5 py-4 align-top">
															{sub ? (
																<Badge
																	variant={
																		sub.status === "active" && !isExpired
																			? "success"
																			: sub.status === "past_due" || isExpired
																				? "warning"
																				: STATUS_VARIANTS[sub.status]
																	}
																>
																	{STATUS_LABELS[sub.status] || sub.status}
																	{isExpired && sub.status === "active"
																		? " · expired"
																		: ""}
																</Badge>
															) : (
																<Badge variant="default">Unassigned</Badge>
															)}
														</td>
														<td className="px-5 py-4 align-top text-sm text-slate-600">
															{sub?.currentPeriodEnd ? (
																<span className="inline-flex items-center gap-1.5">
																	<CalendarDays className="h-4 w-4 text-slate-400" />
																	{formatDate(sub.currentPeriodEnd)}
																</span>
															) : (
																"—"
															)}
														</td>
														<td className="px-5 py-4 align-top text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => openEditAgentSubscription(agent)}
																className="rounded-md text-slate-700 hover:bg-slate-100"
															>
																<Settings className="mr-2 h-4 w-4" />
																Manage
															</Button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							) : (
								<EmptyState
									title="No agent companies"
									description="Create or approve agent companies before assigning agent billing."
								/>
							)}
						</div>
					</section>
				</>
			)}

			<Modal
				isOpen={agentPlanModalOpen}
				onClose={() => {
					setAgentPlanModalOpen(false);
					setEditingAgentPlan(null);
				}}
				title={editingAgentPlan ? "Edit agent plan" : "Create agent plan"}
				size="lg"
			>
				<div className="space-y-5">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
						Agent plans can include country price overrides. If no country
						override matches, the default price is used.
					</div>
					<Input
						label="Plan name"
						value={agentPlanForm.name}
						onChange={(e) =>
							setAgentPlanForm((f) => ({ ...f, name: e.target.value }))
						}
						placeholder="e.g. Agent monthly plan"
					/>
					<Select
						label="Billing interval"
						value={agentPlanForm.interval}
						onChange={(e) =>
							setAgentPlanForm((f) => ({
								...f,
								interval: e.target.value as PlanInterval,
							}))
						}
						options={[
							{ value: "WEEKLY", label: "Weekly" },
							{ value: "MONTHLY", label: "Monthly" },
							{ value: "YEARLY", label: "Yearly" },
						]}
					/>
					<Input
						label="Branch limit"
						type="number"
						min={0}
						value={agentPlanForm.branchLimit}
						onChange={(e) =>
							setAgentPlanForm((f) => ({
								...f,
								branchLimit: parseInt(e.target.value, 10) || 0,
							}))
						}
						helperText="Use 0 for unlimited branches."
					/>
					<Input
						label="Default price per branch (cents)"
						type="number"
						min={0}
						value={agentPlanForm.defaultPriceCents}
						onChange={(e) =>
							setAgentPlanForm((f) => ({
								...f,
								defaultPriceCents: parseInt(e.target.value, 10) || 0,
							}))
						}
						helperText={`Current value: ${formatCurrency(agentPlanForm.defaultPriceCents || 0)}`}
					/>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Country price overrides
						</label>
						<p className="mt-1 text-xs text-gray-500">
							Optional. Use ISO country code and price per branch in cents, for
							example IN = 200.
						</p>
						<div className="mt-3 space-y-2">
							{countryPrices.map((p, i) => (
								<div
									key={`${p.countryCode}-${i}`}
									className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[120px_1fr_auto] sm:items-center"
								>
									<Input
										placeholder="IN"
										value={p.countryCode}
										onChange={(e) =>
											setCountryPrices((prev) =>
												prev.map((x, j) =>
													j === i
														? {
																...x,
																countryCode: e.target.value
																	.toUpperCase()
																	.slice(0, 2),
															}
														: x,
												),
											)
										}
									/>
									<Input
										type="number"
										placeholder="Cents"
										value={p.pricePerBranchCents}
										onChange={(e) =>
											setCountryPrices((prev) =>
												prev.map((x, j) =>
													j === i
														? {
																...x,
																pricePerBranchCents:
																	parseInt(e.target.value, 10) || 0,
															}
														: x,
												),
											)
										}
										helperText={formatCurrency(p.pricePerBranchCents || 0)}
									/>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setCountryPrices((prev) => prev.filter((_, j) => j !== i))
										}
										className="rounded-md text-red-700 hover:bg-red-50"
									>
										Remove
									</Button>
								</div>
							))}
							<Button
								variant="secondary"
								size="sm"
								onClick={() =>
									setCountryPrices((prev) => [
										...prev,
										{ countryCode: "", pricePerBranchCents: 0 },
									])
								}
								className="rounded-md shadow-none"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add country override
							</Button>
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="secondary"
							onClick={() => setAgentPlanModalOpen(false)}
							className="rounded-md shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSaveAgentPlan}
							disabled={
								!agentPlanForm.name ||
								createAgentPlanMutation.isPending ||
								updateAgentPlanMutation.isPending
							}
							className="rounded-md shadow-none"
						>
							{editingAgentPlan
								? updateAgentPlanMutation.isPending
									? "Saving..."
									: "Update plan"
								: createAgentPlanMutation.isPending
									? "Creating..."
									: "Create plan"}
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={agentSubscriptionModalOpen}
				onClose={() => {
					setAgentSubscriptionModalOpen(false);
					setSelectedAgent(null);
					setSelectedAgentSub(null);
				}}
				title={
					selectedAgent
						? `Manage agent subscription · ${selectedAgent.companyName}`
						: "Manage agent subscription"
				}
				size="lg"
			>
				<div className="space-y-5">
					{selectedAgentSub ? (
						<div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Effective branches
							</p>
							<p className="mt-1 font-semibold text-slate-950">
								{selectedAgentSub.effectiveBranchCount ?? 0}
							</p>
						</div>
					) : null}
					<Select
						label="Plan"
						value={agentSubForm.planId}
						onChange={(e) =>
							setAgentSubForm((f) => ({ ...f, planId: e.target.value }))
						}
						options={
							agentPlans.length > 0
								? agentPlans.map((p) => ({
										value: p.id,
										label: `${p.name} (${formatCurrency(p.defaultPriceCents)} default)`,
									}))
								: [{ value: "", label: "No agent plans available" }]
						}
					/>
					<Input
						label="Subscribed branch count"
						type="number"
						min={0}
						value={agentSubForm.subscribedBranchCount}
						onChange={(e) =>
							setAgentSubForm((f) => ({
								...f,
								subscribedBranchCount: parseInt(e.target.value, 10) || 0,
							}))
						}
						helperText="Use 0 for unlimited branches."
					/>
					<Select
						label="Subscription status"
						value={agentSubForm.status}
						onChange={(e) =>
							setAgentSubForm((f) => ({
								...f,
								status: e.target.value as SubscriptionStatus,
							}))
						}
						options={[
							{ value: "active", label: "Active" },
							{ value: "trialing", label: "Trialing" },
							{ value: "past_due", label: "Past due" },
							{ value: "canceled", label: "Canceled" },
						]}
					/>
					<Input
						label="Expiry date"
						type="datetime-local"
						value={agentSubForm.currentPeriodEnd}
						onChange={(e) =>
							setAgentSubForm((f) => ({
								...f,
								currentPeriodEnd: e.target.value,
							}))
						}
					/>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="secondary"
							onClick={() => setAgentSubscriptionModalOpen(false)}
							className="rounded-md shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSaveAgentSubscription}
							disabled={
								!selectedAgent ||
								!agentSubForm.planId ||
								setAgentSubscriptionMutation.isPending
							}
							className="rounded-md shadow-none"
						>
							{setAgentSubscriptionMutation.isPending
								? "Saving..."
								: "Save subscription"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
