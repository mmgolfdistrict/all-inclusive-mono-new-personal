import Image from 'next/image';
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
  const countryDropDown = useRef<HTMLUListElement | null>(null);
  const [activeCountryIndex, setActiveCountryIndex] = useState<number|null>(null);

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
    setActiveCountryIndex(null)
    setFilteredCountries(
      items.filter((country) =>
        country.iso2.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
      )
    );
  }, [searchQuery, items]);

  const handleSelect = (event: React.MouseEvent<HTMLButtonElement>, country: Country) => {
    event.preventDefault();
    setSelectedCountry(country);
    setIsOpen(false);
    onSelect(country);
    setSearchQuery("");
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === 'Enter' &&
      activeCountryIndex !== null &&
      countryDropDown.current
    ) {
      const country = filteredCountries[activeCountryIndex];
      if (country) {
        setSelectedCountry(country);
        setIsOpen(false);
        onSelect(country);
        setSearchQuery("");
        setActiveCountryIndex(null);
      }
    }
  
    if (event.key === 'ArrowDown' && countryDropDown.current) {
      if (activeCountryIndex === null) {
        setActiveCountryIndex(0);
        const firstCountry = countryDropDown.current.children[0] as HTMLElement;
        firstCountry.focus();
        firstCountry.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (countryDropDown.current.children.length > activeCountryIndex + 1) {
        const country = countryDropDown.current.children[activeCountryIndex + 1] as HTMLElement;
        setActiveCountryIndex(activeCountryIndex + 1);
        country.focus();
        country.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    } else if (event.key === 'ArrowUp' && countryDropDown.current && activeCountryIndex !== null) {
      if (activeCountryIndex > 0) {
        const country = countryDropDown.current.children[activeCountryIndex - 1] as HTMLElement;
        setActiveCountryIndex(activeCountryIndex - 1);
        country.focus();
        country.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative inline-block text-left max-w-36" ref={dropdownRef} onClick={(e) => e.preventDefault()}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary-white text-gray-500 flex items-center px-2 py-3 rounded-lg w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          {selectedCountry && (
            <>
              <Image src={selectedCountry.flag} alt={selectedCountry.iso2} className="w-8 h-6" width={20} height={20}/>
              <span>{selectedCountry.iso2.toUpperCase()} (+{selectedCountry.dialCode})</span>
            </>
          )}
          <svg className="w-4 h-4 relative" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="absolute mt-2 w-[324px] bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country..."
              className="w-full p-2 border rounded-lg outline-none focus:ring focus:ring-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          <ul className="max-h-48 overflow-auto" ref={countryDropDown}>
            {filteredCountries.map((country, index) => (
              <li
                key={country.iso2}
                className={
                  `${index === activeCountryIndex ? 'bg-gray-200' : ''}
                `}>
                <button
                  className="
                    w-full p-2 flex items-center space-x-2 hover:bg-gray-100
                    cursor-pointer
                  "
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => 
                    handleSelect(e, country)
                  }
                >
                  <Image
                    src={country.flag}
                    alt={country.iso2}
                    className="w-8 h-6"
                    width={20}
                    height={20}
                  />
                  <span className="text-left">
                    (+{country.dialCode}) {country.name} - {country.iso2.toUpperCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryDropdown;