// Form Filler - Injected into page to fill form fields
// Handles React/Vue synthetic events properly

function fillApplicationForm(fieldMatches) {
  let filledCount = 0;
  const errors = [];

  // Helper: Set value with proper React/Vue handling
  function setNativeValue(element, value) {
    const tagName = element.tagName.toLowerCase();
    
    // Get the native setter
    const prototype = tagName === 'textarea' 
      ? window.HTMLTextAreaElement.prototype 
      : window.HTMLInputElement.prototype;
    
    const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    
    // Set value using native setter
    nativeValueSetter.call(element, value);
    
    // Trigger all necessary events
    ['input', 'change', 'blur'].forEach(eventType => {
      element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
    });
  }

  // Helper: Fill different field types
  function fillField(selector, value, fieldType = 'text') {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        errors.push(`Field not found: ${selector}`);
        return false;
      }

      switch (fieldType) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'number':
        case 'textarea':
          setNativeValue(element, value);
          break;

        case 'select':
          // For select dropdowns
          const option = [...element.options].find(opt => 
            opt.text.trim().toLowerCase() === value.toLowerCase() ||
            opt.value.toLowerCase() === value.toLowerCase()
          );
          
          if (option) {
            element.value = option.value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Try custom dropdown (div-based)
            fillCustomDropdown(element, value);
          }
          break;

        case 'radio':
          // For radio buttons, find the one with matching label
          const radios = document.querySelectorAll(selector);
          for (const radio of radios) {
            const label = getRadioLabel(radio);
            if (label && label.toLowerCase().includes(value.toLowerCase())) {
              radio.click();
              break;
            }
          }
          break;

        case 'checkbox':
          // For checkboxes
          const shouldCheck = /yes|true|1/i.test(value.toString());
          if (element.checked !== shouldCheck) {
            element.click();
          }
          break;

        case 'file':
          // File inputs need special handling
          errors.push(`File upload detected for ${selector} - manual intervention needed`);
          return false;

        default:
          setNativeValue(element, value);
      }

      filledCount++;
      return true;

    } catch (error) {
      errors.push(`Error filling ${selector}: ${error.message}`);
      return false;
    }
  }

  // Helper: Get label for radio button
  function getRadioLabel(radio) {
    // Check parent label
    const parentLabel = radio.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    
    // Check for label
    if (radio.id) {
      const label = document.querySelector(`label[for="${radio.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Check next sibling
    const nextEl = radio.nextElementSibling;
    if (nextEl && nextEl.tagName === 'LABEL') {
      return nextEl.textContent.trim();
    }
    
    return radio.value;
  }

  // Helper: Handle custom dropdowns (div-based)
  function fillCustomDropdown(triggerElement, value) {
    // Click to open dropdown
    triggerElement.click();
    
    setTimeout(() => {
      // Look for dropdown options
      const dropdownSelectors = [
        '[role="listbox"] [role="option"]',
        '.dropdown-menu li',
        '.select-options li',
        '[class*="option"]'
      ];
      
      for (const selector of dropdownSelectors) {
        const options = document.querySelectorAll(selector);
        for (const option of options) {
          if (option.textContent.trim().toLowerCase() === value.toLowerCase()) {
            option.click();
            return;
          }
        }
      }
    }, 200);
  }

  // Helper: Handle dynamic form sections (education/experience)
  function addDynamicSection(buttonSelector, sectionData) {
    const addButton = document.querySelector(buttonSelector);
    if (!addButton) {
      errors.push(`Add button not found: ${buttonSelector}`);
      return false;
    }

    // Click add button
    addButton.click();

    // Wait for new section to appear
    setTimeout(() => {
      // Fill the new section fields
      // This would need to be customized based on the specific form structure
    }, 500);

    return true;
  }

  // Helper: Wait for element
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsed = 0;

      const timer = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(timer);
          resolve(element);
        } else if (elapsed >= timeout) {
          clearInterval(timer);
          reject(new Error(`Element ${selector} not found after ${timeout}ms`));
        }
        elapsed += interval;
      }, interval);
    });
  }

  // Main filling logic with delays to avoid detection
  async function fill() {
    // Fill simple fields first
    for (const [fieldLabel, fieldData] of Object.entries(fieldMatches)) {
      if (fieldData.selector && fieldData.value) {
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
        fillField(fieldData.selector, fieldData.value, fieldData.type);
      }
    }

    return {
      success: filledCount > 0,
      filledCount: filledCount,
      totalFields: Object.keys(fieldMatches).length,
      errors: errors
    };
  }

  // Execute filling
  return fill();
}

// Education/Experience section handler
function fillRepeatingSection(sectionType, sectionData) {
  const templates = {
    education: {
      school: '{school}',
      degree: '{degree}',
      major: '{major}',
      gpa: '{gpa}',
      startDate: '{startDate}',
      endDate: '{endDate}',
      current: '{current}'
    },
    experience: {
      company: '{company}',
      title: '{title}',
      location: '{location}',
      startDate: '{startDate}',
      endDate: '{endDate}',
      current: '{current}',
      description: '{description}'
    }
  };

  const fields = templates[sectionType];
  const results = [];

  // For each item in sectionData array
  sectionData.forEach((item, index) => {
    const sectionResults = {};
    
    // Try to find fields for this section
    Object.entries(fields).forEach(([fieldName, template]) => {
      const value = item[fieldName];
      if (value !== undefined) {
        // Look for field in the form
        const selector = findFieldSelector(fieldName, index);
        if (selector) {
          sectionResults[fieldName] = {
            selector: selector,
            value: value
          };
        }
      }
    });

    results.push(sectionResults);
  });

  return results;
}

// Helper to find field selectors dynamically
function findFieldSelector(fieldName, sectionIndex = 0) {
  // Common patterns for field names in repeating sections
  const patterns = [
    `[name*="${fieldName}"][name*="[${sectionIndex}]"]`,
    `[name="${fieldName}_${sectionIndex}"]`,
    `[name="${fieldName}${sectionIndex}"]`,
    `[id*="${fieldName}"][id*="${sectionIndex}"]`,
    `[data-field="${fieldName}"][data-index="${sectionIndex}"]`
  ];

  for (const pattern of patterns) {
    const element = document.querySelector(pattern);
    if (element) return pattern;
  }

  // Try by label text
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent.toLowerCase().includes(fieldName.toLowerCase())) {
      const forAttr = label.getAttribute('for');
      if (forAttr) return `#${forAttr}`;
      
      const input = label.querySelector('input, textarea, select');
      if (input && input.id) return `#${input.id}`;
    }
  }

  return null;
}

// Execute the form filling when called
// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fillApplicationForm, fillRepeatingSection };
} else {
  window.fillApplicationForm = fillApplicationForm;
  window.fillRepeatingSection = fillRepeatingSection;
}