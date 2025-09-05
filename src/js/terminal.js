// Terminal system for text input and output

export class Terminal {
  constructor(outputElementId, inputElementId) {
    this.outputElement = typeof outputElementId === 'string' ? document.getElementById(outputElementId) : outputElementId;
    this.inputElement = typeof inputElementId === 'string' ? document.getElementById(inputElementId) : inputElementId;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.commandHandlers = {};
    
    if (!this.outputElement || !this.inputElement) {
      console.error('Terminal: Could not find required DOM elements');
      return;
    }
    
    this.init();
  }
  
  init() {
    // Store event handler references for cleanup
    this.keydownHandler = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.processInput();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateHistory(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateHistory(1);
      }
    };
    
    this.clickHandler = () => {
      this.inputElement.focus();
    };
    
    // Set up input event listener
    this.inputElement.addEventListener('keydown', this.keydownHandler);
    
    // Focus the input element
    this.inputElement.focus();
    
    // Add event listener to refocus input when clicking anywhere in the terminal
    const terminalContainer = document.getElementById('terminal-container');
    if (terminalContainer) {
      terminalContainer.addEventListener('click', this.clickHandler);
    }
  }
  
  processInput() {
    const input = this.inputElement.value.trim();
    
    // Add to command history (only if not empty)
    if (input !== '') {
      this.commandHistory.push(input);
      this.historyIndex = this.commandHistory.length;
      
      // Display the input
      this.print(input, 'player-input');
    }
    
    // Clear the input field
    this.inputElement.value = '';
    
    // Process the command (allow empty input for special handlers like game over)
    this.parseCommand(input);
  }
  
  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex += direction;
    
    // Keep index within bounds
    if (this.historyIndex < 0) this.historyIndex = 0;
    if (this.historyIndex > this.commandHistory.length) this.historyIndex = this.commandHistory.length;
    
    // Set input value from history or clear it if at the end
    if (this.historyIndex === this.commandHistory.length) {
      this.inputElement.value = '';
    } else {
      this.inputElement.value = this.commandHistory[this.historyIndex];
    }
    
    // Move cursor to end of input
    setTimeout(() => {
      this.inputElement.selectionStart = this.inputElement.value.length;
      this.inputElement.selectionEnd = this.inputElement.value.length;
    }, 0);
  }
  
  parseCommand(input) {
    // Convert to lowercase for case-insensitive matching
    const lowerInput = input.toLowerCase();
    
    // Check for registered command handlers
    for (const [pattern, handler] of Object.entries(this.commandHandlers)) {
      if (lowerInput.match(new RegExp(pattern, 'i'))) {
        handler(input);
        return;
      }
    }
    
    // If no handler matched, show default message
    this.print("I don't understand that command.", 'error-message');
  }
  
  registerCommand(pattern, handler) {
    this.commandHandlers[pattern] = handler;
  }
  
  print(message, className = '') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.textContent = message;
    
    this.outputElement.appendChild(messageElement);
    
    // Scroll to bottom
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
  
  getHistory() {
    // Return the current terminal output as HTML
    return this.outputElement.innerHTML;
  }
  
  setHistory(historyHTML) {
    // Restore terminal output from saved HTML
    if (typeof historyHTML === 'string') {
      this.outputElement.innerHTML = historyHTML;
    } else if (Array.isArray(historyHTML)) {
      // Handle legacy array format
      this.outputElement.innerHTML = historyHTML.join('');
    }
    
    // Scroll to bottom
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
  
  clear() {
    this.outputElement.innerHTML = '';
  }
  
  disable() {
    this.inputElement.disabled = true;
  }
  
  enable() {
    this.inputElement.disabled = false;
    this.inputElement.focus();
  }
  
  printHTML(html, className = '') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.innerHTML = html;
    
    this.outputElement.appendChild(messageElement);
    
    // Scroll to bottom
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
  
  clear() {
    this.outputElement.innerHTML = '';
  }
  
  disable() {
    this.inputElement.disabled = true;
  }
  
  enable() {
    this.inputElement.disabled = false;
    this.inputElement.focus();
  }
  
  cleanup() {
    // Remove event listeners
    if (this.inputElement) {
      this.inputElement.removeEventListener('keydown', this.keydownHandler);
    }
    
    const terminalContainer = document.getElementById('terminal-container');
    if (terminalContainer && this.clickHandler) {
      terminalContainer.removeEventListener('click', this.clickHandler);
    }
    
    // Clear command handlers
    this.commandHandlers = {};
    
    // Clear command history
    this.commandHistory = [];
    this.historyIndex = -1;
  }
}