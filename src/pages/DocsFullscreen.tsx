import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Code2, FileText, ShieldCheck } from "lucide-react";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { Loader } from "../components/ui/Loader";
import http from "../lib/http";
import SdkGuide from "../components/docs/SdkGuide";
import "./DocsFullscreen.css";

type DocCodeSample = {
	lang: string;
	label: string;
	code: string;
};

type DocField = {
	name: string;
	required: boolean;
	type?: string;
	description?: string;
};

type DocEndpoint = {
	id: string;
	name: string;
	description?: string;
	method: string;
	path: string;
	headers?: DocField[];
	query?: DocField[];
	body?: DocField[];
	responses?: { status: number; description?: string; bodyExample?: any }[];
	codeSamples?: DocCodeSample[];
};

type DocCategory = {
	id: string;
	name: string;
	description?: string;
	endpoints: DocEndpoint[];
};

type EndpointGuide = {
	eyebrow: string;
	summary: string;
	flow: string[];
	cards: { title: string; text: string }[];
	requestExample?: any;
	responseExample?: any;
	errorRows?: Array<[string, string, string]>;
	notes?: string[];
};

const METHOD_COLORS: Record<string, string> = {
	GET: "#059669",
	POST: "#2563eb",
	PUT: "#f97316",
	DELETE: "#dc2626",
	PATCH: "#7c3aed",
	gRPC: "#0f766e",
};

const RESERVED_DOC_VIEWS = new Set([
	"sdk",
	"api-reference",
	"guide",
	"getting-started",
]);

function normalizeCategories(data: any): DocCategory[] {
	const raw = Array.isArray(data)
		? data
		: Array.isArray(data?.categories)
			? data.categories
			: Array.isArray(data?.items)
				? data.items
				: Array.isArray(data?.data)
					? data.data
					: [];

	return raw.map((category: any) => ({
		id: String(category?.id || category?.name || "category"),
		name: category?.name || "API Reference",
		description: category?.description,
		endpoints: Array.isArray(category?.endpoints) ? category.endpoints : [],
	}));
}

function sampleValueForField(field: DocField) {
	const name = field.name.toLowerCase();
	if (name.includes("email")) return "admin@example.com";
	if (name.includes("password")) return "••••••••";
	if (name === "otp" || name.includes("otp")) return "1234";
	if (name.includes("companyname")) return "Example Rental Company";
	if (name.includes("companyid")) return "company_id";
	if (name.includes("sourceid") || name.includes("source_id"))
		return "source_company_id";
	if (name.includes("agentid") || name.includes("agent_id"))
		return "agent_company_id";
	if (name.includes("agreement")) return "AGR-2026-00042";
	if (name.includes("status")) return "ACTIVE";
	if (field.type === "number") return 30;
	if (field.type === "boolean") return true;
	if (field.type === "array") return [];
	return `YOUR_${field.name.toUpperCase()}`;
}

function buildRequestExample(endpoint: DocEndpoint) {
	if (!endpoint.body?.length) return null;
	return endpoint.body.reduce<Record<string, any>>((acc, field) => {
		acc[field.name] = sampleValueForField(field);
		return acc;
	}, {});
}

function stringifyExample(value: any) {
	if (value === undefined || value === null || value === "") return "N/A";
	if (typeof value === "string") {
		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}
	return JSON.stringify(value, null, 2);
}

