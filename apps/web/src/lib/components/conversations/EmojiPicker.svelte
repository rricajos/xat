<script lang="ts">
  interface Props {
    onSelect: (emoji: string) => void;
  }

  let { onSelect }: Props = $props();

  let search = $state("");
  let selectedCategory = $state("smileys");

  const categories = [
    { id: "smileys", label: "Smileys", icon: "😀" },
    { id: "people", label: "People", icon: "👋" },
    { id: "nature", label: "Nature", icon: "🐶" },
    { id: "food", label: "Food", icon: "🍕" },
    { id: "travel", label: "Travel", icon: "✈️" },
    { id: "objects", label: "Objects", icon: "💡" },
    { id: "symbols", label: "Symbols", icon: "❤️" },
  ];

  const emojiData: Record<string, string[]> = {
    smileys: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝",
      "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒",
      "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
      "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
      "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰",
      "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
      "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺",
    ],
    people: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘",
      "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵",
      "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅",
      "👄", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓",
    ],
    nature: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
      "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣",
      "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛",
      "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🌸", "🌺",
      "🌻", "🌹", "🌷", "🌱", "🌲", "🌳", "🌴", "🌵", "🍀", "🍁", "🍂", "🍃",
    ],
    food: [
      "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖",
      "🍗", "🥩", "🥓", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲",
      "🫕", "🥗", "🍝", "🍜", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚",
      "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰",
      "🎂", "🍮", "🍭", "🍬", "🍫", "🍩", "🍪", "☕", "🍵", "🧃", "🥤", "🧋",
    ],
    travel: [
      "✈️", "🚗", "🚕", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚",
      "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🚂", "🚆", "🚇", "🚊", "🚉", "🚁",
      "🛸", "🚀", "🛶", "⛵", "🚤", "🛳️", "⛴️", "🗺️", "🗼", "🏰", "🗽", "⛲",
      "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🌅", "🌄", "🌠", "🎆", "🎇",
    ],
    objects: [
      "💡", "🔦", "🏮", "🪔", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾", "💿",
      "📀", "🎥", "📷", "📹", "📞", "☎️", "📺", "📻", "🎙️", "⏰", "⌚", "📡",
      "🔋", "🔌", "💰", "💳", "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️",
      "🪚", "🔩", "⚙️", "🧲", "🔬", "🔭", "📡", "🗝️", "🔑", "🔒", "🔓",
    ],
    symbols: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
      "✡️", "🔯", "🕎", "☯️", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎",
      "♏", "♐", "♑", "♒", "♓", "⚛️", "🔀", "🔁", "🔂", "▶️", "⏩", "⏭️",
      "⏯️", "◀️", "⏪", "⏮️", "🔼", "⏫", "🔽", "⏬", "⏸️", "⏹️", "⏺️",
      "✅", "❌", "❓", "❗", "‼️", "⁉️", "💯", "🔥", "✨", "⭐", "🌟", "💫",
    ],
  };

  const filteredEmojis = $derived(
    search.trim()
      ? Object.values(emojiData).flat().filter(() => true) // Show all when searching (emoji search is visual)
      : emojiData[selectedCategory] ?? [],
  );
</script>

<div class="absolute bottom-full left-0 mb-1 w-72 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
  <!-- Category tabs -->
  <div class="flex border-b border-gray-100 px-1 dark:border-gray-700">
    {#each categories as cat}
      <button
        type="button"
        onclick={() => selectedCategory = cat.id}
        class="flex-1 p-2 text-center text-sm transition-colors {selectedCategory === cat.id
          ? 'border-b-2 border-blue-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'}"
        title={cat.label}
      >
        {cat.icon}
      </button>
    {/each}
  </div>

  <!-- Emoji grid -->
  <div class="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2">
    {#each filteredEmojis as emoji}
      <button
        type="button"
        onclick={() => onSelect(emoji)}
        class="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {emoji}
      </button>
    {/each}
  </div>
</div>
