async function getRequestProfile(supabase, req) {
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, company_id, candidate_id')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}
 
module.exports = { getRequestProfile };