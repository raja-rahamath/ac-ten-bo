'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AsyncSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface AsyncSelectProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string, option?: AsyncSelectOption) => void;
  onSearch: (query: string) => Promise<AsyncSelectOption[]>;
  minSearchLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  initialOption?: AsyncSelectOption;
  onCreateNew?: () => void;
  createNewLabel?: string;
}

export function AsyncSelect({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  minSearchLength = 2,
  debounceMs = 300,
  disabled = false,
  required = false,
  name,
  className = '',
  initialOption,
  onCreateNew,
  createNewLabel = 'Create New',
}: AsyncSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<AsyncSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AsyncSelectOption | undefined>(initialOption);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update selected option when initialOption changes
  useEffect(() => {
    if (initialOption) {
      setSelectedOption(initialOption);
    }
  }, [initialOption]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minSearchLength) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearch(searchQuery);
      setOptions(results);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, minSearchLength]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, debounceMs);
  };

  // Handle option selection
  const handleSelect = (option: AsyncSelectOption) => {
    setSelectedOption(option);
    onChange(option.value, option);
    setIsOpen(false);
    setQuery('');
    setOptions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(undefined);
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      {name && (
        <input type="hidden" name={name} value={value || selectedOption?.value || ''} />
      )}

      {/* Main input container */}
      <div
        className={`w-full rounded-xl border bg-white dark:bg-dark-700 px-4 py-2.5 flex items-center gap-2 cursor-text
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-dark-300 dark:hover:border-dark-500'}
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-dark-200 dark:border-dark-600'}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Search icon */}
        <svg className="w-4 h-4 text-dark-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Input field or selected value */}
        {isOpen || !selectedOption ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-dark-800 dark:text-white placeholder-dark-400 dark:placeholder-dark-500"
          />
        ) : (
          <div className="flex-1 text-dark-800 dark:text-white truncate">
            {selectedOption.label}
            {selectedOption.sublabel && (
              <span className="text-dark-400 dark:text-dark-500 text-sm ml-2">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}

        {/* Clear button */}
        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-dark-100 dark:hover:bg-dark-600 rounded"
          >
            <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {query.length < minSearchLength ? (
            <div className="px-4 py-3 text-dark-500 dark:text-dark-400 text-sm">
              Type at least {minSearchLength} characters to search...
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-dark-500 dark:text-dark-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-dark-500 dark:text-dark-400 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <ul>
              {options.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 cursor-pointer border-b border-dark-100 dark:border-dark-700
                    ${highlightedIndex === index ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-dark-50 dark:hover:bg-dark-700'}
                  `}
                >
                  <div className="font-medium text-dark-800 dark:text-white">
                    {option.label}
                  </div>
                  {option.sublabel && (
                    <div className="text-sm text-dark-500 dark:text-dark-400">
                      {option.sublabel}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Create New button */}
          {onCreateNew && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="w-full px-4 py-3 text-left border-t border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 text-primary-600 dark:text-primary-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">{createNewLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
