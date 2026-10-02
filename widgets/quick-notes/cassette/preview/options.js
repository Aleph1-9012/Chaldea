/* Quick notes preview options. Original code, 0BSD. */
(() => {
  const root = document.querySelector('[id^="ts-notes-"]');
  let settings = {};
  window.XLR8Notes = {
    apply(values, rowHeight = 40, rowGap = 7) {
      settings = values;
      const density = values.listDensity;
      const height = rowHeight + (density === 'Compact' ? -8 : density === 'Spacious' ? 8 : 0);
      const gap = Math.max(0, rowGap + (density === 'Compact' ? -3 : density === 'Spacious' ? 3 : 0));
      root.dataset.numbers = String(values.showNumbers);
      root.dataset.density = density;
      for (const [key, value] of Object.entries({
        'editor-height': values.editorHeight, 'title-size': values.titleSize,
        'row-height': height, 'row-gap': gap,
        'list-height': values.visibleNotes * height + (values.visibleNotes - 1) * gap,
      })) root.style.setProperty('--notes-' + key, value + 'px');
      // A manually resized textarea must also follow the next accepted settings snapshot.
      root.querySelectorAll('textarea').forEach(body => { body.style.height = values.editorHeight + 'px'; });
      this.updateCount();
      window.XLR8NotesAppearance.apply(values);
    },
    add(notes, note) {
      const index = settings.newNotePosition === 'Top' ? 0 : notes.length;
      notes.splice(index, 0, note);
      return index;
    },
    updateCount() {
      const body = root.querySelector('textarea');
      const count = root.querySelector('[data-text-count]');
      if (!count) return;
      const text = body?.value || '';
      const mode = settings.textCount || 'Off';
      const value = mode === 'Words' ? (text.trim() ? text.trim().split(/\s+/).length : 0) : Array.from(text).length;
      const unit = mode === 'Words' ? 'word' : 'character';
      count.hidden = mode === 'Off';
      count.textContent = mode === 'Off' ? '' : value + ' ' + unit + (value === 1 ? '' : 's');
    },
    reveal(list, selected) {
      requestAnimationFrame(() => {
        const row = list.querySelector(selected);
        if (!row) return;
        const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + row.offsetHeight - list.clientHeight;
      });
    },
  };
  root.addEventListener('input', () => window.XLR8Notes.updateCount());
})();
