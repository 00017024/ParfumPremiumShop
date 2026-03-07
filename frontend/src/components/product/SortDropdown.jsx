export default function SortDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-48 bg-surface-card border border-neutral-border rounded-lg px-4 py-3 text-text-primary focus:border-brand-gold focus:outline-none transition-colors cursor-pointer"
    >
      <option value="createdAt-desc">Newest</option>
      <option value="price-asc">Price: Low → High</option>
      <option value="price-desc">Price: High → Low</option>
    </select>
  );
}