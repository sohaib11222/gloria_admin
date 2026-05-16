import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Loader } from "../components/ui/Loader";
import {
	supportApi,
	SupportTicket,
	SupportMessage,
	SupportTicketStatus,
} from "../api/support";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Image as ImageIcon,
	Inbox,
	MessageCircle,
	Paperclip,
	RefreshCw,
	Search,
	Send,
	ShieldCheck,
	User,
	Users,
	X,
} from "lucide-react";
import { cn } from "../lib/utils";

type StatTone = "slate" | "blue" | "emerald" | "amber" | "red";

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
	OPEN: "Open",
	IN_PROGRESS: "In progress",
	RESOLVED: "Resolved",
	CLOSED: "Closed",
};

const STATUS_VARIANTS: Record<
	SupportTicketStatus,
	"success" | "warning" | "default" | "info"
> = {
	OPEN: "info",
	IN_PROGRESS: "warning",
	RESOLVED: "success",
	CLOSED: "default",
};

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
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
			<span className="inline-flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
				{icon || <MessageCircle className="h-7 w-7" />}
			</span>
			<h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
			<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
				{description}
			</p>
		</div>
	);
}

function ticketAge(value: string) {
	return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function senderLabel(message: SupportMessage, ticket: SupportTicket) {
	if (message.senderType === "ADMIN") return "Support team";
	return ticket.createdBy.companyName;
}

export default function Support() {
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "ALL">(
		"ALL",
	);
	const [companyTypeFilter, setCompanyTypeFilter] = useState<
		"ALL" | "AGENT" | "SOURCE"
	>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [messageContent, setMessageContent] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { data: allTicketsData } = useQuery({
		queryKey: ["support-tickets", "all-stats"],
		queryFn: () => supportApi.getTickets(),
		refetchInterval: 5000,
	});

	const {
		data: ticketsData,
		isLoading: ticketsLoading,
		isFetching: ticketsFetching,
		refetch: refetchTickets,
	} = useQuery({
		queryKey: [
			"support-tickets",
			statusFilter !== "ALL" ? statusFilter : undefined,
			companyTypeFilter !== "ALL" ? companyTypeFilter : undefined,
		],
		queryFn: () =>
			supportApi.getTickets({
				status: statusFilter !== "ALL" ? statusFilter : undefined,
				companyType:
					companyTypeFilter !== "ALL" ? companyTypeFilter : undefined,
			}),
		refetchInterval: 5000,
	});

	const { data: selectedTicket, isLoading: ticketLoading } = useQuery({
		queryKey: ["support-ticket", selectedTicketId],
		queryFn: () => supportApi.getTicket(selectedTicketId!),
		enabled: !!selectedTicketId,
		refetchInterval: 5000,
	});

	const { data: messagesData, isLoading: messagesLoading } = useQuery({
		queryKey: ["support-messages", selectedTicketId],
		queryFn: () => supportApi.getMessages(selectedTicketId!),
		enabled: !!selectedTicketId,
		refetchInterval: 5000,
	});

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messagesData]);

	const updateTicketMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: { status?: SupportTicketStatus; assignedTo?: string | null };
		}) => supportApi.updateTicket(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			queryClient.invalidateQueries({
				queryKey: ["support-ticket", selectedTicketId],
			});
			toast.success("Ticket updated");
		},
	});

	const sendMessageMutation = useMutation({
		mutationFn: ({
			ticketId,
			content,
			image,
		}: {
			ticketId: string;
			content?: string;
			image?: File;
		}) => supportApi.sendMessage(ticketId, { content, image }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["support-messages", selectedTicketId],
			});
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			setMessageContent("");
			setSelectedImage(null);
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			toast.success("Message sent");
		},
	});

	const markReadMutation = useMutation({
		mutationFn: ({
			ticketId,
			messageId,
		}: {
			ticketId: string;
			messageId: string;
		}) => supportApi.markMessageRead(ticketId, messageId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["support-messages", selectedTicketId],
			});
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
		},
	});

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		if (!allowedTypes.includes(file.type)) {
			toast.error(
				"Invalid file type. Please select an image (JPG, PNG, GIF, or WEBP)",
			);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image size must be less than 5MB");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		setSelectedImage(file);
		const reader = new FileReader();
		reader.onloadend = () => setImagePreview(reader.result as string);
		reader.onerror = () => {
			toast.error("Failed to read image file");
			setSelectedImage(null);
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
		};
		reader.readAsDataURL(file);
	};

	const handleSendMessage = () => {
		if (!selectedTicketId) return;
		if (!messageContent.trim() && !selectedImage) {
			toast.error("Please enter a message or select an image");
			return;
		}

		const contentToSend =
			messageContent.trim() || (selectedImage ? "" : undefined);
		sendMessageMutation.mutate({
			ticketId: selectedTicketId,
			content: contentToSend,
			image: selectedImage || undefined,
		});
	};

	const handleStatusChange = (
		ticketId: string,
		status: SupportTicketStatus,
	) => {
		updateTicketMutation.mutate({ id: ticketId, data: { status } });
	};

	const filteredTickets = useMemo(() => {
		if (!ticketsData?.items) return [];
		const query = searchQuery.trim().toLowerCase();
		if (!query) return ticketsData.items;
		return ticketsData.items.filter(
			(ticket) =>
				ticket.title.toLowerCase().includes(query) ||
				ticket.createdBy.companyName.toLowerCase().includes(query) ||
				ticket.createdBy.email.toLowerCase().includes(query),
		);
	}, [ticketsData, searchQuery]);

	const tickets = filteredTickets;
	const messages = messagesData?.items || [];
	const allTickets = allTicketsData?.items || ticketsData?.items || [];

	useEffect(() => {
		if (selectedTicketId && messages.length > 0) {
			const unreadMessages = messages.filter(
				(msg) =>
					!msg.readAt &&
					(msg.senderType === "AGENT" || msg.senderType === "SOURCE"),
			);
			unreadMessages.forEach((msg) => {
				markReadMutation.mutate({
					ticketId: selectedTicketId,
					messageId: msg.id,
				});
			});
		}
	}, [selectedTicketId, messages]);

	const stats = useMemo(() => {
		const open = allTickets.filter((ticket) => ticket.status === "OPEN").length;
		const progress = allTickets.filter(
			(ticket) => ticket.status === "IN_PROGRESS",
		).length;
		const resolved = allTickets.filter(
			(ticket) => ticket.status === "RESOLVED",
		).length;
		const unread = allTickets.reduce(
			(sum, ticket) => sum + (ticket.unreadCount || 0),
			0,
		);
		return {
			total: allTickets.length,
			open,
			progress,
			resolved,
			unread,
			closed: allTickets.filter((ticket) => ticket.status === "CLOSED").length,
		};
	}, [allTickets]);

	const filtersApplied =
		Boolean(searchQuery.trim()) ||
		statusFilter !== "ALL" ||
		companyTypeFilter !== "ALL";
	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("ALL");
		setCompanyTypeFilter("ALL");
	};

	const selectedStatusVariant = selectedTicket
		? STATUS_VARIANTS[selectedTicket.status]
		: "default";

	return (
		<div className="space-y-6 pb-8">
			<section className="overflow-hidden rounded-md border border-slate-200 bg-white">
				<div className="grid grid-cols-1 xl:grid-cols-3">
					<div className="border-b border-slate-200 p-6 xl:col-span-2 xl:border-b-0 xl:border-r">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-4">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
									<MessageCircle className="h-6 w-6" />
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
										Customer support
									</p>
									<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
										Support tickets
									</h1>
									<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
										Review customer issues, respond to agent and source teams,
										track unread messages, and move tickets through a clear
										support workflow.
									</p>
								</div>
							</div>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => refetchTickets()}
								disabled={ticketsFetching}
								className="shrink-0 rounded-md border-slate-300 shadow-none"
							>
								<RefreshCw
									className={cn(
										"mr-2 h-4 w-4",
										ticketsFetching && "animate-spin",
									)}
								/>
								Refresh
							</Button>
						</div>
					</div>

					<aside className="bg-slate-50/70 p-6">
						<h2 className="text-sm font-semibold text-slate-950">
							Support workflow
						</h2>
						<p className="mt-1 text-sm leading-5 text-slate-500">
							Keep the queue actionable by updating status after each response.
						</p>
						<div className="mt-5 space-y-3">
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<Inbox className="h-4 w-4 text-slate-500" />
									Open
								</div>
								<p className="mt-1 text-sm text-slate-500">
									New issues waiting for support triage.
								</p>
							</div>
							<div className="rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
									<ShieldCheck className="h-4 w-4 text-slate-500" />
									In progress
								</div>
								<p className="mt-1 text-sm text-slate-500">
									Active conversations that need follow-up.
								</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total tickets"
					value={stats.total}
					helper={`${stats.open} open · ${stats.progress} in progress`}
					icon={<MessageCircle className="h-5 w-5" />}
				/>
				<StatCard
					label="Unread messages"
					value={stats.unread}
					helper={
						stats.unread > 0
							? "Customer messages waiting for admin review"
							: "No unread customer replies"
					}
					icon={<AlertCircle className="h-5 w-5" />}
					tone={stats.unread > 0 ? "red" : "slate"}
				/>
				<StatCard
					label="Open queue"
					value={stats.open + stats.progress}
					helper="Tickets requiring support attention"
					icon={<Clock className="h-5 w-5" />}
					tone={stats.open + stats.progress > 0 ? "amber" : "emerald"}
				/>
				<StatCard
					label="Resolved"
					value={stats.resolved}
					helper={`${stats.closed} closed tickets`}
					icon={<CheckCircle2 className="h-5 w-5" />}
					tone="emerald"
				/>
			</div>

			<section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr] xl:min-h-[calc(100vh-360px)]">
				<div className="flex min-h-[620px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
					<div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-base font-semibold text-slate-950">
									Ticket queue
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Showing {tickets.length} ticket
									{tickets.length === 1 ? "" : "s"}.
								</p>
							</div>
							<Badge variant="info">Live refresh</Badge>
						</div>

						<div className="mt-4 space-y-3">
							<div>
								<label className="mb-1 block text-sm font-medium text-slate-700">
									Search
								</label>
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<Input
										placeholder="Title, company, email"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10 text-slate-900 placeholder:text-slate-400"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Select
									label="Status"
									value={statusFilter}
									onChange={(e) =>
										setStatusFilter(
											e.target.value as SupportTicketStatus | "ALL",
										)
									}
									className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
									options={[
										{ value: "ALL", label: "All statuses" },
										{ value: "OPEN", label: "Open" },
										{ value: "IN_PROGRESS", label: "In progress" },
										{ value: "RESOLVED", label: "Resolved" },
										{ value: "CLOSED", label: "Closed" },
									]}
								/>
								<Select
									label="Company type"
									value={companyTypeFilter}
									onChange={(e) =>
										setCompanyTypeFilter(
											e.target.value as "ALL" | "AGENT" | "SOURCE",
										)
									}
									className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
									options={[
										{ value: "ALL", label: "All types" },
										{ value: "AGENT", label: "Agent" },
										{ value: "SOURCE", label: "Source" },
									]}
								/>
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
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						{ticketsLoading ? (
							<div className="flex justify-center py-10">
								<Loader />
							</div>
						) : tickets.length === 0 ? (
							<EmptyState
								title="No tickets found"
								description="Try clearing filters or searching for a different company, email, or ticket title."
								icon={<Inbox className="h-7 w-7" />}
							/>
						) : (
							<div className="space-y-2">
								{tickets.map((ticket) => (
									<TicketListItem
										key={ticket.id}
										ticket={ticket}
										selected={selectedTicketId === ticket.id}
										onSelect={() => setSelectedTicketId(ticket.id)}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="flex min-h-[620px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
					{!selectedTicketId ? (
						<div className="flex flex-1 items-center justify-center">
							<EmptyState
								title="Select a ticket"
								description="Choose a ticket from the queue to view the conversation, update status, and respond to the customer."
							/>
						</div>
					) : ticketLoading || messagesLoading ? (
						<div className="flex flex-1 items-center justify-center">
							<Loader />
						</div>
					) : !selectedTicket ? (
						<div className="flex flex-1 items-center justify-center">
							<EmptyState
								title="Ticket not found"
								description="This ticket may have been deleted or is no longer available."
							/>
						</div>
					) : (
						<>
							<div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 flex-1">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<Badge variant={selectedStatusVariant}>
												{STATUS_LABELS[selectedTicket.status]}
											</Badge>
											<Badge
												variant={
													selectedTicket.createdBy.type === "AGENT"
														? "info"
														: "default"
												}
											>
												{selectedTicket.createdBy.type === "AGENT"
													? "Agent"
													: "Source"}
											</Badge>
											{selectedTicket.unreadCount ? (
												<Badge variant="danger">
													{selectedTicket.unreadCount} unread
												</Badge>
											) : null}
										</div>
										<h2 className="break-words text-lg font-semibold text-slate-950">
											{selectedTicket.title}
										</h2>
										<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
											<span className="inline-flex min-w-0 items-center gap-1.5">
												<User className="h-4 w-4 shrink-0 text-slate-400" />
												<span className="truncate font-medium text-slate-800">
													{selectedTicket.createdBy.companyName}
												</span>
											</span>
											<span className="inline-flex items-center gap-1.5 text-slate-500">
												<Clock className="h-4 w-4 shrink-0" />
												Opened {ticketAge(selectedTicket.createdAt)}
											</span>
											<span className="inline-flex items-center gap-1.5 text-slate-500">
												<Users className="h-4 w-4 shrink-0" />
												{selectedTicket.createdBy.email}
											</span>
										</div>
									</div>
									<div className="w-full shrink-0 lg:w-56">
										<Select
											label="Ticket status"
											value={selectedTicket.status}
											onChange={(e) =>
												handleStatusChange(
													selectedTicket.id,
													e.target.value as SupportTicketStatus,
												)
											}
											className="rounded-md border-slate-300 shadow-none focus:ring-blue-100"
											options={[
												{ value: "OPEN", label: "Open" },
												{ value: "IN_PROGRESS", label: "In progress" },
												{ value: "RESOLVED", label: "Resolved" },
												{ value: "CLOSED", label: "Closed" },
											]}
										/>
									</div>
								</div>
							</div>

							<div className="flex min-h-0 flex-1 flex-col">
								<div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 p-5">
									{messages.length === 0 ? (
										<EmptyState
											title="No messages yet"
											description="The thread is empty. Send a response when you are ready to start the conversation."
										/>
									) : (
										<div className="space-y-4">
											{messages.map((message) => (
												<MessageBubble
													key={message.id}
													message={message}
													ticket={selectedTicket}
												/>
											))}
											<div ref={messagesEndRef} />
										</div>
									)}
								</div>

								<div className="shrink-0 border-t border-slate-200 bg-white p-4">
									{imagePreview && (
										<div className="mb-3 inline-block rounded-md border border-blue-200 bg-blue-50 p-2">
											<div className="relative">
												<img
													src={imagePreview}
													alt="Preview"
													className="h-28 rounded border border-blue-200 bg-white object-cover"
												/>
												<button
													type="button"
													onClick={() => {
														setSelectedImage(null);
														setImagePreview(null);
														if (fileInputRef.current)
															fileInputRef.current.value = "";
													}}
													className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
													title="Remove image"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
											<p className="mt-2 max-w-[14rem] truncate text-xs text-blue-900">
												{selectedImage?.name || "Selected image"}
											</p>
										</div>
									)}

									<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
										<div className="min-w-0 flex-1">
											<label className="mb-1 block text-sm font-medium text-slate-700">
												Reply
											</label>
											<textarea
												placeholder="Type a clear support response..."
												value={messageContent}
												onChange={(e) => setMessageContent(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter" && !e.shiftKey) {
														e.preventDefault();
														handleSendMessage();
													}
												}}
												rows={3}
												className="block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
											/>
										</div>
										<div className="flex gap-2">
											<input
												ref={fileInputRef}
												type="file"
												accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
												onChange={handleImageSelect}
												className="hidden"
											/>
											<Button
												type="button"
												variant="secondary"
												className="rounded-md border-slate-300 px-3 shadow-none"
												onClick={() => fileInputRef.current?.click()}
												title="Attach image"
											>
												<Paperclip className="h-5 w-5" />
											</Button>
											<Button
												onClick={handleSendMessage}
												disabled={
													sendMessageMutation.isPending ||
													(!messageContent.trim() && !selectedImage)
												}
												loading={sendMessageMutation.isPending}
												className="rounded-md px-4 shadow-none"
											>
												<Send className="mr-2 h-5 w-5" />
												Send
											</Button>
										</div>
									</div>
									<p className="mt-2 text-xs text-slate-500">
										Press Enter to send, Shift+Enter for a new line. Images can
										be JPG, PNG, GIF, or WebP up to 5 MB.
									</p>
								</div>
							</div>
						</>
					)}
				</div>
			</section>
		</div>
	);
}

function TicketListItem({
	ticket,
	selected,
	onSelect,
}: {
	ticket: SupportTicket;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full rounded-md border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100",
				selected
					? "border-blue-300 bg-blue-50 shadow-sm"
					: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold text-slate-950">
						{ticket.title}
					</h3>
					<p className="mt-1 truncate text-xs text-slate-500">
						{ticket.createdBy.companyName} · {ticket.createdBy.email}
					</p>
				</div>
				{ticket.unreadCount && ticket.unreadCount > 0 ? (
					<Badge variant="danger" size="sm">
						{ticket.unreadCount}
					</Badge>
				) : null}
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap gap-2">
					<Badge variant={STATUS_VARIANTS[ticket.status]} size="sm">
						{STATUS_LABELS[ticket.status]}
					</Badge>
					<Badge
						variant={ticket.createdBy.type === "AGENT" ? "info" : "default"}
						size="sm"
					>
						{ticket.createdBy.type}
					</Badge>
				</div>
				<span className="text-xs text-slate-500">
					{ticket.lastMessage
						? ticketAge(ticket.lastMessage.createdAt)
						: ticketAge(ticket.createdAt)}
				</span>
			</div>
			{ticket.lastMessage?.content ? (
				<p className="mt-2 truncate text-xs text-slate-500">
					{ticket.lastMessage.content}
				</p>
			) : null}
		</button>
	);
}

function MessageBubble({
	message,
	ticket,
}: {
	message: SupportMessage;
	ticket: SupportTicket;
}) {
	const isAdmin = message.senderType === "ADMIN";

	return (
		<div className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[85%] rounded-md border px-4 py-3 shadow-sm sm:max-w-[70%]",
					isAdmin
						? "border-blue-700 bg-blue-600 text-white"
						: "border-slate-200 bg-white text-slate-900",
				)}
			>
				<div
					className={cn(
						"mb-1 text-xs font-semibold",
						isAdmin ? "text-blue-100" : "text-slate-600",
					)}
				>
					{senderLabel(message, ticket)}
				</div>
				{message.content ? (
					<p className="whitespace-pre-wrap text-sm leading-relaxed">
						{message.content}
					</p>
				) : null}
				{message.imageUrl ? (
					<button
						type="button"
						className="mt-3 block text-left"
						onClick={() =>
							window.open(
								message.imageUrl || "",
								"_blank",
								"noopener,noreferrer",
							)
						}
						title="Open attachment"
					>
						<img
							src={message.imageUrl}
							alt="Attachment"
							className="max-h-64 max-w-full rounded-md border border-slate-200 bg-white object-contain shadow-sm transition hover:opacity-90"
						/>
						<span
							className={cn(
								"mt-1 inline-flex items-center gap-1 text-xs",
								isAdmin ? "text-blue-100" : "text-slate-500",
							)}
						>
							<ImageIcon className="h-3.5 w-3.5" />
							Open image
						</span>
					</button>
				) : null}
				<div
					className={cn(
						"mt-2 text-xs",
						isAdmin ? "text-blue-100" : "text-slate-500",
					)}
				>
					{ticketAge(message.createdAt)}
				</div>
			</div>
		</div>
	);
}
