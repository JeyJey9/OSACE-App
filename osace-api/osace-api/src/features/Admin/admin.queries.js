// osace-api/src/features/Admin/admin.queries.js

// Query-ul pentru GET /statistics
const STATS_QUERY = `
  WITH completed_attendances AS (
    SELECT 
      ea.user_id,
      e.id AS event_id,
      e.title AS event_title,
      e.category, 
      COALESCE(ea.awarded_hours, e.duration_hours, 0) AS hours,
      e.start_time
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.confirmation_status = 'attended' AND e.end_time <= NOW()
    
    UNION ALL
    
    SELECT
      sc.user_id,
      NULL AS event_id,
      sc.title AS event_title,
      'contributie' AS category,
      sc.awarded_hours AS hours,
      sc.created_at AS start_time
    FROM special_contributions sc
    WHERE sc.status = 'approved'
  ),

  stats_aggregated AS (
    SELECT 
      COALESCE(SUM(hours), 0)                                    AS total_hours_volunteered,
      COALESCE(COUNT(*), 0)                                      AS total_participants_attended,
      COALESCE((SELECT COUNT(*) FROM events WHERE end_time <= NOW()), 0) AS total_events_completed,
      COALESCE(COUNT(DISTINCT user_id), 0)                       AS total_unique_volunteers
    FROM completed_attendances
  ),

  category_hours AS (
    SELECT 
      COALESCE(category, 'social') AS category,
      SUM(hours) AS hours
    FROM completed_attendances
    GROUP BY COALESCE(category, 'social')
  ),

  top_volunteers AS (
    SELECT
      u.id,
      COALESCE(u.display_name, u.first_name || ' ' || u.last_name) AS name,
      u.avatar_url,
      SUM(ca.hours) AS total_hours,
      COUNT(ca.event_id) AS events_attended
    FROM completed_attendances ca
    JOIN users u ON ca.user_id = u.id
    GROUP BY u.id, u.display_name, u.first_name, u.last_name, u.avatar_url
    ORDER BY total_hours DESC
    LIMIT 5
  ),

  event_popularity AS (
    SELECT
      e.id,
      e.title,
      e.category,
      COUNT(ea.user_id) AS attendee_count
    FROM events e
    JOIN event_attendance ea ON e.id = ea.event_id AND ea.confirmation_status = 'attended'
    WHERE e.end_time <= NOW()
    GROUP BY e.id, e.title, e.category
    ORDER BY attendee_count DESC
    LIMIT 1
  ),

  monthly_trend AS (
    SELECT
      TO_CHAR(ca.start_time, 'Mon') AS month_label,
      DATE_TRUNC('month', ca.start_time) AS month_date,
      COUNT(DISTINCT ca.event_id) AS events_count,
      SUM(ca.hours) AS total_hours
    FROM completed_attendances ca
    WHERE ca.start_time >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', ca.start_time), TO_CHAR(ca.start_time, 'Mon')
    ORDER BY month_date ASC
  ),

  avg_attendance AS (
    SELECT
      ROUND(AVG(cnt)::numeric, 1) AS avg_attendees_per_event
    FROM (
      SELECT e.id, COUNT(ea.user_id) AS cnt
      FROM events e
      LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.confirmation_status = 'attended'
      WHERE e.end_time <= NOW()
      GROUP BY e.id
    ) sub
  )

  SELECT 
    sa.total_hours_volunteered,
    sa.total_participants_attended,
    sa.total_events_completed,
    sa.total_unique_volunteers,
    (SELECT avg_attendees_per_event FROM avg_attendance)         AS avg_attendees_per_event,
    COALESCE((
      SELECT json_agg(json_build_object(
        'category', ch.category, 
        'hours', ch.hours::float, 
        'color', CASE ch.category
                    WHEN 'sedinta' THEN '#1C748C'
                    WHEN 'social'  THEN '#27ae60'
                    WHEN 'proiect' THEN '#f39c12'
                    ELSE '#777'
               END
      ))
      FROM category_hours ch
    ), '[]') AS hours_by_category,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id',             tv.id,
        'name',           tv.name,
        'avatar_url',     tv.avatar_url,
        'total_hours',    tv.total_hours::float,
        'events_attended',tv.events_attended
      ))
      FROM top_volunteers tv
    ), '[]') AS top_volunteers,
    (SELECT row_to_json(ep) FROM event_popularity ep) AS most_popular_event,
    COALESCE((
      SELECT json_agg(json_build_object(
        'month',       mt.month_label,
        'events',      mt.events_count,
        'hours',       mt.total_hours::float
      ))
      FROM monthly_trend mt
    ), '[]') AS monthly_trend
  FROM stats_aggregated sa;
`;

// Query-ul pentru GET /users/:id/details
// Notă: Folosește $1 ca placeholder pentru 'id'
const USER_DETAILS_QUERY = `
  WITH UserAllEvents AS (
    SELECT 
      e.id, e.title, e.category, e.duration_hours, e.start_time, ea.confirmation_status
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = $1
  ),
  
  UserAttendedEvents AS (
    SELECT * FROM UserAllEvents 
    WHERE confirmation_status = 'attended' AND start_time <= NOW()
  ),

  UserInfo AS (
    SELECT id, display_name, first_name, last_name, email, role 
    FROM users 
    WHERE id = $1
  ),
  
  Aggregates AS (
    SELECT
      COALESCE(SUM(duration_hours), 0) as total_hours,
      COALESCE(COUNT(*), 0) as total_attended_events
    FROM UserAttendedEvents
  ),
  
  CategoryHours AS (
    SELECT
      COALESCE(category, 'social') as category,
      SUM(duration_hours) as hours
    FROM UserAttendedEvents
    GROUP BY COALESCE(category, 'social')
  ),
  
  RecentEvents AS (
    SELECT id, title, confirmation_status
    FROM UserAllEvents
    ORDER BY start_time DESC
    LIMIT 5
  )
  
  SELECT 
    (SELECT row_to_json(ui) FROM UserInfo ui) as user_info,
    a.total_hours,
    a.total_attended_events,
    COALESCE((SELECT json_agg(ch) FROM CategoryHours ch), '[]') as hours_by_category,
    COALESCE((SELECT json_agg(re) FROM RecentEvents re), '[]') as recent_events
  FROM Aggregates a;
`;

module.exports = {
  STATS_QUERY,
  USER_DETAILS_QUERY
};