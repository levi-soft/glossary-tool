import { useParams } from 'react-router-dom'
import { BarChart3, TrendingUp, CheckCircle, Clock, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const { id } = useParams()

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', id],
    queryFn: async () => {
      const response = await axios.get(`/api/analytics/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  const stats = analytics?.overview || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Project statistics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Entries"
          value={stats.totalEntries || 0}
          icon={<BarChart3 className="text-blue-600" size={24} />}
          color="bg-blue-50"
        />
        <StatCard
          title="Translated"
          value={stats.translated || 0}
          icon={<CheckCircle className="text-green-600" size={24} />}
          color="bg-green-50"
          subtitle={`${stats.progress || 0}% complete`}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress || 0}
          icon={<Clock className="text-yellow-600" size={24} />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Glossary Terms"
          value={stats.glossaryTerms || 0}
          icon={<Sparkles className="text-purple-600" size={24} />}
          color="bg-purple-50"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Translation Progress</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-medium">{stats.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${stats.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
        <div className="space-y-2">
          <StatusRow label="Untranslated" count={stats.untranslated || 0} color="bg-gray-500" />
          <StatusRow label="In Progress" count={stats.inProgress || 0} color="bg-yellow-500" />
          <StatusRow label="Translated" count={stats.translated || 0} color="bg-blue-500" />
          <StatusRow label="In Review" count={stats.inReview || 0} color="bg-purple-500" />
          <StatusRow label="Needs Revision" count={stats.needsRevision || 0} color="bg-orange-500" />
          <StatusRow label="Approved" count={stats.approved || 0} color="bg-green-500" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-green-600" size={20} />
          <div>
            <p className="text-sm text-gray-900 font-medium">
              {analytics?.recentActivity?.translationsLast7Days || 0} translations
            </p>
            <p className="text-xs text-gray-500">In the last 7 days</p>
          </div>
        </div>
      </div>

      {/* AI Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">AI Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Cache Hits</span>
            <span className="text-sm font-medium">{stats.aiCacheHits || 0}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Cached responses save time and API costs
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function StatusRow({ label, count, color }: { label: string; count: number; color: string }) {
  const total = 100 // Simplified, should calculate from all counts
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}