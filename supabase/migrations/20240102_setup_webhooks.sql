
-- 1. Create the Database Webhook to trigger the Edge Function
-- Replace 'YOUR_PROJECT_REF' with your actual project reference (e.g. qndilnabfwbhnwvvptgs)
-- You can find this in your Supabase URL: https://YOUR_PROJECT_REF.supabase.co

-- Function to call the Edge Function
create extension if not exists pg_net;

create or replace function public.handle_new_submission()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://qndilnabfwbhnwvvptgs.supabase.co/functions/v1/notify-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase_service_role_key') || '"}',
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for Bookings
create trigger on_booking_created
  after insert on public.bookings
  for each row execute procedure public.handle_new_submission();

-- Trigger for Scorecards
create trigger on_scorecard_created
  after insert on public.scorecards
  for each row execute procedure public.handle_new_submission();
