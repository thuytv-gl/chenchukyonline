// src/lib/debugConsole.ts

/**
 * Creates an on-screen console logger for debugging on mobile devices
 * @param options Configuration options
 * @returns Object with methods to control the on-screen logger
 */
export function createScreenLogger(options: {
  position?: 'top' | 'bottom';
  maxLogs?: number;
  fontSize?: string;
  zIndex?: number;
  opacity?: number;
  theme?: 'dark' | 'light';
} = {}) {
  const {
    position = 'bottom',
    maxLogs = 50,
    fontSize = '12px',
    zIndex = 10000,
    opacity = 0.9,
    theme = 'dark',
  } = options;

  // Create and style container element
  const container = document.createElement('div');
  container.id = 'screen-logger';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.right = '0';
  container.style[position] = '0';
  container.style.maxHeight = '50vh';
  container.style.overflowY = 'auto';
  container.style.zIndex = String(zIndex);
  container.style.fontSize = fontSize;
  container.style.fontFamily = 'monospace';
  container.style.padding = '8px';
  container.style.backgroundColor = theme === 'dark' ? 'rgba(0, 0, 0, ' + opacity + ')' : 'rgba(255, 255, 255, ' + opacity + ')';
  container.style.color = theme === 'dark' ? '#fff' : '#000';
  container.style.whiteSpace = 'pre-wrap';
  container.style.wordBreak = 'break-word';
  container.style.backdropFilter = 'blur(2px)';

  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.innerText = 'Toggle Logger';
  toggleButton.style.position = 'fixed';
  toggleButton.style.right = '10px';
  toggleButton.style.top = '10px';
  toggleButton.style.zIndex = String(zIndex + 1);
  toggleButton.style.padding = '5px 10px';
  toggleButton.style.backgroundColor = theme === 'dark' ? '#333' : '#ddd';
  toggleButton.style.color = theme === 'dark' ? '#fff' : '#000';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '4px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.fontSize = '12px';
  
  toggleButton.addEventListener('click', () => {
    if (container.style.display === 'none') {
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  });

  // Add clear button
  const clearButton = document.createElement('button');
  clearButton.innerText = 'Clear';
  clearButton.style.position = 'fixed';
  clearButton.style.right = '120px';
  clearButton.style.top = '10px';
  clearButton.style.zIndex = String(zIndex + 1);
  clearButton.style.padding = '5px 10px';
  clearButton.style.backgroundColor = theme === 'dark' ? '#333' : '#ddd';
  clearButton.style.color = theme === 'dark' ? '#fff' : '#000';
  clearButton.style.border = 'none';
  clearButton.style.borderRadius = '4px';
  clearButton.style.cursor = 'pointer';
  clearButton.style.fontSize = '12px';
  
  clearButton.addEventListener('click', () => {
    container.innerHTML = '';
  });

  // Add elements to DOM
  document.body.appendChild(container);
  document.body.appendChild(toggleButton);
  document.body.appendChild(clearButton);

  const logs: string[] = [];

  function formatArguments(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  function addLogEntry(level: string, color: string, args: any[]) {
    const time = new Date().toLocaleTimeString();
    const formattedArgs = formatArguments(args);
    const logEntry = `[${time}] [${level}] ${formattedArgs}`;
    
    logs.push(logEntry);
    if (logs.length > maxLogs) {
      logs.shift();
    }
    
    const logElement = document.createElement('div');
    logElement.style.color = color;
    logElement.style.marginBottom = '4px';
    logElement.style.borderLeft = `3px solid ${color}`;
    logElement.style.paddingLeft = '5px';
    logElement.textContent = logEntry;
    
    container.appendChild(logElement);
    container.scrollTop = container.scrollHeight;
  }

  // Backup original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  // Override console methods
  console.log = function(...args) {
    addLogEntry('LOG', '#8BC34A', args);
    originalConsoleLog.apply(console, args);
  };

  console.error = function(...args) {
    addLogEntry('ERROR', '#F44336', args);
    originalConsoleError.apply(console, args);
  };

  console.warn = function(...args) {
    addLogEntry('WARN', '#FFC107', args);
    originalConsoleWarn.apply(console, args);
  };

  console.info = function(...args) {
    addLogEntry('INFO', '#2196F3', args);
    originalConsoleInfo.apply(console, args);
  };

  // Add these to the createScreenLogger function
  window.addEventListener('error', (event) => {
    addLogEntry('UNCAUGHT', '#FF5252', [event.message, '\n', event.error?.stack || '']);
    return false;
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    addLogEntry('PROMISE', '#FF5252', [`Unhandled Promise Rejection: ${error?.message || error}`, '\n', error?.stack || '']);
    return false;
  });

  // For network errors specifically
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .catch(error => {
        addLogEntry('FETCH', '#FF7043', [`Fetch error: ${error.message}`, args[0]]);
        throw error; // Re-throw to not disrupt normal error handling
      });
  };

  // Return methods for controlling the logger
  return {
    clear: () => {
      container.innerHTML = '';
      logs.length = 0;
    },
    hide: () => {
      container.style.display = 'none';
    },
    show: () => {
      container.style.display = 'block';
    },
    toggle: () => {
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    },
    restore: () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      
      // Remove elements
      document.body.removeChild(container);
      document.body.removeChild(toggleButton);
      document.body.removeChild(clearButton);
    },
    getLogs: () => [...logs]
  };
}
