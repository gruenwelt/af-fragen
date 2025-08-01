

<!-- src/lib/components/LoadingSpinner.svelte -->
<div class="spinner-wrapper">
  <div class="spinner"></div>
</div>

<style>
  .spinner-wrapper {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background-color: transparent;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
    background-color: currentColor;
    animation: pulse 1s infinite ease-in-out;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>