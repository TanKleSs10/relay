type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function MessageFilters({ value, options, onChange }: Props) {
  return (
    <div className="u-flex u-gap-1 filter-row" style={{ marginBottom: "1rem" }}>
      <label htmlFor="status-filter" className="filter-label">
        Filtrar por estado:
      </label>
      <select
        id="status-filter"
        className="filter-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "Todos" : option}
          </option>
        ))}
      </select>
    </div>
  );
}
