import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Plus, Edit, XCircle, Search, Clock } from 'lucide-react'

export default function BookingsTester() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings Tester</h1>
        <p className="mt-2 text-gray-600">
          Test booking operations (Create, Modify, Cancel, Check)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <Badge variant="info">Coming Soon</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Booking</h3>
            <p className="text-sm text-gray-600">
              Create a new booking with availability offer reference
            </p>
            <Button variant="secondary" className="w-full mt-4" disabled>
              Create Booking
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <Badge variant="info">Coming Soon</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Modify Booking</h3>
            <p className="text-sm text-gray-600">
              Modify an existing booking (dates, vehicle, etc.)
            </p>
            <Button variant="secondary" className="w-full mt-4" disabled>
              Modify Booking
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <Badge variant="info">Coming Soon</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
            <p className="text-sm text-gray-600">
              Cancel an existing booking by reference
            </p>
            <Button variant="secondary" className="w-full mt-4" disabled>
              Cancel Booking
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <Badge variant="info">Coming Soon</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Booking</h3>
            <p className="text-sm text-gray-600">
              Check booking status and details by reference
            </p>
            <Button variant="secondary" className="w-full mt-4" disabled>
              Check Booking
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Booking Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              The booking tester allows you to test all booking operations against your configured sources.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Create Booking</h4>
                <p className="text-xs text-gray-600">
                  Create a new booking using an availability offer reference. Requires valid agreement and availability offer.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Modify Booking</h4>
                <p className="text-xs text-gray-600">
                  Modify an existing booking (change dates, vehicle class, etc.). Not all sources support modifications.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Cancel Booking</h4>
                <p className="text-xs text-gray-600">
                  Cancel a booking by reference. Cancellation policies vary by source.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Check Booking</h4>
                <p className="text-xs text-gray-600">
                  Retrieve booking details and status by booking reference.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
