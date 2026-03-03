import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Settings } from 'lucide-react';


const BackButtonStyled = styled.div`
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;                    /* just enough for the icon */
    height: 1.8em;
    background-color: transparent;
    border-radius: 3px;
    transition: all 0.2s linear;
    cursor: pointer;
    border: none;
    color: #4b5563;
    flex-shrink: 0;
    padding: 0;                      /* no extra padding */
    margin: 0;                        /* no extra margin */
  }

  button > svg {
    font-size: 16px;                  /* slightly larger icon */
    fill: #4b5563;
    transition: all 0.2s ease-in;
  }

  button:hover {
    background-color: rgba(0,0,0,0.05);
  }

  button:hover > svg {
    transform: translateX(-2px);
  }

  /* Hide any text (if present) */
  span {
    display: none;
  }
`;


const DropdownWrapper = styled.div`
  .select {
    width: fit-content;
    cursor: pointer;
    position: relative;
    transition: 300ms;
    color: #2a2f3b;
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  .selected {
    background-color: transparent;
    padding: 2px 4px;
    border-radius: 4px;
    position: relative;
    z-index: 10;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 60px;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }

  .arrow {
    height: 8px;
    width: 14px;
    fill: #4b5563;
    transform: rotate(-90deg);
    transition: 300ms;
    margin-left: 2px;
  }

  .options {
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    padding: 4px;
    background-color: white;
    border: 1px solid #e5e7eb;
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 100%;
    width: max-content;
    opacity: 0;
    pointer-events: none;
    transition: 300ms;
    z-index: 20;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .select:hover .options {
    opacity: 1;
    pointer-events: all;
    top: calc(100% + 2px);
  }

  .select:hover .arrow {
    transform: rotate(0deg);
  }

  .option {
    border-radius: 3px;
    padding: 4px 6px;
    transition: 300ms;
    background-color: white;
    font-size: 12px;
    color: #4b5563;
    cursor: pointer;
    white-space: nowrap;
  }

  .option:hover {
    background-color: #f3f4f6;
  }

  .option.selected-option {
    background-color: #e5e7eb;
    font-weight: 500;
  }
`;


const SearchWrapper = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 0.25rem;

  .search-container {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    width: 100%;
  }

  .search-input {
    border: none;
    padding: 3px 6px;
    font-size: 12px;
    min-width: 0;
    flex: 1 1 auto;
    outline: none;
  }

  .search-button {
    background-color: transparent;
    color: #3b82f6;
    border: none;
    padding: 3px 8px;
    font-weight: 500;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .search-button:hover {
    background-color: #eff6ff;
  }
`;

// Settings icon – minimal
const SettingsLink = styled(Link)`
  margin-left: 0.25rem;
  color: #4b5563;
  transition: color 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;

  &:hover {
    color: #3b82f6;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  background-color: transparent;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 50;
  gap: 0.25rem;
  flex-wrap: nowrap;

  @media (max-width: 640px) {
    padding: 0.1rem 0.25rem;
    gap: 0.1rem;
  }
`;

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <BackButtonStyled>
      <button onClick={() => navigate(-1)} aria-label="Go back">
        <svg height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <path d="M874.690416 495.52477c0 11.2973-9.168824 20.466124-20.466124 20.466124l-604.773963 0 188.083679 188.083679c7.992021 7.992021 7.992021 20.947078 0 28.939099-4.001127 3.990894-9.240455 5.996574-14.46955 5.996574-5.239328 0-10.478655-1.995447-14.479783-5.996574l-223.00912-223.00912c-3.837398-3.837398-5.996574-9.046027-5.996574-14.46955 0-5.433756 2.159176-10.632151 5.996574-14.46955l223.019353-223.029586c7.992021-7.992021 20.957311-7.992021 28.949332 0 7.992021 8.002254 7.992021 20.957311 0 28.949332l-188.073446 188.073446 604.753497 0C865.521592 475.058646 874.690416 484.217237 874.690416 495.52477z" />
        </svg>
       
      </button>
    </BackButtonStyled>
  );
};

const Header = ({
  showBackButton = true,
  onSearch,
  initialQuery = '',
  initialCategory = '',
  categories = [],
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const allCategories = [{ id: '', name: 'All' }, ...categories];

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery, selectedCategory);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectedCategoryName =
    allCategories.find((cat) => cat.id === selectedCategory)?.name || 'All';

  return (
    <HeaderContainer>
      {showBackButton && <BackButton />}

      <DropdownWrapper>
        <div className="select">
          <div className="selected">
            <span>{selectedCategoryName}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="arrow"
            >
              <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
            </svg>
          </div>
          <div className="options">
            {allCategories.map((cat) => (
              <div
                key={cat.id}
                className={`option ${
                  selectedCategory === cat.id ? 'selected-option' : ''
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </DropdownWrapper>

      <SearchWrapper>
        <div className="search-container">
            <input
            type="text"
            className="search-input"
            placeholder={`Search in ${selectedCategoryName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </SearchWrapper>

      <SettingsLink to="/settings">
        <Settings />
      </SettingsLink>
    </HeaderContainer>
  );
};

export default Header;