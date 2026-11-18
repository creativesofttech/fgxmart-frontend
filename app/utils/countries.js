export const fetchActiveCountries = async apiBase => {
  const response = await $fetch(`${apiBase}/countries`, { query: { all: 1 } })
  return (response.data || []).filter(country => country.status !== false)
}
