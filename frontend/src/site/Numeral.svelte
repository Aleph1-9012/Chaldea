<script lang="ts">
  import zero from './assets/number-0.svg';
  import one from './assets/number-1.svg';
  import two from './assets/number-2.svg';
  import three from './assets/number-3.svg';
  import four from './assets/number-4.svg';
  import five from './assets/number-5.svg';
  import six from './assets/number-6.svg';
  import seven from './assets/number-7.svg';
  import eight from './assets/number-8.svg';
  import nine from './assets/number-9.svg';
  import heroThree from './assets/hero-count-3.svg';
  import heroNine from './assets/hero-count-9.svg';
  import menuThree from './assets/menu-count-3.svg';
  import menuNine from './assets/menu-count-9.svg';
  import libraryThree from './assets/library-count-3.svg';
  import libraryNine from './assets/library-count-9.svg';

  let { value, variant = 'library' }: { value: number; variant?: 'hero' | 'menu' | 'library' } = $props();

  const digits = [zero, one, two, three, four, five, six, seven, eight, nine];

  // Masks preserve Figma's outlines while applying each screen's palette.
  const designs = {
    hero: [heroThree, heroNine],
    menu: [menuThree, menuNine],
    library: [libraryThree, libraryNine],
  };
</script>

<div class="numeral numeral-{variant}" role="img" aria-label={String(value)}>
  {#if value === 39}
    {#each designs[variant] as src, index}<span class="designed-digit" style:--digit-index={index} style:mask-image={`url("${src}")`}></span>{/each}
  {:else}
    {#each String(value).padStart(2, '0') as digit, index}
      <span class="numeral-digit" class:narrow={digit === '1'} style:--digit-index={index} style:mask-image={`url("${digits[Number(digit)]}")`}></span>
    {/each}
  {/if}
</div>
