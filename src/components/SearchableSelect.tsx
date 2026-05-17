import Select from 'react-select';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: any[];
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  isClearable?: boolean;
  isMulti?: boolean;
  closeMenuOnSelect?: boolean;
  isDisabled?: boolean;
}

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", isClearable = false, isMulti = false, closeMenuOnSelect = true, isDisabled = false }: SearchableSelectProps) => {
  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: '14px',
      minHeight: '48px',
      border: '1.5px solid #e2e8f0',
      backgroundColor: 'white',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(1, 86, 44, 0.05)' : 'none',
      borderColor: state.isFocused ? 'var(--primary)' : '#e2e8f0',
      '&:hover': {
        borderColor: 'var(--primary)'
      },
      cursor: 'text'
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '2px 16px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(1, 86, 44, 0.1)',
      color: 'var(--primary)',
      borderRadius: '8px',
      padding: '2px 6px',
      fontWeight: '700'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: 'var(--primary)',
      fontSize: '0.85rem'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: 'var(--primary)',
      ':hover': {
        backgroundColor: 'var(--primary)',
        color: 'white',
        borderRadius: '8px'
      }
    }),
    input: (base: any) => ({
      ...base,
      margin: '0px',
      padding: '0px',
      color: '#1a1a1a',
      fontSize: '0.95rem'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.95rem',
      fontWeight: '500'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#1a1a1a',
      fontSize: '0.95rem',
      fontWeight: '700'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: '#94a3b8',
      paddingRight: '12px'
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '1px solid #f1f5f9',
      marginTop: '8px',
      zIndex: 16000,
      overflow: 'hidden'
    }),
    menuList: (base: any) => ({
      ...base,
      padding: '6px'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'rgba(1, 86, 44, 0.05)' 
          : 'transparent',
      color: state.isSelected ? 'white' : '#1a1a1a',
      padding: '10px 14px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: state.isSelected ? '700' : '500',
      '&:active': {
        backgroundColor: 'var(--primary)',
        color: 'white'
      }
    })
  };

  // Support both flat and grouped options for finding the current value
  const allOptions = options.reduce((acc: Option[], curr: any) => {
    if (curr.options) return [...acc, ...curr.options];
    return [...acc, curr];
  }, []);

  const getSelectedValue = () => {
    if (isMulti) {
      if (!Array.isArray(value)) return [];
      const stringValues = value.map(v => String(v));
      return allOptions.filter((opt: any) => stringValues.includes(String(opt.value)));
    }
    return allOptions.find((opt: any) => String(opt.value) === String(value)) || null;
  };

  return (
    <Select
      options={options}
      value={getSelectedValue()}
      isMulti={isMulti}
      closeMenuOnSelect={closeMenuOnSelect}
      onChange={(val: any) => {
        if (isMulti) {
          onChange(val ? val.map((v: any) => v.value) : []);
        } else {
          onChange(val ? val.value : '');
        }
      }}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      styles={customStyles}
      classNamePrefix="react-select"
    />
  );
};

export default SearchableSelect;
