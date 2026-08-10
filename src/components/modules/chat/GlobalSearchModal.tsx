"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { useGetSessions } from "@/hooks/data/useChats/useChats";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Command,
} from "@/components/ui/command";

export function GlobalSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGetSessions(debouncedQuery);
  const sessions = React.useMemo(() => {
    return (
      data?.pages
        .flatMap((page) => page?.items || [])
        .filter((session) => Boolean(session)) || []
    );
  }, [data]);

  const handleSelect = React.useCallback(
    (id: string) => {
      onOpenChange(false);
      router.push(`/chat/${id}`);
    },
    [onOpenChange, router],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="h-full w-full">
        <CommandInput
          placeholder="Search chats..."
          value={searchInput}
          onValueChange={setSearchInput}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Searching..." : "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Recent chats">
            {sessions.map((session: any) => {
              const sessionTitle =
                session.title?.trim() ||
                session.lastMessageContent?.trim() ||
                "New Conversation";
              return (
                <CommandItem
                  key={session.id}
                  value={`${sessionTitle} ${session.id}`} // so we can search by id if needed, but display title
                  onSelect={() => handleSelect(session.id)}
                >
                  <History className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>{sessionTitle}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
