import React from 'react';

const IntegrationStandardGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1>Car Rental Integration Standard (Glora)</h1>
      <p style={{ color: '#6b7280' }}>
        Admin governance ensures every supplier integration ultimately conforms to a single Gloria contract for branches, pricing, booking, and cancellation/reservation status.
      </p>

      <section>
        <h2>Standard Components to Govern</h2>
        <ol style={{ paddingLeft: '1.25rem' }}>
          <li>List of Branches</li>
          <li>Price Request</li>
          <li>Booking Request</li>
          <li>Cancel Request / Reservation Status</li>
        </ol>
      </section>

      <section>
        <h2>Admin Validation Focus</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Field naming consistency across REST and gRPC.</li>
          <li>OTA XML to Gloria mapping correctness.</li>
          <li>Error/status normalization and observability.</li>
          <li>SDK snippets align with production route behavior.</li>
        </ul>
      </section>

      <section>
        <h2>Status Mapping Example</h2>
        <pre className="code-block">{`Supplier XML Status     Gloria Status
-------------------     -------------
CONFIRMED               CONFIRMED
CANCELLED               CANCELLED
ONREQUEST               PENDING`}</pre>
      </section>
    </div>
  );
};

export default IntegrationStandardGuide;
