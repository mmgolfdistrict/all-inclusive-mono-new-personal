import React, { useState, useEffect, useRef } from 'react';

export interface Country {
  name: string;
  iso2: string;
  dialCode: string;
  flag: string;
}

interface CountryDropdownProps {
  defaultCountry: string;
  items: Country[];
  onSelect: (country: Country) => void;
}

const CountryDropdown = ({ defaultCountry, items, onSelect }: CountryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(items);

  useEffect(() => {
    if (defaultCountry) {
      const foundCountry = items.find((c) => c.iso2 === defaultCountry);
      if (foundCountry) setSelectedCountry(foundCountry);
    }
  }, [defaultCountry, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredCountries(
      items.filter((country) =>
        country.iso2.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, items]);

  const handleSelect = (event: React.MouseEvent<HTMLLIElement>, country: Country) => {
    event.preventDefault();
    setSelectedCountry(country);
    setIsOpen(false);
    onSelect(country);
    setSearchQuery("");
  };

  return (
    <div className="relative inline-block text-left max-w-36" ref={dropdownRef} onClick={(e) => e.preventDefault()}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary-white text-gray-500 flex items-center px-2 py-3 rounded-lg w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          {selectedCountry && (
            <>
              <img src={selectedCountry.flag} alt={selectedCountry.iso2} className="w-6 h-4" />
              <span>{selectedCountry.iso2.toUpperCase()} ({selectedCountry.dialCode})</span>
            </>
          )}
          <svg className="w-4 h-4 relative" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="absolute mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country..."
              className="w-full p-2 border rounded-lg outline-none focus:ring focus:ring-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-48 overflow-auto">
            {filteredCountries.map((country) => (
              <li
                key={country.iso2}
                onClick={(e) => handleSelect(e, country)}
                className="p-2 flex items-center space-x-2 hover:bg-gray-100 cursor-pointer"
              >
                <img src={country.flag} alt={country.iso2} className="w-8 h-6" />
                <span>{country.iso2.toUpperCase()} ({country.name})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryDropdown;