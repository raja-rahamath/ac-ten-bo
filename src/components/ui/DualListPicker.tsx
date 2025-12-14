'use client';

import { useState, useMemo } from 'react';

export interface DualListItem {
  value: string;
  label: string;
  sublabel?: string; // Optional sublabel (e.g., governorate name)
}

interface DualListPickerProps {
  availableItems: DualListItem[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  availableTitle?: string;
  selectedTitle?: string;
  availablePlaceholder?: string;
  selectedPlaceholder?: string;
  height?: string;
}

export default function DualListPicker({
  availableItems,
  selectedValues,
  onChange,
  availableTitle = 'Available',
  selectedTitle = 'Selected',
  availablePlaceholder = 'Search available...',
  selectedPlaceholder = 'Search selected...',
  height = '300px',
}: DualListPickerProps) {
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());

  // Items in the left column (available - not selected)
  const leftItems = useMemo(() => {
    return availableItems
      .filter(item => !selectedValues.includes(item.value))
      .filter(item => {
        if (!leftSearch) return true;
        const searchLower = leftSearch.toLowerCase();
        return (
          item.label.toLowerCase().includes(searchLower) ||
          (item.sublabel?.toLowerCase().includes(searchLower) ?? false)
        );
      });
  }, [availableItems, selectedValues, leftSearch]);

  // Items in the right column (selected)
  const rightItems = useMemo(() => {
    return availableItems
      .filter(item => selectedValues.includes(item.value))
      .filter(item => {
        if (!rightSearch) return true;
        const searchLower = rightSearch.toLowerCase();
        return (
          item.label.toLowerCase().includes(searchLower) ||
          (item.sublabel?.toLowerCase().includes(searchLower) ?? false)
        );
      });
  }, [availableItems, selectedValues, rightSearch]);

  // Move selected items from left to right
  const moveToRight = () => {
    if (leftSelected.size === 0) return;
    const newSelected = [...selectedValues, ...Array.from(leftSelected)];
    onChange(newSelected);
    setLeftSelected(new Set());
  };

  // Move selected items from right to left
  const moveToLeft = () => {
    if (rightSelected.size === 0) return;
    const newSelected = selectedValues.filter(v => !rightSelected.has(v));
    onChange(newSelected);
    setRightSelected(new Set());
  };

  // Move all items to right
  const moveAllToRight = () => {
    const allAvailable = leftItems.map(item => item.value);
    const newSelected = [...selectedValues, ...allAvailable];
    onChange(newSelected);
    setLeftSelected(new Set());
  };

  // Move all items to left
  const moveAllToLeft = () => {
    const rightItemValues = new Set(rightItems.map(item => item.value));
    const newSelected = selectedValues.filter(v => !rightItemValues.has(v));
    onChange(newSelected);
    setRightSelected(new Set());
  };

  // Toggle item selection in left list
  const toggleLeftItem = (value: string) => {
    const newSelected = new Set(leftSelected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setLeftSelected(newSelected);
  };

  // Toggle item selection in right list
  const toggleRightItem = (value: string) => {
    const newSelected = new Set(rightSelected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setRightSelected(newSelected);
  };

  // Select all visible items in left list
  const selectAllLeft = () => {
    if (leftSelected.size === leftItems.length) {
      setLeftSelected(new Set());
    } else {
      setLeftSelected(new Set(leftItems.map(item => item.value)));
    }
  };

  // Select all visible items in right list
  const selectAllRight = () => {
    if (rightSelected.size === rightItems.length) {
      setRightSelected(new Set());
    } else {
      setRightSelected(new Set(rightItems.map(item => item.value)));
    }
  };

  const ListColumn = ({
    title,
    items,
    selectedItems,
    onToggle,
    onSelectAll,
    search,
    onSearchChange,
    placeholder,
    emptyMessage,
  }: {
    title: string;
    items: DualListItem[];
    selectedItems: Set<string>;
    onToggle: (value: string) => void;
    onSelectAll: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    emptyMessage: string;
  }) => (
    <div className="flex-1 flex flex-col border border-dark-200 dark:border-dark-600 rounded-xl overflow-hidden bg-white dark:bg-dark-700">
      {/* Header */}
      <div className="px-3 py-2 bg-dark-50 dark:bg-dark-600 border-b border-dark-200 dark:border-dark-500">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
            {title} ({items.length})
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
            >
              {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-dark-100 dark:border-dark-600">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-dark-200 dark:border-dark-500 rounded-lg bg-white dark:bg-dark-600 text-dark-700 dark:text-dark-200 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ height }}>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-dark-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-dark-100 dark:divide-dark-600">
            {items.map(item => (
              <label
                key={item.value}
                className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  selectedItems.has(item.value)
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-dark-50 dark:hover:bg-dark-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.value)}
                  onChange={() => onToggle(item.value)}
                  className="mt-0.5 w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-dark-700 dark:text-dark-200 truncate">
                    {item.label}
                  </div>
                  {item.sublabel && (
                    <div className="text-xs text-dark-400 truncate">{item.sublabel}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-2 items-stretch">
      {/* Left Column - Available Items */}
      <ListColumn
        title={availableTitle}
        items={leftItems}
        selectedItems={leftSelected}
        onToggle={toggleLeftItem}
        onSelectAll={selectAllLeft}
        search={leftSearch}
        onSearchChange={setLeftSearch}
        placeholder={availablePlaceholder}
        emptyMessage="No available items"
      />

      {/* Center Buttons */}
      <div className="flex flex-col items-center justify-center gap-2 px-1">
        <button
          type="button"
          onClick={moveAllToRight}
          disabled={leftItems.length === 0}
          className="p-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:bg-dark-50 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Move all to right"
        >
          <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={moveToRight}
          disabled={leftSelected.size === 0}
          className="p-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:bg-dark-50 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Move selected to right"
        >
          <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={moveToLeft}
          disabled={rightSelected.size === 0}
          className="p-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:bg-dark-50 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Move selected to left"
        >
          <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={moveAllToLeft}
          disabled={rightItems.length === 0}
          className="p-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 hover:bg-dark-50 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Move all to left"
        >
          <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Right Column - Selected Items */}
      <ListColumn
        title={selectedTitle}
        items={rightItems}
        selectedItems={rightSelected}
        onToggle={toggleRightItem}
        onSelectAll={selectAllRight}
        search={rightSearch}
        onSearchChange={setRightSearch}
        placeholder={selectedPlaceholder}
        emptyMessage="No items selected"
      />
    </div>
  );
}
