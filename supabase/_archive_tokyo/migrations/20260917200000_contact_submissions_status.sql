-- פניות מהאזור האישי: מצב טיפול לכל פנייה, כדי שהלקוח יראה "התקבל / בטיפול /
-- ממתין למסמך / הושלם" (מסך "הפניות שלי" במוקאפ). ברירת המחדל "received".
-- הלקוח קורא רק את הפניות שלו (המדיניות הקיימת: user_id = auth.uid()).
alter table public.contact_submissions
  add column if not exists status text not null default 'received';

alter table public.contact_submissions
  drop constraint if exists contact_submissions_status_check;
alter table public.contact_submissions
  add constraint contact_submissions_status_check
  check (status in ('received', 'in_progress', 'waiting_docs', 'done'));

create index if not exists contact_submissions_user_idx
  on public.contact_submissions (user_id, created_at desc);
