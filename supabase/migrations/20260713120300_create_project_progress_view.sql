create view public.project_progress
with (security_invoker = true) as
select
  p.id as project_id,
  count(t.id) filter (where t.id is not null) as total_tasks,
  count(t.id) filter (where t.status = 'done') as done_tasks,
  case when count(t.id) filter (where t.id is not null) = 0 then 0
    else round(
      100.0 * count(t.id) filter (where t.status = 'done')
      / count(t.id) filter (where t.id is not null)
    )
  end as percent_done
from public.projects p
left join public.tasks t on t.project_id = p.id
group by p.id;
