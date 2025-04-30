-- Migration: Add attachments and additional fields to chat_messages table

-- Add column for attachments (JSON array of objects with file metadata)
alter table public.chat_messages
add column if not exists attachments jsonb;

-- Add column for model used to generate the assistant response
alter table public.chat_messages
add column if not exists model text;

-- Add column to track if message was generated with web search mode
alter table public.chat_messages
add column if not exists search_mode boolean default false;

-- Add column for storing search sources when using web search
alter table public.chat_messages
add column if not exists sources jsonb;

-- Add comments for documentation
comment on column public.chat_messages.attachments is 'Array of attachment objects with URLs and metadata for files shared in messages.';
comment on column public.chat_messages.model is 'The AI model used to generate the assistant message.';
comment on column public.chat_messages.search_mode is 'Whether web search was used to generate this message.';
comment on column public.chat_messages.sources is 'Sources of information used when web search is enabled.'; 