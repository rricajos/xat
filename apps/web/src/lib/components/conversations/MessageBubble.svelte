<script lang="ts">
  import { MESSAGE_TYPE } from "@xat/shared";

  interface Attachment {
    id: number;
    fileType: number | null;
    externalUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
  }

  interface Props {
    message: {
      id: number;
      content: string | null;
      contentType: string | null;
      messageType: number;
      senderType: string | null;
      private: boolean | null;
      createdAt: Date;
      attachments?: Attachment[];
    };
  }

  let { message }: Props = $props();

  const isOutgoing = $derived(message.messageType === MESSAGE_TYPE.OUTGOING);
  const isActivity = $derived(message.messageType === MESSAGE_TYPE.ACTIVITY);
  const isPrivate = $derived(message.private === true);
  const hasAttachments = $derived(
    message.attachments && message.attachments.length > 0,
  );
  const showContent = $derived(
    message.content && message.content !== "[Attachment]",
  );

  function formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImage(attachment: Attachment): boolean {
    return attachment.fileType === 0 || (attachment.mimeType?.startsWith("image/") ?? false);
  }
</script>

{#if isActivity}
  <div class="flex justify-center">
    <span class="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      {message.content}
    </span>
  </div>
{:else}
  <div class="flex {isOutgoing ? 'justify-end' : 'justify-start'}">
    <div
      class="max-w-[70%] rounded-lg px-4 py-2 {isPrivate
        ? 'bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700'
        : isOutgoing
          ? 'bg-blue-600 text-white'
          : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700'}"
    >
      {#if isPrivate}
        <span class="mb-1 block text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">
          Private Note
        </span>
      {/if}

      {#if showContent}
        <p class="whitespace-pre-wrap text-sm {isOutgoing && !isPrivate ? 'text-white' : 'text-gray-800 dark:text-gray-200'}">
          {message.content}
        </p>
      {/if}

      {#if hasAttachments}
        <div class="mt-1 space-y-1.5">
          {#each message.attachments! as attachment}
            {#if isImage(attachment) && attachment.externalUrl}
              <a href={attachment.externalUrl} target="_blank" rel="noopener" class="block">
                <img
                  src={attachment.externalUrl}
                  alt={attachment.fileName ?? "Image"}
                  class="max-h-48 rounded-md object-cover"
                  loading="lazy"
                />
              </a>
            {:else if attachment.externalUrl}
              <a
                href={attachment.externalUrl}
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 rounded-md p-2 {isOutgoing && !isPrivate
                  ? 'bg-blue-500/30 hover:bg-blue-500/40'
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'}"
              >
                <svg class="h-5 w-5 flex-shrink-0 {isOutgoing && !isPrivate ? 'text-blue-200' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium {isOutgoing && !isPrivate ? 'text-white' : 'text-gray-700 dark:text-gray-200'}">
                    {attachment.fileName ?? "File"}
                  </p>
                  {#if attachment.fileSize}
                    <p class="text-[10px] {isOutgoing && !isPrivate ? 'text-blue-200' : 'text-gray-400'}">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  {/if}
                </div>
              </a>
            {/if}
          {/each}
        </div>
      {/if}

      <span
        class="mt-1 block text-right text-[10px] {isOutgoing && !isPrivate
          ? 'text-blue-200'
          : 'text-gray-400'}"
      >
        {formatTime(message.createdAt)}
      </span>
    </div>
  </div>
{/if}
