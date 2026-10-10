<script lang="ts">
  import mark from './assets/footer-mark.svg';
  import inscriptions from './assets/footer-inscriptions.svg';
  import star from './assets/star.svg';
  import { repositoryUrl, docsUrl, changelogUrl, libraryUrl } from './links';

  let { visible = $bindable(false) }: { visible?: boolean } = $props();

  function trackVisibility(node: HTMLElement) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
    });

    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
        visible = false;
      },
    };
  }
</script>

<footer class="site-footer" use:trackVisibility>
  <svg width="0" height="0" class="footer-clip-defs" aria-hidden="true">
    <defs>
      <clipPath id="footer-github-chamber" clipPathUnits="objectBoundingBox">
        <!-- The C opening from footer-mark.svg, normalized to the link's bounds. -->
        <path transform="matrix(0.005571890481149459 0 0 0.004568959766654087 -0.21950852582821972 -0.33333211494406223)" d="M198.44 91.9244C189.685 100.679 179.472 105.056 166.34 105.056H110.893C68.5786 105.056 39.3957 137.158 39.3957 182.39C39.3958 227.623 64.2013 253.887 109.434 253.887H164.88C180.93 253.887 191.145 264.1 201.359 275.773L218.868 291.824V72.9558L198.44 91.9244Z" />
      </clipPath>
      <!-- Match the remaining openings in footer-mark.svg without changing the artwork. -->
      <clipPath id="footer-docs-chamber" clipPathUnits="objectBoundingBox">
        <path transform="matrix(0.004568963941737 0 0 0.005439213794281 -1.146668311493686 -0.142854967171625)" d="M335.598 26.2639L469.837 42.3147C446.491 39.3964 431.9 49.6106 431.9 75.8747V157.585C431.9 194.063 412.931 210.114 379.371 210.114H291.824C262.642 210.114 250.969 189.685 250.969 151.748V75.8747L271.396 77.3331L272.855 129.862C274.314 160.503 287.447 178.013 318.088 178.013C344.352 178.013 358.943 157.585 358.943 122.567V53.9871C358.943 37.9372 351.648 29.1821 335.598 26.2639Z" />
      </clipPath>
      <clipPath id="footer-top-chamber" clipPathUnits="objectBoundingBox">
        <path transform="matrix(0.011053876594522 0 0 0.010078511605406 -2.999977892246811 -2.235272774916600)" d="M271.396 321.007V271.396C271.396 237.836 293.284 221.786 316.629 221.786C345.811 221.786 361.862 240.755 361.862 271.396V321.007H271.396Z" />
      </clipPath>
      <clipPath id="footer-library-chamber" clipPathUnits="objectBoundingBox">
        <path transform="matrix(0.004685442797772 0 0 0.004055284887819 -1.925262501932745 -0.301774835984003)" d="M528.201 74.4152L624.33 321.007H561.761V296.201C561.761 252.428 544.252 218.868 516.528 218.868C485.887 218.868 465.459 255.346 465.459 297.66V321.007H410.903C414.22 291.303 425.301 266.29 442.114 237.837L528.201 74.4152Z" />
      </clipPath>
      <clipPath id="footer-changelog-chamber" clipPathUnits="objectBoundingBox">
        <path transform="matrix(0.006527116907191 0 0 0.004479375610875 -3.933351609260674 -0.248366147745933)" d="M602.617 55.4466L688.704 70.0379V211.572C688.704 232 700.378 245.132 722.264 245.132H755.824V278.692H696.001C646.39 278.692 621.585 255.346 621.585 202.817V78.7925C621.585 65.6605 615.749 56.9057 602.617 55.4466Z" />
      </clipPath>
      <clipPath id="footer-license-chamber" clipPathUnits="objectBoundingBox">
        <path transform="matrix(0.006287726358149 0 0 0.019581350721573 -6.156124245472838 -2.971430809297225)" d="M1034.52 151.748C1002.42 151.748 979.07 167.799 979.07 185.308C979.07 195.522 986.365 202.817 1008.25 202.817H1107.47L1138.11 151.748H1034.52Z" />
      </clipPath>
    </defs>
  </svg>
  <div class="footer-slab grain">
    <div class="footer-mark">
      <img class="footer-silhouette" src={mark} alt="" width="1392" height="321.007" />
      <img class="footer-inscriptions" src={inscriptions} alt="" width="1392" height="321" />
      <ul class="footer-links">
        <li class="footer-github"><a href={repositoryUrl} aria-label="Star on GitHub"><span class="footer-github-label"><span class="footer-github-first-line"><img src={star} alt="" width="14" height="14" />Star on</span><span>GitHub</span></span></a></li>
        <li class="footer-docs"><a href={docsUrl}>Docs</a></li>
        <li class="footer-top"><a href="#top">↑ Top</a></li>
        <li class="footer-library"><a href={libraryUrl()}>Library</a></li>
        <li class="footer-changelog"><a href={changelogUrl}>Changelog</a></li>
        <li class="footer-license"><a href={`${repositoryUrl}/blob/main/LICENSE`}>Site · Apache-2.0</a></li>
        <li class="footer-widgets">Widgets · 0BSD</li>
        <li class="footer-year">© 2026</li>
      </ul>
    </div>
  </div>
</footer>
