<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    setTimeout(() => goto('/'), 2000);
  });
</script>

<svelte:head>
  <title>Seite nicht gefunden – Funkfragen</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="h-screen w-screen flex items-center justify-center bg-white px-4">
  <div class="text-center animate-fade-in flex flex-col items-center space-y-4">
    <svg class="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
    <p class="text-xl text-gray-700 font-semibold">404 – Seite nicht gefunden</p>
    <p class="text-sm text-gray-500">Du wirst gleich zur Startseite weitergeleitet...</p>
  </div>
</div>