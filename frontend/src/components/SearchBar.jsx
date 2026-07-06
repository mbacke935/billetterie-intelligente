import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Rechercher...' }) => {
  return (
    <div className="search-bar">
      <Search size={18} className="search-bar-icon" />
      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="search-bar-clear" onClick={() => onChange('')}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
