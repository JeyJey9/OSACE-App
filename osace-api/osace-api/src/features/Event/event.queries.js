// src/features/Event/event.queries.js

// Query pentru GET / (lista de evenimente "acasă")
// Folosește $1 pentru userId
const HOME_EVENTS_QUERY = `
  SELECT 
    e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.created_at, e.category,
    (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id) as participant_count,
    (
      SELECT json_agg(json_build_object('avatar_url', u.avatar_url))
      FROM (
        SELECT u.avatar_url 
        FROM event_attendance ea_sub
        JOIN users u ON ea_sub.user_id = u.id
        WHERE ea_sub.event_id = e.id
        LIMIT 4
      ) u
    ) as top_participants
  FROM events e
  LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = $1
  WHERE e.end_time > NOW() AND ea.user_id IS NULL
  ORDER BY e.start_time ASC
`;

// Query pentru GET /:id/participants (lista de admin)
// Folosește $1 pentru eventId
const PARTICIPANTS_QUERY = `
  SELECT 
    u.id, 
    u.display_name, 
    u.first_name, 
    u.last_name, 
    u.email, 
    ea.confirmation_status, 
    ea.confirmed_at,
    ea.check_in_time,       -- ADĂUGAT NOU
    ea.check_out_time,      -- ADĂUGAT NOU
    ea.awarded_hours        -- ADĂUGAT NOU
  FROM event_attendance ea
  JOIN users u ON ea.user_id = u.id
  WHERE ea.event_id = $1
  ORDER BY u.last_name ASC, u.first_name ASC
`;

// Query pentru GET /:id/attendees (lista publică)
// Folosește $1 pentru eventId
const ATTENDEES_QUERY = `
  SELECT u.id, u.display_name, u.first_name, u.last_name, u.avatar_url
  FROM event_attendance ea
  JOIN users u ON ea.user_id = u.id
  WHERE ea.event_id = $1
  ORDER BY u.display_name ASC
`;

// Query pentru GET /:id (detaliile unui eveniment)
// Folosește $1 pentru eventId, $2 pentru userId
const EVENT_DETAILS_QUERY = `
  SELECT
    e.*, 
    u.display_name as coordinator_name,
    u.avatar_url as coordinator_avatar,
    (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id) as participant_count,
    EXISTS (
      SELECT 1 FROM event_attendance ea_user WHERE ea_user.event_id = e.id AND ea_user.user_id = $2
    ) as is_attending,
    (
      SELECT confirmation_status FROM event_attendance ea_user WHERE ea_user.event_id = e.id AND ea_user.user_id = $2 LIMIT 1
    ) as confirmation_status
  FROM events e
  JOIN users u ON e.created_by = u.id
  WHERE e.id = $1
`;

const PUBLIC_CALENDAR_QUERY = `
  SELECT 
    e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.category,
    (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.id) as participant_count,
    (
      SELECT json_agg(json_build_object('avatar_url', u.avatar_url))
      FROM (
        SELECT u.avatar_url 
        FROM event_attendance ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = e.id
        LIMIT 3
      ) u
    ) as top_participants
  FROM events e
  -- Am scos filtrul de timp pentru a permite Arhiva completă
  ORDER BY e.start_time DESC
`;

module.exports = {
  HOME_EVENTS_QUERY,
  PARTICIPANTS_QUERY,
  ATTENDEES_QUERY,
  EVENT_DETAILS_QUERY,
  PUBLIC_CALENDAR_QUERY
};