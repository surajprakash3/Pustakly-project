import React from 'react';
import './OrderTracker.css';

const statusSteps = [
  { key: 'Placed', label: 'Placed', icon: '✅' },
  { key: 'Processing', label: 'Processing', icon: '⏳' },
  { key: 'Shipped', label: 'Shipped', icon: '🚚' },
  { key: 'Delivered', label: 'Delivered', icon: '📦' }
];

export default function OrderTracker({ status }) {
  const currentStep = statusSteps.findIndex(s => s.key === status);
  return (
    <div className="order-tracker">
      {statusSteps.map((step, idx) => (
        <div key={step.key} className={`tracker-step${idx <= currentStep ? ' completed' : ''}`}> 
          <span className="tracker-icon">{step.icon}</span>
          <span className="tracker-label">{step.label}</span>
          {idx < statusSteps.length - 1 && <span className="tracker-bar" />}
        </div>
      ))}
    </div>
  );
}
