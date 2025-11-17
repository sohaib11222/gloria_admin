import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function BookingsTester() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings Tester</h1>
        <p className="mt-2 text-gray-600">
          Test booking operations (Create, Modify, Cancel, Check)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Booking tester features coming soon...</p>
            <div className="mt-4 space-x-2">
              <Button variant="secondary">Create Booking</Button>
              <Button variant="secondary">Modify Booking</Button>
              <Button variant="secondary">Cancel Booking</Button>
              <Button variant="secondary">Check Booking</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
