-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.event_attendance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  status USER-DEFINED NOT NULL,
  visibility USER-DEFINED DEFAULT 'private'::visibility_level,
  group_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT fk_event_attendance_group FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.event_sources (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  source_name USER-DEFINED NOT NULL UNIQUE,
  last_sync timestamp with time zone,
  next_sync timestamp with time zone,
  sync_frequency interval DEFAULT '04:00:00'::interval,
  is_active boolean DEFAULT true,
  sync_status text DEFAULT 'pending'::text CHECK (sync_status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  last_error text,
  events_synced integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_sources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
  description text,
  date_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location_name text NOT NULL CHECK (length(location_name) <= 255),
  location_address text CHECK (length(location_address) <= 500),
  location_point USER-DEFINED,
  neighborhood text CHECK (length(neighborhood) <= 100),
  category USER-DEFINED NOT NULL,
  source USER-DEFINED NOT NULL,
  external_id text CHECK (length(external_id) <= 255),
  external_url text,
  image_url text,
  price_min integer DEFAULT 0 CHECK (price_min >= 0),
  price_max integer CHECK (price_max >= 0),
  capacity integer CHECK (capacity > 0),
  current_attendees integer DEFAULT 0 CHECK (current_attendees >= 0),
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_user_generated boolean DEFAULT false,
  created_by_user_id uuid,
  moderation_status USER-DEFINED DEFAULT 'approved'::moderation_status,
  accessibility_info jsonb DEFAULT '{}'::jsonb,
  transit_score integer CHECK (transit_score >= 1 AND transit_score <= 10),
  metadata jsonb DEFAULT '{}'::jsonb,
  tags ARRAY DEFAULT '{}'::text[],
  popularity_score real DEFAULT 0.0,
  friend_attendance_count integer DEFAULT 0,
  similar_user_attendance integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  friend_user_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'blocked'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT friendships_friend_user_id_fkey FOREIGN KEY (friend_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::group_role,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  description text,
  type USER-DEFINED DEFAULT 'friend_group'::group_type,
  created_by_user_id uuid NOT NULL,
  is_private boolean DEFAULT true,
  max_members integer DEFAULT 50 CHECK (max_members > 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL,
  inviter_user_id uuid NOT NULL,
  invitee_user_id uuid NOT NULL,
  group_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT invitations_inviter_user_id_fkey FOREIGN KEY (inviter_user_id) REFERENCES public.users(id),
  CONSTRAINT invitations_invitee_user_id_fkey FOREIGN KEY (invitee_user_id) REFERENCES public.users(id),
  CONSTRAINT invitations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.ml_event_features (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL UNIQUE,
  feature_vector ARRAY NOT NULL,
  popularity_features jsonb DEFAULT '{}'::jsonb,
  social_features jsonb DEFAULT '{}'::jsonb,
  temporal_features jsonb DEFAULT '{}'::jsonb,
  location_features jsonb DEFAULT '{}'::jsonb,
  computed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ml_event_features_pkey PRIMARY KEY (id),
  CONSTRAINT ml_event_features_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.swipe_context (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  swipe_id uuid NOT NULL,
  swipe_speed_ms integer,
  hesitation_time_ms integer,
  friends_attending_count integer DEFAULT 0,
  weather_condition text,
  time_of_day text,
  day_of_week text,
  user_calendar_density real DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT swipe_context_pkey PRIMARY KEY (id),
  CONSTRAINT swipe_context_swipe_id_fkey FOREIGN KEY (swipe_id) REFERENCES public.swipes(id)
);
CREATE TABLE public.swipe_recommendation_feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  predicted_direction USER-DEFINED NOT NULL,
  actual_direction USER-DEFINED NOT NULL,
  prediction_confidence real NOT NULL CHECK (prediction_confidence >= 0::double precision AND prediction_confidence <= 1::double precision),
  was_accurate boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT swipe_recommendation_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT swipe_recommendation_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT swipe_recommendation_feedback_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.swipes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  direction USER-DEFINED NOT NULL,
  action USER-DEFINED NOT NULL,
  visibility USER-DEFINED DEFAULT 'private'::visibility_level,
  calendar_type USER-DEFINED DEFAULT 'private'::calendar_type,
  notes text CHECK (length(notes) <= 500),
  confidence_score real DEFAULT 1.0 CHECK (confidence_score >= 0::double precision AND confidence_score <= 1::double precision),
  context_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT swipes_pkey PRIMARY KEY (id),
  CONSTRAINT swipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT swipes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  preference_score real DEFAULT 0.5 CHECK (preference_score >= 0::double precision AND preference_score <= 1::double precision),
  neighborhood text,
  time_preference text,
  price_sensitivity real DEFAULT 0.5 CHECK (price_sensitivity >= 0::double precision AND price_sensitivity <= 1::double precision),
  social_preference real DEFAULT 0.5 CHECK (social_preference >= 0::double precision AND social_preference <= 1::double precision),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  age integer CHECK (age >= 18 AND age <= 50),
  location_neighborhood text,
  privacy_level USER-DEFINED DEFAULT 'private'::privacy_level,
  preferences jsonb DEFAULT '{}'::jsonb,
  ml_preference_vector ARRAY DEFAULT '{}'::real[],
  phone_hash text,
  profile_image_url text,
  push_token text,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);