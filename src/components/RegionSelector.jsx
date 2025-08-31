// src/components/RegionSelector.jsx
export default function RegionSelector({ regions, selectedRegion, onChange }) {
  return (
    <div className="flex justify-center mb-6">
      <select
        value={selectedRegion}
        onChange={(e) => onChange(e.target.value)}
        className="select-box"
      >
        <option value="All">🌍 All Regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  )
}
