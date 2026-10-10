<script lang="ts">
  function trackVisibility(node: HTMLDivElement) {
    const observer = new IntersectionObserver(entries => {
      node.classList.toggle('active', entries.some(entry => entry.isIntersecting));
    });

    observer.observe(node);

    return { destroy: () => observer.disconnect() };
  }
</script>

<div class="module-loader" aria-hidden="true" use:trackVisibility>
  {#each [0, 1, 2, 3, 7, 6, 5, 4] as step}<i style:--step={step}></i>{/each}
</div>
