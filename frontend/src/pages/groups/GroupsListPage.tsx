import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Card, CardContent } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { groupsApi } from '../../lib/api'
import { Group } from '../../types'
import { formatCurrency, formatRelativeTime } from '../../lib/utils'
import { Users, Plus, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GroupsListPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await groupsApi.list()
      setGroups(response.data.data.groups || [])
    } catch (error: any) {
      console.error('Failed to fetch groups:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Groups</h1>
          <Link to="/groups/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </Link>
        </div>

        {/* Groups List */}
        {isLoading ? (
          <Loading className="py-12" />
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No groups yet</h3>
              <p className="text-text-secondary mb-4">
                Create a group to easily split expenses with the same people
              </p>
              <Link to="/groups/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card variant="interactive">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={group.avatar}
                        name={group.name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                          {group.name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </p>
                        {group.balance !== 0 && (
                          <p className={`text-sm font-medium mt-1 ${
                            group.balance > 0 ? 'text-success' : 'text-error'
                          }`}>
                            {group.balance > 0 ? 'You\'re owed' : 'You owe'}{' '}
                            {formatCurrency(Math.abs(group.balance))}
                          </p>
                        )}
                        {group.lastActivity && (
                          <p className="text-xs text-text-secondary mt-1">
                            Last activity {formatRelativeTime(group.lastActivity)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
