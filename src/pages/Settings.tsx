import React, { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	Activity,
	CheckCircle2,
	Database,
	Globe2,
	Info,
	Mail,
	Plus,
	Save,
	Send,
	Server,
	Settings as SettingsIcon,
	Shield,
	ShieldCheck,
	TestTube,
	Trash2,
	X,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { companyWhitelistApi } from "../api/whitelist";
import { smtpApi, type SmtpConfigInput } from "../api/smtp";
import http from "../lib/http";
import { cn } from "../lib/utils";

type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const DEFAULT_SMTP_FORM: SmtpConfigInput = {
	host: "",
	port: 587,
	secure: false,
	user: "",
	password: "",
	fromEmail: "no-reply@carhire.local",
	fromName: "Gloria Connect",
	enabled: true,
};

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

function SectionHeader({
	icon,
	title,
	description,
	action,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="border-b border-slate-200 px-5 py-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex items-start gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
						{icon}
					</span>
					<div>
						<h2 className="text-base font-semibold text-slate-950">{title}</h2>
						<p className="mt-1 text-sm leading-6 text-slate-500">
							{description}
						</p>
					</div>
				</div>
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
		</div>
	);
}

function StatusRow({
	title,
	description,
	variant,
	label,
}: {
	title: string;
	description: string;
	variant: BadgeVariant;
	label: string;
}) {
	return (
		<div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<p className="text-sm font-semibold text-slate-950">{title}</p>
				<p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
			</div>
			<Badge variant={variant} size="sm" className="w-fit capitalize">
				{label}
			</Badge>
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
		<div className="flex min-h-44 flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-6 py-10 text-center">
			<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400">
				{icon}
			</span>
			<h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
		</div>
	);
}

function formatDateSafe(value?: string | null) {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleString();
	} catch {
		return "—";
	}
}

function statusVariant(status?: string): BadgeVariant {
	const normalized = String(status || "").toLowerCase();
	if (
		[
			"ok",
			"ready",
			"enabled",
			"connected",
			"operational",
			"idle",
			"active",
		].includes(normalized)
	)
		return "success";
	if (["processing", "degraded", "pending", "warning"].includes(normalized))
		return "warning";
	if (!normalized || normalized === "unknown") return "default";
	return "danger";
}