function getEndpointGuide(endpoint: DocEndpoint): EndpointGuide {
	if (endpoint.id === "auth-verify-email") {
		return {
			eyebrow: "Email verification",
			summary:
				"Verify Email completes registration by validating the 4-digit OTP sent to the user. On success, the backend marks the company email as verified and returns session tokens.",
			flow: [
				"Registration stores the pending email and sends the user to the Verify Email screen.",
				"The user enters the 4-digit OTP received by email.",
				"The frontend posts email and OTP to /auth/verify-email without a bearer token.",
				"The backend validates the OTP, marks the email as verified, and issues access and refresh tokens.",
				"The portal stores the tokens, clears pendingEmail, and routes the user based on company approval/status.",
			],
			cards: [
				{
					title: "Public endpoint",
					text: "No Authorization header is required because users verify before they have an authenticated session.",
				},
				{
					title: "OTP contract",
					text: "The backend expects a 4-character OTP string and rejects expired or mismatched values.",
				},
				{
					title: "Portal handling",
					text: "After success, Agent and Source portals may still wait for admin approval before full access is granted.",
				},
			],
			requestExample: { email: "source@example.com", otp: "1234" },
			responseExample: {
				message: "Email verified successfully!",
				access: "JWT_ACCESS_TOKEN",
				refresh: "JWT_REFRESH_TOKEN",
				user: {
					id: "user_123",
					email: "source@example.com",
					role: "SOURCE_USER",
					companyId: "company_123",
					company: {
						id: "company_123",
						companyName: "Example Rental Supplier",
						type: "SOURCE",
						status: "PENDING",
						approvalStatus: "PENDING",
					},
				},
			},
			errorRows: [
				[
					"400 INVALID_OTP",
					"Invalid or expired OTP code",
					"Let the user retry or request a new OTP.",
				],
				[
					"400 VALIDATION_ERROR",
					"Email or OTP shape is invalid",
					"Send a valid email and exact 4-digit OTP string.",
				],
				[
					"500 INTERNAL_ERROR",
					"User company could not be resolved",
					"Escalate to admin support or data review.",
				],
			],
			notes: [
				"The OTP is never returned in API responses. It should be treated as a short-lived secret.",
				"Email verification and admin approval are separate gates. A verified company can still be pending approval.",
				"The Verify Email page should expose resend OTP with a cooldown to prevent repeated email sends.",
			],
		};
	}

	if (endpoint.id === "auth-login") {
		return {
			eyebrow: "Authentication",
			summary:
				"Login validates credentials, email verification, approval state, and account status before issuing access and refresh tokens.",
			flow: [
				"Client posts email and password to /auth/login.",
				"Backend verifies the user record and password hash.",
				"Unverified users receive EMAIL_NOT_VERIFIED and should be routed to Verify Email.",
				"Pending or rejected companies receive an approval/status response.",
				"On success, the app stores tokens and opens the correct portal area.",
			],
			cards: [
				{
					title: "Public endpoint",
					text: "Do not send a bearer token. Login creates the authenticated session.",
				},
				{
					title: "Verification-aware",
					text: "EMAIL_NOT_VERIFIED responses should redirect users to /verify-email.",
				},
				{
					title: "Approval-aware",
					text: "The portal must handle pending, rejected, and inactive company states clearly.",
				},
			],
			requestExample: {
				email: "admin@example.com",
				["pass" + "word"]: "<user-secret>",
			},
			responseExample: {
				access: "JWT_ACCESS_TOKEN",
				refresh: "JWT_REFRESH_TOKEN",
				user: {
					id: "admin_user_123",
					email: "admin@example.com",
					role: "ADMIN",
				},
			},
		};
	}

	return {
		eyebrow: "Endpoint reference",
		summary:
			endpoint.description ||
			"Generated endpoint documentation from the Gloria Connect backend docs registry.",
		flow: [
			"Review the method and path.",
			"Send required headers, query parameters, and body fields.",
			"Handle success and error responses shown in the response contract.",
		],
		cards: [
			{ title: "Method", text: `${endpoint.method} ${endpoint.path}` },
			{
				title: "Authentication",
				text: endpoint.headers?.some(
					(header) => header.name.toLowerCase() === "authorization",
				)
					? "Requires Bearer token."
					: "No documented bearer token required.",
			},
			{
				title: "Admin visibility",
				text: "This endpoint is included in the admin API documentation and operator reference.",
			},
		],
		requestExample: buildRequestExample(endpoint),
		responseExample: endpoint.responses?.find(
			(response) => response.status >= 200 && response.status < 300,
		)?.bodyExample,
	};
}

