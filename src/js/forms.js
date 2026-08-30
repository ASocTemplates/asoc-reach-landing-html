/**
 * Form behaviors. Everything binds by data-attribute, so markup is all you write.
 *
 *   <button data-password-toggle="password">        show/hide a password field
 *   <textarea data-autosize>                        grow with content
 *   <input data-char-count="160">                   live character counter
 *   <div data-dropzone>                             drag-and-drop file picker
 *   <div data-tags>                                 tag / multi-value input
 *   <form data-validate>                            inline validation on submit
 */

/* --------------------------------------------------------------- password */

function initPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((btn) => {
    const input = document.getElementById(btn.dataset.passwordToggle);
    if (!input) return;
    btn.addEventListener("click", () => {
      const shown = input.type === "text";
      input.type = shown ? "password" : "text";
      btn.setAttribute("aria-label", shown ? "Show password" : "Hide password");
      // The two icons are inlined at build time; swap which one is visible.
      btn.querySelector(".lucide-eye")?.classList.toggle("hidden", !shown);
      btn.querySelector(".lucide-eye-off")?.classList.toggle("hidden", shown);
    });
  });
}

/* --------------------------------------------------------------- autosize */

function initAutosize() {
  document.querySelectorAll("textarea[data-autosize]").forEach((textarea) => {
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener("input", resize);
    resize();
  });
}

/* ------------------------------------------------------------ char counter */

function initCharCounts() {
  document.querySelectorAll("[data-char-count]").forEach((field) => {
    const max = Number(field.dataset.charCount);
    const output = document.getElementById(field.getAttribute("aria-describedby"));
    if (!output) return;
    const update = () => {
      const used = field.value.length;
      output.textContent = `${used} / ${max}`;
      output.classList.toggle("text-destructive", used > max);
    };
    field.addEventListener("input", update);
    update();
  });
}

/* ---------------------------------------------------------------- dropzone */

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

function initDropzones() {
  document.querySelectorAll("[data-dropzone]").forEach((zone) => {
    const input = zone.querySelector('input[type="file"]');
    const list = zone.parentElement.querySelector("[data-dropzone-list]");
    if (!input) return;

    const render = (files) => {
      if (!list) return;
      list.innerHTML = "";
      [...files].forEach((file) => {
        const row = document.createElement("li");
        row.className = "flex items-center gap-3 rounded-lg border p-3";
        row.innerHTML = `
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold uppercase text-muted-foreground">${(file.name.split(".").pop() ?? "?").slice(0, 4)}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">${file.name}</span>
            <span class="block text-xs text-muted-foreground">${formatBytes(file.size)}</span>
          </span>
          <button type="button" data-dropzone-remove aria-label="Remove ${file.name}" class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive">&times;</button>`;
        row.querySelector("[data-dropzone-remove]").addEventListener("click", () => row.remove());
        list.append(row);
      });
    };

    input.addEventListener("change", () => render(input.files));

    ["dragenter", "dragover"].forEach((type) =>
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.add("border-primary", "bg-primary/5");
      }),
    );
    ["dragleave", "drop"].forEach((type) =>
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.remove("border-primary", "bg-primary/5");
      }),
    );
    zone.addEventListener("drop", (event) => {
      // Assigning to input.files keeps the form submission honest — the dropped
      // files really are the field's value, not a parallel list.
      input.files = event.dataTransfer.files;
      render(input.files);
    });
  });
}

/* -------------------------------------------------------------------- tags */

function initTags() {
  document.querySelectorAll("[data-tags]").forEach((root) => {
    const input = root.querySelector("input");
    const name = root.dataset.tags;
    if (!input) return;

    const add = (label) => {
      const value = label.trim().replace(/,$/, "");
      if (!value) return;
      const tag = document.createElement("span");
      tag.className =
        "inline-flex items-center gap-1 rounded-md bg-secondary py-1 pl-2.5 pr-1 text-xs font-medium";
      tag.innerHTML = `${value}<input type="hidden" name="${name}" value="${value}" /><button type="button" aria-label="Remove ${value}" class="inline-flex size-4 items-center justify-center rounded transition-colors hover:bg-background">&times;</button>`;
      tag.querySelector("button").addEventListener("click", () => tag.remove());
      root.insertBefore(tag, input);
      input.value = "";
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        add(input.value);
      }
      if (event.key === "Backspace" && !input.value) {
        root.querySelector("span:last-of-type")?.remove();
      }
    });
    input.addEventListener("blur", () => add(input.value));
  });
}

/* -------------------------------------------------------------- validation */

function initValidation() {
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    const show = (field) => {
      const wrap = field.closest("[data-field]") ?? field.parentElement;
      const message = wrap.querySelector("[data-field-error]");
      const invalid = !field.checkValidity();
      field.setAttribute("aria-invalid", String(invalid));
      field.classList.toggle("border-destructive", invalid);
      field.classList.toggle("focus-visible:ring-destructive/30", invalid);
      if (message) {
        message.textContent = invalid ? field.validationMessage : "";
        message.classList.toggle("hidden", !invalid);
      }
      return !invalid;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fields = [...form.querySelectorAll("input, select, textarea")];
      const ok = fields.map(show).every(Boolean);
      const banner = form.querySelector("[data-form-status]");
      if (banner) {
        banner.hidden = false;
        banner.textContent = ok
          ? "Looks good — this demo form does not submit anywhere."
          : "Please correct the highlighted fields.";
        banner.className = ok
          ? "rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success"
          : "rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive";
      }
      if (!ok) fields.find((f) => !f.checkValidity())?.focus();
    });

    // Re-validate a field once it has been corrected, not on every keystroke.
    form.addEventListener(
      "blur",
      (event) => {
        if (event.target.matches("input, select, textarea")) show(event.target);
      },
      true,
    );
  });
}

export function initForms() {
  initPasswordToggles();
  initAutosize();
  initCharCounts();
  initDropzones();
  initTags();
  initValidation();
}
