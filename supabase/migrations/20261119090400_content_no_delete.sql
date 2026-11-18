-- V2-05 (ADR-23): no DELETE for API roles on public content. Deletion = archive.
revoke delete on content.blog_posts, content.travel_companies from authenticated;
revoke delete on api.blog_posts, api.travel_companies from authenticated;
drop policy blog_delete on content.blog_posts;
drop policy travel_delete on content.travel_companies;
comment on table content.blog_posts is 'Public blog. Staff delete = status archived; hard delete is service_role only.';
comment on table content.travel_companies is 'Travel insurers. Staff delete = active false; hard delete is service_role only.';
