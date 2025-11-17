import { useState } from 'react'
import { companiesApi } from '../api/companies'
import { testSourceGrpc, testAgentGrpc } from '../api/client'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import toast from 'react-hot-toast'

interface TestResult {
  success: boolean
  message?: string
  responseTime?: number
  error?: string
}

interface Company {
  id: string
  companyName: string
  type: string
  email: string
  status: string
  grpcEndpoint?: string | null
}

interface CompaniesTableProps {
  companies: Company[]
  isLoading: boolean
  onLoadCompanies: () => void
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({ 
  companies, 
  isLoading, 
  onLoadCompanies 
}) => {
  const [companyTests, setCompanyTests] = useState<Record<string, TestResult | null>>({})
  const [testingCompanies, setTestingCompanies] = useState<Record<string, boolean>>({})

  const testCompanyConnection = async (company: Company) => {
    setTestingCompanies(prev => ({ ...prev, [company.id]: true }))
    try {
      let result: TestResult
      
      if (company.type === 'SOURCE') {
        result = await testSourceGrpc(company.grpcEndpoint || undefined)
      } else {
        result = await testAgentGrpc(company.grpcEndpoint || undefined)
      }
      
      setCompanyTests(prev => ({ ...prev, [company.id]: result }))
      
      if (result.success) {
        toast.success(`${company.companyName} gRPC test successful`)
      } else {
        toast.error(`${company.companyName} gRPC test failed`)
      }
    } catch (error) {
      console.error('Company test error:', error)
      toast.error(`${company.companyName} test failed`)
    } finally {
      setTestingCompanies(prev => ({ ...prev, [company.id]: false }))
    }
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <p className="text-sm text-gray-600">
            Test gRPC connections for all registered companies
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      gRPC Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => {
                    const testResult = companyTests[company.id]
                    const isTesting = testingCompanies[company.id]
                    
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {company.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {company.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={company.type === 'SOURCE' ? 'info' : 'warning'}>
                            {company.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              company.status === 'ACTIVE' ? 'success' : 
                              company.status === 'PENDING_VERIFICATION' ? 'warning' : 
                              'danger'
                            }
                          >
                            {company.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.grpcEndpoint || 'Not configured'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {testResult ? (
                            <div className="space-y-1">
                              <Badge variant={testResult.success ? 'success' : 'danger'}>
                                {testResult.success ? 'SERVING' : 'FAILED'}
                              </Badge>
                              {testResult.responseTime && (
                                <div className="text-xs text-gray-500">
                                  {testResult.responseTime}ms
                                </div>
                              )}
                              {testResult.error && (
                                <div className="text-xs text-red-600 max-w-xs truncate">
                                  {testResult.error}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not tested</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            onClick={() => testCompanyConnection(company)}
                            loading={isTesting}
                            disabled={!company.grpcEndpoint || isTesting}
                          >
                            Test gRPC
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {companies.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">
                    No companies found
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