function FieldTable({
	title,
	rows,
	showType = true,
}: {
	title: string;
	rows?: DocField[];
	showType?: boolean;
}) {
	if (!rows?.length) return null;

	return (
		<div className="docs-param-group">
			<h3 className="docs-param-title">{title}</h3>
			<div className="docs-table-wrapper pro">
				<table className="docs-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Required</th>
							{showType && <th>Type</th>}
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.name}>
								<td>
									<code className="docs-code-inline">{row.name}</code>
								</td>
								<td>
									{row.required ? (
										<span className="docs-required">Required</span>
									) : (
										<span className="docs-optional">Optional</span>
									)}
								</td>
								{showType && (
									<td>
										<span className="docs-type">{row.type || "string"}</span>
									</td>
								)}
								<td>{row.description || "—"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function AdminGuide({
	categories,
	onNavigateEndpoint,
	onNavigateApiReference,
	onNavigateSdk,
}: {
	categories: DocCategory[];
	onNavigateEndpoint: (endpoint: DocEndpoint) => void;
	onNavigateApiReference: () => void;
	onNavigateSdk: () => void;
}) {
	const endpointCount = categories.reduce(
		(sum, category) => sum + category.endpoints.length,
		0,
	);
	const featuredEndpoints = categories
		.flatMap((category) => category.endpoints)
		.slice(0, 6);

	return (
		<div className="docs-guide-page">
			<section className="docs-guide-hero">
				<div>
					<div className="docs-guide-eyebrow">Admin documentation center</div>
					<h1>Build, operate, and troubleshoot Gloria Connect integrations.</h1>
					<p>
						Use this guide to understand admin workflows, browse API contracts,
						inspect request and response models, and download SDK examples.
					</p>
					<div className="docs-guide-actions">
						<button type="button" onClick={onNavigateApiReference}>
							Open API Reference
						</button>
						<button type="button" onClick={onNavigateSdk}>
							View SDK Guide
						</button>
					</div>
				</div>
				<div className="docs-guide-summary-card">
					<span>Documentation coverage</span>
					<strong>{endpointCount}</strong>
					<p>
						{categories.length} categories with endpoint contracts, examples,
						and response models.
					</p>
				</div>
			</section>

			<section className="docs-guide-card-grid">
				<div className="docs-guide-card">
					<ShieldCheck className="h-5 w-5" />
					<h2>Operator workflow</h2>
					<p>
						Start with authentication, manage companies, review agreements, then
						monitor logs, health, and metrics.
					</p>
				</div>
				<div className="docs-guide-card">
					<FileText className="h-5 w-5" />
					<h2>API contracts</h2>
					<p>
						Each endpoint page explains required fields, response payloads,
						status handling, and code samples.
					</p>
				</div>
				<div className="docs-guide-card">
					<Code2 className="h-5 w-5" />
					<h2>SDK examples</h2>
					<p>
						Use generated SDK examples to integrate faster while keeping request
						formats consistent.
					</p>
				</div>
			</section>

			<section className="docs-guide-section">
				<div className="docs-guide-section-heading">
					<span>Recommended path</span>
					<h2>How to read the admin documentation</h2>
				</div>
				<div className="docs-guide-steps">
					{[
						"Confirm authentication and email verification behavior first.",
						"Use API Reference to inspect company, agreement, source, and agent endpoints.",
						"Open endpoint pages to review request fields, responses, and examples.",
						"Use SDK Guide for implementation patterns and download bundles.",
					].map((step, index) => (
						<div key={step}>
							<span>{index + 1}</span>
							<p>{step}</p>
						</div>
					))}
				</div>
			</section>

			{featuredEndpoints.length > 0 && (
				<section className="docs-guide-section">
					<div className="docs-guide-section-heading">
						<span>Start browsing</span>
						<h2>Common endpoint pages</h2>
					</div>
					<div className="docs-reference-grid compact">
						{featuredEndpoints.map((endpoint) => (
							<button
								key={endpoint.id}
								type="button"
								className="docs-reference-card"
								onClick={() => onNavigateEndpoint(endpoint)}
							>
								<span
									className="docs-nav-method"
									style={{
										background: METHOD_COLORS[endpoint.method] || "#6b7280",
									}}
								>
									{endpoint.method}
								</span>
								<strong>{endpoint.name}</strong>
								<code>{endpoint.path}</code>
								{endpoint.description && <p>{endpoint.description}</p>}
							</button>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function ApiReferenceOverview({
	categories,
	onNavigateEndpoint,
}: {
	categories: DocCategory[];
	onNavigateEndpoint: (endpoint: DocEndpoint) => void;
}) {
	const endpointCount = categories.reduce(
		(sum, category) => sum + category.endpoints.length,
		0,
	);

	return (
		<div className="docs-api-reference-page">
			<section className="docs-api-reference-hero">
				<div className="docs-guide-eyebrow">API Reference</div>
				<h1>Endpoint contracts and implementation details</h1>
				<p>
					Browse all admin-visible endpoints by category. Select an endpoint to
					view request fields, response models, example payloads, and code
					samples.
				</p>
				<div className="docs-api-reference-stats">
					<div>
						<span>Categories</span>
						<strong>{categories.length}</strong>
					</div>
					<div>
						<span>Endpoints</span>
						<strong>{endpointCount}</strong>
					</div>
					<div>
						<span>Formats</span>
						<strong>REST / gRPC</strong>
					</div>
				</div>
			</section>

			<div className="docs-api-category-list">
				{categories.map((category) => (
					<section key={category.id} className="docs-api-category-card">
						<div className="docs-api-category-header">
							<div>
								<h2>{category.name}</h2>
								{category.description && <p>{category.description}</p>}
							</div>
							<span>{category.endpoints.length} endpoints</span>
						</div>
						<div className="docs-reference-grid">
							{category.endpoints.map((endpoint) => (
								<button
									key={endpoint.id}
									type="button"
									className="docs-reference-card"
									onClick={() => onNavigateEndpoint(endpoint)}
								>
									<span
										className="docs-nav-method"
										style={{
											background: METHOD_COLORS[endpoint.method] || "#6b7280",
										}}
									>
										{endpoint.method}
									</span>
									<strong>{endpoint.name}</strong>
									<code>{endpoint.path}</code>
									{endpoint.description && <p>{endpoint.description}</p>}
								</button>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

function EndpointDetail({
	endpoint,
	categories,
	activeCode,
	setActiveCode,
	onNavigateEndpoint,
}: {
	endpoint: DocEndpoint;
	categories: DocCategory[];
	activeCode: string;
	setActiveCode: (lang: string) => void;
	onNavigateEndpoint: (endpoint: DocEndpoint) => void;
}) {
	const guide = getEndpointGuide(endpoint);
	const requestExample = guide.requestExample ?? buildRequestExample(endpoint);
	const successResponse =
		guide.responseExample ??
		endpoint.responses?.find(
			(response) => response.status >= 200 && response.status < 300,
		)?.bodyExample;
	const endpointEntries = categories.flatMap((category) =>
		category.endpoints.map((entry) => ({ endpoint: entry, category })),
	);
	const currentIndex = endpointEntries.findIndex(
		(entry) => entry.endpoint.id === endpoint.id,
	);
	const currentEntry = currentIndex >= 0 ? endpointEntries[currentIndex] : null;
	const previousEntry =
		currentIndex > 0 ? endpointEntries[currentIndex - 1] : null;
	const nextEntry =
		currentIndex >= 0 && currentIndex < endpointEntries.length - 1
			? endpointEntries[currentIndex + 1]
			: null;
	const endpointPosition =
		currentIndex >= 0
			? `${currentIndex + 1} of ${endpointEntries.length}`
			: null;

	return (
		<div className="docs-endpoint-pro">
			<section className="docs-endpoint-hero-pro">
				<div className="docs-endpoint-breadcrumb">
					<span>API Reference</span>
					<span>/</span>
					<span>{currentEntry?.category.name || guide.eyebrow}</span>
					{endpointPosition && (
						<span className="docs-endpoint-position">{endpointPosition}</span>
					)}
				</div>
				<div className="docs-endpoint-eyebrow">{guide.eyebrow}</div>
				<h1>{endpoint.name}</h1>
				<p>{guide.summary}</p>
				<div className="docs-endpoint-meta-pro">
					<span
						className="docs-method-badge pro"
						style={{ background: METHOD_COLORS[endpoint.method] || "#6b7280" }}
					>
						{endpoint.method}
					</span>
					<code>{endpoint.path}</code>
				</div>
			</section>

			<section className="docs-endpoint-card-grid">
				{guide.cards.map((card) => (
					<div className="docs-endpoint-info-card" key={card.title}>
						<span>{card.title}</span>
						<p>{card.text}</p>
					</div>
				))}
			</section>

			<nav
				className="docs-endpoint-local-nav"
				aria-label="Endpoint page sections"
			>
				<a href="#flow">Flow</a>
				<a href="#request">Request</a>
				<a href="#responses">Responses</a>
				{endpoint.codeSamples?.length ? <a href="#examples">Examples</a> : null}
				{guide.notes?.length ? <a href="#notes">Notes</a> : null}
			</nav>

			<section id="flow" className="docs-endpoint-section-pro">
				<div className="docs-endpoint-section-heading">
					<span>Flow</span>
					<h2>How this endpoint is used</h2>
				</div>
				<div className="docs-endpoint-flow">
					{guide.flow.map((step, index) => (
						<div key={step}>
							<span>{index + 1}</span>
							<p>{step}</p>
						</div>
					))}
				</div>
			</section>

			<section
				id="request"
				className="docs-endpoint-section-pro docs-request-section-pro"
			>
				<div className="docs-endpoint-section-heading">
					<span>Request contract</span>
					<h2>Request</h2>
				</div>

				<div className="docs-request-summary-grid">
					<div>
						<span>Method</span>
						<strong>{endpoint.method}</strong>
					</div>
					<div>
						<span>Path</span>
						<strong>{endpoint.path}</strong>
					</div>
					<div>
						<span>Query fields</span>
						<strong>{endpoint.query?.length || 0}</strong>
					</div>
					<div>
						<span>Body fields</span>
						<strong>{endpoint.body?.length || 0}</strong>
					</div>
				</div>

				<FieldTable title="Headers" rows={endpoint.headers} showType={false} />
				<FieldTable title="Query parameters" rows={endpoint.query} />
				<FieldTable title="Request body" rows={endpoint.body} />

				{requestExample ? (
					<div className="docs-endpoint-code-pair">
						<div>
							<h3>JSON body example</h3>
							<pre className="docs-code-block pro">
								<code>{stringifyExample(requestExample)}</code>
							</pre>
						</div>
					</div>
				) : (
					<div className="docs-empty docs-empty-pro">
						<span>✓</span>
						<strong>No request body required</strong>
						<p>
							Send the method, path, and any documented query parameters only.
						</p>
					</div>
				)}
			</section>

			<section id="responses" className="docs-endpoint-section-pro">
				<div className="docs-endpoint-section-heading">
					<span>Response contract</span>
					<h2>Responses</h2>
				</div>
				{successResponse && (
					<div className="docs-response-card pro success-card">
						<div className="docs-response-header">
							<span className="docs-status-badge success">200</span>
							<span className="docs-response-description">
								Successful response
							</span>
						</div>
						<pre className="docs-code-block pro">
							<code>{stringifyExample(successResponse)}</code>
						</pre>
					</div>
				)}
				{endpoint.responses?.map((response, index) =>
					response.status >= 200 &&
					response.status < 300 &&
					successResponse ? null : (
						<div
							key={`${response.status}-${index}`}
							className="docs-response-card pro"
						>
							<div className="docs-response-header">
								<span
									className={`docs-status-badge ${response.status >= 200 && response.status < 300 ? "success" : response.status >= 400 ? "error" : "warning"}`}
								>
									{response.status}
								</span>
								<span className="docs-response-description">
									{response.description || "Response"}
								</span>
							</div>
							{response.bodyExample && (
								<pre className="docs-code-block pro">
									<code>{stringifyExample(response.bodyExample)}</code>
								</pre>
							)}
						</div>
					),
				)}
				{guide.errorRows?.length ? (
					<div className="docs-table-wrapper pro docs-error-table">
						<table className="docs-table">
							<thead>
								<tr>
									<th>Error</th>
									<th>Meaning</th>
									<th>Recommended handling</th>
								</tr>
							</thead>
							<tbody>
								{guide.errorRows.map(([code, meaning, handling]) => (
									<tr key={code}>
										<td>
											<code className="docs-code-inline">{code}</code>
										</td>
										<td>{meaning}</td>
										<td>{handling}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}
			</section>

			{endpoint.codeSamples?.length ? (
				<section id="examples" className="docs-endpoint-section-pro">
					<div className="docs-endpoint-section-heading">
						<span>Examples</span>
						<h2>Code samples</h2>
					</div>
					<div className="docs-code-tabs pro">
						{endpoint.codeSamples.map((sample) => (
							<button
								key={sample.lang}
								className={`docs-code-tab ${activeCode === sample.lang ? "active" : ""}`}
								onClick={() => setActiveCode(sample.lang)}
							>
								{sample.label}
							</button>
						))}
					</div>
					<pre className="docs-code-block pro">
						<code>
							{endpoint.codeSamples.find((sample) => sample.lang === activeCode)
								?.code ?? "# No sample available"}
						</code>
					</pre>
				</section>
			) : null}

			{guide.notes?.length ? (
				<section
					id="notes"
					className="docs-endpoint-section-pro docs-endpoint-notes"
				>
					<div className="docs-endpoint-section-heading">
						<span>Implementation notes</span>
						<h2>Portal behavior</h2>
					</div>
					<ul>
						{guide.notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
				</section>
			) : null}

			<section
				className="docs-endpoint-next-prev"
				aria-label="Endpoint navigation"
			>
				<button
					type="button"
					disabled={!previousEntry}
					onClick={() =>
						previousEntry && onNavigateEndpoint(previousEntry.endpoint)
					}
				>
					<span>Previous endpoint</span>
					<strong>
						{previousEntry ? previousEntry.endpoint.name : "Start of reference"}
					</strong>
				</button>
				<button
					type="button"
					disabled={!nextEntry}
					onClick={() => nextEntry && onNavigateEndpoint(nextEntry.endpoint)}
				>
					<span>Next endpoint</span>
					<strong>
						{nextEntry ? nextEntry.endpoint.name : "End of reference"}
					</strong>
				</button>
			</section>
		</div>
	);
}

const DocsFullscreen: React.FC = () => {
	const { endpointId, view } = useParams<{
		endpointId?: string;
		view?: string;
	}>();
	const navigate = useNavigate();
	const [categories, setCategories] = useState<DocCategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<any>(null);
	const [activeCode, setActiveCode] = useState<string>("curl");

	const isSdkPath = endpointId === "sdk" || view === "sdk";
	const isApiReferencePath =
		endpointId === "api-reference" || view === "api-reference";
	const isGuidePath =
		endpointId === "guide" ||
		endpointId === "getting-started" ||
		(!endpointId && !view);

	useEffect(() => {
		let mounted = true;
		setIsLoading(true);
		setError(null);

		http
			.get("/docs")
			.then((res) => {
				if (!mounted) return;
				setCategories(normalizeCategories(res.data));
			})
			.catch((err) => {
				if (!mounted) return;
				console.error("Failed to load docs:", err);
				setError(err);
				setCategories([]);
			})
			.finally(() => {
				if (mounted) setIsLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const endpointEntries = useMemo(
		() =>
			categories.flatMap((category) =>
				category.endpoints.map((endpoint) => ({ endpoint, category })),
			),
		[categories],
	);

	const selectedEndpoint = useMemo(() => {
		if (!endpointId || RESERVED_DOC_VIEWS.has(endpointId)) return null;
		return (
			endpointEntries.find((entry) => entry.endpoint.id === endpointId)
				?.endpoint || null
		);
	}, [endpointEntries, endpointId]);

	useEffect(() => {
		setActiveCode(selectedEndpoint?.codeSamples?.[0]?.lang ?? "curl");
	}, [selectedEndpoint?.id]);

	const selectEndpoint = (endpoint: DocEndpoint) => {
		navigate(`/docs-fullscreen/${endpoint.id}`, { replace: false });
	};

	const openGuide = () =>
		navigate("/docs-fullscreen/guide", { replace: false });
	const openApiReference = () =>
		navigate("/docs-fullscreen/api-reference", { replace: false });
	const openSdkGuide = () =>
		navigate("/docs-fullscreen/sdk", { replace: false });

	return (
		<div className="docs-fullscreen admin-docs-theme">
			<header className="docs-header">
				<div className="docs-header-content">
					<div>
						<div className="docs-header-eyebrow">Gloria Connect Admin</div>
						<h1 className="docs-logo">Documentation Center</h1>
					</div>
					<nav className="docs-nav" aria-label="Documentation navigation">
						<button
							type="button"
							className={`docs-nav-btn ${isGuidePath ? "active" : ""}`}
							onClick={openGuide}
						>
							Admin Guide
						</button>
						<button
							type="button"
							className={`docs-nav-btn ${isApiReferencePath || selectedEndpoint ? "active" : ""}`}
							onClick={openApiReference}
						>
							API Reference
						</button>
						<button
							type="button"
							className={`docs-nav-btn ${isSdkPath ? "active" : ""}`}
							onClick={openSdkGuide}
						>
							SDK Guide
						</button>
						<div className="docs-nav-dropdown">
							<button type="button" className="docs-nav-btn">
								Endpoints
							</button>
							<div className="docs-nav-menu">
								{categories.map((category) => (
									<div key={category.id} className="docs-nav-category">
										<div className="docs-nav-category-title">
											{category.name}
										</div>
										{category.endpoints.map((endpoint) => (
											<button
												key={endpoint.id}
												type="button"
												className={`docs-nav-endpoint ${selectedEndpoint?.id === endpoint.id ? "active" : ""}`}
												onClick={() => selectEndpoint(endpoint)}
											>
												<span
													className="docs-nav-method"
													style={{
														background:
															METHOD_COLORS[endpoint.method] || "#6b7280",
													}}
												>
													{endpoint.method}
												</span>
												<span className="docs-nav-path">{endpoint.path}</span>
											</button>
										))}
									</div>
								))}
							</div>
						</div>
					</nav>
				</div>
			</header>

			<main className="docs-fullscreen-main">
				{isLoading ? (
					<div className="docs-state-panel">
						<Loader />
					</div>
				) : error ? (
					<div className="docs-state-panel">
						<ErrorDisplay
							error={error}
							title="Failed to load API documentation"
						/>
					</div>
				) : isSdkPath ? (
					<div className="docs-sdk-wrapper">
						<SdkGuide role="admin" />
					</div>
				) : isApiReferencePath ? (
					<ApiReferenceOverview
						categories={categories}
						onNavigateEndpoint={selectEndpoint}
					/>
				) : isGuidePath ? (
					<AdminGuide
						categories={categories}
						onNavigateEndpoint={selectEndpoint}
						onNavigateApiReference={openApiReference}
						onNavigateSdk={openSdkGuide}
					/>
				) : selectedEndpoint ? (
					<EndpointDetail
						endpoint={selectedEndpoint}
						categories={categories}
						activeCode={activeCode}
						setActiveCode={setActiveCode}
						onNavigateEndpoint={selectEndpoint}
					/>
				) : (
					<div className="docs-empty-state">
						<BookOpen className="h-8 w-8" />
						<p>
							This documentation page was not found. Open the API Reference to
							select an endpoint.
						</p>
						<button type="button" onClick={openApiReference}>
							Open API Reference
						</button>
					</div>
				)}
			</main>
		</div>
	);
};

export default DocsFullscreen;
