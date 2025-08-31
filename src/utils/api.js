// src/utils/api.js

export async function fetchCountries() {
  const res = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,capital,flags,region"
  )
  const data = await res.json()

  return data
    .filter((c) => c.capital && c.capital.length > 0) // some countries don’t have a capital
    .map((c) => ({
      name: c.name.common,
      capital: c.capital[0],
      flag: c.flags.svg, // svg is usually cleaner, png works too
      region: c.region,
    }))
}
