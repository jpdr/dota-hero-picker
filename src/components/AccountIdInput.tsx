"use client";

import { useState } from 'react';

interface AccountIdInputProps {
  onLoad: (accountId: string) => void;
  loading: boolean;
}

export default function AccountIdInput({ onLoad, loading }: AccountIdInputProps) {
  const [value, setValue] = useState('177992811');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationError('Account ID is required');
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setValidationError('Account ID must be numeric');
      return;
    }
    setValidationError(null);
    onLoad(trimmed);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="account-id" className="text-sm font-medium text-gray-300">
        OpenDota Account ID
      </label>
      <div className="flex gap-2">
        <input
          id="account-id"
          type="text"
          value={value}
          onChange={e => {
            setValue(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          placeholder="e.g. 123456789"
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-gray-100 border border-gray-700 focus:border-cyan-500 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-6 py-2 font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Load Profile'}
        </button>
      </div>
      {validationError && (
        <p className="text-sm text-red-400">{validationError}</p>
      )}
    </div>
  );
}
