-- Migration: Create chat_messages table
-- Stores the history of conversations between users and the assistant.

create table public.chat_messages (
  id bigserial primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  session_id uuid not null default gen_random_uuid(), -- Groups messages in a single conversation thread
  role text not null check (role in ('user', 'assistant')), -- Who sent the message
  content text not null, -- The actual message text
  -- Optional: Add references if a message relates to specific document context
  -- related_document_id uuid references public.documents,
  -- related_embedding_id bigint references public.document_embeddings,

  -- Add an index for efficient querying by user and session
  index idx_chat_messages_user_session (user_id, session_id, created_at)
);

alter table public.chat_messages enable row level security;

-- Comments for documentation
comment on table public.chat_messages is 'Stores chat conversation messages between users and the AI assistant.';
comment on column public.chat_messages.session_id is 'Identifier for a specific chat session or thread.';
comment on column public.chat_messages.role is 'Indicates whether the message is from the user or the assistant.';
comment on column public.chat_messages.content is 'The text content of the chat message.';

-- Policy: Allow users to manage their own chat messages.
create policy "Users can manage their own chat messages" on public.chat_messages
  for all using (auth.uid() = user_id); 