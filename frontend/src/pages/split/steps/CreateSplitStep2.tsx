import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Avatar'
import { Loading } from '../../../components/ui/Loading'
import { useSplitStore } from '../../../store/splitStore'
import { contactsApi } from '../../../lib/api'
import { Contact } from '../../../types'
import { Search, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateSplitStep2() {
  const { draft, saveDraft, nextStep, previousStep } = useSplitStore()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(draft?.selectedContacts || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredContacts(
        contacts.filter(
          (c) =>
            c.name?.toLowerCase().includes(query) ||
            c.phone.includes(query)
        )
      )
    } else {
      setFilteredContacts(contacts)
    }
  }, [searchQuery, contacts])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const response = await contactsApi.list()
      setContacts(response.data.data.contacts || [])
      setFilteredContacts(response.data.data.contacts || [])
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleContact = (userId: string) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter((id) => id !== userId))
    } else {
      if (selectedIds.length >= 50) {
        toast.error('Maximum 50 participants allowed')
        return
      }
      setSelectedIds([...selectedIds, userId])
    }
  }

  const clearAll = () => {
    setSelectedIds([])
  }

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one person')
      return
    }

    saveDraft({ selectedContacts: selectedIds })
    nextStep()
  }

  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.userId))

  // Group contacts alphabetically
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = (contact.name?.[0] || '#').toUpperCase()
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(contact)
    return acc
  }, {} as Record<string, Contact[]>)

  const sortedLetters = Object.keys(groupedContacts).sort()

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <Loading className="py-12" />
        ) : filteredContacts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-secondary">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </p>
            <p className="text-sm text-text-secondary mt-2">
              {!searchQuery && 'Split with someone to add them to your contacts'}
            </p>
          </div>
        ) : (
          <div className="pb-24">
            {sortedLetters.map((letter) => (
              <div key={letter}>
                {/* Section Header */}
                <div className="sticky top-0 px-4 py-2 bg-background text-xs font-semibold text-text-secondary">
                  {letter}
                </div>

                {/* Contacts in Section */}
                {groupedContacts[letter].map((contact) => {
                  const isSelected = selectedIds.includes(contact.userId)
                  return (
                    <button
                      key={contact.userId}
                      onClick={() => toggleContact(contact.userId)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
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
            ))}
          </div>
        )}
      </div>

      {/* Selected Contacts Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-primary">
              {selectedIds.length} selected
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-primary font-medium"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedContacts.slice(0, 5).map((contact) => (
              <div
                key={contact.userId}
                className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Avatar src={contact.avatar} name={contact.name} size="xs" />
                <span className="text-sm font-medium text-text-primary">
                  {contact.name?.split(' ')[0] || 'Unknown'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleContact(contact.userId)
                  }}
                  className="text-text-secondary hover:text-error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedIds.length > 5 && (
              <div className="flex items-center px-3 py-1.5 text-sm text-text-secondary">
                +{selectedIds.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="p-4 border-t bg-white flex gap-3">
        <Button onClick={previousStep} variant="outline" size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="flex-1"
          disabled={selectedIds.length === 0}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
