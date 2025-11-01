import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { groupsApi, contactsApi } from '../../lib/api'
import { Contact } from '../../types'
import { ArrowLeft, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateGroupPage() {
  const navigate = useNavigate()

  const [groupName, setGroupName] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true)
      const response = await contactsApi.list()
      setContacts(response.data.data.contacts || [])
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const filteredContacts = searchQuery.trim()
    ? contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery)
      )
    : contacts

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId))
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId])
    }
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    if (selectedMemberIds.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    try {
      setIsLoading(true)
      const response = await groupsApi.create({
        name: groupName.trim(),
        memberIds: selectedMemberIds,
      })
      toast.success('Group created!')
      navigate(`/groups/${response.data.data.group.id}`)
    } catch (error: any) {
      console.error('Failed to create group:', error)
      toast.error(
        error.response?.data?.error?.message || 'Failed to create group'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Create Group</h1>
        </div>

        {/* Group Name Input */}
        <div className="mb-6">
          <Input
            label="Group Name"
            placeholder="Friday Dinner Club"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            helperText={`${groupName.length}/50`}
          />
        </div>

        {/* Member Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            ADD MEMBERS
          </h3>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Contact List */}
          {isLoadingContacts ? (
            <div className="py-8 text-center text-text-secondary">
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-8 text-center text-text-secondary">
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => {
                const isSelected = selectedMemberIds.includes(contact.userId)
                return (
                  <button
                    key={contact.userId}
                    onClick={() => toggleMember(contact.userId)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <Avatar
                      src={contact.avatar}
                      name={contact.name}
                      size="md"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {contact.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {contact.phone}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Selected Count */}
          {selectedMemberIds.length > 0 && (
            <p className="mt-2 text-sm text-text-secondary">
              {selectedMemberIds.length} member
              {selectedMemberIds.length === 1 ? '' : 's'} selected
            </p>
          )}
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreate}
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading || !groupName.trim() || selectedMemberIds.length === 0}
        >
          {isLoading ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </Layout>
  )
}