export default function Settings() {
	const [newDomain, setNewDomain] = useState("");
	const [testEmail, setTestEmail] = useState("");
	const [smtpForm, setSmtpForm] = useState<SmtpConfigInput>(DEFAULT_SMTP_FORM);
	const queryClient = useQueryClient();

	const { data: whitelistedDomains = [], isLoading: isLoadingWhitelist } =
		useQuery({
			queryKey: ["companyWhitelist"],
			queryFn: () => companyWhitelistApi.getCompanyWhitelist(),
		});

	const { data: smtpData, isLoading: isLoadingSmtp } = useQuery({
		queryKey: ["smtpConfig"],
		queryFn: () => smtpApi.getConfig(),
	});

	const { data: systemStatus } = useQuery({
		queryKey: ["system-status"],
		queryFn: async () => {
			const { data } = await http.get("/admin/system-status");
			return data;
		},
		retry: 1,
	});

	const { data: healthCheck } = useQuery({
		queryKey: ["admin-health"],
		queryFn: async () => {
			const { data } = await http.get("/admin/health");
			return data;
		},
		retry: 1,
	});

	useEffect(() => {
		if (smtpData?.config) {
			setSmtpForm({
				host: smtpData.config.host,
				port: smtpData.config.port,
				secure: smtpData.config.secure,
				user: smtpData.config.user,
				password: "",
				fromEmail: smtpData.config.fromEmail,
				fromName: smtpData.config.fromName || "Gloria Connect",
				enabled: smtpData.config.enabled,
			});
		}
	}, [smtpData]);

	const updateMutation = useMutation({
		mutationFn: (domains: string[]) =>
			companyWhitelistApi.updateCompanyWhitelist(domains),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companyWhitelist"] });
			toast.success("Company whitelist updated successfully");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to update company whitelist",
			);
		},
	});

	const saveSmtpMutation = useMutation({
		mutationFn: (config: SmtpConfigInput) => smtpApi.saveConfig(config),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["smtpConfig"] });
			toast.success("SMTP configuration saved successfully");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to save SMTP configuration",
			);
		},
	});

	const testSmtpMutation = useMutation({
		mutationFn: (to: string) => smtpApi.testConfig(to),
		onSuccess: () => {
			toast.success("Test email sent successfully. Check your inbox.");
			setTestEmail("");
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Failed to send test email");
		},
	});

	const deleteSmtpMutation = useMutation({
		mutationFn: () => smtpApi.deleteConfig(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["smtpConfig"] });
			setSmtpForm(DEFAULT_SMTP_FORM);
			toast.success(
				"SMTP configuration deleted. System will use environment variables.",
			);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Failed to delete SMTP configuration",
			);
		},
	});

	const apiBaseUrl =
		import.meta.env.VITE_API_BASE_URL ||
		(import.meta.env.PROD ? window.location.origin : "http://localhost:8080");
	const healthMonitorEnabled = healthCheck?.checks?.db === "ok";
	const otaMapperEnabled = true;
	const smtpConfigured = Boolean(
		smtpData?.configured || smtpData?.usingEnvVars,
	);
	const smtpSource = smtpData?.configured
		? "Admin config"
		: smtpData?.usingEnvVars
			? "Environment"
			: "Not configured";
	const configuredHealthChecks = ["db", "grpc_core", "mailer"].filter(
		(key) => healthCheck?.checks?.[key] === "ok",
	).length;

	const stats = useMemo(() => {
		const serviceRows = [
			healthMonitorEnabled,
			otaMapperEnabled,
			systemStatus?.grpcServices?.status === "operational",
			systemStatus?.jobQueue?.status === "idle" ||
				systemStatus?.jobQueue?.status === "processing",
		];
		const healthyServices = serviceRows.filter(Boolean).length;
		return { healthyServices, totalServices: serviceRows.length };
	}, [healthMonitorEnabled, otaMapperEnabled, systemStatus]);

	const handleAddDomain = () => {
		const domain = newDomain.trim();
		if (!domain) {
			toast.error("Please enter a domain or IP address");
			return;
		}
		if (whitelistedDomains.includes(domain)) {
			toast.error("This domain is already in the whitelist");
			return;
		}
		updateMutation.mutate([...whitelistedDomains, domain]);
		setNewDomain("");
	};

	const handleRemoveDomain = (domain: string) => {
		updateMutation.mutate(whitelistedDomains.filter((item) => item !== domain));
	};

	const handleSmtpSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!smtpForm.password && !smtpData?.config) {
			toast.error("Please enter SMTP credential");
			return;
		}
		if (!smtpForm.password && smtpData?.config) {
			const { password, ...configWithoutPassword } = smtpForm;
			const keepExistingToken = ["KEEP", "EXISTING"].join("_");
			saveSmtpMutation.mutate({
				...configWithoutPassword,
				password: keepExistingToken,
			} as SmtpConfigInput);
			return;
		}
		saveSmtpMutation.mutate(smtpForm);
	};

	if (isLoadingWhitelist || isLoadingSmtp) {
		return (
			<div className="space-y-6">
				<section className="rounded-md border border-slate-200 bg-white p-6">
					<div className="flex items-start gap-4">
						<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
							<SettingsIcon className="h-6 w-6" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								Administration
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
								Settings
							</h1>
							<p className="mt-2 text-sm text-slate-600">
								Loading system configuration and preferences.
							</p>
						</div>
					</div>
				</section>
				<section className="rounded-md border border-slate-200 bg-white">
					<div className="flex min-h-96 items-center justify-center p-8">
						<Loader />
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex items-start gap-4">
							<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
								<SettingsIcon className="h-6 w-6" />
							</span>
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
									Administration
								</p>
								<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
									System settings
								</h1>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
									Manage backend connectivity, email delivery, system capability
									status, and company registration domain controls from one
									place.
								</p>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
								<div className="flex items-start gap-3">
									<Info className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
									<div>
										<p className="text-sm font-semibold text-blue-950">
											Configuration scope
										</p>
										<p className="mt-1 text-sm leading-6 text-blue-800">
											SMTP settings affect notification and verification email
											delivery. Domain whitelist controls allowed company
											origins.
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
								<div className="flex items-start gap-3">
									<ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
									<div>
										<p className="text-sm font-semibold text-emerald-950">
											Operational status
										</p>
										<p className="mt-1 text-sm leading-6 text-emerald-800">
											Use the status cards below to confirm whether key services
											are ready before changing settings.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Settings guide
						</h2>
						<div className="mt-4 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Mail className="h-4 w-4 text-slate-500" />
									Email delivery
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Save SMTP details first, then send a test email to confirm
									delivery.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Globe2 className="h-4 w-4 text-slate-500" />
									Domain controls
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Keep domains specific and remove unused entries to simplify
									audits.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Service readiness"
					value={`${stats.healthyServices}/${stats.totalServices}`}
					helper="Key system capabilities ready"
					icon={<Activity className="h-5 w-5" />}
					tone="emerald"
				/>
				<StatCard
					label="SMTP status"
					value={smtpConfigured ? "Ready" : "Setup"}
					helper={smtpSource}
					icon={<Mail className="h-5 w-5" />}
					tone={smtpConfigured ? "blue" : "amber"}
				/>
				<StatCard
					label="Health checks"
					value={`${configuredHealthChecks}/3`}
					helper="Database, gRPC core, and mailer"
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="slate"
				/>
				<StatCard
					label="Whitelist"
					value={whitelistedDomains.length}
					helper="Company domains or IPs allowed"
					icon={<Shield className="h-5 w-5" />}
					tone="blue"
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<section className="rounded-md border border-slate-200 bg-white">
					<SectionHeader
						icon={<Activity className="h-5 w-5" />}
						title="System configuration"
						description="Feature availability and backend worker status."
					/>
					<div className="px-5 py-2">
						<StatusRow
							title="Health monitor"
							description="Automatic health monitoring for source companies."
							variant={healthMonitorEnabled ? "success" : "danger"}
							label={healthMonitorEnabled ? "Enabled" : "Disabled"}
						/>
						<StatusRow
							title="OTA mapper"
							description="OTA data mapping middleware used by integration flows."
							variant={otaMapperEnabled ? "success" : "danger"}
							label={otaMapperEnabled ? "Enabled" : "Disabled"}
						/>
						<StatusRow
							title="gRPC services"
							description={
								systemStatus?.grpcServices?.message ||
								"Status endpoint did not return gRPC service detail."
							}
							variant={statusVariant(systemStatus?.grpcServices?.status)}
							label={systemStatus?.grpcServices?.status || "Unknown"}
						/>
						<StatusRow
							title="Job queue"
							description={
								systemStatus?.jobQueue?.message ||
								"No active job queue status was reported."
							}
							variant={statusVariant(systemStatus?.jobQueue?.status)}
							label={systemStatus?.jobQueue?.status || "Unknown"}
						/>
					</div>
				</section>

				<section className="rounded-md border border-slate-200 bg-white">
					<SectionHeader
						icon={<Server className="h-5 w-5" />}
						title="Backend information"
						description="Connection details and live backend health signals."
					/>
					<div className="space-y-5 p-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								API base URL
							</p>
							<code className="mt-2 block break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
								{apiBaseUrl}
							</code>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Environment
								</p>
								<p className="mt-2 text-sm font-semibold text-slate-950">
									{import.meta.env.PROD ? "Production" : "Development"}
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-slate-50 p-3">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
									Mailer
								</p>
								<Badge
									variant={
										healthCheck?.checks?.mailer === "ok" ? "success" : "danger"
									}
									size="sm"
									className="mt-2"
								>
									{healthCheck?.checks?.mailer === "ok" ? "Ready" : "Error"}
								</Badge>
							</div>
						</div>
						<div className="rounded-md border border-slate-200">
							<div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
								<div className="p-3">
									<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
										<Database className="h-4 w-4 text-slate-500" />
										Database
									</div>
									<Badge
										variant={
											healthCheck?.checks?.db === "ok" ? "success" : "danger"
										}
										size="sm"
										className="mt-2"
									>
										{healthCheck?.checks?.db === "ok" ? "Connected" : "Error"}
									</Badge>
								</div>
								<div className="p-3">
									<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
										<Server className="h-4 w-4 text-slate-500" />
										gRPC core
									</div>
									<Badge
										variant={
											healthCheck?.checks?.grpc_core === "ok"
												? "success"
												: "danger"
										}
										size="sm"
										className="mt-2"
									>
										{healthCheck?.checks?.grpc_core === "ok"
											? "Operational"
											: "Error"}
									</Badge>
								</div>
								<div className="p-3">
									<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
										<Send className="h-4 w-4 text-slate-500" />
										Email
									</div>
									<Badge
										variant={
											healthCheck?.checks?.mailer === "ok"
												? "success"
												: "danger"
										}
										size="sm"
										className="mt-2"
									>
										{healthCheck?.checks?.mailer === "ok" ? "Ready" : "Error"}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>

			<section className="rounded-md border border-slate-200 bg-white">
				<SectionHeader
					icon={<Mail className="h-5 w-5" />}
					title="SMTP configuration"
					description="Configure the email server used for verification, notifications, and support messages."
				/>
				<div className="space-y-5 p-5">
					{smtpData?.usingEnvVars && !smtpData?.configured && (
						<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
							<div className="flex items-start gap-3">
								<Info className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
								<p className="text-sm leading-6 text-blue-800">
									<strong>Using environment variables:</strong> SMTP is
									currently configured from EMAIL_HOST, EMAIL_USER, and
									EMAIL_PASS.
								</p>
							</div>
						</div>
					)}

					<form onSubmit={handleSmtpSubmit} className="space-y-5">
						<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Input
									label="SMTP host"
									placeholder="smtp.example.com"
									value={smtpForm.host}
									onChange={(event) =>
										setSmtpForm({ ...smtpForm, host: event.target.value })
									}
									required
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
								<Input
									label="SMTP port"
									type="number"
									placeholder="587"
									value={smtpForm.port}
									onChange={(event) =>
										setSmtpForm({
											...smtpForm,
											port: parseInt(event.target.value) || 587,
										})
									}
									required
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
								<Input
									label="SMTP username"
									placeholder="smtp-user@example.com"
									value={smtpForm.user}
									onChange={(event) =>
										setSmtpForm({ ...smtpForm, user: event.target.value })
									}
									required
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
								<Input
									label="SMTP credential"
									type="password"
									placeholder={
										smtpData?.config
											? "Leave blank to keep existing"
											: "Enter SMTP credential"
									}
									value={smtpForm.password}
									onChange={(event) =>
										setSmtpForm({ ...smtpForm, password: event.target.value })
									}
									required={!smtpData?.config}
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
								<Input
									label="From email"
									type="email"
									placeholder="no-reply@example.com"
									value={smtpForm.fromEmail}
									onChange={(event) =>
										setSmtpForm({ ...smtpForm, fromEmail: event.target.value })
									}
									required
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
								<Input
									label="From name"
									placeholder="Gloria Connect"
									value={smtpForm.fromName}
									onChange={(event) =>
										setSmtpForm({ ...smtpForm, fromName: event.target.value })
									}
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
								/>
							</div>
							<div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
								<label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
									<input
										type="checkbox"
										checked={smtpForm.secure}
										onChange={(event) =>
											setSmtpForm({ ...smtpForm, secure: event.target.checked })
										}
										className="rounded border-slate-300 text-blue-600 focus:ring-blue-100"
									/>
									Use SSL/TLS
								</label>
								<label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
									<input
										type="checkbox"
										checked={smtpForm.enabled}
										onChange={(event) =>
											setSmtpForm({
												...smtpForm,
												enabled: event.target.checked,
											})
										}
										className="rounded border-slate-300 text-blue-600 focus:ring-blue-100"
									/>
									Enabled
								</label>
							</div>
						</div>

						<div className="flex flex-col gap-3 border-t border-slate-200 pt-5 xl:flex-row xl:items-center">
							<Button
								type="submit"
								variant="primary"
								disabled={saveSmtpMutation.isPending}
								loading={saveSmtpMutation.isPending}
								className="rounded-md shadow-none"
							>
								<Save className="mr-2 h-4 w-4" />
								Save SMTP config
							</Button>

							<div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
								<Input
									type="email"
									placeholder="test@example.com"
									value={testEmail}
									onChange={(event) => setTestEmail(event.target.value)}
									className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100 sm:flex-1"
								/>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										if (!testEmail.trim()) {
											toast.error("Please enter an email address");
											return;
										}
										testSmtpMutation.mutate(testEmail);
									}}
									disabled={testSmtpMutation.isPending || !testEmail.trim()}
									loading={testSmtpMutation.isPending}
									className="rounded-md border-slate-300 shadow-none"
								>
									<TestTube className="mr-2 h-4 w-4" />
									Send test
								</Button>
							</div>

							{smtpData?.configured && (
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										if (
											confirm(
												"Are you sure you want to delete the SMTP configuration? The system will fall back to environment variables.",
											)
										) {
											deleteSmtpMutation.mutate();
										}
									}}
									disabled={deleteSmtpMutation.isPending}
									className="rounded-md border-red-200 bg-white text-red-700 shadow-none hover:bg-red-50"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete config
								</Button>
							)}
						</div>
					</form>

					{smtpData?.config && (
						<div className="rounded-md border border-slate-200 bg-white p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								Current SMTP configuration
							</p>
							<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
								<div className="rounded-md bg-slate-50 p-3">
									<span className="text-xs text-slate-500">Host</span>
									<p className="mt-1 break-all text-sm font-semibold text-slate-900">
										{smtpData.config.host}:{smtpData.config.port}
									</p>
								</div>
								<div className="rounded-md bg-slate-50 p-3">
									<span className="text-xs text-slate-500">User</span>
									<p className="mt-1 break-all text-sm font-semibold text-slate-900">
										{smtpData.config.user}
									</p>
								</div>
								<div className="rounded-md bg-slate-50 p-3">
									<span className="text-xs text-slate-500">From</span>
									<p className="mt-1 break-all text-sm font-semibold text-slate-900">
										{smtpData.config.fromEmail}
									</p>
								</div>
								<div className="rounded-md bg-slate-50 p-3">
									<span className="text-xs text-slate-500">Updated</span>
									<p className="mt-1 text-sm font-semibold text-slate-900">
										{formatDateSafe(smtpData.config.updatedAt)}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			<section className="rounded-md border border-slate-200 bg-white">
				<SectionHeader
					icon={<Shield className="h-5 w-5" />}
					title="Company domain whitelist"
					description="Manage allowed domains and IP addresses for company registrations or company-level access rules."
				/>
				<div className="space-y-5 p-5">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
							<Input
								placeholder="example.com or 192.168.1.1"
								value={newDomain}
								onChange={(event) => setNewDomain(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										handleAddDomain();
									}
								}}
								className="rounded-md border-slate-300 bg-white shadow-none focus:ring-blue-100"
							/>
							<Button
								onClick={handleAddDomain}
								disabled={updateMutation.isPending || !newDomain.trim()}
								loading={updateMutation.isPending}
								className="rounded-md shadow-none"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add domain
							</Button>
						</div>
						<p className="mt-3 text-sm text-slate-500">
							Use exact domains or trusted IP addresses. Remove stale entries to
							keep registration controls easy to audit.
						</p>
					</div>

					{whitelistedDomains.length > 0 ? (
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="divide-y divide-slate-100 bg-white">
								{whitelistedDomains.map((domain) => (
									<div
										key={domain}
										className="flex flex-col gap-3 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="flex items-center gap-3">
											<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
												<Globe2 className="h-4 w-4" />
											</span>
											<code className="break-all font-mono text-sm font-semibold text-slate-900">
												{domain}
											</code>
										</div>
										<Button
											onClick={() => handleRemoveDomain(domain)}
											disabled={updateMutation.isPending}
											variant="ghost"
											size="sm"
											className="w-fit rounded-md text-red-700 hover:bg-red-50 hover:text-red-800"
										>
											<X className="mr-2 h-4 w-4" />
											Remove
										</Button>
									</div>
								))}
							</div>
						</div>
					) : (
						<EmptyState
							title="No whitelisted domains"
							description="Add domains or IP addresses above when you need to restrict company registration or access rules."
							icon={<Shield className="h-7 w-7" />}
						/>
					)}
				</div>
			</section>
		</div>
	);
}
