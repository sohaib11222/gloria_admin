import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { supportApi, SupportTicket, SupportMessage, SupportTicketStatus } from '../api/support'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { MessageCircle, Send, Image as ImageIcon, X, Clock, User, Filter, Search } from 'lucide-react'

export default function Support() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'ALL'>('ALL')
  const [companyTypeFilter, setCompanyTypeFilter] = useState<'ALL' | 'AGENT' | 'SOURCE'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter !== 'ALL' ? statusFilter : undefined, companyTypeFilter !== 'ALL' ? companyTypeFilter : undefined],
    queryFn: () => supportApi.getTickets({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      companyType: companyTypeFilter !== 'ALL' ? companyTypeFilter : undefined,
    }),
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const { data: selectedTicket, isLoading: ticketLoading } = useQuery({
    queryKey: ['support-ticket', selectedTicketId],
    queryFn: () => supportApi.getTicket(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', selectedTicketId],
    queryFn: () => supportApi.getMessages(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messagesData])

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: SupportTicketStatus; assignedTo?: string | null } }) =>
      supportApi.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicketId] })
      toast.success('Ticket updated')
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, content, image }: { ticketId: string; content?: string; image?: File }) =>
      supportApi.sendMessage(ticketId, { content, image }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setMessageContent('')
      setSelectedImage(null)
      setImagePreview(null)
      toast.success('Message sent')
    },
  })

  const markReadMutation = useMutation({
    mutationFn: ({ ticketId, messageId }: { ticketId: string; messageId: string }) =>
      supportApi.markMessageRead(ticketId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = () => {
    if (!selectedTicketId) return
    if (!messageContent.trim() && !selectedImage) {
      toast.error('Please enter a message or select an image')
      return
    }

    sendMessageMutation.mutate({
      ticketId: selectedTicketId,
      content: messageContent.trim() || undefined,
      image: selectedImage || undefined,
    })
  }

  const handleStatusChange = (ticketId: string, status: SupportTicketStatus) => {
    updateTicketMutation.mutate({ id: ticketId, data: { status } })
  }

  const filteredTickets = React.useMemo(() => {
    if (!ticketsData?.items) return []
    let filtered = ticketsData.items

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.createdBy.companyName.toLowerCase().includes(query) ||
          ticket.createdBy.email.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [ticketsData, searchQuery])

  const tickets = filteredTickets
  const messages = messagesData?.items || []

  // Mark unread messages as read when viewing
  useEffect(() => {
    if (selectedTicketId && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => !msg.readAt && (msg.senderType === 'AGENT' || msg.senderType === 'SOURCE')
      )
      unreadMessages.forEach((msg) => {
        markReadMutation.mutate({ ticketId: selectedTicketId, messageId: msg.id })
      })
    }
  }, [selectedTicketId, messages])

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Manage and respond to support requests from agents and sources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Ticket List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <div className="space-y-2 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SupportTicketStatus | 'ALL')}
                  options={[
                    { value: 'ALL', label: 'All Status' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'RESOLVED', label: 'Resolved' },
                    { value: 'CLOSED', label: 'Closed' },
                  ]}
                />
                <Select
                  value={companyTypeFilter}
                  onChange={(e) => setCompanyTypeFilter(e.target.value as 'ALL' | 'AGENT' | 'SOURCE')}
                  options={[
                    { value: 'ALL', label: 'All Types' },
                    { value: 'AGENT', label: 'Agent' },
                    { value: 'SOURCE', label: 'Source' },
                  ]}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTicketId === ticket.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm text-gray-900 truncate flex-1">{ticket.title}</h3>
                      {ticket.unreadCount && ticket.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs ml-2">{ticket.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{ticket.createdBy.companyName}</span>
                      <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                    </div>
                    {ticket.lastMessage && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {formatDistanceToNow(new Date(ticket.lastMessage.createdAt), { addSuffix: true })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedTicketId ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select a ticket to view messages</p>
              </div>
            </CardContent>
          ) : ticketLoading || messagesLoading ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <Loader />
            </CardContent>
          ) : !selectedTicket ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Ticket not found</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{selectedTicket.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{selectedTicket.createdBy.companyName}</span>
                        <Badge className="ml-2">{selectedTicket.createdBy.type}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicketStatus)}
                      className="text-sm"
                      options={[
                        { value: 'OPEN', label: 'Open' },
                        { value: 'IN_PROGRESS', label: 'In Progress' },
                        { value: 'RESOLVED', label: 'Resolved' },
                        { value: 'CLOSED', label: 'Closed' },
                      ]}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderType === 'ADMIN'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.senderType !== 'ADMIN' && (
                            <div className="text-xs font-medium mb-1 opacity-75">
                              {selectedTicket.createdBy.companyName}
                            </div>
                          )}
                          {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Attachment"
                              className="mt-2 rounded max-w-full h-auto max-h-64 object-contain"
                            />
                          )}
                          <div
                            className={`text-xs mt-2 ${
                              message.senderType === 'ADMIN' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4 space-y-3">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-32 rounded border" />
                      <button
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" className="px-3">
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </label>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || (!messageContent.trim() && !selectedImage)}
                      className="px-4"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
