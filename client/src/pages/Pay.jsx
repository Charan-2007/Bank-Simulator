import React, { useState } from 'react';
import SegmentedControl from '../components/glass/SegmentedControl.jsx';
import Send from './Send.jsx';
import Receive from './Receive.jsx';
import Scan from './Scan.jsx';

export default function Pay() {
  const [activeTab, setActiveTab] = useState('send');
  const [scannedRecipient, setScannedRecipient] = useState(null);

  const segments = [
    { id: 'send', label: 'Send Money' },
    { id: 'receive', label: 'Receive' },
    { id: 'scan', label: 'Scan QR' }
  ];

  const handleScanSuccess = (recipient) => {
    setScannedRecipient(recipient);
    setActiveTab('send');
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pb-28 pt-2">
      {/* Tab Segment Selector */}
      <SegmentedControl
        segments={segments}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {/* Send Screen */}
      {activeTab === 'send' && (
        <Send
          initialRecipient={scannedRecipient}
          onComplete={() => setScannedRecipient(null)}
        />
      )}

      {/* Receive Screen */}
      {activeTab === 'receive' && (
        <Receive />
      )}

      {/* Scan Screen (Portal) */}
      <Scan
        isActive={activeTab === 'scan'}
        onClose={() => setActiveTab('send')}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
