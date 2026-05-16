import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import { cn } from "../lib/utils";

interface SearchItem {
	id: string;
	label: string;
	category: string;
	path: string;
	icon?: string;
	description?: string;
}

const searchItems: SearchItem[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		category: "Navigation",
		path: "/dashboard",
		icon: "📊",
		description: "Overview and activity summary",
	},
	{
		id: "companies",
		label: "Companies",
		category: "Navigation",
		path: "/companies",
		icon: "🏢",
		description: "Manage source and agent companies",
	},
	{
		id: "agents",
		label: "Agents",
		category: "Navigation",
		path: "/agents",
		icon: "👥",
		description: "Agent company configuration",
	},
	{
		id: "sources",
		label: "Sources",
		category: "Navigation",
		path: "/sources",
		icon: "🔌",
		description: "Supplier/source configuration",
	},
	{
		id: "agreements",
		label: "Agreements",
		category: "Navigation",
		path: "/agreements-management",
		icon: "📄",
		description: "Agreement lifecycle management",
	},
	{
		id: "locations",
		label: "Locations",
		category: "Navigation",
		path: "/locations",
		icon: "📍",
		description: "Location and branch data",
	},
	{
		id: "availability",
		label: "Availability & pricing",
		category: "Tools",
		path: "/availability",
		icon: "📈",
		description: "Run live availability tests",
	},
	{
		id: "bookings",
		label: "Booking Logs",
		category: "Logs",
		path: "/booking-logs",
		icon: "📝",
		description: "Booking request history",
	},
	{
		id: "health",
		label: "Health Monitoring",
		category: "Monitoring",
		path: "/health",
		icon: "❤️",
		description: "System and source health",
	},
	{
		id: "activity",
		label: "Activity & Audit",
		category: "Logs",
		path: "/activity",
		icon: "📊",
		description: "Audit activity timeline",
	},
	{
		id: "logs",
		label: "System Logs",
		category: "Logs",
		path: "/logs",
		icon: "📋",
		description: "Request and response traces",
	},
	{
		id: "metrics",
		label: "Metrics",
		category: "Monitoring",
		path: "/metrics",
		icon: "📈",
		description: "Prometheus metrics viewer",
	},
	{
		id: "verification",
		label: "Verification",
		category: "Tools",
		path: "/verification",
		icon: "✅",
		description: "Connectivity verification tools",
	},
	{
		id: "docs",
		label: "API Reference",
		category: "Documentation",
		path: "/docs-fullscreen",
		icon: "📖",
		description: "Open documentation center",
	},
	{
		id: "integrations",
		label: "Integrations",
		category: "Settings",
		path: "/integrations",
		icon: "🔧",
		description: "API keys and integration access",
	},
	{
		id: "settings",
		label: "Settings",
		category: "Settings",
		path: "/settings",
		icon: "⚙️",
		description: "System configuration",
	},
];

export const SearchPalette: React.FC<{
	isOpen: boolean;
	onClose: () => void;
}> = ({ isOpen, onClose }) => {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (!isOpen) {
			setQuery("");
			setSelectedIndex(0);
		}
	}, [isOpen]);

	const filteredItems = useMemo(() => {
		if (!query.trim()) return searchItems.slice(0, 8);

		const lowerQuery = query.toLowerCase();
		return searchItems.filter(
			(item) =>
				item.label.toLowerCase().includes(lowerQuery) ||
				item.category.toLowerCase().includes(lowerQuery) ||
				item.description?.toLowerCase().includes(lowerQuery),
		);
	}, [query]);

	useEffect(() => {
		if (selectedIndex >= filteredItems.length) setSelectedIndex(0);
	}, [filteredItems.length, selectedIndex]);

	const openItem = (item: SearchItem) => {
		if (item.id === "docs") {
			const docsUrl = `${window.location.origin}/admin/docs-fullscreen`;
			window.open(docsUrl, "_blank", "noopener,noreferrer");
		} else {
			navigate(item.path);
		}
		onClose();
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			if (filteredItems.length > 0)
				setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			if (filteredItems.length > 0)
				setSelectedIndex(
					(prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
				);
		} else if (event.key === "Enter") {
			event.preventDefault();
			const selectedItem = filteredItems[selectedIndex];
			if (selectedItem) openItem(selectedItem);
		} else if (event.key === "Escape") {
			onClose();
		}
	};

	const groupedItems = useMemo(() => {
		const groups: Record<string, SearchItem[]> = {};
		filteredItems.forEach((item) => {
			if (!groups[item.category]) groups[item.category] = [];
			groups[item.category].push(item);
		});
		return groups;
	}, [filteredItems]);

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>

			<div
				className="fixed left-1/2 top-24 z-[90] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2"
				role="dialog"
				aria-modal="true"
				aria-label="Quick search"
			>
				<div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
					<div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
						<div className="flex items-center gap-3">
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
								<Search className="h-5 w-5" />
							</span>
							<div className="relative min-w-0 flex-1">
								<input
									type="text"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Search pages, agreements, logs..."
									className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
									autoFocus
								/>
								{query && (
									<button
										type="button"
										onClick={() => setQuery("")}
										className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
										aria-label="Clear search"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
							<kbd className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 shadow-sm sm:inline-flex">
								ESC
							</kbd>
						</div>
					</div>

					<div className="max-h-[26rem] overflow-y-auto">
						{filteredItems.length === 0 ? (
							<div className="px-4 py-12 text-center">
								<p className="text-sm font-semibold text-slate-700">
									No results found
								</p>
								<p className="mt-1 text-xs text-slate-500">
									Try another page name, category, or workflow.
								</p>
							</div>
						) : (
							<div className="py-2">
								{Object.entries(groupedItems).map(([category, items]) => (
									<div key={category} className="py-1">
										<div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
											{category}
										</div>
										{items.map((item) => {
											const globalIdx = filteredItems.indexOf(item);
											const isSelected = selectedIndex === globalIdx;
											return (
												<button
													key={item.id}
													type="button"
													onClick={() => openItem(item)}
													onMouseEnter={() => setSelectedIndex(globalIdx)}
													className={cn(
														"flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors",
														isSelected
															? "border-blue-600 bg-blue-50"
															: "border-transparent hover:bg-slate-50",
													)}
												>
													<span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-slate-200 bg-white text-lg">
														{item.icon}
													</span>
													<span className="min-w-0 flex-1">
														<span
															className={cn(
																"block truncate text-sm font-semibold",
																isSelected ? "text-blue-950" : "text-slate-900",
															)}
														>
															{item.label}
														</span>
														{item.description ? (
															<span className="mt-0.5 block truncate text-xs text-slate-500">
																{item.description}
															</span>
														) : null}
													</span>
													<ArrowRight
														className={cn(
															"h-4 w-4 flex-none",
															isSelected ? "text-blue-600" : "text-slate-400",
														)}
													/>
												</button>
											);
										})}
									</div>
								))}
							</div>
						)}
					</div>

					<div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
						<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
							<span>
								Navigate with{" "}
								<kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-600">
									↑
								</kbd>{" "}
								<kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-600">
									↓
								</kbd>{" "}
								and press Enter
							</span>
							<kbd className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600">
								↵
							</kbd>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
