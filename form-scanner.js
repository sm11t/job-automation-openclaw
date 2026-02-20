// Form Scanner - Injected into page via browser.act(evaluate)
// Returns structured form data for LLM processing

function scanApplicationForm() {
  const fields = [];
  const sections = {
    personal: [],
    education: [],
    experience: [],
    questions: [],
    other: []
  };

  // Helper: Find label for an element
  function getLabel(el) {
    // Strategy 1: Label with for attribute
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Strategy 2: Parent label
    const parentLabel = el.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent;
      // Remove the input's value from label text
      return text.replace(el.value, '').trim();
    }

    // Strategy 3: ARIA attributes
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelEl = document.getElementById(ariaLabelledBy);
      if (labelEl) return labelEl.textContent.trim();
    }

    // Strategy 4: Previous sibling text
    let prev = el.previousSibling;
    while (prev && prev.nodeType === 3 && !prev.textContent.trim()) {
      prev = prev.previousSibling;
    }
    if (prev && prev.nodeType === 3) return prev.textContent.trim();

    // Strategy 5: Placeholder or name
    return el.placeholder || el.name || '';
  }

  // Helper: Detect field category
  function categorizeField(label, type) {
    const lowerLabel = label.toLowerCase();
    
    // Personal info patterns
    if (/first.?name|given.?name/i.test(label)) return 'personal';
    if (/last.?name|family.?name|surname/i.test(label)) return 'personal';
    if (/email|e-mail/i.test(label)) return 'personal';
    if (/phone|mobile|cell/i.test(label)) return 'personal';
    if (/address|city|state|zip|postal/i.test(label)) return 'personal';
    if (/linkedin|github|portfolio|website/i.test(label)) return 'personal';

    // Education patterns
    if (/school|university|college|education|degree|major|gpa|graduation/i.test(label)) return 'education';

    // Experience patterns
    if (/company|employer|position|title|experience|work|job/i.test(label)) return 'experience';
    if (/start.?date|end.?date|from|to|current/i.test(label)) return 'experience';

    // Question patterns
    if (/why|describe|explain|tell us|how would|what would/i.test(label)) return 'questions';
    if (type === 'textarea' && label.length > 30) return 'questions';

    return 'other';
  }

  // Helper: Get select/radio options
  function getOptions(el) {
    if (el.tagName === 'SELECT') {
      return [...el.options].map(opt => ({
        value: opt.value,
        text: opt.text.trim()
      })).filter(opt => opt.text && opt.value);
    }

    if (el.type === 'radio') {
      const name = el.name;
      return [...document.querySelectorAll(`input[type="radio"][name="${name}"]`)]
        .map(radio => ({
          value: radio.value,
          text: getLabel(radio) || radio.value
        }));
    }

    return [];
  }

  // Main scanning logic
  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
    'textarea, select'
  );

  const processedNames = new Set();

  for (const el of inputs) {
    // Skip if not visible
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Skip if already processed (for radio groups)
    if (el.type === 'radio' && processedNames.has(el.name)) continue;
    if (el.type === 'radio') processedNames.add(el.name);

    const label = getLabel(el);
    if (!label && el.type !== 'hidden') continue;

    const field = {
      label: label,
      type: el.type || (el.tagName === 'SELECT' ? 'select' : 'text'),
      name: el.name,
      id: el.id,
      required: el.required || el.getAttribute('aria-required') === 'true',
      value: el.value || '',
      options: getOptions(el),
      selector: el.id ? `#${el.id}` : `[name="${el.name}"]`,
      category: categorizeField(label, el.type)
    };

    fields.push(field);
    sections[field.category].push(field);
  }

  // Detect repeating sections (education/experience blocks)
  const educationBlocks = detectRepeatingBlocks('education');
  const experienceBlocks = detectRepeatingBlocks('experience');

  function detectRepeatingBlocks(keyword) {
    const blocks = [];
    const containers = document.querySelectorAll('[class*="' + keyword + '"], [id*="' + keyword + '"]');
    
    containers.forEach(container => {
      const blockFields = [];
      const inputs = container.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        const label = getLabel(input);
        if (label) {
          blockFields.push({
            label: label,
            selector: input.id ? `#${input.id}` : `[name="${input.name}"]`
          });
        }
      });

      if (blockFields.length > 2) {
        blocks.push(blockFields);
      }
    });

    return blocks;
  }

  // Check for "Add More" buttons
  const addButtons = [...document.querySelectorAll('button, a, div[role="button"]')]
    .filter(el => /add.*education|add.*school|add.*degree/i.test(el.textContent))
    .map(el => ({
      text: el.textContent.trim(),
      selector: el.id ? `#${el.id}` : null
    }));

  return {
    url: window.location.href,
    domain: window.location.hostname,
    fields: fields,
    sections: sections,
    educationBlocks: educationBlocks,
    experienceBlocks: experienceBlocks,
    addButtons: addButtons,
    totalFields: fields.length,
    hasFileUpload: fields.some(f => f.type === 'file')
  };
}

// Execute and return result
scanApplicationForm();