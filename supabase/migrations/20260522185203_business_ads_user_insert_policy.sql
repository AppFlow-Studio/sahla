-- Allow authenticated users to submit their own business ad applications
create policy "Users can insert own submissions"
  on public.business_ads_submissions
  for insert
  with check (auth.jwt() ->> 'sub' = user_id);

-- Allow users to read their own submissions (for status checking)
create policy "Users can read own submissions"
  on public.business_ads_submissions
  for select
  using (auth.jwt() ->> 'sub' = user_id);
